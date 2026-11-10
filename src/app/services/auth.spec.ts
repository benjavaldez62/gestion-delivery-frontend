import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { computed } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { apiUrl } from '../config/api';
import { AuthService, LoginResponse } from './auth';

describe('AuthService', () => {
  let service: AuthService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('stores the role and selects the corresponding landing route after login', () => {
    const rolActual = computed(() => service.obtenerRol());
    const sesionActiva = computed(() => service.estaAutenticado());
    const response: LoginResponse = {
      success: true,
      message: 'Login exitoso.',
      data: {
        access_token: 'token',
        token_type: 'Bearer',
        user: {
          id: 1,
          name: 'Administradora',
          email: 'admin@example.com',
          role: { id: 1, nombre: 'Administrador' },
        },
      },
    };

    service.login({ email: response.data.user.email, password: 'password' }).subscribe();
    httpTestingController.expectOne(`${apiUrl}/login`).flush(response);

    expect(service.estaAutenticado()).toBe(true);
    expect(sesionActiva()).toBe(true);
    expect(rolActual()).toBe('Administrador');
    expect(service.rutaInicial()).toBe('/pedidos');
  });

  it('selects the landing route for cook and delivery roles', () => {
    const iniciarSesionComo = (id: number, nombre: string): void => {
      service.login({ email: `${nombre.toLowerCase()}@example.com`, password: 'password' }).subscribe();
      httpTestingController.expectOne(`${apiUrl}/login`).flush({
        success: true,
        message: 'Login exitoso.',
        data: {
          access_token: `token-${id}`,
          token_type: 'Bearer',
          user: {
            id,
            name: nombre,
            email: `${nombre.toLowerCase()}@example.com`,
            role: { id, nombre },
          },
        },
      } satisfies LoginResponse);
    };

    iniciarSesionComo(2, 'Cocinero');
    expect(service.rutaInicial()).toBe('/cocina');

    iniciarSesionComo(3, 'Repartidor');
    expect(service.rutaInicial()).toBe('/repartos');
  });

  it('clears the token and role when the session ends', () => {
    localStorage.setItem('token', 'token');
    localStorage.setItem('rol_usuario', 'Cocinero');

    service.limpiarSesion();

    expect(service.estaAutenticado()).toBe(false);
    expect(service.obtenerRol()).toBeNull();
  });
});
