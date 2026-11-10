import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

export const guardRole: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const allowedRoles = (route.data['roles'] as string[] | undefined) ?? [];
  const role = authService.obtenerRol()?.trim().toLocaleLowerCase();

  if (!authService.estaAutenticado()) {
    return route.data['allowAnonymous'] === true ? true : router.createUrlTree(['/login']);
  }

  if (!role) {
    return router.parseUrl('/login');
  }

  if (role && allowedRoles.some((allowedRole) => allowedRole.toLocaleLowerCase() === role)) {
    return true;
  }

  return router.parseUrl(authService.rutaInicial());
};
