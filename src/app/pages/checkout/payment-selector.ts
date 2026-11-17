import { DecimalPipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MetodoPago } from '../../services/checkout';

@Component({
  selector: 'app-payment-selector',
  standalone: true,
  imports: [DecimalPipe, ReactiveFormsModule],
  template: `
    <fieldset class="mb-4">
      <legend class="fs-5">Método de pago *</legend>
      <div class="form-check">
        <input id="efectivo" type="radio" class="form-check-input" [formControl]="metodo()" value="efectivo">
        <label for="efectivo" class="form-check-label">Efectivo al recibir el delivery</label>
      </div>
      <div class="form-check">
        <input id="tarjeta" type="radio" class="form-check-input" [formControl]="metodo()" value="tarjeta" [attr.disabled]="true">
        <label for="tarjeta" class="form-check-label text-muted">Tarjeta mediante pasarela (no disponible)</label>
      </div>
      <div class="form-check">
        <input id="transferencia" type="radio" class="form-check-input" [formControl]="metodo()" value="transferencia" [attr.disabled]="true">
        <label for="transferencia" class="form-check-label text-muted">Transferencia (no disponible)</label>
      </div>
      @if (metodo().value === 'efectivo') {
        <label for="monto-recibido" class="form-label mt-3">¿Con cuánto vas a pagar? (opcional)</label>
        <input id="monto-recibido" type="number" class="form-control" min="0" step="0.01"
          [formControl]="monto()" [attr.aria-invalid]="monto().invalid || montoInsuficiente()">
        @if (monto().invalid) {
          <p class="text-danger small mt-1">Ingresá un importe válido con hasta dos decimales.</p>
        } @else if (montoInsuficiente()) {
          <p class="text-danger small mt-1">El importe debe cubrir el total estimado.</p>
        } @else if (monto().value !== null) {
          <p class="small mt-1">Vuelto estimado: \${{ vuelto() | number:'1.2-2' }}</p>
        }
      } @else if (metodo().value === 'tarjeta' || metodo().value === 'transferencia') {
        <p class="alert alert-info mt-3 mb-0">
          El pago digital todavía no está habilitado. El restaurante deberá indicar cómo pagar;
          el pedido no se considerará pagado automáticamente.
        </p>
      }
    </fieldset>
  `,
})
export class PaymentSelectorComponent {
  readonly metodo = input.required<FormControl<MetodoPago | ''>>();
  readonly monto = input.required<FormControl<number | null>>();
  readonly total = input.required<number>();

  montoInsuficiente(): boolean {
    const monto = this.monto().value;
    return this.metodo().value === 'efectivo' && monto !== null && monto < this.total();
  }

  vuelto(): number {
    return Math.max(0, Math.round(((this.monto().value ?? 0) - this.total()) * 100) / 100);
  }
}
