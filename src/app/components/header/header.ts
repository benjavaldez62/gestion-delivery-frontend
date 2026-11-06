import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CartService } from '../../services/cart';

@Component({
  imports: [CommonModule, RouterLink, RouterLinkActive],
  selector: 'app-header',
  standalone: true,
  styleUrl: './header.css',
  templateUrl: './header.html',
})
export class Header {
  public readonly cart = inject(CartService);

  cargarDemo(): void {
    this.cart.cargarDatosPrueba();
  }

  remove(idTemporal: string): void {
    this.cart.removeItem(idTemporal);
  }
}
