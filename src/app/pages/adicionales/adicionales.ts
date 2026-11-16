import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdicionalesService, Adicional, Categoria } from '../../services/adicionales';

@Component({
  imports: [FormsModule],
  selector: 'app-adicionales',
  styleUrl: './adicionales.css',
  templateUrl: './adicionales.html',
})
export class Adicionales implements OnInit {
  private adicionalesService = inject(AdicionalesService);

  adicionales = signal<Adicional[]>([]);
  adicionalesDesactivados = signal<Adicional[]>([]);
  categorias = signal<Categoria[]>([]);
  categoriasSeleccionadas = signal<number[]>([]);
  adicionalesFiltrados = computed(() => this.filtrarPorCategoria(this.adicionales()));
  adicionalesDesactivadosFiltrados = computed(() => this.filtrarPorCategoria(this.adicionalesDesactivados()));
  cantidadAdicionalesPorCategoria = computed(() => {
    const cantidades = new Map<number, number>();
    const adicionales = [...this.adicionales(), ...this.adicionalesDesactivados()];

    for (const adicional of adicionales) {
      const categoriaId = adicional.categoria?.id ?? adicional.categoria_id;
      if (categoriaId !== undefined) {
        cantidades.set(categoriaId, (cantidades.get(categoriaId) ?? 0) + 1);
      }
    }

    return cantidades;
  });

  cargando = signal(true);
  error = signal('');
  errorCategorias = signal('');
  errorGuardar = signal('');
  mensaje = signal('');
  guardando = signal(false);
  modalAbierto = signal(false);
  adicionalEditando = signal<number | null>(null);

  nombre = '';
  descripcion = '';
  activo = true;
  precio = 0;
  categoriaId: number | null = null;

  ngOnInit(): void {
    this.cargarAdicionales();
    this.cargarCategorias();
  }

  cargarAdicionales(): void {

    // 1. Cargamos adicionales disponibles
    this.adicionalesService.obtenerAdicionales().subscribe({
      next: (respuesta) => {
        this.adicionales.set(respuesta.adicionales);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al obtener adicionales:', err);
        this.error.set('No se pudieron cargar los adicionales.');
        this.cargando.set(false);
      }
    });

    // 2. Cargamos adicionales desactivadas
    this.adicionalesService.obtenerAdicionalesDesactivados().subscribe({
      next: (respuesta) => {
        this.adicionalesDesactivados.set(respuesta.adicionalesDesactivados);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al obtener adicionales desactivados:', err);
      }
    });
  }

  private cargarCategorias(): void {
    this.adicionalesService.obtenerCategorias().subscribe({
      next: (respuesta) => {
        this.categorias.set(respuesta.categorias);
        this.errorCategorias.set('');
      },
      error: (err) => {
        console.error('Error al obtener categorias:', err);
        this.errorCategorias.set('No se pudieron cargar los categorias.');
        this.error.set('No se pudieron cargar los categorias.');
      }
    });
  }

  actualizarFiltroCategoria(categoriaId: number, seleccionado: boolean): void {
    this.categoriasSeleccionadas.update((seleccionados) =>
      seleccionado
        ? (seleccionados.includes(categoriaId) ? seleccionados : [...seleccionados, categoriaId])
        : seleccionados.filter((id) => id !== categoriaId)
    );
  }

  limpiarFiltrosCategorias(): void {
    this.categoriasSeleccionadas.set([]);
  }

  private filtrarPorCategoria(adicionales: Adicional[]): Adicional[] {
    const categoriasSeleccionadas = this.categoriasSeleccionadas();
    if (categoriasSeleccionadas.length === 0) {
      return adicionales;
    }

    return adicionales.filter((adicional) => {
      const categoriaId = adicional.categoria?.id ?? adicional.categoria_id;
      return categoriaId !== undefined && categoriasSeleccionadas.includes(categoriaId);
    });
  }

  obtenerNombreCategoria(adicional: Adicional): string {
    const categoriaId = adicional.categoria?.id ?? adicional.categoria_id;
    return adicional.categoria?.nombre
      ?? this.categorias().find((categoria) => categoria.id === categoriaId)?.nombre
      ?? 'Categoría no disponible';
  }

  abrirModal(): void {
    this.limpiarFormulario();
    this.adicionalEditando.set(null);
    this.errorGuardar.set('');
    this.mensaje.set('');
    this.modalAbierto.set(true);
  }

