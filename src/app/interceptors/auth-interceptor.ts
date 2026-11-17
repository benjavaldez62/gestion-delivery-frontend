import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { apiUrl } from '../config/api';
import { AuthService } from '../services/auth';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.obtenerToken();
  const apiBase = apiUrl.replace(/\/+$/, '');

  // Solo enviar el token a nuestra API Laravel.
  const esApiLaravel = req.url === apiBase || req.url.startsWith(`${apiBase}/`);
  const esRutaLogin = req.url.endsWith('/login') || req.url.endsWith('/auth/google');

  const request = token && esApiLaravel && !esRutaLogin
    ? req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      })
    : req;

  return next(request).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        esApiLaravel &&
        !esRutaLogin
      ) {
        authService.limpiarSesion();
        if (router.url !== '/login') {
          void router.navigateByUrl('/login');
        }
      }

      return throwError(() => error);
    }),
  );
};