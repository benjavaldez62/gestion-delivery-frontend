import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { apiUrl } from '../config/api';
import { Categoria } from './categorias';

export interface Producto {
  id: number;
  nombre: string;
  descripcion: string | null;
  imagen: string | null;
  precio: number;
  activo: boolean;
  categoria?: Categoria | null;
}

export interface NuevoProducto {
  nombre: string;
  descripcion: string | null;
  imagen: string | null;
  precio: number;
  categoria_id: number;
  activo: true;
}

export type ProductoActualizado = Omit<NuevoProducto, 'activo'>;

interface RespuestaProductos {
  message: string;
  productos: Producto[];
}

interface RespuestaProductosDesactivados {
  message: string;
  productosDesactivados: Producto[];
}

interface RespuestaProducto {
  message: string;
  producto: Producto;
}

@Injectable({ providedIn: 'root' })
export class ProductosService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = `${apiUrl}/productos`;

  obtenerProductos(): Observable<Producto[]> {
    return this.http.get<RespuestaProductos>(this.endpoint).pipe(
      catchError((error: HttpErrorResponse) =>
        error.status === 404
          ? of({ message: '', productos: [] })
          : throwError(() => error)
      ),
      map((respuesta) => respuesta.productos),
    );
  }

  obtenerProductosDesactivados(): Observable<Producto[]> {
    return this.http.get<RespuestaProductosDesactivados>(`${apiUrl}/productos-desactivados`).pipe(
      catchError((error: HttpErrorResponse) =>
        error.status === 404
          ? of({ message: '', productosDesactivados: [] })
          : throwError(() => error)
      ),
      map((respuesta) => respuesta.productosDesactivados),
    );
  }

  crearProducto(datos: NuevoProducto): Observable<RespuestaProducto> {
    return this.http.post<RespuestaProducto>(this.endpoint, datos);
  }

  actualizarProducto(id: number, datos: ProductoActualizado): Observable<RespuestaProducto> {
    return this.http.put<RespuestaProducto>(`${this.endpoint}/${id}`, datos);
  }

  eliminarProducto(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.endpoint}/${id}`);
  }

  restaurarProducto(id: number): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.endpoint}/${id}/restore`, {});
  }
}
