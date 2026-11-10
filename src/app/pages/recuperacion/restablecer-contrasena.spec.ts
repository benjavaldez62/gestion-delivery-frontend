import { Location } from '@angular/common';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { apiUrl } from '../../config/api';
import { RestablecerContrasena } from './restablecer-contrasena';

describe('RestablecerContrasena', () => {
  let http: HttpTestingController;
  let location: Location;
  const fragmento = (email: string, token: string): string =>
    btoa(JSON.stringify({ email, token })).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [RestablecerContrasena],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    location = TestBed.inject(Location);
    vi.spyOn(location, 'replaceState').mockImplementation(() => {});
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('rechaza un enlace sin token', () => {
    vi.spyOn(location, 'path').mockReturnValue('/restablecer-contrasena');
    const fixture = TestBed.createComponent(RestablecerContrasena);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('El enlace de recuperación no es válido');
    fixture.componentInstance.restablecer();
    http.expectNone(`${apiUrl}/reset-password`);
  });

  it('rechaza fragmentos malformados y los quita de la barra', () => {
    vi.spyOn(location, 'path').mockReturnValue('/restablecer-contrasena#fragmento-invalido');
    const fixture = TestBed.createComponent(RestablecerContrasena);
    fixture.detectChanges();
    expect(location.replaceState).toHaveBeenCalledWith('/restablecer-contrasena');
    expect(fixture.componentInstance.enlaceValido).toBe(false);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('El enlace de recuperación no es válido');
  });

  it('limpia el fragmento, valida confirmación y envía el token con el correo exacto', () => {
    vi.spyOn(location, 'path').mockReturnValue(`/restablecer-contrasena#${fragmento('persona+test@example.test', 'abc123')}`);
    const fixture = TestBed.createComponent(RestablecerContrasena);
    const component = fixture.componentInstance;
    expect(location.replaceState).toHaveBeenCalledWith('/restablecer-contrasena');
    component.formulario.setValue({ password: 'nueva12345', confirmacion: 'otra12345' });
    component.restablecer();
    http.expectNone(`${apiUrl}/reset-password`);

    localStorage.setItem('token', 'sesion-anterior');
    component.formulario.setValue({ password: 'nueva12345', confirmacion: 'nueva12345' });
    component.restablecer();
    const request = http.expectOne(`${apiUrl}/reset-password`);
    expect(request.request.body).toEqual({
      email: 'persona+test@example.test',
      token: 'abc123',
      password: 'nueva12345',
      password_confirmation: 'nueva12345',
    });
    request.flush({ message: 'Tu contraseña fue actualizada.' });
    fixture.detectChanges();
    expect(localStorage.getItem('token')).toBeNull();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Tu contraseña fue actualizada');
    component.restablecer();
    http.expectNone(`${apiUrl}/reset-password`);
  });

  it('distingue un token vencido de errores de validación de contraseña', () => {
    vi.spyOn(location, 'path').mockReturnValue(`/restablecer-contrasena#${fragmento('persona@example.test', 'abc')}`);
    const component = TestBed.createComponent(RestablecerContrasena).componentInstance;
    component.formulario.setValue({ password: 'nueva12345', confirmacion: 'nueva12345' });
    component.restablecer();
    http.expectOne(`${apiUrl}/reset-password`).flush({}, { status: 422, statusText: 'Unprocessable Entity' });
    expect(component.error()).toContain('enlace no es válido o venció');

    component.restablecer();
    http.expectOne(`${apiUrl}/reset-password`).flush(
      { errors: { password: ['No válida'] } }, { status: 422, statusText: 'Unprocessable Entity' },
    );
    expect(component.error()).toContain('contraseña no es válida');
  });

  it('limita el largo a 72 bytes y cuenta caracteres Unicode', () => {
    vi.spyOn(location, 'path').mockReturnValue(`/restablecer-contrasena#${fragmento('persona@example.test', 'abc')}`);
    const component = TestBed.createComponent(RestablecerContrasena).componentInstance;
    component.formulario.setValue({ password: 'a'.repeat(73), confirmacion: 'a'.repeat(73) });
    expect(component.formulario.invalid).toBe(true);
    component.formulario.setValue({ password: '😀'.repeat(4), confirmacion: '😀'.repeat(4) });
    expect(component.formulario.invalid).toBe(true);
    component.formulario.setValue({ password: '😀'.repeat(8), confirmacion: '😀'.repeat(8) });
    expect(component.formulario.valid).toBe(true);
  });
});
