import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MetodosPagoService, MetodoPago, nuevoMetodoPago } from '../../services/metodos-pago';

@Component({
  imports: [FormsModule],
  selector: 'app-metodos-pago',
  styleUrl: './metodos-pago.css',
  templateUrl: './metodos-pago.html',
})
export class MetodoPagos implements OnInit {

  // Modal
  modalAbierto = signal(false);
  estadoMetodoPago = true;

  abrirModal(): void {
    this.metodoPagoEditando.set(null);
    this.nombre = '';
    this.descripcion = '';
    this.error.set('');
    this.modalAbierto.set(true);
  }

  editarMetodoPago(metodoPago: MetodoPago): void {
    this.metodoPagoEditando.set(metodoPago.id);
    this.nombre = metodoPago.nombre;
    this.descripcion = metodoPago.descripcion ?? '';
    this.estadoMetodoPago = metodoPago.activo;
    this.error.set('');
    this.mensaje.set('');
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    if (this.guardando()) {
      return;
    }

    this.modalAbierto.set(false);
    this.metodoPagoEditando.set(null);
  }

  private metodosPagoService = inject(MetodosPagoService);

  metodosPago = signal<MetodoPago[]>([]);
  metodosPagoDesactivados = signal<MetodoPago[]>([]);
  cargando = signal(true);
  error = signal('');
  errorGuardar = signal('');

  nombre = '';
  descripcion = '';
  activo = true;

  guardando = signal(false);
  mensaje = signal('');

  ngOnInit(): void {
    this.cargarMetodosPago();
  }

  cargarMetodosPago(): void {
    this.cargando.set(true);

    this.metodosPagoService.obtenerMetodosPago().subscribe({
      next: (respuesta) => {
        this.metodosPago.set(respuesta.metodosPago);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al obtener los métodos de pago:', err);
        this.error.set('No se pudieron cargar los métodos de pago.');
        this.cargando.set(false);
      }
    });

    this.metodosPagoService.obtenerMetodosPagoDesactivados().subscribe({
      next: (respuesta) => {
        this.metodosPagoDesactivados.set(respuesta.metodosPagoDesactivados);
        this.cargando.set(false);
      },
      error: (err) => {
        if (err.status === 404) {
          this.metodosPagoDesactivados.set([]);
        } else {
          console.error('Error al obtener los métodos de pago desactivados:', err);
          this.error.set('No se pudieron cargar los métodos de pago desactivados.');
        }

        this.cargando.set(false);
      }
    });
  }

  guardarMetodoPago(): void {
    this.mensaje.set('');
    this.errorGuardar.set('');

    const datos: nuevoMetodoPago = {
      nombre: this.nombre.trim(),
      descripcion: this.descripcion.trim(),
      ...(this.metodoPagoEditando() !== null ? { activo: this.estadoMetodoPago } : {}),
    };

    if (datos.nombre.length > 50) {
      this.errorGuardar.set('El nombre no debe superar los 50 caracteres.');
      return;
    } else if (datos.descripcion.length > 150) {
      this.errorGuardar.set('La descripción del método de pago no debe superar los 150 caracteres.');
      return;
    }

    this.guardando.set(true);

    const id = this.metodoPagoEditando();

    // dependiendo si tiene o no id, se llama al método correspondiente:
    const solicitud =
      id === null
        ? this.metodosPagoService.crearMetodoPago(datos)
        : this.metodosPagoService.actualizarMetodoPago(id, datos);

    this.guardando.set(true);

    solicitud.subscribe({
      next: (respuesta) => {
        this.mensaje.set(respuesta.message);

        this.nombre = '';
        this.descripcion = '';

        this.guardando.set(false);

        this.modalAbierto.set(false);
        this.metodoPagoEditando.set(null);

        this.cargarMetodosPago();
      },
      error: (err) => {
        console.error('Error al guardar método de pago:', err);

        if (err.status === 422) {
          this.errorGuardar.set(
            err.error?.errors?.nombre?.[0] ??
            err.error?.errors?.descripcion?.[0] ??
            err.error?.message ??
            'Revisá los datos ingresados.'
          );
        } else {
          this.errorGuardar.set('No se pudo guardar el método de pago. Verificá la conexión con Laravel.');
        }

        this.guardando.set(false);
      },
    });
  }

  metodoPagoEditando = signal<number | null>(null);

  //eliminar
  eliminarMetodoPago(metodoPago: MetodoPago): void {
    const confirmar = confirm(`¿Estás seguro que querés eliminar el método de pago "${metodoPago.nombre}"?`);

    if (!confirmar) { return; }

    // caso Eliminar
    this.error.set('');
    this.mensaje.set('');
    this.metodosPagoService.eliminarMetodoPago(metodoPago.id).subscribe({
      next: (respuesta) => {
        this.mensaje.set(respuesta.message);
        this.cargarMetodosPago();
      },
      error: (err) => {
        console.error('Error al eliminar el método de pago:', err);

        this.error.set(err.error?.message ?? 'No se pudo eliminar l método de pago');
      }
    });
  }

  // restaurar
  restaurarMetodoPago(metodoPago: MetodoPago): void {
    const confirmar = confirm(`¿Estás seguro que querés restaurar el método de pago "${metodoPago.nombre}"?`);

    if (!confirmar) { return; }

    // caso Restaurar
    this.metodosPagoService.restaurarMetodoPago(metodoPago.id).subscribe({
      next: (respuesta) => {
        this.mensaje.set(respuesta.message);

        // Actualizar listas
        this.cargarMetodosPago();
      },
      error: (err) => {
        this.error.set(err.error?.message || 'No se pudo restaurar el método de pago.');
      }
    });
  }
}
