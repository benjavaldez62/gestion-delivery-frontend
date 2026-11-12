import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TimeoutError, finalize, timeout } from 'rxjs';
import {
  DashboardPedidoParaAsignar,
  DashboardResumen,
  DashboardService,
  DashboardStaffMiembro,
  PeriodoDashboard,
} from '../../services/dashboard';

@Component({
  imports: [CommonModule, RouterLink],
  selector: 'app-dashboard',
  standalone: true,
  styleUrl: './dashboard.css',
  templateUrl: './dashboard.html',
})
export class Dashboard implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly changeDetector = inject(ChangeDetectorRef);

  resumen: DashboardResumen | null = null;
  periodoActual: PeriodoDashboard = 'historico';
  cargando = true;
  error = '';
  soloDisponibles = false;
  mostrarDesglose = false;

  readonly periodos: { valor: PeriodoDashboard; etiqueta: string }[] = [
    { valor: 'historico', etiqueta: 'Todo el historial' },
    { valor: 'hoy', etiqueta: 'Hoy' },
    { valor: '7d', etiqueta: 'Últimos 7 días' },
    { valor: '30d', etiqueta: 'Últimos 30 días' },
  ];

  get cocineros(): DashboardStaffMiembro[] {
    return this.resumen?.staff.cocineros ?? [];
  }

  get repartidores(): DashboardStaffMiembro[] {
    return this.resumen?.staff.repartidores ?? [];
  }

  get todoElPersonal(): DashboardStaffMiembro[] {
    return [...this.cocineros, ...this.repartidores];
  }

  get personalFiltrado(): DashboardStaffMiembro[] {
    if (this.soloDisponibles) {
      return this.todoElPersonal.filter((miembro) => miembro.disponible);
    }
    return this.todoElPersonal;
  }

  get cocinerosDisponiblesCount(): number {
    return this.cocineros.filter((c) => c.disponible).length;
  }

  get repartidoresDisponiblesCount(): number {
    return this.repartidores.filter((r) => r.disponible).length;
  }

  ngOnInit(): void {
    this.cargarDashboard();
  }

  cambiarPeriodo(periodo: PeriodoDashboard): void {
    if (this.periodoActual === periodo && this.resumen !== null) {
      return;
    }
    this.periodoActual = periodo;
    this.cargarDashboard();
  }

  recargar(): void {
    this.cargarDashboard();
  }

  toggleSoloDisponibles(): void {
    this.soloDisponibles = !this.soloDisponibles;
    this.changeDetector.markForCheck();
  }

  toggleDesglose(): void {
    this.mostrarDesglose = !this.mostrarDesglose;
    this.changeDetector.markForCheck();
  }

  listaPedidosActivos(miembro: DashboardStaffMiembro): string {
    return miembro.pedidos_activos.map((pedido) => `#${pedido.id}`).join(', ');
  }

  descripcionFaltante(pedido: DashboardPedidoParaAsignar): string {
    if (!pedido.cocinero && !pedido.repartidor) {
      return 'Falta asignar cocinero y repartidor';
    }
    if (!pedido.cocinero) {
      return 'Falta asignar cocinero';
    }
    if (!pedido.repartidor) {
      return 'Falta asignar repartidor';
    }
    return 'Pendiente de asignación';
  }

  claseEstado(nombre: string): string {
    return nombre
      .trim()
      .toLocaleLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_');
  }

  claseMetodoPago(nombre: string): string {
    return nombre
      .trim()
      .toLocaleLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_');
  }

  private cargarDashboard(): void {
    this.cargando = true;
    this.error = '';

    this.dashboardService
      .obtenerResumen(this.periodoActual)
      .pipe(
        timeout({ first: 15000 }),
        finalize(() => {
          this.cargando = false;
          this.changeDetector.markForCheck();
        }),
      )
      .subscribe({
        next: (resumen) => {
          this.resumen = resumen;
        },
        error: (error: unknown) => {
          if (error instanceof TimeoutError) {
            this.error =
              'La carga del dashboard tardó demasiado. Verifique la conexión con el servidor e intente nuevamente.';
          } else if (error instanceof HttpErrorResponse) {
            this.error = error.error?.message || 'No se pudo cargar el resumen del dashboard.';
          } else {
            this.error = 'Ocurrió un error inesperado al cargar el resumen del dashboard.';
          }
          this.changeDetector.markForCheck();
        },
      });
  }
}
