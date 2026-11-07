//consulta la API, incluidos productos y adicionales.
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { apiUrl } from '../config/api';
import { MenuAdditional, MenuProduct } from '../models/menu';

interface ProductsResponse {
  productos: MenuProduct[];
}

interface AdditionalsResponse {
  adicionales: MenuAdditional[];
}

@Injectable({ providedIn: 'root' })
export class MenuService {
  private readonly http = inject(HttpClient);

  getProducts(): Observable<MenuProduct[]> {
    return this.http.get<ProductsResponse>(`${apiUrl}/productos`).pipe(
      map((response) => response.productos),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 404) {
          return of([]);
        }
        return throwError(() => error);
      })
    );
  }

  getAdditionals(categoryId: number): Observable<MenuAdditional[]> {
    return this.http
      .get<AdditionalsResponse>(`${apiUrl}/categorias/${categoryId}/adicionales`)
      .pipe(map((response) => response.adicionales));
  }
}
