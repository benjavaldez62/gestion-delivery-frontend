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
    expect(texto).not.toContain('Pedido #');
    expect(new URL(builder.enlace(texto, 'BotDePrueba_bot')).searchParams.get('text')).toBe(texto);
  });

  it('incluye el identificador del pedido en el encabezado cuando pedido_id está definido', () => {
    const texto = builder.construir({
      ...datos,
      borrador: { ...datos.borrador, pedido_id: 42, estado: 'Pre-pedido' },
    });
    expect(texto).toContain('Pedido #42');
    expect(texto.indexOf('Pedido #42')).toBeLessThan(texto.indexOf('Referencia: ref'));
  });

  it('rechaza mensajes que Telegram truncaría', () => {
    expect(() => builder.enlace('a'.repeat(4096), 'BotDePrueba_bot')).not.toThrow();
    expect(() => builder.enlace('a'.repeat(4097), 'BotDePrueba_bot')).toThrow(RangeError);
  });

  it('rechaza nombres que alterarían la URL del bot', () => {
    for (const username of ['', 'abc', '@bot', 'bot/path', 'bot?url=otra', 'botvalido\n', 'a'.repeat(33)]) {
      expect(() => builder.enlace('hola', username)).toThrow();
    }
  });
});
