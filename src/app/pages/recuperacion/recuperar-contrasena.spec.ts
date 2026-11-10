import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { apiUrl } from '../../config/api';
import { RecuperarContrasena } from './recuperar-contrasena';

describe('RecuperarContrasena', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [RecuperarContrasena],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('valida el correo y muestra la respuesta genérica de la API', () => {
    const fixture = TestBed.createComponent(RecuperarContrasena);
    const component = fixture.componentInstance;
    component.correo.setValue('incorrecto');
    component.solicitar();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Ingresá un correo válido');
    http.expectNone(`${apiUrl}/forgot-password`);

    component.correo.setValue('persona@example.test');
    component.solicitar();
    component.solicitar();
    const req = http.expectOne(`${apiUrl}/forgot-password`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'persona@example.test' });
    req.flush({ message: 'Si el correo está registrado, recibirás un enlace.' });
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('recibirás un enlace');
  });

  it('muestra errores de conexión y limitación de intentos', () => {
    const component = TestBed.createComponent(RecuperarContrasena).componentInstance;
    component.correo.setValue('persona@example.test');
    component.solicitar();
    http.expectOne(`${apiUrl}/forgot-password`).flush({}, { status: 429, statusText: 'Too Many Requests' });
    expect(component.error()).toContain('demasiados intentos');

    component.solicitar();
    http.expectOne(`${apiUrl}/forgot-password`).error(new ProgressEvent('error'));
    expect(component.error()).toContain('No se pudo conectar');
  });

  it('envía la solicitud al presentar el formulario', () => {
    const fixture = TestBed.createComponent(RecuperarContrasena);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    const input = element.querySelector<HTMLInputElement>('#correo-recuperacion')!;
    input.value = 'persona@example.test';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    element.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    http.expectOne(`${apiUrl}/forgot-password`).flush({ message: 'Solicitud procesada.' });
    fixture.detectChanges();
    expect(element.textContent).toContain('Solicitud procesada.');
  });
});
