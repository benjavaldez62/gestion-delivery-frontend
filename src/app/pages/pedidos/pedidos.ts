import { HttpErrorResponse } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { TimeoutError, finalize, forkJoin, timeout } from 'rxjs';
import { CampoAsignacion, PedidoAdministracion, PedidosService, UsuarioAsignable } from '../../services/pedidos';

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

  claseEstado(nombre: string): string {
    return nombre.trim().toLocaleLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '_');
  }

  asignar(pedido: PedidoAdministracion, campo: CampoAsignacion, event: Event): void {
    const select = event.target;
    if (!(select instanceof HTMLSelectElement)) {
      this.error = 'No se pudo leer el personal seleccionado.';
      return;
    }

    const usuarioId = Number(select.value);
    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
      select.value = String(pedido[campo === 'cocinero_id' ? 'cocinero' : 'repartidor']?.id ?? '');
      return;
    }

    this.error = '';
    this.asignandoPedidoId = pedido.id;
    this.pedidosService.asignar(pedido.id, campo, usuarioId)
      .pipe(finalize(() => {
        this.asignandoPedidoId = null;
        this.changeDetector.markForCheck();
      }))
      .subscribe({
        next: (pedidoActualizado) => {
          this.pedidos = this.pedidos.map((actual) =>
            actual.id === pedido.id ? pedidoActualizado : actual,
          );
        },
        error: (error: HttpErrorResponse) => {
          this.error = error.error?.message || `No se pudo asignar personal al pedido #${pedido.id}.`;
          select.value = String(pedido[campo === 'cocinero_id' ? 'cocinero' : 'repartidor']?.id ?? '');
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
