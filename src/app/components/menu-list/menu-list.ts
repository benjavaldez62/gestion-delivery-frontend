import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { CartService } from '../../services/cart';
import { MenuService } from '../../services/menu';
import { MenuAdditional, MenuProduct } from '../../models/menu';
import { ProductCardComponent } from '../product-card/product-card';

@Component({
  imports: [CurrencyPipe, ProductCardComponent],
  selector: 'app-menu-list',
  standalone: true,
  styleUrl: './menu-list.css',
  templateUrl: './menu-list.html',
})
export class MenuListComponent implements OnInit {
  private readonly menuService = inject(MenuService);
  private readonly cartService = inject(CartService);

  readonly products = signal<MenuProduct[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly selectedProduct = signal<MenuProduct | null>(null);
  readonly additionals = signal<MenuAdditional[]>([]);
  readonly additionalsLoading = signal(false);
  readonly additionalsError = signal('');
  readonly quantity = signal(1);
  readonly selectedAdditionalIds = signal<number[]>([]);
  readonly selectedAdditionals = computed(() => {
    const selectedIds = this.selectedAdditionalIds();
    return this.additionals().filter((additional) => selectedIds.includes(additional.id));
  });
  readonly selectedTotal = computed(() => {
    const product = this.selectedProduct();
    return product
      ? (product.precio + this.selectedAdditionals().reduce((total, additional) => total + additional.precio, 0))
        * this.quantity()
      : 0;
  });

  ngOnInit(): void {
    this.menuService.getProducts().subscribe({
      next: (products) => {
        this.products.set(products);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        console.error('Error al obtener el menú:', error);
        this.error.set(
          error instanceof HttpErrorResponse && error.status === 0
            ? 'No se pudo conectar con el backend. Inicia el servidor de la API e intenta nuevamente.'
            : 'No se pudo cargar el menú. Intenta nuevamente más tarde.'
        );
        this.loading.set(false);
      },
    });
  }

  solicitarAgregar(product: MenuProduct): void {
    if (!product.activo || this.additionalsLoading()) {
      return;
    }

    this.selectedProduct.set(product);
    this.selectedAdditionalIds.set([]);
    this.quantity.set(1);
    this.additionals.set([]);
    this.additionalsError.set('');

    if (!product.categoria?.id) {
      this.additionalsLoading.set(false);
      return;
    }

    this.cargarAdicionales(product, product.categoria.id);
  }

  incrementarCantidad(): void {
    this.quantity.update((current) => current + 1);
  }

  decrementarCantidad(): void {
    this.quantity.update((current) => Math.max(1, current - 1));
  }

  private cargarAdicionales(product: MenuProduct, categoryId: number): void {
    this.additionalsLoading.set(true);
    this.additionalsError.set('');
    this.menuService.getAdditionals(categoryId).subscribe({
      next: (additionals) => {
        this.additionalsLoading.set(false);
        const availableAdditionals = additionals.filter((additional) => additional.activo);
        this.additionals.set(availableAdditionals);
      },
      error: (error: unknown) => {
        console.error('Error al obtener adicionales del menú:', error);
        this.additionalsLoading.set(false);
        this.additionals.set([]);
        this.additionalsError.set('No se pudieron cargar los adicionales. Puedes agregar el producto sin adicionales o reintentar.');
      },
    });
  }

  reintentarAdicionales(): void {
    const product = this.selectedProduct();
    if (product?.categoria?.id) {
      this.cargarAdicionales(product, product.categoria.id);
    }
  }

  toggleAdicional(additionalId: number): void {
    this.selectedAdditionalIds.update((selectedIds) => {
      if (selectedIds.includes(additionalId)) {
        return selectedIds.filter((id) => id !== additionalId);
      }
      if (selectedIds.length >= 2) {
        return selectedIds;
      }
      return [...selectedIds, additionalId];
    });
  }

  confirmarAgregar(): void {
    const product = this.selectedProduct();
    if (!product || !product.activo || this.selectedAdditionalIds().length > 2) {
      return;
    }
    this.agregarProducto(product, this.selectedAdditionals());
  }

  cerrarModal(): void {
    this.selectedProduct.set(null);
    this.selectedAdditionalIds.set([]);
    this.quantity.set(1);
    this.additionals.set([]);
    this.additionalsLoading.set(false);
    this.additionalsError.set('');
  }

  private agregarProducto(product: MenuProduct, additionals: MenuAdditional[]): void {
    this.cartService.addItem({
      productoId: product.id,
      nombre: product.nombre,
      precioUnitario: product.precio,
      cantidad: this.quantity(),
      imagenUrl: product.imagen ?? undefined,
      adicionales: additionals.map(({ id, nombre, precio }) => ({ id, nombre, precio })),
    });
    this.cerrarModal();
  }
}
