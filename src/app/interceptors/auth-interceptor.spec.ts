import { HttpClient, HttpInterceptorFn, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { apiUrl } from '../config/api';
import { AuthService } from '../services/auth';
import { authInterceptor } from './auth-interceptor';

describe('authInterceptor', () => {
  const interceptor: HttpInterceptorFn = (req, next) =>
    TestBed.runInInjectionContext(() => authInterceptor(req, next));

  let http: HttpClient;
  let controller: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    controller.verify();
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('should be created', () => {
    expect(interceptor).toBeTruthy();
  });

  it('adjunta el token Bearer solo para la API y limpia la sesión ante un 401 protegido', () => {
    localStorage.setItem('token', 'token-activo');
    const authService = TestBed.inject(AuthService);
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);

    http.post(`${apiUrl}/login`, {}).subscribe({ error: () => {} });
    const loginReq = controller.expectOne(`${apiUrl}/login`);
    expect(loginReq.request.headers.has('Authorization')).toBe(false);
    loginReq.flush({ message: 'Credenciales inválidas' }, { status: 401, statusText: 'Unauthorized' });
    expect(authService.obtenerToken()).toBe('token-activo');

    http.get(`${apiUrl}/pedidos`).subscribe({ error: () => {} });
    const protectedReq = controller.expectOne(`${apiUrl}/pedidos`);
    expect(protectedReq.request.headers.get('Authorization')).toBe('Bearer token-activo');
    protectedReq.flush({ message: 'No autenticado' }, { status: 401, statusText: 'Unauthorized' });

    expect(authService.obtenerToken()).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith('/login');
  });
});
