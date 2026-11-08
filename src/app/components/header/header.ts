import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';
import { CartService } from '../../services/cart';

@Component({
  imports: [CommonModule, RouterLink, RouterLinkActive],
  selector: 'app-header',
  standalone: true,
  styleUrl: './header.css',
  templateUrl: './header.html',
})
export class Header {
  // ==============
  //    SESIÓN
  // ============== 
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  // Cierre de sesión
  cerrarSesion(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.finalizarSesion();
      },
      error: () => {
        // cerramos la sesion local también si falla la petición
        this.finalizarSesion();
      }
    });
  }

  private finalizarSesion(): void {
    this.authService.limpiarSesion();
    this.router.navigate(['/login']);
  }

  // ==============
  //    CARRITO
  // ==============
  public readonly cart = inject(CartService);

  cargarDemo(): void {
    this.cart.cargarDatosPrueba();
  }

  remove(idTemporal: string): void {
    this.cart.removeItem(idTemporal);
  }
}
