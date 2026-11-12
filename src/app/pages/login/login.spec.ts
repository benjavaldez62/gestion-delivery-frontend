import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { apiUrl } from '../../config/api';
import { authInterceptor } from '../../interceptors/auth-interceptor';
import { AuthService } from '../../services/auth';
import { Login } from './login';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    vi.spyOn(TestBed.inject(AuthService), 'cargarScriptGoogle').mockRejectedValue(new Error('Google no disponible'));
    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    fixture.autoDetectChanges();
    await fixture.whenStable();
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('muestra el enlace para recuperar la contraseña', () => {
    fixture.detectChanges();
    const enlace = (fixture.nativeElement as HTMLElement).querySelector('a[href="/recuperar-contrasena"]');
    expect(enlace?.textContent).toContain('Olvidaste tu contraseña');
  });

  it('actualiza el formulario automáticamente después de credenciales incorrectas', async () => {
    const element = fixture.nativeElement as HTMLElement;
    const email = element.querySelector<HTMLInputElement>('#email')!;
    const password = element.querySelector<HTMLInputElement>('#password')!;
    email.value = 'persona@example.test';
    email.dispatchEvent(new Event('input', { bubbles: true }));
    password.value = 'incorrecta';
    password.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    element.querySelector('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();

    const button = element.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    expect(button.textContent).toContain('Ingresando');
    expect(button.disabled).toBe(true);
    http.expectOne(`${apiUrl}/login`).flush(
      { message: 'Credenciales incorrectas' }, { status: 401, statusText: 'Unauthorized' },
    );
    await fixture.whenStable();

    expect(element.querySelector('.alert.error')?.textContent).toContain('El correo o la contraseña son incorrectos.');
    expect(button.textContent).toContain('Ingresar');
    expect(button.disabled).toBe(false);
  });

  it('permite reintentar después de errores de validación, conexión y servidor', async () => {
    component.email = 'persona@example.test';
    component.password = 'incorrecta';
    const element = fixture.nativeElement as HTMLElement;

    for (const [status, message] of [
      [422, 'Revisá los datos ingresados.'],
      [403, 'Cuenta inactiva.'],
      [503, 'Ocurrió un error al iniciar sesión.'],
      [0, 'No se pudo conectar con la API de Laravel.'],
    ] as const) {
      component.iniciarSesion();
      const request = http.expectOne(`${apiUrl}/login`);
      component.iniciarSesion();
      http.expectNone(`${apiUrl}/login`);
      if (status === 0) {
        request.error(new ProgressEvent('error'));
      } else {
        request.flush(status === 403 ? { message: 'Cuenta inactiva.' } : {}, { status, statusText: 'Error' });
      }
      await fixture.whenStable();
      expect(element.querySelector('.alert.error')?.textContent).toContain(message);
      expect(component.cargando()).toBe(false);
    }
  });

  it('conserva la navegación y guarda la sesión al iniciar correctamente', async () => {
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    component.email = 'persona@example.test';
    component.password = 'correcta';
    component.iniciarSesion();
    http.expectOne(`${apiUrl}/login`).flush({
      success: true,
      message: 'Login exitoso.',
      data: {
        access_token: 'token-de-prueba',
        token_type: 'Bearer',
        user: { id: 1, name: 'Persona', email: 'persona@example.test', role: { id: 1, nombre: 'Administrador' } },
      },
    });
    await fixture.whenStable();
    expect(navigate).toHaveBeenCalledWith('/dashboard');
    expect(localStorage.getItem('token')).toBe('token-de-prueba');
    expect(component.cargando()).toBe(false);
    expect((fixture.nativeElement as HTMLElement).querySelector('.alert.success')?.textContent).toContain('Login exitoso.');
  });

  it('muestra errores de Google y libera el estado de carga automáticamente', async () => {
    let callback: ((response: { credential: string }) => void) | undefined;
    vi.stubGlobal('google', {
      accounts: { id: {
        initialize: (config: { callback: (response: { credential: string }) => void }) => { callback = config.callback; },
        renderButton: vi.fn(),
      } },
    });
    vi.mocked(TestBed.inject(AuthService).cargarScriptGoogle).mockResolvedValue();
    await component.ngAfterViewInit();
    expect(callback).toBeDefined();
    callback!({ credential: 'token-google-de-prueba' });
    await fixture.whenStable();

    const request = http.expectOne(`${apiUrl}/auth/google`);
    component.iniciarSesion();
    http.expectNone(`${apiUrl}/login`);
    request.flush({ message: 'No se pudo iniciar sesión con Google.' }, { status: 401, statusText: 'Unauthorized' });
    await fixture.whenStable();
    expect(component.cargando()).toBe(false);
    expect((fixture.nativeElement as HTMLElement).querySelector('.alert.error')?.textContent)
      .toContain('No se pudo iniciar sesión con Google.');
  });
});
