import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectorRef, Component, DestroyRef, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { Subscription, forkJoin, finalize } from 'rxjs';
import { CatalogoPago, MetodoPagoAdministracion, PagoAdministracion, PagosService, ResumenEnvios, ResumenIngresos } from '../../services/pagos';

@Component({
  selector: 'app-pagos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pagos.html',
  styleUrl: './pagos.css',
})
export class Pagos implements OnInit {
  private readonly service = inject(PagosService);
  private readonly cd = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  @ViewChild('ticketDialog', { static: true }) private ticketDialog!: ElementRef<HTMLDialogElement>;
  private solicitudTicket?: Subscription;
  pagos: PagoAdministracion[] = [];
  metodos: MetodoPagoAdministracion[] = [];
  estados: CatalogoPago[] = [];
  busqueda = '';
  estado = '';
  metodo = '';
  error = '';
  cargando = false;
  resumen: ResumenIngresos | null = null;
  errorResumen = '';
  cargandoResumen = false;
  fechaEnvios = '';
  resumenEnvios: ResumenEnvios | null = null;
  errorEnvios = '';
  cargandoEnvios = false;
  numeroTicket = '';
  contenidoTicket: string | null = null;
  errorTicket = '';
  cargandoTicket = false;

  ngOnInit(): void {
    this.cargarResumen();
    this.cargarEnvios();
    this.cargando = true;
    forkJoin({ metodos: this.service.metodos(), estados: this.service.estados() })
      .pipe(finalize(() => { this.cargando = false; this.cd.markForCheck(); }))
      .subscribe({
        next: ({ metodos, estados }) => {
          this.metodos = metodos;
          this.estados = estados;
          this.buscar();
        },
        error: (error: HttpErrorResponse) => this.mostrarError(error, 'No se pudieron cargar los métodos y estados de pago.'),
      });
  }

  cargarEnvios(): void {
    if (this.cargandoEnvios) return;
    this.errorEnvios = '';
    this.resumenEnvios = null;
    this.cargandoEnvios = true;
    this.service.resumenEnvios(this.fechaEnvios)
      .pipe(finalize(() => { this.cargandoEnvios = false; this.cd.markForCheck(); }))
      .subscribe({
        next: resumen => { this.resumenEnvios = resumen; this.fechaEnvios = resumen.fecha; },
        error: () => { this.errorEnvios = 'No se pudieron cargar los envíos. Revisá la fecha e intentá nuevamente.'; },
      });
  }

  cargarResumen(): void {
    if (this.cargandoResumen) return;
    this.errorResumen = '';
    this.cargandoResumen = true;
    this.service.resumen()
      .pipe(finalize(() => { this.cargandoResumen = false; this.cd.markForCheck(); }))
      .subscribe({
        next: resumen => { this.resumen = resumen; },
        error: () => { this.resumen = null; this.errorResumen = 'No se pudieron cargar los ingresos. Intentá nuevamente.'; },
      });
  }

  buscar(): void {
    this.error = '';
    this.cargando = true;
    this.service.listar(this.busqueda.trim(), this.estado, this.metodo)
      .pipe(finalize(() => { this.cargando = false; this.cd.markForCheck(); }))
      .subscribe({
        next: pagos => { this.pagos = pagos; },
        error: (error: HttpErrorResponse) => { this.pagos = []; this.mostrarError(error, 'No se pudieron cargar los pagos.'); },
      });
  }

  esOperativo(metodo: MetodoPagoAdministracion): boolean {
    return metodo.nombre.trim().toLocaleLowerCase() === 'efectivo';
  }

  verTicket(id: number, numero: string): void {
    this.numeroTicket = numero;
    this.contenidoTicket = null;
    this.errorTicket = '';
    this.cargandoTicket = true;
    this.ticketDialog.nativeElement.showModal();
    this.solicitudTicket = this.service.comprobante(id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => { this.cargandoTicket = false; this.cd.markForCheck(); }),
      )
      .subscribe({
        next: comprobante => { this.contenidoTicket = comprobante.contenido_ticket; },
        error: () => { this.errorTicket = 'No se pudo cargar el comprobante. Intentá nuevamente.'; },
      });
  }

  cerrarTicket(): void {
    this.cancelarSolicitudTicket();
    this.ticketDialog.nativeElement.close();
  }

  cancelarSolicitudTicket(): void {
    this.solicitudTicket?.unsubscribe();
  }

  private mostrarError(error: HttpErrorResponse, alternativa: string): void {
    this.error = error.error?.message || alternativa;
    this.cd.markForCheck();
  }
}
