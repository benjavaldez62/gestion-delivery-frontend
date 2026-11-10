import { TelegramMessageBuilder, DatosMensajeTelegram } from './telegram-message-builder';

describe('TelegramMessageBuilder', () => {
  const builder = new TelegramMessageBuilder();
  const datos: DatosMensajeTelegram = {
    direccion: 'Av. Libertad 123',
    telefono: '123456789',
    notas: '',
    metodoPago: 'transferencia',
    montoRecibido: null,
    borrador: {
      id: 'ref', message: 'Guardado', subtotal: 1000, costo_envio: 1500, monto_total: 2500,
      items: [{ producto_id: 1, nombre: 'Pizza', precio_unitario: 1000, cantidad: 1, adicionales: [], subtotal: 1000 }],
    },
  };

  it('describe la transferencia como pendiente y codifica el texto', () => {
    const texto = builder.construir(datos);
    expect(texto).toContain('Transferencia (pendiente de pago)');
    expect(texto).not.toContain('Abona con');
    expect(new URL(builder.enlace(texto)).searchParams.get('text')).toBe(texto);
  });

  it('rechaza mensajes que Telegram truncaría', () => {
    expect(() => builder.enlace('a'.repeat(4096))).not.toThrow();
    expect(() => builder.enlace('a'.repeat(4097))).toThrow(RangeError);
  });
});
