import { Injectable } from '@angular/core';
import { BorradorCheckout, MetodoPago } from './checkout';

export interface DatosMensajeTelegram {
  direccion: string;
  telefono: string;
  notas: string;
  metodoPago: MetodoPago;
  montoRecibido: number | null;
  borrador: BorradorCheckout;
}

@Injectable({ providedIn: 'root' })
export class TelegramMessageBuilder {
  construir(datos: DatosMensajeTelegram): string {
    const dinero = (importe: number) => `$${importe.toFixed(2)}`;
    const nombres: Record<MetodoPago, string> = {
      efectivo: 'Efectivo al recibir',
      tarjeta: 'Tarjeta (pendiente de pago)',
      transferencia: 'Transferencia (pendiente de pago)',
    };
    const lineas = [
      '🍽️ La Posta - Borrador de pedido',
      ...(datos.borrador.pedido_id !== undefined ? [`Pedido #${datos.borrador.pedido_id}`] : []),
      `Referencia: ${datos.borrador.id}`,
      '',
      '🛒 Productos:',
    ];
    for (const item of datos.borrador.items) {
      lineas.push(`${item.cantidad} x ${item.nombre} - ${dinero(item.subtotal)}`);
      for (const adicional of item.adicionales) {
        lineas.push(`  + ${adicional.nombre} (${dinero(adicional.precio)} c/u)`);
      }
    }
    lineas.push(
      '',
      `Subtotal: ${dinero(datos.borrador.subtotal)}`,
      `Envío: ${dinero(datos.borrador.costo_envio)}`,
      `Total: ${dinero(datos.borrador.monto_total)}`,
      `Pago: ${nombres[datos.metodoPago]}`,
    );
    if (datos.metodoPago === 'efectivo' && datos.montoRecibido !== null) {
      lineas.push(`Abona con: ${dinero(datos.montoRecibido)}`);
      lineas.push(`Vuelto: ${dinero(Math.round((datos.montoRecibido - datos.borrador.monto_total) * 100) / 100)}`);
    }
    lineas.push(
      '',
      `📍 Dirección: ${datos.direccion}`,
      `📞 Teléfono: ${datos.telefono}`,
    );
    if (datos.notas) lineas.push(`Aclaraciones: ${datos.notas}`);
    lineas.push('', 'Este mensaje no confirma el pedido ni el pago.');
    return lineas.join('\n');
  }

  enlace(mensaje: string): string {
    if (Array.from(mensaje).length > 4096) {
      throw new RangeError('El resumen supera el límite de Telegram. Reducí la cantidad de productos o aclaraciones.');
    }
    return `https://t.me/Restauransbot?text=${encodeURIComponent(mensaje)}`;
  }
}
