import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { CartService } from '../../services/cart';
import { MenuService } from '../../services/menu';
import { MenuAdditional, MenuProduct, supportsAdditionals } from '../../models/menu';
import { ProductCardComponent } from '../product-card/product-card';

@Component({
  imports: [ProductCardComponent],
  selector: 'app-menu-list',
  standalone: true,
  styleUrl: './menu-list.css',
  templateUrl: './menu-list.html',
})
export class MenuListComponent implements OnInit, OnDestroy {
  private readonly menuService = inject(MenuService);
  private readonly cartService = inject(CartService);
  private additionalsRequestId = 0;
  private toastTimeout: ReturnType<typeof setTimeout> | null = null;

  readonly products = signal<MenuProduct[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');
  readonly expandedProductId = signal<number | null>(null);
  readonly additionals = signal<MenuAdditional[]>([]);
  readonly additionalsLoading = signal(false);
  readonly additionalsError = signal('');
  readonly selectedAdditionalIds = signal<number[]>([]);
  readonly quantities = signal<Record<number, number>>({});
  readonly successMessage = signal('');

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

  ngOnDestroy(): void {
    if (this.toastTimeout !== null) {
      clearTimeout(this.toastTimeout);
    }
  }

  toggleAdditionals(product: MenuProduct, expanded: boolean): void {
    if (!expanded) {
      if (this.expandedProductId() === product.id) {
        this.resetAdditionals();
      }
      return;
    }

    if (!product.activo || !supportsAdditionals(product.categoria?.nombre) || !product.categoria?.id) {
      return;
    }

    this.expandedProductId.set(product.id);
    this.selectedAdditionalIds.set([]);
    this.additionals.set([]);
    this.additionalsError.set('');
    this.cargarAdicionales(product.categoria.id);
  }

  quantityFor(productId: number): number {
    return this.quantities()[productId] ?? 1;
  }

  permiteAdicionales(product: MenuProduct): boolean {
    return supportsAdditionals(product.categoria?.nombre);
  }

  changeQuantity(productId: number, delta: number): void {
    this.quantities.update((quantities) => ({
      ...quantities,
      [productId]: Math.max(1, this.quantityFor(productId) + delta),
    }));
  }

  solicitarAgregar(product: MenuProduct, quantity: number): void {
    if (!product.activo || (this.expandedProductId() === product.id && this.additionalsLoading())) {
      return;
    }

    const additionals = this.expandedProductId() === product.id
      ? this.additionals().filter((additional) => this.selectedAdditionalIds().includes(additional.id))
      : [];
    this.cartService.addItem({
      productoId: product.id,
      nombre: product.nombre,
      precioUnitario: product.precio,
      cantidad: quantity,
      categoriaId: product.categoria?.id,
      categoriaNombre: product.categoria?.nombre,
      imagenUrl: product.imagen ?? undefined,
      adicionales: additionals.map(({ id, nombre, precio }) => ({ id, nombre, precio })),
    });

    this.showSuccessMessage(
      quantity > 1
        ? `${quantity} ${product.nombre} agregados correctamente`
        : `${product.nombre} agregado correctamente`
    );
    this.quantities.update((quantities) => ({ ...quantities, [product.id]: 1 }));
    if (this.expandedProductId() === product.id) {
      this.resetAdditionals();
    }
  }

  reintentarAdicionales(product: MenuProduct): void {
    if (product.categoria?.id && this.expandedProductId() === product.id) {
      this.cargarAdicionales(product.categoria.id);
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

  private cargarAdicionales(categoryId: number): void {
    const requestId = ++this.additionalsRequestId;
    this.additionalsLoading.set(true);
    this.additionalsError.set('');
    this.menuService.getAdditionals(categoryId).subscribe({
      next: (additionals) => {
        if (requestId !== this.additionalsRequestId) return;
        this.additionalsLoading.set(false);
        this.additionals.set(additionals.filter((additional) => additional.activo));
      },
      error: (error: unknown) => {
        if (requestId !== this.additionalsRequestId) return;
        console.error('Error al obtener adicionales del menú:', error);
        this.additionalsLoading.set(false);
        this.additionals.set([]);
        this.additionalsError.set('No se pudieron cargar los adicionales. Puedes agregar el producto sin adicionales o reintentar.');
      },
    });
  }

  private resetAdditionals(): void {
    this.additionalsRequestId++;
    this.expandedProductId.set(null);
    this.selectedAdditionalIds.set([]);
    this.additionals.set([]);
    this.additionalsLoading.set(false);
    this.additionalsError.set('');
  }

  private showSuccessMessage(message: string): void {
    this.successMessage.set(message);
    if (this.toastTimeout !== null) {
      clearTimeout(this.toastTimeout);
    }
    this.toastTimeout = setTimeout(() => {
      this.successMessage.set('');
      this.toastTimeout = null;
    }, 3500);
  }
}
