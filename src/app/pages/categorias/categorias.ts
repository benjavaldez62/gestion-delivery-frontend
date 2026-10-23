import { Component, OnInit, inject, signal } from '@angular/core';
import { CategoriasService, Categoria } from '../../services/categorias';

@Component({
  selector: 'app-categorias',
  templateUrl: './categorias.html',
  styleUrl: './categorias.css'
})
export class Categorias implements OnInit {
  private categoriasService = inject(CategoriasService);
  categorias = signal<Categoria[]>([]);
  cargando = signal(true);
  error = signal('');
  ngOnInit(): void {
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
  }
}