import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { apiUrl } from '../config/api';
import { PedidoReparto, RepartosService } from './repartos';

describe('RepartosService', () => {
  let service: RepartosService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(RepartosService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('conserva el resultado del envío del ticket al confirmar la entrega', () => {
    const pedido: PedidoReparto = {
      id: 12, subtotal: 1000, monto_total: 2500, created_at: null,
      estado: { id: 6, nombre: 'Entregado' }, repartidor: { id: 7 },
      pagos: [], cliente: null, items: [],
    };
    service.actualizarEstado(12, 6).subscribe(respuesta => {
      expect(respuesta.pedido.id).toBe(12);
      expect(respuesta.comprobante_enviado).toBe(false);
    });
    const solicitud = http.expectOne(`${apiUrl}/pedidos/12`);
    expect(solicitud.request.method).toBe('PUT');
    expect(solicitud.request.body).toEqual({ estado_pedidos_id: 6 });
    solicitud.flush({ pedido, comprobante_enviado: false });
  });

  it('reintenta el ticket mediante el endpoint del pedido', () => {
    service.reenviarTicket(12).subscribe(respuesta => expect(respuesta.message).toBe('Enviado'));
    const solicitud = http.expectOne(`${apiUrl}/pedidos/12/ticket/enviar`);
    expect(solicitud.request.method).toBe('POST');
    solicitud.flush({ message: 'Enviado' });
  });
});
