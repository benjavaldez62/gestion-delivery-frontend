import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CategoriasService } from '../../services/categorias';
import { asignarImagenCategoria } from '../../utils/categoria-imagen';

export interface CategoriaCarrusel {
  id: number;
  nombre: string;
  imagen: string;
}

@Component({
  imports: [RouterLink],
  selector: 'app-inicio',
  styleUrl: './inicio.css',
  templateUrl: './inicio.html',
})
export class Inicio implements OnInit, OnDestroy {
  private readonly categoriasService = inject(CategoriasService);
  private temporizadorAutoplay: ReturnType<typeof setInterval> | null = null;

  readonly categoriasBase = signal<CategoriaCarrusel[]>([]);
  readonly indiceActual = signal<number>(0);
  readonly pausado = signal<boolean>(false);
  readonly categoriasCargando = signal(true);
  readonly errorCategorias = signal('');
  readonly cantidadVisible = 6;

  readonly categoriasVisibles = computed<CategoriaCarrusel[]>(() => {
    const lista = this.categoriasBase();
    if (lista.length === 0) {
      return [];
    }
    const inicio = this.indiceActual();
    const resultado: CategoriaCarrusel[] = [];
    for (let i = 0; i < Math.min(this.cantidadVisible, lista.length); i++) {
      resultado.push(lista[(inicio + i) % lista.length]);
    }
    return resultado;
  });

  ngOnInit(): void {
    this.cargarCategoriasDesdeApi();
    this.iniciarAutoplay();
  }

  ngOnDestroy(): void {
    this.detenerAutoplay();
  }

  siguienteCategoria(): void {
    const total = this.categoriasBase().length;
    if (total > 0) {
      this.indiceActual.update((actual) => (actual + 1) % total);
    }
  }

  anteriorCategoria(): void {
    const total = this.categoriasBase().length;
    if (total > 0) {
      this.indiceActual.update((actual) => (actual - 1 + total) % total);
    }
  }

  pausarAutoplay(): void {
    this.pausado.set(true);
  }

  reanudarAutoplay(): void {
    this.pausado.set(false);
  }

  categoriaIdPorNombre(nombre: string): number | null {
    const normalizar = (valor: string): string =>
      valor.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
    const nombreBuscado = normalizar(nombre);
    return this.categoriasBase().find((categoria) => normalizar(categoria.nombre) === nombreBuscado)?.id ?? null;
  }

  private iniciarAutoplay(): void {
    this.detenerAutoplay();
    this.temporizadorAutoplay = setInterval(() => {
      if (!this.pausado()) {
        this.siguienteCategoria();
      }
    }, 2200);
  }

  private detenerAutoplay(): void {
    if (this.temporizadorAutoplay !== null) {
      clearInterval(this.temporizadorAutoplay);
      this.temporizadorAutoplay = null;
    }
  }

  private cargarCategoriasDesdeApi(): void {
    this.categoriasService.obtenerCategorias().subscribe({
      next: (respuesta) => {
        const activas = (respuesta?.categorias ?? []).filter((c) => c.activo);
        this.categoriasBase.set(
          activas.map((cat, idx) => ({
            id: cat.id,
            nombre: cat.nombre,
            imagen: asignarImagenCategoria(cat, idx),
          }))
        );
        this.indiceActual.set(0);
        this.categoriasCargando.set(false);
      },
      error: (error: unknown) => {
        console.error('Error al obtener categorías de Inicio:', error);
        this.errorCategorias.set('No se pudieron cargar las categorías. Intenta nuevamente más tarde.');
        this.categoriasCargando.set(false);
      },
    });
  }

}
