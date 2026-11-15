import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { apiUrl } from '../../config/api';
import { AuthService } from '../../services/auth';
import { Perfil } from './perfil';

describe('Perfil', () => {
  let fixture: ComponentFixture<Perfil>;
  let component: Perfil;
  let http: HttpTestingController;
  let auth: AuthService;

  beforeEach(async () => {
    localStorage.clear();
    localStorage.setItem('token', 'token');
    localStorage.setItem('nombre_usuario', 'Nombre anterior');
    await TestBed.configureTestingModule({
      imports: [Perfil],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(Perfil);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    auth = TestBed.inject(AuthService);
    fixture.detectChanges();
    http.expectOne(`${apiUrl}/user`).flush({
      id: 5,
      name: 'Nombre anterior',
      email: 'user@example.com',
      telefono: null,
      direccion: null,
    });
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  it('carga el perfil y guarda sus datos actualizando el nombre de sesión', () => {
    expect(component.formulario.getRawValue()).toEqual({
      name: 'Nombre anterior',
      email: 'user@example.com',
      telefono: '',
      direccion: '',
    });
    component.formulario.setValue({
      name: 'Nombre actualizado',
      email: 'updated@example.com',
      telefono: '+5493455124468',
      direccion: 'Calle 123',
    });
    component.guardar();

    const request = http.expectOne(`${apiUrl}/profile`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({
      name: 'Nombre actualizado',
      email: 'updated@example.com',
      telefono: '+5493455124468',
      direccion: 'Calle 123',
    });
    request.flush({
      message: 'Perfil actualizado correctamente.',
      user: {
        id: 5,
        name: 'Nombre actualizado',
        email: 'updated@example.com',
        telefono: '+5493455124468',
        direccion: 'Calle 123',
      },
    });

    expect(component.mensaje()).toBe('Perfil actualizado correctamente.');
    expect(auth.obtenerNombre()).toBe('Nombre actualizado');
    expect(localStorage.getItem('nombre_usuario')).toBe('Nombre actualizado');
  });

  it('no envía el formulario cuando los datos son inválidos', () => {
    component.formulario.controls.email.setValue('correo-invalido');
    component.guardar();

    expect(component.formulario.controls.email.invalid).toBe(true);
    http.expectNone(`${apiUrl}/profile`);
  });

  it('valida los límites del checkout y el formato del correo antes de guardar', () => {
    const pagina = fixture.nativeElement as HTMLElement;
    expect(pagina.querySelector<HTMLInputElement>('#profile-name')?.maxLength).toBe(25);
    expect(pagina.querySelector<HTMLInputElement>('#profile-address')?.maxLength).toBe(25);

    for (const telefono of ['1'.repeat(25), '+' + '1'.repeat(25)]) {
      component.formulario.controls.telefono.setValue(telefono);
      expect(component.formulario.controls.telefono.valid).toBe(true);
    }
    for (const telefono of ['1'.repeat(26), '12+34', '123abc']) {
      component.formulario.controls.telefono.setValue(telefono);
      expect(component.formulario.controls.telefono.invalid).toBe(true);
    }
    for (const correo of ['sin-arroba', 'usuario@', 'usuario@dominio', 'usuario @dominio.com']) {
      component.formulario.controls.email.setValue(correo);
      expect(component.formulario.controls.email.invalid).toBe(true);
    }

    component.formulario.controls.name.setValue('N'.repeat(26));
    component.formulario.controls.direccion.setValue('D'.repeat(26));
    expect(component.formulario.controls.name.invalid).toBe(true);
    expect(component.formulario.controls.direccion.invalid).toBe(true);
    http.expectNone(`${apiUrl}/profile`);
  });

  it('quita letras al escribir o pegar en el teléfono y conserva el + inicial', () => {
    const pagina = fixture.nativeElement as HTMLElement;
    const telefono = pagina.querySelector<HTMLInputElement>('#profile-phone')!;
    telefono.value = '+54abc 345-12';
    telefono.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    expect(telefono.value).toBe('+5434512');
    expect(component.formulario.controls.telefono.value).toBe('+5434512');

    telefono.value = '12+34xyz';
    telefono.dispatchEvent(new Event('input'));
    expect(telefono.value).toBe('1234');
    expect(component.formulario.controls.telefono.value).toBe('1234');
  });
});
