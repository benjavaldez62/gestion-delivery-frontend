import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, throwError } from 'rxjs';
import { apiUrl } from '../config/api';

export interface CatalogoPago {
  id: number;
  nombre: string;
  descripcion?: string | null;
}

export interface MetodoPagoAdministracion extends CatalogoPago {
  activo: boolean;
}

export interface PagoAdministracion {
  id: number;
  pedido_id: number;
  pedido: {
    cliente_id: number | null;
    nombre_cliente: string | null;
    usuario_cliente: string | null;
    telefono_cliente: string | null;
  } | null;
  monto: number;
  fecha_pago: string | null;
  referencia: string | null;
  metodo_pago: CatalogoPago;
  estado_pago: CatalogoPago;
  comprobantes: { id: number; tipo_comprobante: string; numero_comprobante: string; titular: string }[];
}

export interface DetalleComprobante {
  id: number;
  numero_comprobante: string;
  contenido_ticket: string | null;
}

export interface ResumenIngresos {
  fecha: string;
  zona_horaria: string;
  ingreso_diario: number;
  ingreso_mensual: number;
}

export interface ResumenEnvios {
  fecha: string;
  zona_horaria: string;
  total_envios: number;
  repartidores: {
    id: number;
    nombre: string;
    total: number;
    envios: { pedido_id: number; importe: number }[];
  }[];
  pendientes_revision: { pedido_id: number; motivo: string }[];
}

@Injectable({ providedIn: 'root' })
export class PagosService {
  private readonly http = inject(HttpClient);

  listar(busqueda: string, estado: string, metodo: string): Observable<PagoAdministracion[]> {
    let params = new HttpParams();
    if (busqueda) params = params.set('busqueda', busqueda);
    if (estado) params = params.set('estado_pago_id', estado);
    if (metodo) params = params.set('metodo_pago_id', metodo);
    return this.http.get<{ pagos: PagoAdministracion[] }>(`${apiUrl}/pagos`, { params }).pipe(
      map(respuesta => respuesta.pagos),
      catchError((error: HttpErrorResponse) =>
        error.status === 404 && error.error?.message === 'No hay pagos disponibles.' ? of([]) : throwError(() => error)),
    );
  }

  metodos(): Observable<MetodoPagoAdministracion[]> {
    return this.http.get<{ metodosPago: MetodoPagoAdministracion[] }>(`${apiUrl}/metodos-pago`)
      .pipe(map(respuesta => respuesta.metodosPago));
  }

  estados(): Observable<CatalogoPago[]> {
    return this.http.get<{ estadoPagos: CatalogoPago[] }>(`${apiUrl}/estado-pagos`)
      .pipe(map(respuesta => respuesta.estadoPagos));
  }

  resumen(): Observable<ResumenIngresos> {
    return this.http.get<ResumenIngresos>(`${apiUrl}/pagos/resumen`);
  }

  resumenEnvios(fecha: string): Observable<ResumenEnvios> {
    const params = fecha ? new HttpParams().set('fecha', fecha) : new HttpParams();
    return this.http.get<ResumenEnvios>(`${apiUrl}/pagos/envios`, { params });
  }

  comprobante(id: number): Observable<DetalleComprobante> {
    return this.http.get<{ comprobante: DetalleComprobante }>(`${apiUrl}/comprobantes/${id}`)
      .pipe(map(respuesta => respuesta.comprobante));
  }
}
