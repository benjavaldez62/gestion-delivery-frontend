import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService } from '../../services/cart';

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './carrito.html',
  styleUrl: './carrito.css',
})
export class Carrito {
  public readonly cart = inject(CartService);

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

