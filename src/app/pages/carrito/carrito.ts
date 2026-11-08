import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService } from '../../services/cart';
import { CartItem } from '../../models/cart';
import { MenuAdditional, supportsAdditionals } from '../../models/menu';
import { MenuService } from '../../services/menu';

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './carrito.html',
  styleUrl: './carrito.css',
})
export class Carrito {
  public readonly cart = inject(CartService);
  private readonly menuService = inject(MenuService);

  readonly editingItem = signal<CartItem | null>(null);
  readonly availableAdditionals = signal<MenuAdditional[]>([]);
  readonly selectedAdditionalIds = signal<number[]>([]);
  readonly additionalsLoading = signal(false);
  readonly additionalsError = signal('');
  readonly selectedAdditionals = computed(() => {
    const selectedIds = this.selectedAdditionalIds();
    return this.availableAdditionals().filter((additional) => selectedIds.includes(additional.id));
  });

  puedeEditarAdicionales(item: CartItem): boolean {
    return supportsAdditionals(item.categoriaNombre) && item.categoriaId !== undefined;
  }

  editarAdicionales(item: CartItem): void {
    if (!this.puedeEditarAdicionales(item) || item.categoriaId === undefined) {
      return;
    }

    this.editingItem.set(item);
    this.availableAdditionals.set([]);
    this.selectedAdditionalIds.set(item.adicionales.map((adicional) => adicional.id));
    this.additionalsError.set('');
    this.additionalsLoading.set(true);

    this.menuService.getAdditionals(item.categoriaId).subscribe({
      next: (additionals) => {
        this.availableAdditionals.set(additionals.filter((adicional) => adicional.activo));
        this.additionalsLoading.set(false);
      },
      error: (error: unknown) => {
        console.error('Error al cargar adicionales para editar el carrito:', error);
        this.additionalsError.set('No se pudieron cargar los adicionales. Intenta nuevamente.');
        this.additionalsLoading.set(false);
      },
    });
  }

  toggleAdicional(adicionalId: number): void {
    this.selectedAdditionalIds.update((ids) => {
      if (ids.includes(adicionalId)) {
        return ids.filter((id) => id !== adicionalId);
      }
      return ids.length < 2 ? [...ids, adicionalId] : ids;
    });
  }

  guardarAdicionales(): void {
    const item = this.editingItem();
    if (!item || this.additionalsLoading() || this.additionalsError() || this.selectedAdditionalIds().length > 2) {
      return;
    }

    this.cart.updateAdditionals(
      item.idTemporal,
      this.selectedAdditionals().map(({ id, nombre, precio }) => ({ id, nombre, precio }))
    );
    this.cancelarEdicionAdicionales();
  }

  cancelarEdicionAdicionales(): void {
    this.editingItem.set(null);
    this.availableAdditionals.set([]);
    this.selectedAdditionalIds.set([]);
    this.additionalsError.set('');
    this.additionalsLoading.set(false);
  }

  reintentarCargaAdicionales(): void {
    const item = this.editingItem();
    if (item) {
      this.editarAdicionales(item);
    }
  }

  cargarDemo(): void {
    this.cart.cargarDatosPrueba();
  }

  increment(idTemporal: string): void {
    this.cart.updateQuantity(idTemporal, 1);
  }

  decrement(idTemporal: string): void {
    this.cart.updateQuantity(idTemporal, -1);
  }

  remove(idTemporal: string): void {
    this.cart.removeItem(idTemporal);
  }

  clear(): void {
    this.cart.clear();
  }
}
