import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MenuProduct } from '../../models/menu';

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
  readonly addRequested = output<MenuProduct>();
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
