import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, provideRouter, Router, UrlTree } from '@angular/router';
import { guardRole } from './role-guard';

describe('guardRole', () => {
  let router: Router;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideRouter([])],
    });
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    localStorage.clear();
  });

  function rutaConRoles(roles: string[]): ActivatedRouteSnapshot {
    const route = new ActivatedRouteSnapshot();
    route.data = { roles };
    return route;
  }

  it('allows an authenticated user whose role is listed on the route', () => {
    localStorage.setItem('token', 'token');
    localStorage.setItem('rol_usuario', 'Cocinero');

    const result = TestBed.runInInjectionContext(() =>
      guardRole(rutaConRoles(['Cocinero']), router.routerState.snapshot),
    );

    expect(result).toBe(true);
  });

  it('redirects an authenticated user to their role landing route when not allowed', () => {
    localStorage.setItem('token', 'token');
    localStorage.setItem('rol_usuario', 'Cocinero');

    const result = TestBed.runInInjectionContext(() =>
      guardRole(rutaConRoles(['Administrador']), router.routerState.snapshot),
    );

    expect(result instanceof UrlTree).toBe(true);
    if (result instanceof UrlTree) {
      expect(router.serializeUrl(result)).toBe('/cocina');
    }
  });

  it('sends an authenticated session without a known role back to login', () => {
    localStorage.setItem('token', 'token');

    const result = TestBed.runInInjectionContext(() =>
      guardRole(rutaConRoles(['Administrador']), router.routerState.snapshot),
    );

    expect(result instanceof UrlTree).toBe(true);
    if (result instanceof UrlTree) {
      expect(router.serializeUrl(result)).toBe('/login');
    }
  });
});
