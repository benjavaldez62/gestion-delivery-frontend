import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TimeoutError, finalize, timeout } from 'rxjs';
import { AuthService } from '../../services/auth';
import {
  DashboardEstadoItem,
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
  private readonly authService = inject(AuthService);
  private readonly changeDetector = inject(ChangeDetectorRef);

  resumen: DashboardResumen | null = null;
  periodoActual: PeriodoDashboard = 'historico';
  cargando = true;
  error = '';
  soloDisponibles = false;

  readonly periodos: { valor: PeriodoDashboard; etiqueta: string }[] = [
    { valor: 'hoy', etiqueta: 'Hoy' },
    { valor: '7d', etiqueta: '7 días' },
    { valor: '30d', etiqueta: '30 días' },
    { valor: 'historico', etiqueta: 'Todo' },
  ];

  readonly fechaActualTexto = this.formatearFechaActual();

  get saludoEncabezado(): string {
    const hora = new Date().getHours();
    const saludo = hora < 12 ? 'Buen día' : hora < 20 ? 'Buenas tardes' : 'Buenas noches';
    const nombreCompleto = (
      this.resumen?.admin_nombre ||
      this.authService.obtenerNombre() ||
      'Admin'
    ).trim();
    const primerNombre = nombreCompleto.split(/\s+/)[0] || 'Admin';
    return `${saludo}, ${primerNombre}`;
  }

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

  get totalDisponibles(): number {
    return this.todoElPersonal.filter((miembro) => miembro.disponible).length;
  }

  get porcentajeEntregados(): number {
    if (!this.resumen || this.resumen.kpis.total_pedidos <= 0) {
      return 0;
    }
    return Math.round(
      (this.resumen.kpis.pedidos_entregados / this.resumen.kpis.total_pedidos) * 100,
    );
  }

  get estadosConPedidos(): DashboardEstadoItem[] {
    return (this.resumen?.por_estado ?? []).filter((e) => e.cantidad > 0);
  }

  get resumenEstadosEnCero(): string {
    const enCero = (this.resumen?.por_estado ?? []).filter((e) => e.cantidad === 0);
    if (enCero.length === 0) {
      return '';
    }
    if (enCero.length === 1) {
      return `${enCero[0].nombre}: 0`;
    }
    const ultimo = enCero[enCero.length - 1].nombre;
    const previos = enCero
      .slice(0, -1)
      .map((e) => e.nombre)
      .join(', ');
    return `${previos} y ${ultimo}: 0`;
  }

  get ariaLabelEstados(): string {
    return (this.resumen?.por_estado ?? [])
      .filter((e) => e.cantidad > 0)
      .map((e) => `${e.nombre} ${e.cantidad}`)
      .join(', ');
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

  iniciales(nombre: string): string {
    const partes = nombre.trim().split(/\s+/).filter(Boolean);
    if (partes.length === 0) {
      return 'ST';
    }
    if (partes.length === 1) {
      return partes[0].slice(0, 2).toUpperCase();
    }
    return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
  }

  detalleStaff(miembro: DashboardStaffMiembro): string {
    if (miembro.disponible || miembro.pedidos_activos.length === 0) {
      return 'Sin pedidos';
    }
    const ids = miembro.pedidos_activos.map((p) => `#${p.id}`).join(', ');
    return miembro.pedidos_activos.length === 1 ? `Pedido ${ids}` : `Pedidos ${ids}`;
  }

  estadoStaffTexto(miembro: DashboardStaffMiembro): string {
    if (miembro.disponible) {
      return 'Libre';
    }
    const n = miembro.pedidos_activos_count;
    return n === 1 ? '1 activo' : `${n} activos`;
  }

  descripcionFaltante(pedido: DashboardPedidoParaAsignar): string {
    if (!pedido.cocinero && !pedido.repartidor) {
      return 'cocinero y repartidor';
    }
    if (!pedido.cocinero) {
      return 'cocinero';
    }
    if (!pedido.repartidor) {
      return 'repartidor';
    }
    return 'personal';
  }

  colorEstado(nombre: string): string {
    const clave = this.normalizarClave(nombre);
    switch (clave) {
      case 'pendiente':
        return '#F59E0B';
      case 'en_preparacion':
      case 'sin_asignar':
        return '#EA580C';
      case 'listo_para_entregar':
      case 'listo':
        return '#0D9488';
      case 'en_camino':
        return '#2563EB';
      case 'entregado':
        return '#16A34A';
      case 'cancelado':
        return '#A8A29E';
      default:
        return '#57534E';
    }
  }

  claseChipEstado(nombre?: string): string {
    const clave = this.normalizarClave(nombre ?? '');
    if (clave === 'pendiente') {
      return 'chip-amber';
    }
    return 'chip-orange';
  }

  private normalizarClave(texto: string): string {
    return texto
      .trim()
      .toLocaleLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_');
  }

  private formatearFechaActual(): string {
    const texto = new Intl.DateTimeFormat('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(new Date());
    return texto.charAt(0).toUpperCase() + texto.slice(1);
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
