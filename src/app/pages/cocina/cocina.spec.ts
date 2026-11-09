import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { CocinaService, EstadoPedido, PedidoCocina } from '../../services/cocina';
import { Cocina } from './cocina';

describe('Cocina', () => {
  let component: Cocina;
  let fixture: ComponentFixture<Cocina>;

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
    items: [],
    created_at: null,
  };
  const pedidos = [pedido, { ...pedido, id: 43, cocinero: { id: 8 } }];

  beforeEach(async () => {
    const cocinaService = {
      obtenerUsuario: () => of({ id: 7 }),
      obtenerEstados: () => of(estados),
      obtenerPedidos: () => of(pedidos),
      actualizarEstado: (_pedidoId: number, estadoId: number) =>
        of({ ...pedido, estado: estados.find((estado) => estado.id === estadoId)! }),
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
});
