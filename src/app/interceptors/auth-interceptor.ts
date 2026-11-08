import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('token');

  // Solo enviar el token a nuestra API Laravel.
  const esApiLaravel = req.url.startsWith('http://127.0.0.1:8000/api/');

  if (token && esApiLaravel && !req.url.endsWith('/login')) {
    const requestAutenticada = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });

    return next(requestAutenticada);
  }

  return next(req);
};