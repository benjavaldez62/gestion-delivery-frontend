import { DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { finalize, timeout } from 'rxjs';
import { CartService } from '../../services/cart';
import { BorradorCheckout, CheckoutService, MetodoPago } from '../../services/checkout';
import { ConfiguracionPublicaService } from '../../services/configuracion-publica';
import { DatosMensajeTelegram, TelegramMessageBuilder } from '../../services/telegram-message-builder';
import { PaymentSelectorComponent } from './payment-selector';

const importeValido: ValidatorFn = control => {
  const valor: number | null = control.value;
  return valor === null || (Number.isFinite(valor) && Math.abs(valor * 100 - Math.round(valor * 100)) < 1e-8)
    ? null : { importe: true };
};

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [DecimalPipe, ReactiveFormsModule, RouterLink, PaymentSelectorComponent],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class Checkout {
  readonly cart = inject(CartService);
  private readonly checkout = inject(CheckoutService);
  private readonly fb = inject(FormBuilder);
  private readonly telegram = inject(TelegramMessageBuilder);
  private readonly configuracion = inject(ConfiguracionPublicaService);
  private readonly destroyRef = inject(DestroyRef);

  readonly guardando = signal(false);
  readonly cargandoTelegram = signal(false);
  readonly error = signal('');
  readonly borrador = signal<BorradorCheckout | null>(null);
  readonly datosTelegram = signal<DatosMensajeTelegram | null>(null);
  readonly enlaceTelegram = signal('');
  readonly confirmandoTelegram = signal(false);
  readonly formulario = this.fb.nonNullable.group({
    nombreCliente: ['', [Validators.required, Validators.maxLength(255), Validators.pattern(/\S/)]],
    direccion: ['', [Validators.required, Validators.maxLength(255), Validators.pattern(/\S/)]],
    telefono: ['', [Validators.required, Validators.maxLength(30), Validators.pattern(/^(?=(?:[^0-9]*[0-9]){6})[0-9+() \-]{6,30}$/)]],
    notas: ['', [Validators.maxLength(500)]],
    metodoPago: this.fb.nonNullable.control<MetodoPago | ''>('', [Validators.required, Validators.pattern(/^efectivo$/)]),
    montoRecibido: this.fb.control<number | null>(null, [Validators.min(0), importeValido]),
  });

  constructor() {
    this.formulario.controls.metodoPago.valueChanges.pipe(takeUntilDestroyed()).subscribe(metodo => {
      if (metodo !== 'efectivo') this.formulario.controls.montoRecibido.reset();
    });
  }

  montoInsuficiente(): boolean {
    const { metodoPago, montoRecibido } = this.formulario.getRawValue();
    return metodoPago === 'efectivo' && montoRecibido !== null && montoRecibido < this.cart.montoTotal();
  }

  vueltoEstimado(): number {
    return Math.round(((this.formulario.controls.montoRecibido.value ?? 0) - this.cart.montoTotal()) * 100) / 100;
  }

  guardar(): void {
    if (this.guardando() || this.borrador() || this.formulario.invalid || this.montoInsuficiente() || this.cart.items().length === 0) {
      this.formulario.markAllAsTouched();
      return;
    }

    const valores = this.formulario.getRawValue();
    if (!valores.metodoPago) {
      return;
    }
    const metodoPago = valores.metodoPago;

    this.error.set('');
    this.guardando.set(true);
    this.checkout.guardarBorrador({
      nombre_cliente: valores.nombreCliente.trim(),
      direccion: valores.direccion.trim(),
      telefono: valores.telefono.trim(),
      notas: valores.notas.trim(),
      metodo_pago: metodoPago,
      ...(metodoPago === 'efectivo' && valores.montoRecibido !== null
        ? { monto_recibido: valores.montoRecibido } : {}),
      items: this.cart.items().map(item => ({
        producto_id: item.productoId,
        cantidad: item.cantidad,
        adicionales: item.adicionales.map(adicional => adicional.id),
      })),
    }).pipe(finalize(() => this.guardando.set(false))).subscribe({
      next: (respuesta) => {
        this.datosTelegram.set({
          nombreCliente: valores.nombreCliente.trim(),
          direccion: valores.direccion.trim(),
          telefono: valores.telefono.trim(),
          notas: valores.notas.trim(),
          metodoPago,
          montoRecibido: metodoPago === 'efectivo' ? valores.montoRecibido : null,
          borrador: respuesta,
        });
        this.borrador.set(respuesta);
      },
      error: (error: HttpErrorResponse) => {
        this.error.set(error.status === 422
          ? error.error?.errors?.monto_recibido?.[0] || 'No se pudo guardar: revisá los datos y la disponibilidad de los productos.'
          : 'No se pudo guardar el borrador. Intentá nuevamente.');
      },
    });
  }

  prepararTelegram(): void {
    if (this.cargandoTelegram()) return;
    const datos = this.datosTelegram();
    if (!datos) {
      this.error.set('No se encontró el resumen del borrador para Telegram.');
      return;
    }
    let mensaje: string;
    try {
      mensaje = this.telegram.construir(datos);
      this.telegram.validarMensaje(mensaje);
    } catch (error) {
      if (!(error instanceof RangeError)) throw error;
      this.error.set(error.message);
      return;
    }
    this.error.set('');
    this.enlaceTelegram.set('');
    this.cargandoTelegram.set(true);
    this.configuracion.obtenerBotTelegram().pipe(
      timeout({ first: 15000 }),
      finalize(() => this.cargandoTelegram.set(false)),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: username => {
        this.enlaceTelegram.set(this.telegram.enlace(mensaje, username));
        this.confirmandoTelegram.set(true);
      },
      error: () => this.error.set('No se pudo obtener la configuración de Telegram. Intentá nuevamente.'),
    });
  }
}