  editarAdicional(adicional: Adicional): void {
    this.adicionalEditando.set(adicional.id);
    this.nombre = adicional.nombre;
    this.descripcion = adicional.descripcion ?? '';
    this.precio = adicional.precio;
    this.categoriaId = adicional.categoria?.id ?? adicional.categoria_id ?? null;
    this.errorGuardar.set('');
    this.mensaje.set('');
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    if (this.guardando()) {
      return;
    }

    this.modalAbierto.set(false);
    this.adicionalEditando.set(null);
  }

  guardarAdicional(): void {
    this.mensaje.set('');
    this.errorGuardar.set('');

    const id = this.adicionalEditando();
    const nombre = this.nombre.trim();
    const descripcion = this.descripcion.trim();
    const precio = this.precio;

    if (id === null && nombre.length === 0) {
      this.errorGuardar.set('El nombre es obligatorio.');
      return;
    }
    if (id === null && precio <= 0) {
      this.errorGuardar.set('El precio debe ser un numero positivo.');
      return;
    }
    if (id !== null && nombre.length < 5) {
      this.errorGuardar.set('El nombre debe tener al menos 5 caracteres.');
      return;
    }
    if (nombre.length > 50) {
      this.errorGuardar.set('El nombre no debe superar los 50 caracteres.');
      return;
    }
    const categoriaId = this.categoriaId;
    if (categoriaId === null) {
      this.errorGuardar.set('Seleccioná una categoria.');
      return;
    }

    this.guardando.set(true);
    const solicitud = id === null
      ? this.adicionalesService.crearAdicional({
        nombre,
        descripcion,
        precio,
        categoria_id: categoriaId,
        activo: true,
      })
      : this.adicionalesService.actualizarAdicional(id, {
        nombre,
        descripcion,
        categoria_id: categoriaId,
        precio
      });

    solicitud.subscribe({
      next: (respuesta) => {
        this.mensaje.set(respuesta.message);
        this.guardando.set(false);
        this.modalAbierto.set(false);
        this.adicionalEditando.set(null);
        this.limpiarFormulario();
        this.cargarAdicionales();
      },
      error: (err) => {
        console.error('Error al guardar adicional:', err);
        if (err.status === 422) {
          this.errorGuardar.set(
            err.error?.errors?.nombre?.[0] ??
            err.error?.errors?.descripcion?.[0] ??
            err.error?.errors?.precio?.[0] ??
            err.error?.errors?.categoria_id?.[0] ??
            err.error?.error ??
            err.error?.message ??
            'Revisá los datos ingresados.'
          );
        } else {
          this.errorGuardar.set('No se pudo guardar el adicional. Verificá la conexión con Laravel.');
        }
        this.guardando.set(false);
      }
    });
  }

  eliminarAdicional(adicional: Adicional): void {
    const confirmar = confirm(`¿Estás seguro que querés eliminar el adicional "${adicional.nombre}"?`);

    // Caso 'Cancelar'
    if (!confirmar) {
      return;
    }

    // Caso 'Eliminar'
    this.error.set('');
    this.mensaje.set('');
    this.adicionalesService.eliminarAdicional(adicional.id).subscribe({
      next: (respuesta) => {
        this.mensaje.set(respuesta.message);
        this.cargarAdicionales();
      },
      error: (err) => {
        console.error('Error al eliminar el adicional:', err);
        this.error.set(err.error?.message ?? 'No se pudo eliminar el adicional.');
      }
    });
  }

  restaurarAdicional(adicional: Adicional): void {
    const confirmar = confirm(`¿Querés restaurar el adicional "${adicional.nombre}"?`);

    // Caso 'Cancelar'
    if (!confirmar) {
      return;
    }

    // Caso 'Restaurar'
    this.adicionalesService.restaurarAdicional(adicional.id).subscribe({
      next: (respuesta) => {
        this.mensaje.set(respuesta.message);

        // Actualizar listas de adicionales (activos y desactivados )
        this.cargarAdicionales();
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'No se pudo restaurar el adicional.');
      }
    });
  }

  private limpiarFormulario(): void {
    this.nombre = '';
    this.descripcion = '';
    this.precio = 0;
    this.categoriaId = null;
  }
}