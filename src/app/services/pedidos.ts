import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { apiUrl } from '../config/api';

export interface UsuarioAsignable {
  id: number;
  name: string;
  activo: boolean;
  role: { id: number; nombre: string } | null;
}

export interface PedidoAdministracion {
  id: number;
  cliente: { id: number; username: string } | null;
  cocinero: UsuarioAsignable | null;
  repartidor: UsuarioAsignable | null;
  estado: { id: number; nombre: string } | null;
}

export type CampoAsignacion = 'cocinero_id' | 'repartidor_id';

export interface AsignacionesPersonalPedido {
  cocinero_id: number;
  repartidor_id: number;
}

interface RespuestaPedidos {
  pedidos: PedidoAdministracion[];
}

interface RespuestaUsuarios {
  usuarios: UsuarioAsignable[];
}

interface RespuestaPedido {
  pedido: PedidoAdministracion;
}

@Injectable({ providedIn: 'root' })
export class PedidosService {
  private readonly http = inject(HttpClient);

  obtenerPedidos(): Observable<PedidoAdministracion[]> {
    return this.http.get<RespuestaPedidos>(`${apiUrl}/pedidos`).pipe(
      map((respuesta) => respuesta.pedidos),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 404 && error.error?.message === 'No hay pedidos disponibles.') {
          return of([]);
        }
        return throwError(() => error);
      }),
    );
  }

  obtenerPersonalActivo(): Observable<UsuarioAsignable[]> {
    return this.http.get<RespuestaUsuarios>(`${apiUrl}/users`).pipe(
      map((respuesta) => respuesta.usuarios.filter((usuario) => usuario.activo)),
      catchError((error: HttpErrorResponse) => {
        if (error.status === 404 && error.error?.message === 'No hay usuarios disponibles para mostrar.') {
          return of([]);
        }
        return throwError(() => error);
      }),
    );
  }

  asignar(pedidoId: number, asignaciones: AsignacionesPersonalPedido): Observable<PedidoAdministracion> {
    return this.http
      .put<RespuestaPedido>(`${apiUrl}/pedidos/${pedidoId}/asignaciones`, asignaciones)
      .pipe(map((respuesta) => respuesta.pedido));
  }
}
