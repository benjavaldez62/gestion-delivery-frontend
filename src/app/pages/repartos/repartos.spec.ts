import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PedidoReparto, RepartosService } from '../../services/repartos';
import { Repartos } from './repartos';

describe('Repartos', () => {
  let component: Repartos;
  let fixture: ComponentFixture<Repartos>;
  let service: {
    obtenerUsuario: ReturnType<typeof vi.fn>;
    obtenerEstados: ReturnType<typeof vi.fn>;
    obtenerPedidos: ReturnType<typeof vi.fn>;
    actualizarEstado: ReturnType<typeof vi.fn>;
    reenviarTicket: ReturnType<typeof vi.fn>;
  };

  const states = [
    { id: 4, nombre: 'Listo para entregar' },
    { id: 5, nombre: 'En camino' },
    { id: 6, nombre: 'Entregado' },
  ];
  const pedido: PedidoReparto = {
    id: 42,
    subtotal: 2500,
    monto_total: 4000,
    created_at: null,
    estado: states[0],
    repartidor: { id: 7 },
    pagos: [],
    cliente: { username: 'Cliente de prueba', telefono: '123456789', direccion: 'Calle 123' },
    items: [{ id: 1, cantidad: 2, producto: { nombre: 'Pizza' }, adicionales: [] }],
  };

  beforeEach(async () => {
    service = {
      obtenerUsuario: vi.fn(() => of({ id: 7 })),
      obtenerEstados: vi.fn(() => of(states)),
      obtenerPedidos: vi.fn(() => of([
        pedido,
        {
          ...pedido,
          id: 43,
          estado: states[1],
          pagos: [{ id: 2, monto: 4000, estado_pago: { id: 2, nombre: 'Pagado' } }],
        },
        { ...pedido, id: 44, estado: states[2] },
        { ...pedido, id: 45, repartidor: { id: 8 } },
        { ...pedido, id: 46, estado: { id: 7, nombre: 'Cancelado' } },
      ])),
      actualizarEstado: vi.fn((_pedidoId: number, estadoId: number) =>
        of({ pedido: { ...pedido, estado: states.find((estado) => estado.id === estadoId)! } }),
      ),
      reenviarTicket: vi.fn(() => of({ message: 'Ticket enviado por Telegram.' })),
    };

    await TestBed.configureTestingModule({
      imports: [Repartos],
      providers: [{ provide: RepartosService, useValue: service }],
    }).compileComponents();

    fixture = TestBed.createComponent(Repartos);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('shows only the signed-in delivery person orders in delivery states', () => {
    expect(component.pedidos.map((item) => item.id)).toEqual([42, 43, 44]);
    expect(component.estados.map((estado) => estado.nombre)).toEqual([
      'Listo para entregar',
      'En camino',
      'Entregado',
    ]);
  });

  it('advances assigned orders to the next delivery state', () => {
    component.avanzarPedido(component.pedidos[0]);

    expect(service.actualizarEstado).toHaveBeenCalledWith(42, 5);
    expect(component.pedidos[0].estado?.nombre).toBe('En camino');
    expect(component.mensaje).toBe('El pedido #42 avanzó a En camino correctamente.');
  });

  it('only allows moving an order to the next column', () => {
    const updateStatus = vi.spyOn(TestBed.inject(RepartosService), 'actualizarEstado');
    const event = {
      preventDefault: vi.fn(),
      dataTransfer: { getData: () => '42' },
    } as unknown as DragEvent;

    component.moverPedido(event, states[2]);

    expect(updateStatus).not.toHaveBeenCalled();
  });

  it('shows paid only when confirmed payments cover the order and shipping', () => {
    const pagoCompleto = {
      id: 1,
      monto: 4000,
      estado_pago: { id: 2, nombre: 'Pagado' },
    };
    const pagoParcial = {
      id: 2,
      monto: 2500,
      estado_pago: { id: 2, nombre: 'Pagado' },
    };

    expect(component.estadoPago(pedido)).toBe('Pendiente');
    expect(component.estadoPago({ ...pedido, pagos: [pagoCompleto] })).toBe('Pagado');
    expect(component.estadoPago({ ...pedido, pagos: [pagoParcial] })).toBe('Pago parcial');
    expect(component.estadoPago({
      ...pedido,
      pagos: [{ ...pagoCompleto, estado_pago: { id: 1, nombre: 'Pendiente' } }],
    })).toBe('Pendiente');
  });

  it('renders the payment state on each order card', () => {
    const cards = fixture.nativeElement.querySelectorAll('.order-card') as NodeListOf<HTMLElement>;
    expect(cards[0].textContent).toContain('Estado del pago');
    expect(cards[0].textContent).toContain('Pendiente');
    expect(cards[1].textContent).toContain('Pagado');
  });

  it('informa si el ticket falla sin revertir la entrega y permite reintentarlo', () => {
    const enCamino = component.pedidos[1];
    service.actualizarEstado.mockReturnValueOnce(of({
      pedido: { ...enCamino, estado: states[2] },
      comprobante_enviado: false,
      message: 'Entrega y cobro registrados, pero no se pudo enviar el ticket.',
    }));

    component.avanzarPedido(enCamino);
    expect(component.pedidos[1].estado?.nombre).toBe('Entregado');
    expect(component.error).toContain('no se pudo enviar el ticket');
    component.reenviarTicket(component.pedidos[1]);
    expect(service.reenviarTicket).toHaveBeenCalledWith(enCamino.id);
    expect(component.mensaje).toBe('Ticket enviado por Telegram.');
  });
});
