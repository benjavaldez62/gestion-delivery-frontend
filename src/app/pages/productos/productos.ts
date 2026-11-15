import { DecimalPipe } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Categoria, CategoriasService } from '../../services/categorias';
import {
  NuevoProducto,
  Producto,
  ProductoActualizado,
  ProductosService,
} from '../../services/productos';

@Component({
  imports: [DecimalPipe, FormsModule],
  selector: 'app-productos',
  styleUrl: './productos.css',
  templateUrl: './productos.html',
})
export class Productos implements OnInit, OnDestroy {
  private readonly productosService = inject(ProductosService);
  private readonly categoriasService = inject(CategoriasService);
  private notificacionTimeout: ReturnType<typeof setTimeout> | null = null;

  productos = signal<Producto[]>([]);
  productosDesactivados = signal<Producto[]>([]);
  categorias = signal<Categoria[]>([]);
  cargandoProductos = signal(true);
  cargandoDesactivados = signal(true);
  cargandoCategorias = signal(true);
  error = signal('');
  errorCategorias = signal('');
  errorGuardar = signal('');
  mensaje = signal('');
  notificacion = signal('');
  guardando = signal(false);
  modalAbierto = signal(false);
  productoEditando = signal<number | null>(null);

  nombre = '';
  descripcion = '';
  precio: number | null = null;
  imagen = '';
  categoriaId: number | null = null;

  ngOnInit(): void {
    this.cargarProductos();
    this.cargarCategorias();
  }

  ngOnDestroy(): void {
    if (this.notificacionTimeout !== null) {
      clearTimeout(this.notificacionTimeout);
    }
  }

  cargarProductos(): void {
    this.cargandoProductos.set(true);
    this.cargandoDesactivados.set(true);

    this.productosService.obtenerProductos().subscribe({
      next: (productos) => {
        this.productos.set(productos);
        this.cargandoProductos.set(false);
      },
      error: (err) => {
        console.error('Error al obtener productos:', err);
        this.error.set('No se pudieron cargar los productos.');
        this.cargandoProductos.set(false);
      },
    });

    this.productosService.obtenerProductosDesactivados().subscribe({
      next: (productos) => {
        this.productosDesactivados.set(productos);
        this.cargandoDesactivados.set(false);
      },
      error: (err) => {
        console.error('Error al obtener productos inactivos:', err);
        this.error.set('No se pudieron cargar los productos inactivos.');
        this.cargandoDesactivados.set(false);
      },
    });
  }

  private cargarCategorias(): void {
    this.categoriasService.obtenerCategorias().subscribe({
      next: (respuesta) => {
        this.categorias.set(respuesta.categorias.filter((categoria) => categoria.activo));
        this.cargandoCategorias.set(false);
      },
      error: (err) => {
        console.error('Error al obtener categorías:', err);
        this.errorCategorias.set(
          err.status === 404
            ? 'No hay categorías activas para asignar.'
            : 'No se pudieron cargar las categorías.'
        );
        this.cargandoCategorias.set(false);
      },
    });
  }

  abrirModal(): void {
    this.limpiarFormulario();
    this.productoEditando.set(null);
    this.errorGuardar.set('');
    this.mensaje.set('');
    this.modalAbierto.set(true);
  }

  editarProducto(producto: Producto): void {
    this.productoEditando.set(producto.id);
    this.nombre = producto.nombre;
    this.descripcion = producto.descripcion ?? '';
    this.precio = producto.precio;
    this.imagen = producto.imagen ?? '';
    this.categoriaId = producto.categoria?.id ?? null;
    this.errorGuardar.set('');
    this.mensaje.set('');
    this.modalAbierto.set(true);
  }

  seleccionarCategoria(id: number, seleccionada: boolean): void {
    this.categoriaId = seleccionada ? id : null;
  }

  cerrarModal(): void {
    if (this.guardando()) {
      return;
    }

    this.modalAbierto.set(false);
    this.productoEditando.set(null);
  }

