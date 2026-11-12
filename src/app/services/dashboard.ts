import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { apiUrl } from '../config/api';

export type PeriodoDashboard = 'hoy' | '7d' | '30d' | 'historico';

export interface DashboardKpis {
  ingresos_totales: number;
  total_pedidos: number;
  pedidos_validos: number;
  pedidos_entregados: number;
  pedidos_cancelados: number;
  pedidos_en_curso: number;
  pedidos_sin_asignar: number;
  ticket_promedio: number;
  tasa_entrega: number;
}

export interface DashboardEstadoItem {
  id: number;
  nombre: string;
  cantidad: number;
  monto_total: number;
  porcentaje: number;
}

export interface DashboardMetodoPagoItem {
  id: number;
  nombre: string;
  cantidad: number;
  monto_total: number;
  porcentaje: number;
}

export interface DashboardStaffPedidoActivo {
  id: number;
  codigo: string;
  estado: string;
  cliente: string | null;
  monto_total: number;
}

export interface DashboardStaffMiembro {
  id: number;
  name: string;
  email: string;
  rol: string;
  disponible: boolean;
  pedidos_activos_count: number;
  pedidos_completados_periodo: number;
  pedidos_activos: DashboardStaffPedidoActivo[];
}

export interface DashboardPedidoParaAsignar {
  id: number;
  codigo: string;
  monto_total: number;
  created_at: string | null;
  cliente: { id: number; username: string } | null;
  estado: { id: number; nombre: string } | null;
  metodo_pago: string | null;
  cocinero: { id: number; name: string } | null;
  repartidor: { id: number; name: string } | null;
}

export interface DashboardResumen {
  periodo: PeriodoDashboard;
  admin_nombre?: string | null;
  kpis: DashboardKpis;
  por_estado: DashboardEstadoItem[];
  por_metodo_pago: DashboardMetodoPagoItem[];
  staff: {
    cocineros: DashboardStaffMiembro[];
    repartidores: DashboardStaffMiembro[];
  };
  pedidos_para_asignar: DashboardPedidoParaAsignar[];
}

interface RespuestaDashboard {
  message: string;
  dashboard: DashboardResumen;
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  obtenerResumen(periodo: PeriodoDashboard = 'historico'): Observable<DashboardResumen> {
    return this.http
      .get<RespuestaDashboard>(`${apiUrl}/dashboard?periodo=${periodo}`)
      .pipe(map((respuesta) => respuesta.dashboard));
  }
}
