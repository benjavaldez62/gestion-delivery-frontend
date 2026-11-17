import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { PedidoAdministracion, PedidosService, UsuarioAsignable } from '../../services/pedidos';
import { Pedidos } from './pedidos';

describe('Pedidos', () => {
  let fixture: ComponentFixture<Pedidos>;
  let component: Pedidos;
  let service: {
    obtenerPedidos: ReturnType<typeof vi.fn>;
    obtenerPersonalActivo: ReturnType<typeof vi.fn>;
    asignar: ReturnType<typeof vi.fn>;
  };

  const cocinero: UsuarioAsignable = {
    id: 2,
    name: 'Benjamin',
    activo: true,
    role: { id: 1, nombre: 'Cocinero' },
  };
  const repartidor: UsuarioAsignable = {
    id: 3,
    name: 'Sebastián',
    activo: true,
    role: { id: 2, nombre: 'Repartidor' },
  };
  const pedido: PedidoAdministracion = {
    id: 1,
    cliente: { id: 4, username: 'Cliente' },
    cocinero: null,
    repartidor: null,
    estado: { id: 1, nombre: 'Sin Asignar' },
  };

  beforeEach(async () => {
    const pedidoActualizado: PedidoAdministracion = {
      ...pedido,
      cocinero,
      repartidor,
      estado: { id: 2, nombre: 'Pendiente' },
    };
    service = {
      obtenerPedidos: vi.fn(() => of([pedido])),
      obtenerPersonalActivo: vi.fn(() => of([cocinero, repartidor])),
      asignar: vi.fn(() => of(pedidoActualizado)),
    };

    await TestBed.configureTestingModule({
      imports: [Pedidos],
      providers: [{ provide: PedidosService, useValue: service }],
    }).compileComponents();

    fixture = TestBed.createComponent(Pedidos);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('keeps both selections local until Asignar is clicked, then saves them together', () => {
    const selects = fixture.nativeElement.querySelectorAll('select') as NodeListOf<HTMLSelectElement>;
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    expect(selects.length).toBe(2);
    expect(button.disabled).toBe(true);

    selects[0].value = String(cocinero.id);
    selects[0].dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(service.asignar).not.toHaveBeenCalled();
    expect(button.disabled).toBe(true);

    selects[1].value = String(repartidor.id);
    selects[1].dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(service.asignar).not.toHaveBeenCalled();
    expect(button.disabled).toBe(false);
    expect(component.pedidos[0].estado?.nombre).toBe('Sin Asignar');

    button.click();

    expect(service.asignar).toHaveBeenCalledWith(1, {
      cocinero_id: cocinero.id,
      repartidor_id: repartidor.id,
    });
    expect(component.pedidos[0].estado?.nombre).toBe('Pendiente');

    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
  });

  it('prioriza nombre_cliente sobre cliente.username y conserva el fallback cuando falta', () => {
    service.obtenerPedidos.mockReturnValueOnce(of([
      { ...pedido, id: 10, nombre_cliente: 'Carlos Gómez', cliente: { id: 4, username: 'web_3454998877' } },
      { ...pedido, id: 11, nombre_cliente: '   ', cliente: { id: 5, username: 'juan-martin96' } },
    ]));
    component.recargar();
    fixture.detectChanges();

    const nombres = Array.from(
      fixture.nativeElement.querySelectorAll('.order-field dd'),
      (dd) => (dd as HTMLElement).textContent?.trim(),
    );

    expect(nombres).toContain('Carlos Gómez');
    expect(nombres).toContain('juan-martin96');
    expect(nombres).not.toContain('web_3454998877');
  });
});