  guardarProducto(): void {
    this.mensaje.set('');
    this.errorGuardar.set('');

    const nombre = this.nombre.trim();
    const descripcion = this.descripcion.trim();
    const imagen = this.imagen.trim();
    const precio = this.precio;

    if (nombre.length < 5 || nombre.length > 100) {
      this.errorGuardar.set('El nombre debe tener entre 5 y 100 caracteres.');
      return;
    }
    if (descripcion.length > 255) {
      this.errorGuardar.set('La descripción no debe superar los 255 caracteres.');
      return;
    }
    if (precio === null || !Number.isFinite(precio) || precio < 1 || precio > 60000) {
      this.errorGuardar.set('El precio debe estar entre $1 y $60.000.');
      return;
    }
    if (imagen.length > 255 || (imagen.length > 0 && !this.esUrlValida(imagen))) {
      this.errorGuardar.set('Ingresá una URL de imagen válida de hasta 255 caracteres.');
      return;
    }
    if (this.categoriaId === null) {
      this.errorGuardar.set('Seleccioná una categoría.');
      return;
    }

    const datos: ProductoActualizado = {
      nombre,
      descripcion: descripcion || null,
      imagen: imagen || null,
      precio,
      categoria_id: this.categoriaId,
    };
    const id = this.productoEditando();
    const solicitud = id === null
      ? this.productosService.crearProducto({ ...datos, activo: true } satisfies NuevoProducto)
      : this.productosService.actualizarProducto(id, datos);

    this.guardando.set(true);
    solicitud.subscribe({
      next: (respuesta) => {
        if (id === null) {
          this.mostrarNotificacion('Producto creado con éxito.');
        } else {
          this.mensaje.set(respuesta.message);
        }
        this.guardando.set(false);
        this.modalAbierto.set(false);
        this.productoEditando.set(null);
        this.limpiarFormulario();
        this.cargarProductos();
      },
      error: (err) => {
        console.error('Error al guardar producto:', err);
        if (err.status === 422) {
          this.errorGuardar.set(
            err.error?.errors?.nombre?.[0] ??
            err.error?.errors?.descripcion?.[0] ??
            err.error?.errors?.precio?.[0] ??
            err.error?.errors?.imagen?.[0] ??
            err.error?.errors?.categoria_id?.[0] ??
            err.error?.message ??
            'Revisá los datos ingresados.'
          );
        } else {
          this.errorGuardar.set('No se pudo guardar el producto. Verificá la conexión con Laravel.');
        }
        this.guardando.set(false);
      },
    });
  }

  eliminarProducto(producto: Producto): void {
    if (!confirm(`¿Estás seguro que querés desactivar "${producto.nombre}"?`)) {
      return;
    }

    this.error.set('');
    this.mensaje.set('');
    this.productosService.eliminarProducto(producto.id).subscribe({
      next: (respuesta) => {
        this.mensaje.set(respuesta.message);
        this.cargarProductos();
      },
      error: (err) => {
        console.error('Error al desactivar producto:', err);
        this.error.set(err.error?.message ?? 'No se pudo desactivar el producto.');
      },
    });
  }

  restaurarProducto(producto: Producto): void {
    if (!confirm(`¿Querés restaurar "${producto.nombre}"?`)) {
      return;
    }

    this.error.set('');
    this.mensaje.set('');
    this.productosService.restaurarProducto(producto.id).subscribe({
      next: (respuesta) => {
        this.mensaje.set(respuesta.message);
        this.cargarProductos();
      },
      error: (err) => {
        console.error('Error al restaurar producto:', err);
        this.error.set(err.error?.message ?? 'No se pudo restaurar el producto.');
      },
    });
  }

  private esUrlValida(value: string): boolean {
    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  private mostrarNotificacion(message: string): void {
    this.notificacion.set(message);
    if (this.notificacionTimeout !== null) {
      clearTimeout(this.notificacionTimeout);
    }
    this.notificacionTimeout = setTimeout(() => {
      this.notificacion.set('');
      this.notificacionTimeout = null;
    }, 3500);
  }

  private limpiarFormulario(): void {
    this.nombre = '';
    this.descripcion = '';
    this.precio = null;
    this.imagen = '';
    this.categoriaId = null;
  }
}
