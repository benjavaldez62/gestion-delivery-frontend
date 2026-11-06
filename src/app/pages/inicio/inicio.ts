import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CategoriasService, Categoria } from '../../services/categorias';

export interface CategoriaCarrusel {
  id: number;
  nombre: string;
  imagen: string;
}

const CATEGORIAS_POR_DEFECTO: CategoriaCarrusel[] = [
  { id: 1, nombre: 'Hamburguesas', imagen: 'assets/img/home-1/menu-l1.png' },
  { id: 2, nombre: 'Pastas', imagen: 'assets/img/home-1/menu-l2.png' },
  { id: 3, nombre: 'Ensaladas', imagen: 'assets/img/home-1/menu-l3.png' },
  { id: 4, nombre: 'Pizzas', imagen: 'assets/img/home-1/menu-l4.png' },
  { id: 5, nombre: 'Sandwiches', imagen: 'assets/img/home-1/menu-l5.png' },
  { id: 6, nombre: 'Guarniciones', imagen: 'assets/img/home-1/menu-l6.png' },
  { id: 7, nombre: 'Milanesas', imagen: 'assets/img/home-1/pp-categori1.png' },
  { id: 8, nombre: 'Empanadas', imagen: 'assets/img/home-1/pp-categori5.png' },
  { id: 9, nombre: 'Entradas', imagen: 'assets/img/home-1/pp-categori7.png' },
];

@Component({
  imports: [RouterLink],
  selector: 'app-inicio',
  styleUrl: './inicio.css',
  templateUrl: './inicio.html',
})
export class Inicio implements OnInit, OnDestroy {
  private readonly categoriasService = inject(CategoriasService);
  private temporizadorAutoplay: ReturnType<typeof setInterval> | null = null;

  readonly categoriasBase = signal<CategoriaCarrusel[]>(CATEGORIAS_POR_DEFECTO);
  readonly indiceActual = signal<number>(0);
  readonly pausado = signal<boolean>(false);
  readonly cantidadVisible = 6;

  readonly categoriasVisibles = computed<CategoriaCarrusel[]>(() => {
    const lista = this.categoriasBase();
    if (lista.length === 0) {
      return [];
    }
    const inicio = this.indiceActual();
    const resultado: CategoriaCarrusel[] = [];
    for (let i = 0; i < this.cantidadVisible; i++) {
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
        if (activas.length > 0) {
          this.categoriasBase.set(
            activas.map((cat, idx) => ({
              id: cat.id,
              nombre: cat.nombre,
              imagen: this.asignarImagenCategoria(cat, idx),
            }))
          );
          this.indiceActual.set(0);
        }
      },
      error: () => {
        // Se conservan las categorias visuales por defecto si el servidor no responde
      },
    });
  }

  private asignarImagenCategoria(categoria: Categoria, indice: number): string {
    const nombre = categoria.nombre.toLowerCase();
    if (nombre.includes('hamburguesa') || nombre.includes('burger')) {
      return 'assets/img/home-1/menu-l1.png';
    }
    if (nombre.includes('pasta') || nombre.includes('tallar') || nombre.includes('raviol')) {
      return 'assets/img/home-1/menu-l2.png';
    }
    if (nombre.includes('ensalada')) {
      return 'assets/img/home-1/menu-l3.png';
    }
    if (nombre.includes('pizza')) {
      return 'assets/img/home-1/menu-l4.png';
    }
    if (nombre.includes('sandwich') || nombre.includes('lomo')) {
      return 'assets/img/home-1/menu-l5.png';
    }
    if (nombre.includes('milanesa') || nombre.includes('carne')) {
      return 'assets/img/home-1/pp-categori1.png';
    }
    if (nombre.includes('empanada')) {
      return 'assets/img/home-1/pp-categori5.png';
    }
    const imagenesFallback = CATEGORIAS_POR_DEFECTO.map((c) => c.imagen);
    return imagenesFallback[indice % imagenesFallback.length];
  }
}
