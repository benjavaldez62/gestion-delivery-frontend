import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart';

@Component({
  selector: 'app-cart-drawer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cart-drawer.html',
  styleUrl: './cart-drawer.css',
})
export class CartDrawer {
  public readonly cart = inject(CartService);
  private readonly router = inject(Router);

  close(): void {
    this.cart.closeCart();
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

  irAlCheckout(): void {
    this.cart.closeCart();
    this.router.navigate(['/checkout']);
  }
}

