import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject, of, throwError } from 'rxjs';
import { CocinaService, EstadoPedido, PedidoCocina } from '../../services/cocina';
import { Cocina } from './cocina';

describe('Cocina', () => {
  let component: Cocina;
  let fixture: ComponentFixture<Cocina>;
  let cocinaService: {
    obtenerUsuario: ReturnType<typeof vi.fn>;
    obtenerEstados: ReturnType<typeof vi.fn>;
    obtenerPedidos: ReturnType<typeof vi.fn>;
    actualizarEstado: ReturnType<typeof vi.fn>;
  };

  const estados: EstadoPedido[] = [
    { id: 1, nombre: 'Pendiente' },
    { id: 2, nombre: 'En preparación' },
    { id: 3, nombre: 'Listo para entregar' },
  ];
  const pedido: PedidoCocina = {
    id: 42,
    cocinero: { id: 7 },
    estado: estados[0],
    cliente: { username: 'Cliente de prueba' },
    items: [
      {
        id: 1,
        cantidad: 1,
        producto: { nombre: 'Hamburguesa' },
        adicionales: [{ nombre: 'Panceta' }, { nombre: 'Cheddar extra' }],
      },
    ],
    created_at: null,
  };
  const pedidos = [pedido, { ...pedido, id: 43, cocinero: { id: 8 } }];

  beforeEach(async () => {
    cocinaService = {
      obtenerUsuario: vi.fn(() => of({ id: 7 })),
      obtenerEstados: vi.fn(() => of(estados)),
      obtenerPedidos: vi.fn(() => of(pedidos)),
      actualizarEstado: vi.fn((_pedidoId: number, estadoId: number) =>
        of({ ...pedido, estado: estados.find((estado) => estado.id === estadoId)! })),
    };

    await TestBed.configureTestingModule({
      imports: [Cocina],
      providers: [{ provide: CocinaService, useValue: cocinaService }],
    }).compileComponents();

    fixture = TestBed.createComponent(Cocina);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('should create and show only orders assigned to the signed-in cook', () => {
    expect(component).toBeTruthy();
    expect(component.estados.length).toBe(3);
    expect(component.pedidos.length).toBe(1);
    expect(component.pedidos[0].id).toBe(42);
    expect((fixture.nativeElement as HTMLElement).querySelector('.auto-refresh-note')?.textContent)
      .toContain('El tablero se actualiza automáticamente cada 20 segundos.');
  });

  it('should show the names of the additionals on each order item', () => {
    const additionals = fixture.nativeElement.querySelector('.order-items small');

    expect(additionals.textContent).toContain('Panceta');
    expect(additionals.textContent).toContain('Cheddar extra');
  });

  it('should move an order to the next backend status', () => {
    component.avanzarPedido(component.pedidos[0]);

    expect(component.pedidos[0].estado.nombre).toBe('En preparación');
    expect(component.mensaje).toBe('El pedido #42 se actualizó al estado En preparación.');
  });

  it('should reject backward and skipped status changes from drag and drop', () => {
    const updateStatus = vi.spyOn(TestBed.inject(CocinaService), 'actualizarEstado');
    const event = {
      preventDefault: vi.fn(),
      dataTransfer: { getData: () => '42' },
    } as unknown as DragEvent;

    component.pedidos[0].estado = estados[1];
    component.moverPedido(event, estados[0]);
    component.pedidos[0].estado = estados[0];
    component.moverPedido(event, estados[2]);

    expect(updateStatus).not.toHaveBeenCalled();
  });

  it('actualiza los pedidos asignados cada 20 segundos y se detiene al salir', () => {
    fixture.destroy();
    vi.useFakeTimers();
    try {
      cocinaService.obtenerPedidos.mockClear();
      fixture = TestBed.createComponent(Cocina);
      component = fixture.componentInstance;
      fixture.detectChanges();
      expect(cocinaService.obtenerPedidos).toHaveBeenCalledTimes(1);
      cocinaService.obtenerPedidos.mockReturnValueOnce(of([
        { ...pedido, id: 50 }, { ...pedido, id: 51, cocinero: { id: 8 } },
      ]));
      vi.advanceTimersByTime(19999);
      expect(cocinaService.obtenerPedidos).toHaveBeenCalledTimes(1);
      vi.advanceTimersByTime(1);
      fixture.detectChanges();
      expect(cocinaService.obtenerPedidos).toHaveBeenCalledTimes(2);
      expect(component.pedidos.map(item => item.id)).toEqual([50]);
      expect((fixture.nativeElement as HTMLElement).textContent).toContain('Pedido #50');
      fixture.destroy();
      vi.advanceTimersByTime(40000);
      expect(cocinaService.obtenerPedidos).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('informa errores de actualización y vuelve a intentar sin borrar el tablero', () => {
    fixture.destroy();
    vi.useFakeTimers();
    try {
      fixture = TestBed.createComponent(Cocina);
      component = fixture.componentInstance;
      fixture.detectChanges();
      cocinaService.obtenerPedidos.mockReturnValueOnce(throwError(() => new Error('red')));
      vi.advanceTimersByTime(20000);
      fixture.detectChanges();
      expect(component.pedidos[0].id).toBe(42);
      expect((fixture.nativeElement as HTMLElement).textContent).toContain('No se pudieron actualizar los pedidos de cocina');
      vi.advanceTimersByTime(20000);
      fixture.detectChanges();
      expect(component.errorActualizacion).toBe('');
      expect(component.pedidos[0].id).toBe(42);
      fixture.destroy();
    } finally {
      vi.useRealTimers();
    }
  });

  it('cancela una actualización pendiente al mover un pedido y omite consultas durante el arrastre', () => {
    fixture.destroy();
    vi.useFakeTimers();
    try {
      cocinaService.obtenerPedidos.mockClear();
      fixture = TestBed.createComponent(Cocina);
      component = fixture.componentInstance;
      fixture.detectChanges();
      const respuestaAnterior = new Subject<PedidoCocina[]>();
      cocinaService.obtenerPedidos.mockReturnValueOnce(respuestaAnterior);
      vi.advanceTimersByTime(20000);
      component.avanzarPedido(component.pedidos[0]);
      respuestaAnterior.next([pedido]);
      expect(component.pedidos[0].estado.nombre).toBe('En preparación');

      component.iniciarArrastre({ dataTransfer: null } as DragEvent, component.pedidos[0]);
      vi.advanceTimersByTime(20000);
      expect(cocinaService.obtenerPedidos).toHaveBeenCalledTimes(2);
      component.finalizarArrastre();
      vi.advanceTimersByTime(20000);
      expect(cocinaService.obtenerPedidos).toHaveBeenCalledTimes(3);
      fixture.destroy();
    } finally {
      vi.useRealTimers();
    }
  });

  it('no consulta durante un cambio de estado pendiente y cancela consultas anteriores al recargar', () => {
    fixture.destroy();
    vi.useFakeTimers();
    try {
      cocinaService.obtenerPedidos.mockClear();
      fixture = TestBed.createComponent(Cocina);
      component = fixture.componentInstance;
      fixture.detectChanges();

      const cambio = new Subject<PedidoCocina>();
      cocinaService.actualizarEstado.mockReturnValueOnce(cambio);
      component.avanzarPedido(component.pedidos[0]);
      vi.advanceTimersByTime(20000);
      expect(cocinaService.obtenerPedidos).toHaveBeenCalledTimes(1);
      cambio.next({ ...pedido, estado: estados[1] });
      cambio.complete();

      const respuestaAnterior = new Subject<PedidoCocina[]>();
      cocinaService.obtenerPedidos.mockReturnValueOnce(respuestaAnterior);
      vi.advanceTimersByTime(20000);
      cocinaService.obtenerPedidos.mockReturnValueOnce(of([{ ...pedido, id: 55 }]));
      component.recargar();
      respuestaAnterior.next([pedido]);
      expect(component.pedidos.map(item => item.id)).toEqual([55]);
      fixture.destroy();
    } finally {
      vi.useRealTimers();
    }
  });
});
