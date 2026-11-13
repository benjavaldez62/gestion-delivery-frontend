import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoriasService, Categoria, nuevaCategoria } from '../../services/categorias';

@Component({
  selector: 'app-categorias',
  imports: [DatePipe, FormsModule],
  templateUrl: './categorias.html',
  styleUrl: './categorias.css'
})

export class Categorias implements OnInit {

  // MODAL
  modalAbierto = signal(false);
  estadoCategoria = true;

  abrirModal(): void {
    this.categoriaEditando.set(null);
    this.nombre = '';
    this.descripcion = '';
    this.error.set('');
    this.mensaje.set('');
    this.modalAbierto.set(true);
  }

  // editar categoria
  editarCategoria(categoria: Categoria): void {
    this.categoriaEditando.set(categoria.id);
    this.nombre = categoria.nombre;
    this.descripcion = categoria.descripcion ?? '';
    this.estadoCategoria = categoria.activo;
    this.error.set('');
    this.mensaje.set('');
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    if (this.guardando()) {
      return;
    }

    this.modalAbierto.set(false);
    this.categoriaEditando.set(null);
  }

  private categoriasService = inject(CategoriasService);

  categorias = signal<Categoria[]>([]);
  categoriasDesactivadas = signal<Categoria[]>([]);
  cargando = signal(true);
  error = signal('');
  errorGuardar = signal('');

  nombre = '';
  descripcion = '';
  activo = true;

  guardando = signal(false);
  mensaje = signal('');

  ngOnInit(): void {

    this.cargarCategorias();
  }

  cargarCategorias(): void {

    // 1. Cargamos categorias disponibles
    this.categoriasService.obtenerCategorias().subscribe({
      next: (respuesta) => {
        this.categorias.set(respuesta.categorias);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al obtener categorías:', err);
        this.error.set('No se pudieron cargar las categorías.');
        this.cargando.set(false);
      }
    });

    // 2. Cargamos las categorias desactivadas
    this.categoriasService.obtenerCategoriasDesactivadas().subscribe({
      next: (respuesta) => {
        this.categoriasDesactivadas.set(respuesta.categoriasDesactivadas);
        this.cargando.set(false);
      },
    })
  }

  guardarCategoria(): void {
    this.mensaje.set('');
    this.errorGuardar.set('');

    const datos: nuevaCategoria = {
      nombre: this.nombre.trim(),
      descripcion: this.descripcion.trim(),
      ...(this.categoriaEditando() !== null ? { activo: this.estadoCategoria } : {}),
    };

    if (datos.nombre.length < 2) {
      this.errorGuardar.set('El nombre debe tener al menos 2 caracteres.');
      return;
    } else if (datos.nombre.length > 50) {
      this.errorGuardar.set('El nombre no debe superar los 50 caracteres.');
      return;
    }

    this.guardando.set(true);

    const id = this.categoriaEditando();

    const solicitud =
      id === null
        ? this.categoriasService.crearCategoria(datos)
        : this.categoriasService.actualizarCategoria(id, datos);

    this.guardando.set(true);

    solicitud.subscribe({
      next: (respuesta) => {
        this.mensaje.set(respuesta.message);

        this.nombre = '';
        this.descripcion = '';

        this.guardando.set(false);

        this.modalAbierto.set(false);

        this.categoriaEditando.set(null);

        this.cargarCategorias();
      },
      error: (err) => {
        console.error('Error al guardar categoría:', err);

        if (err.status === 422) {
          this.errorGuardar.set(
            err.error?.errors?.nombre?.[0] ??
            err.error?.errors?.descripcion?.[0] ??
            err.error?.message ??
            'Revisá los datos ingresados.'
          );
        } else {
          this.errorGuardar.set('No se pudo guardar la categoría. Verificá la conexión con Laravel.');
        }

        this.guardando.set(false);
      },
    });
  }

   categoriaEditando = signal<number | null>(null);
}