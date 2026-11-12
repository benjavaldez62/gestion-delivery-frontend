import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { TimeoutError, finalize, forkJoin, timeout } from 'rxjs';
import { AsignacionesPersonalPedido, CampoAsignacion, PedidoAdministracion, PedidosService, UsuarioAsignable } from '../../services/pedidos';

@Component({
  imports: [CommonModule],
  selector: 'app-pedidos',
  standalone: true,
  styleUrl: './pedidos.css',
  templateUrl: './pedidos.html',
})
export class Pedidos implements OnInit {
  private readonly pedidosService = inject(PedidosService);
  private readonly changeDetector = inject(ChangeDetectorRef);

  pedidos: PedidoAdministracion[] = [];
  personal: UsuarioAsignable[] = [];
  cargando = true;
  asignandoPedidoId: number | null = null;
  error = '';
  asignacionesSeleccionadas = new Map<number, Record<CampoAsignacion, number | null>>();

  get cocineros(): UsuarioAsignable[] {
    return this.personal.filter((usuario) => usuario.role?.nombre.toLocaleLowerCase() === 'cocinero');
  }

  get repartidores(): UsuarioAsignable[] {
    return this.personal.filter((usuario) => usuario.role?.nombre.toLocaleLowerCase() === 'repartidor');
  }

  ngOnInit(): void {
    this.cargarTablero();
  }

  recargar(): void {
    this.cargarTablero();
  }

  esSinAsignar(pedido: PedidoAdministracion): boolean {
    return this.claseEstado(pedido.estado?.nombre ?? '') === 'sin_asignar';
  }

  valorSeleccionado(pedido: PedidoAdministracion, campo: CampoAsignacion): number | '' {
    return this.asignacionesSeleccionadas.get(pedido.id)?.[campo] ?? '';
  }

  claseEstado(nombre: string): string {
    return nombre.trim().toLocaleLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_');
  }

  seleccionarPersonal(pedido: PedidoAdministracion, campo: CampoAsignacion, event: Event): void {
    const select = event.target;
    if (!(select instanceof HTMLSelectElement)) {
      this.error = 'No se pudo leer el personal seleccionado.';
      return;
    }

    const asignaciones = this.asignacionesSeleccionadas.get(pedido.id);
    if (!asignaciones) {
      this.error = `No se pudieron preparar las asignaciones del pedido #${pedido.id}.`;
      return;
    }

    const usuarioId = select.value === '' ? null : Number(select.value);
    if (usuarioId !== null && (!Number.isInteger(usuarioId) || usuarioId <= 0)) {
      this.error = 'El personal seleccionado no es válido.';
      return;
    }

    asignaciones[campo] = usuarioId;
    this.error = '';
  }

  puedeGuardarAsignaciones(pedido: PedidoAdministracion): boolean {
    const asignaciones = this.asignacionesSeleccionadas.get(pedido.id);
    return asignaciones?.cocinero_id !== null && asignaciones?.cocinero_id !== undefined
      && asignaciones.repartidor_id !== null;
  }

  asignar(pedido: PedidoAdministracion): void {
    const asignaciones = this.asignacionesSeleccionadas.get(pedido.id);
    if (!this.esSinAsignar(pedido)) {
      this.error = 'Sólo se puede asignar personal a pedidos Sin Asignar.';
      return;
    }

    if (!asignaciones || asignaciones.cocinero_id === null || asignaciones.repartidor_id === null) {
      this.error = 'Seleccioná un cocinero y un repartidor antes de asignar el pedido.';
      return;
    }

    const datosAsignacion: AsignacionesPersonalPedido = {
      cocinero_id: asignaciones.cocinero_id,
      repartidor_id: asignaciones.repartidor_id,
    };

    this.error = '';
    this.asignandoPedidoId = pedido.id;
    this.pedidosService.asignar(pedido.id, datosAsignacion)
      .pipe(finalize(() => {
        this.asignandoPedidoId = null;
        this.changeDetector.markForCheck();
      }))
      .subscribe({
        next: (pedidoActualizado) => {
          this.pedidos = this.pedidos.map((actual) =>
            actual.id === pedido.id ? pedidoActualizado : actual,
          );
          this.asignacionesSeleccionadas.set(pedido.id, {
            cocinero_id: pedidoActualizado.cocinero?.id ?? null,
            repartidor_id: pedidoActualizado.repartidor?.id ?? null,
          });
        },
        error: (error: HttpErrorResponse) => {
          this.error = error.error?.message || `No se pudo asignar personal al pedido #${pedido.id}.`;
          this.changeDetector.markForCheck();
        },
      });
  }

  private cargarTablero(): void {
    this.cargando = true;
    this.error = '';

    forkJoin({
      pedidos: this.pedidosService.obtenerPedidos().pipe(timeout({ first: 15000 })),
      personal: this.pedidosService.obtenerPersonalActivo().pipe(timeout({ first: 15000 })),
    })
      .pipe(finalize(() => {
        this.cargando = false;
        this.changeDetector.markForCheck();
      }))
      .subscribe({
        next: ({ pedidos, personal }) => {
          this.pedidos = pedidos;
          this.personal = personal;
          this.asignacionesSeleccionadas = new Map(pedidos.map((pedido) => [
            pedido.id,
            {
              cocinero_id: pedido.cocinero?.id ?? null,
              repartidor_id: pedido.repartidor?.id ?? null,
            },
          ]));
        },
        error: (error: unknown) => {
          if (error instanceof TimeoutError) {
            this.error = 'La carga de pedidos tardó demasiado. Verificá la conexión con el servidor e intentá nuevamente.';
          } else if (error instanceof HttpErrorResponse) {
            this.error = error.error?.message || 'No se pudo cargar el tablero de pedidos.';
          } else {
            this.error = 'Ocurrió un error inesperado al cargar el tablero de pedidos.';
          }
          this.changeDetector.markForCheck();
        },
      });
  }
}
