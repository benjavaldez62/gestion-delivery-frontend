import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { TimeoutError, finalize, forkJoin, map, timeout } from 'rxjs';
import {
  CocinaService,
  EstadoPedido,
  PedidoCocina,
} from '../../services/cocina';

const ESTADOS_COCINA = ['Pendiente', 'En preparación', 'Listo para entregar'];

@Component({
  imports: [CommonModule],
  selector: 'app-cocina',
  standalone: true,
  styleUrl: './cocina.css',
  templateUrl: './cocina.html',
})
export class Cocina implements OnDestroy, OnInit {
  private readonly cocinaService = inject(CocinaService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private notificacionTimeout: ReturnType<typeof setTimeout> | undefined;

  estados: EstadoPedido[] = [];
  pedidos: PedidoCocina[] = [];
  cargando = true;
  actualizandoPedidoId: number | null = null;
  arrastrandoPedidoId: number | null = null;
  error = '';
  mensaje = '';

  ngOnDestroy(): void {
    this.limpiarTimeoutNotificacion();
  }

  ngOnInit(): void {
    this.cargarTablero();
  }

  recargar(): void {
    this.cargarTablero();
  }

  iniciarArrastre(event: DragEvent, pedido: PedidoCocina): void {
    this.arrastrandoPedidoId = pedido.id;
    event.dataTransfer?.setData('text/plain', pedido.id.toString());
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  finalizarArrastre(): void {
    this.arrastrandoPedidoId = null;
  }

  pedidosPorEstado(estadoId: number): PedidoCocina[] {
    return this.pedidos.filter((pedido) => pedido.estado.id === estadoId);
  }

  moverPedido(event: DragEvent, estadoDestino: EstadoPedido): void {
    event.preventDefault();
    const pedidoId = Number(event.dataTransfer?.getData('text/plain'));
    const pedido = this.pedidos.find((item) => item.id === pedidoId);

    if (pedido && this.puedeMoverA(pedido, estadoDestino)) {
      this.actualizarEstado(pedido, estadoDestino);
    }
  }

  permitirSoltar(event: DragEvent, estadoDestino: EstadoPedido): void {
    event.preventDefault();
    if (event.dataTransfer) {
      const pedido = this.pedidos.find((item) => item.id === this.arrastrandoPedidoId);
      event.dataTransfer.dropEffect =
        pedido && this.puedeMoverA(pedido, estadoDestino) ? 'move' : 'none';
    }
  }

  avanzarPedido(pedido: PedidoCocina): void {
    const estadoActual = this.estados.findIndex((estado) => estado.id === pedido.estado.id);
    const siguienteEstado = this.estados[estadoActual + 1];

    if (siguienteEstado) {
      this.actualizarEstado(pedido, siguienteEstado);
    }
  }

  siguienteEstado(pedido: PedidoCocina): EstadoPedido | undefined {
    const indiceActual = this.estados.findIndex((estado) => estado.id === pedido.estado.id);
    return this.estados[indiceActual + 1];
  }

  private puedeMoverA(pedido: PedidoCocina, estadoDestino: EstadoPedido): boolean {
    return this.siguienteEstado(pedido)?.id === estadoDestino.id;
  }

  private cargarTablero(): void {
    this.cargando = true;
    this.error = '';

    forkJoin({
      usuario: this.cocinaService.obtenerUsuario().pipe(timeout({ first: 15000 })),
      estados: this.cocinaService.obtenerEstados().pipe(timeout({ first: 15000 })),
      pedidos: this.cocinaService.obtenerPedidos().pipe(timeout({ first: 15000 })),
    })
      .pipe(
        map(({ usuario, estados, pedidos }) => {
          const estadosDisponibles = ESTADOS_COCINA.map((nombre) =>
            estados.find(
              (estado) =>
                typeof estado.nombre === 'string' &&
                estado.nombre.trim().toLocaleLowerCase() === nombre.toLocaleLowerCase(),
            ),
          );

          if (estadosDisponibles.some((estado) => !estado)) {
            throw new Error('No se encontraron todos los estados de cocina configurados en el backend.');
          }

          const estadosValidos = estadosDisponibles.filter(
            (estado): estado is EstadoPedido => estado !== undefined,
          );
          const idsEstados = new Set(estadosValidos.map((estado) => estado.id));
          const pedidosAsignados = pedidos.filter(
            (pedido) =>
              pedido.cocinero?.id === usuario.id &&
              pedido.estado !== null &&
              idsEstados.has(pedido.estado.id),
          );

          return { estados: estadosValidos, pedidos: pedidosAsignados };
        }),
        finalize(() => {
          this.cargando = false;
          this.changeDetector.markForCheck();
        }),
      )
      .subscribe({
        next: ({ estados, pedidos }) => {
          this.estados = estados;
          this.pedidos = pedidos;
        },
        error: (error: unknown) => {
          if (error instanceof TimeoutError) {
            this.error = 'La carga del tablero tardó demasiado. Verificá la conexión con el servidor e intentá nuevamente.';
          } else if (error instanceof HttpErrorResponse) {
            this.error = this.mensajeErrorCarga(error);
          } else if (error instanceof Error) {
            this.error = error.message;
          } else {
            this.error = 'Ocurrió un error inesperado al cargar el tablero.';
          }
          this.changeDetector.markForCheck();
        },
      });
  }

  private mensajeErrorCarga(error: HttpErrorResponse): string {
    if (error.status === 401) {
      return 'La sesión no está autorizada para consultar el tablero. Iniciá sesión y volvé a intentar.';
    }
    if (error.status === 403) {
      return 'Tu usuario no tiene permisos para consultar los pedidos de cocina.';
    }
    if (error.status === 0) {
      return 'No se pudo conectar con el servidor. Verificá que la API esté disponible e intentá nuevamente.';
    }
    return (
      error.error?.message ||
      'No se pudo cargar el tablero de cocina. Verificá tu conexión e intentá nuevamente.'
    );
  }

  private actualizarEstado(pedido: PedidoCocina, estadoDestino: EstadoPedido): void {
    if (pedido.estado.id === estadoDestino.id || this.actualizandoPedidoId !== null) {
      return;
    }

    this.error = '';
    this.limpiarTimeoutNotificacion();
    this.mensaje = '';
    this.actualizandoPedidoId = pedido.id;

    this.cocinaService.actualizarEstado(pedido.id, estadoDestino.id).subscribe({
      next: (pedidoActualizado) => {
        this.pedidos = this.pedidos.map((item) =>
          item.id === pedido.id ? pedidoActualizado : item,
        );
        this.mensaje = `El pedido #${pedido.id} se actualizó al estado ${estadoDestino.nombre}.`;
        this.notificacionTimeout = setTimeout(() => {
          this.mensaje = '';
          this.notificacionTimeout = undefined;
          this.changeDetector.markForCheck();
        }, 4000);
        this.actualizandoPedidoId = null;
        this.changeDetector.markForCheck();
      },
      error: (error: HttpErrorResponse) => {
        this.error = error.error?.message || `No se pudo actualizar el pedido #${pedido.id}.`;
        this.actualizandoPedidoId = null;
        this.changeDetector.markForCheck();
      },
    });
  }

  private limpiarTimeoutNotificacion(): void {
    if (this.notificacionTimeout !== undefined) {
      clearTimeout(this.notificacionTimeout);
      this.notificacionTimeout = undefined;
    }
  }
}
