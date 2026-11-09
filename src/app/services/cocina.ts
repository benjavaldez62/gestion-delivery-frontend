import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { apiUrl } from '../config/api';

export interface UsuarioCocina {
  id: number;
}

export interface EstadoPedido {
  id: number;
  nombre: string;
}

export interface PedidoCocina {
  id: number;
  cocinero: UsuarioCocina | null;
  estado: EstadoPedido;
  cliente: {
    username: string;
    telefono?: string | null;
    direccion?: string | null;
  } | null;
  items: Array<{
    id: number;
    cantidad: number;
    producto: { nombre: string } | null;
    adicionales: Array<{ nombre: string }>;
  }>;
  created_at: string | null;
}

interface RespuestaPedidos {
  pedidos: PedidoCocina[];
}

interface RespuestaEstados {
  estadoPedidos: EstadoPedido[];
}

interface RespuestaPedido {
  pedido: PedidoCocina;
}

@Injectable({ providedIn: 'root' })
export class CocinaService {
  private readonly http = inject(HttpClient);

  obtenerUsuario(): Observable<UsuarioCocina> {
    return this.http.get<UsuarioCocina>(`${apiUrl}/user`);
  }

  obtenerPedidos(): Observable<PedidoCocina[]> {
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

  obtenerEstados(): Observable<EstadoPedido[]> {
    return this.http
      .get<RespuestaEstados>(`${apiUrl}/estado-pedidos`)
      .pipe(map((respuesta) => respuesta.estadoPedidos));
  }

  actualizarEstado(pedidoId: number, estadoId: number): Observable<PedidoCocina> {
    return this.http
      .put<RespuestaPedido>(`${apiUrl}/pedidos/${pedidoId}`, {
        estado_pedidos_id: estadoId,
      })
      .pipe(map((respuesta) => respuesta.pedido));
  }
}
