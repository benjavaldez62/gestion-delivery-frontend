import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, DestroyRef, OnDestroy, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TimeoutError, catchError, finalize, forkJoin, map, of, switchMap, timeout, timer } from 'rxjs';
import { EstadoReparto, PedidoReparto, RepartosService } from '../../services/repartos';

const ESTADOS_REPARTO = ['Listo para entregar', 'En camino', 'Entregado'];
const INTERVALO_ACTUALIZACION_MS = 20000;

@Component({
  imports: [CommonModule],
  selector: 'app-repartos',
  standalone: true,
  styleUrl: './repartos.css',
  templateUrl: './repartos.html',
})
export class Repartos implements OnDestroy, OnInit {
  private readonly repartosService = inject(RepartosService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private repartidorId: number | null = null;
  private notificacionTimeout: ReturnType<typeof setTimeout> | undefined;

  estados: EstadoReparto[] = [];
  pedidos: PedidoReparto[] = [];
  cargando = true;
  actualizandoPedidoId: number | null = null;
  arrastrandoPedidoId: number | null = null;
  error = '';
  mensaje = '';

  ngOnInit(): void {
    forkJoin({
      usuario: this.repartosService.obtenerUsuario().pipe(timeout({ first: 15000 })),
      estados: this.repartosService.obtenerEstados().pipe(timeout({ first: 15000 })),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ usuario, estados }) => {
          const estadosReparto = ESTADOS_REPARTO.map((nombre) =>
            estados.find((estado) => this.normalizar(estado.nombre) === this.normalizar(nombre)),
          );

          if (estadosReparto.some((estado) => !estado)) {
            this.error = 'No se encontraron todos los estados necesarios para gestionar repartos.';
            this.cargando = false;
            this.changeDetector.markForCheck();
            return;
          }

          this.repartidorId = usuario.id;
          this.estados = estadosReparto.filter(
            (estado): estado is EstadoReparto => estado !== undefined,
          );
          this.cargarPedidos();
          this.escucharPedidos();
        },
        error: (error: unknown) => {
          this.error = this.mensajeError(error, 'No se pudo iniciar el tablero de repartos.');
          this.cargando = false;
          this.changeDetector.markForCheck();
        },
      });
  }

  ngOnDestroy(): void {
    this.limpiarTimeoutNotificacion();
  }

  recargar(): void {
    this.cargarPedidos();
  }

  pedidosPorEstado(estadoId: number): PedidoReparto[] {
    return this.pedidos.filter((pedido) => pedido.estado?.id === estadoId);
  }

  estadoPago(pedido: PedidoReparto): string {
    if (pedido.pagos.length === 0) {
      return 'Pendiente';
    }

    const pagosConfirmados = pedido.pagos.filter((pago) =>
      ['pagado', 'aprobado', 'approved', 'completado', 'completed'].includes(
        this.normalizar(pago.estado_pago?.nombre ?? ''),
      ),
    );
    const totalPagadoCentavos = pagosConfirmados.reduce(
      (total, pago) => total + Math.round(pago.monto * 100),
      0,
    );
    const totalPedidoCentavos = Math.round(pedido.monto_total * 100);

    if (totalPagadoCentavos >= totalPedidoCentavos) {
      return 'Pagado';
    }
    if (totalPagadoCentavos > 0) {
      return 'Pago parcial';
    }

    const estados = [...new Set(
      pedido.pagos
        .map((pago) => pago.estado_pago?.nombre.trim())
        .filter((nombre): nombre is string => Boolean(nombre)),
    )];
    return estados.length > 0 ? estados.join(' / ') : 'Pendiente';
  }

  claseEstadoPago(estado: string): string {
    return this.normalizar(estado).replace(/\s+/g, '-');
  }

  siguienteEstado(pedido: PedidoReparto): EstadoReparto | undefined {
    const indiceActual = this.estados.findIndex((estado) => estado.id === pedido.estado?.id);
    return this.estados[indiceActual + 1];
  }

  iniciarArrastre(event: DragEvent, pedido: PedidoReparto): void {
    this.arrastrandoPedidoId = pedido.id;
    event.dataTransfer?.setData('text/plain', pedido.id.toString());
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  finalizarArrastre(): void {
    this.arrastrandoPedidoId = null;
  }

  permitirSoltar(event: DragEvent, estadoDestino: EstadoReparto): void {
    event.preventDefault();
    if (event.dataTransfer) {
      const pedido = this.pedidos.find((item) => item.id === this.arrastrandoPedidoId);
      event.dataTransfer.dropEffect =
        pedido && this.siguienteEstado(pedido)?.id === estadoDestino.id ? 'move' : 'none';
    }
  }

  moverPedido(event: DragEvent, estadoDestino: EstadoReparto): void {
    event.preventDefault();
    const pedidoId = Number(event.dataTransfer?.getData('text/plain'));
    const pedido = this.pedidos.find((item) => item.id === pedidoId);

    if (pedido && this.siguienteEstado(pedido)?.id === estadoDestino.id) {
      this.actualizarEstado(pedido, estadoDestino);
    }
  }

  avanzarPedido(pedido: PedidoReparto): void {
    const siguiente = this.siguienteEstado(pedido);
    if (siguiente) {
      this.actualizarEstado(pedido, siguiente);
    }
  }

  reenviarTicket(pedido: PedidoReparto): void {
    if (this.actualizandoPedidoId !== null) return;
    this.error = '';
    this.mensaje = '';
    this.actualizandoPedidoId = pedido.id;
    this.repartosService.reenviarTicket(pedido.id).pipe(
      timeout({ first: 15000 }),
      finalize(() => {
        this.actualizandoPedidoId = null;
        this.changeDetector.markForCheck();
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: respuesta => { this.mensaje = respuesta.message; },
      error: (error: unknown) => {
        this.error = this.mensajeError(error, 'No se pudo enviar el ticket.');
      },
    });
  }

  private escucharPedidos(): void {
    timer(INTERVALO_ACTUALIZACION_MS, INTERVALO_ACTUALIZACION_MS)
      .pipe(
        switchMap(() =>
          this.repartosService.obtenerPedidos().pipe(
            timeout({ first: 15000 }),
            map((pedidos) => this.pedidosAsignados(pedidos)),
            catchError((error: unknown) => {
              this.error = this.mensajeError(error, 'No se pudieron actualizar los pedidos.');
              this.changeDetector.markForCheck();
              return of(null);
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((pedidos) => {
        if (pedidos) {
          this.pedidos = pedidos;
          this.error = '';
        }
        this.changeDetector.markForCheck();
      });
  }

  private cargarPedidos(): void {
    if (this.repartidorId === null) {
      return;
    }

    this.cargando = true;
    this.error = '';
    this.repartosService
      .obtenerPedidos()
      .pipe(
        timeout({ first: 15000 }),
        map((pedidos) => this.pedidosAsignados(pedidos)),
        finalize(() => {
          this.cargando = false;
          this.changeDetector.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (pedidos) => {
          this.pedidos = pedidos;
        },
        error: (error: unknown) => {
          this.error = this.mensajeError(error, 'No se pudieron cargar los pedidos asignados.');
          this.changeDetector.markForCheck();
        },
      });
  }

  private pedidosAsignados(pedidos: PedidoReparto[]): PedidoReparto[] {
    const estadosDisponibles = new Set(this.estados.map((estado) => estado.id));
    return pedidos.filter(
      (pedido) =>
        pedido.repartidor?.id === this.repartidorId &&
        pedido.estado !== null &&
        estadosDisponibles.has(pedido.estado.id),
    );
  }

  private actualizarEstado(pedido: PedidoReparto, estadoDestino: EstadoReparto): void {
    if (pedido.estado?.id === estadoDestino.id || this.actualizandoPedidoId !== null) {
      return;
    }

    this.error = '';
    this.mensaje = '';
    this.limpiarTimeoutNotificacion();
    this.actualizandoPedidoId = pedido.id;

    this.repartosService
      .actualizarEstado(pedido.id, estadoDestino.id)
      .pipe(
        timeout({ first: 15000 }),
        finalize(() => {
          this.actualizandoPedidoId = null;
          this.changeDetector.markForCheck();
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (respuesta) => {
          this.pedidos = this.pedidos.map((actual) =>
            actual.id === pedido.id ? respuesta.pedido : actual,
          );
          if (respuesta.comprobante_enviado === false) {
            this.error = respuesta.message ?? 'El cobro se registró, pero no se pudo enviar el ticket.';
            return;
          }
          this.mensaje = respuesta.message ?? `El pedido #${pedido.id} avanzó a ${estadoDestino.nombre} correctamente.`;
          this.notificacionTimeout = setTimeout(() => {
            this.mensaje = '';
            this.notificacionTimeout = undefined;
            this.changeDetector.markForCheck();
          }, 4000);
        },
        error: (error: unknown) => {
          this.error = this.mensajeError(error, `No se pudo actualizar el pedido #${pedido.id}.`);
          this.changeDetector.markForCheck();
        },
      });
  }

  private normalizar(valor: string): string {
    return valor.trim().toLocaleLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  private mensajeError(error: unknown, fallback: string): string {
    if (error instanceof TimeoutError) {
      return 'La solicitud tardó demasiado. Verificá la conexión con el servidor e intentá nuevamente.';
    }
    if (error instanceof HttpErrorResponse) {
      if (error.status === 401) {
        return 'La sesión no está autorizada. Iniciá sesión y volvé a intentar.';
      }
      if (error.status === 403) {
        return 'Tu usuario no tiene permisos para gestionar repartos.';
      }
      if (error.status === 0) {
        return 'No se pudo conectar con el servidor. Verificá que la API esté disponible e intentá nuevamente.';
      }
      return error.error?.message || fallback;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return fallback;
  }

  private limpiarTimeoutNotificacion(): void {
    if (this.notificacionTimeout !== undefined) {
      clearTimeout(this.notificacionTimeout);
      this.notificacionTimeout = undefined;
    }
  }
}
