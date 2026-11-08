import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MenuAdditional, MenuProduct } from '../../models/menu';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CurrencyPipe],
  selector: 'app-product-card',
  standalone: true,
  styleUrl: './product-card.css',
  templateUrl: './product-card.html',
})
export class ProductCardComponent {
  readonly product = input.required<MenuProduct>();
  readonly additionalsAllowed = input(false);
  readonly additionalsExpanded = input(false);
  readonly additionals = input<MenuAdditional[]>([]);
  readonly additionalsLoading = input(false);
  readonly additionalsError = input('');
  readonly selectedAdditionalIds = input<number[]>([]);
  readonly quantity = input(1);
  readonly addRequested = output<{ product: MenuProduct; quantity: number }>();
  readonly additionalsToggled = output<boolean>();
  readonly additionalToggled = output<number>();
  readonly quantityChanged = output<number>();
  readonly retryAdditionals = output<void>();
  readonly total = computed(() => {
    const additionalTotal = this.additionals()
      .filter((additional) => this.selectedAdditionalIds().includes(additional.id))
      .reduce((sum, additional) => sum + additional.precio, 0);
    return (this.product().precio + additionalTotal) * this.quantity();
  });

  agregarAlCarrito(): void {
    this.addRequested.emit({ product: this.product(), quantity: this.quantity() });
  }

  readonly imageUrl = computed(() => {
    const product = this.product();
    if (product.imagen) {
      return product.imagen;
    }

    const category = product.categoria?.nombre.toLocaleLowerCase('es') ?? '';
    if (category.includes('pizza')) return 'assets/img/home-1/menu-l4.png';
    if (category.includes('empanada')) return 'assets/img/home-1/pp-categori5.png';
    if (category.includes('milanesa')) return 'assets/img/home-1/pp-categori1.png';
    if (category.includes('hamburguesa')) return 'assets/img/home-1/menu-l1.png';
    if (category.includes('pasta')) return 'assets/img/home-1/menu-l2.png';
    if (category.includes('sandwich')) return 'assets/img/home-1/menu-l5.png';
    if (category.includes('ensalada')) return 'assets/img/home-1/menu-l3.png';
    return 'assets/img/home-1/menu-l6.png';
  });
}
