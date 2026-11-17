import { Observable, OperatorFunction, catchError, of, throwError } from 'rxjs';

/**
 * Convierte respuestas HTTP 404 en un valor vacío seguro para listados opcionales.
 */
export function ignorar404Vacio<T>(fallback: T): OperatorFunction<T, T> {
  return (source: Observable<T>) =>
    source.pipe(
      catchError((error: { status?: number }) =>
        error?.status === 404 ? of(fallback) : throwError(() => error),
      ),
    );
}
