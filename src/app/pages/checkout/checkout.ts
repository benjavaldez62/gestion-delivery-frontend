import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { CartService } from '../../services/cart';
import { BorradorCheckout, CheckoutService } from '../../services/checkout';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [DecimalPipe, ReactiveFormsModule, RouterLink],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class Checkout {
  readonly cart = inject(CartService);
  private readonly checkout = inject(CheckoutService);
  private readonly fb = inject(FormBuilder);

  readonly guardando = signal(false);
  readonly error = signal('');
  readonly borrador = signal<BorradorCheckout | null>(null);
  readonly formulario = this.fb.nonNullable.group({
    direccion: ['', [Validators.required, Validators.maxLength(255), Validators.pattern(/\S/)]],
    telefono: ['', [Validators.required, Validators.maxLength(30), Validators.pattern(/^(?=(?:[^0-9]*[0-9]){6})[0-9+() \-]{6,30}$/)]],
    notas: ['', [Validators.maxLength(500)]],
    metodoPago: this.fb.nonNullable.control<'efectivo' | 'tarjeta' | ''>('', Validators.required),
  });

  guardar(): void {
    if (this.guardando() || this.borrador() || this.formulario.invalid || this.cart.items().length === 0) {
      this.formulario.markAllAsTouched();
      return;
    }

    const valores = this.formulario.getRawValue();
    if (valores.metodoPago !== 'efectivo' && valores.metodoPago !== 'tarjeta') {
      return;
    }

    this.error.set('');
    this.guardando.set(true);
    this.checkout.guardarBorrador({
      direccion: valores.direccion.trim(),
      telefono: valores.telefono.trim(),
      notas: valores.notas.trim(),
      metodo_pago: valores.metodoPago,
      items: this.cart.items().map(item => ({
        producto_id: item.productoId,
        cantidad: item.cantidad,
        adicionales: item.adicionales.map(adicional => adicional.id),
      })),
    }).pipe(finalize(() => this.guardando.set(false))).subscribe({
      next: (respuesta) => this.borrador.set(respuesta),
      error: (error: HttpErrorResponse) => {
        this.error.set(error.status === 422
          ? 'No se pudo guardar: revisá los datos y la disponibilidad de los productos.'
          : 'No se pudo guardar el borrador. Intentá nuevamente.');
      },
    });
  }
}
