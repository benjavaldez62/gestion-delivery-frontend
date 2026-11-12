import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../config/api';
import { CheckoutPayloadItem } from '../models/cart';

export type MetodoPago = 'efectivo' | 'tarjeta' | 'transferencia';

export interface DatosCheckout {
  direccion: string;
  telefono: string;
  notas: string;
  metodo_pago: MetodoPago;
  monto_recibido?: number;
  items: CheckoutPayloadItem[];
}

export interface ItemBorrador {
  producto_id: number;
  nombre: string;
  precio_unitario: number;
  cantidad: number;
  adicionales: { id: number; nombre: string; precio: number }[];
  subtotal: number;
}

export interface BorradorCheckout {
  id: string;
  pedido_id?: number;
  estado?: string;
  message: string;
  subtotal: number;
  costo_envio: number;
  monto_total: number;
  items: ItemBorrador[];
}

@Injectable({ providedIn: 'root' })
export class CheckoutService {
  private readonly http = inject(HttpClient);

  guardarBorrador(datos: DatosCheckout): Observable<BorradorCheckout> {
    return this.http.post<BorradorCheckout>(`${apiUrl}/checkout/borradores`, datos);
  }
}
