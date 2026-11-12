import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { apiUrl } from '../config/api';

export interface UsuarioReparto {
  id: number;
}

export interface EstadoReparto {
  id: number;
  nombre: string;
}

export interface PagoReparto {
  id: number;
  monto: number;
  estado_pago: {
    id: number;
    nombre: string;
  } | null;
}

export interface PedidoReparto {
  id: number;
  subtotal: number | null;
  monto_total: number;
  created_at: string | null;
  estado: EstadoReparto | null;
  repartidor: UsuarioReparto | null;
  pagos: PagoReparto[];
  cliente: {
    username: string;
    telefono: string | null;
    direccion: string | null;
  } | null;
  items: Array<{
    id: number;
    cantidad: number;
    producto: { nombre: string } | null;
    adicionales: Array<{ nombre: string }>;
  }>;
}

interface RespuestaPedidos {
  pedidos: PedidoReparto[];
}

interface RespuestaEstados {
  estadoPedidos: EstadoReparto[];
}

interface RespuestaPedido {
  pedido: PedidoReparto;
}

@Injectable({ providedIn: 'root' })
export class RepartosService {
  private readonly http = inject(HttpClient);

  obtenerUsuario(): Observable<UsuarioReparto> {
    return this.http.get<UsuarioReparto>(`${apiUrl}/user`);
  }

  obtenerEstados(): Observable<EstadoReparto[]> {
    return this.http
      .get<RespuestaEstados>(`${apiUrl}/estado-pedidos`)
      .pipe(map((respuesta) => respuesta.estadoPedidos));
  }

  obtenerPedidos(): Observable<PedidoReparto[]> {
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

  actualizarEstado(pedidoId: number, estadoId: number): Observable<PedidoReparto> {
    return this.http
      .put<RespuestaPedido>(`${apiUrl}/pedidos/${pedidoId}`, {
        estado_pedidos_id: estadoId,
      })
      .pipe(map((respuesta) => respuesta.pedido));
  }
}
