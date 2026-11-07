import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { apiUrl } from '../config/api';
import { CheckoutPayloadItem } from '../models/cart';

export interface DatosCheckout {
  direccion: string;
  telefono: string;
  notas: string;
  metodo_pago: 'efectivo' | 'tarjeta';
  items: CheckoutPayloadItem[];
}

export interface BorradorCheckout {
  id: string;
  message: string;
  subtotal: number;
  costo_envio: number;
  monto_total: number;
}

@Injectable({ providedIn: 'root' })
export class CheckoutService {
  private readonly http = inject(HttpClient);

  guardarBorrador(datos: DatosCheckout): Observable<BorradorCheckout> {
    return this.http.post<BorradorCheckout>(`${apiUrl}/checkout/borradores`, datos);
  }
}
