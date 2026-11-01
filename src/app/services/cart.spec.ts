import { TestBed } from '@angular/core/testing';
import { CartService } from './cart';

describe('CartService', () => {
  let service: CartService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(CartService);
    service.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('debe inicializarse con el carrito vacio', () => {
    expect(service.items()).toEqual([]);
    expect(service.totalItems()).toBe(0);
    expect(service.subtotal()).toBe(0);
    expect(service.costoEnvio()).toBe(0);
    expect(service.montoTotal()).toBe(0);
    expect(service.isDrawerOpen()).toBe(false);
  });

  it('debe agregar un item y calcular subtotal correctamente', () => {
    service.addItem({
      productoId: 10,
      nombre: 'Hamburguesa Doble',
      precioUnitario: 5000,
      cantidad: 2,
      adicionales: [
        { id: 1, nombre: 'Panceta', precio: 500 }
      ]
    });

    expect(service.items().length).toBe(1);
    expect(service.totalItems()).toBe(2);
    // (5000 + 500) * 2 = 11000
    expect(service.subtotal()).toBe(11000);
    expect(service.costoEnvio()).toBe(1500);
    expect(service.montoTotal()).toBe(12500);
  });

  it('debe acumular cantidad cuando se agrega el mismo producto con identicos adicionales', () => {
    const itemData = {
      productoId: 10,
      nombre: 'Hamburguesa Doble',
      precioUnitario: 5000,
      cantidad: 1,
      adicionales: [
        { id: 1, nombre: 'Panceta', precio: 500 }
      ]
    };

    service.addItem(itemData);
    service.addItem(itemData);

    expect(service.items().length).toBe(1);
    expect(service.items()[0].cantidad).toBe(2);
    expect(service.subtotal()).toBe(11000);
  });

  it('debe crear lineas separadas si el mismo producto tiene diferentes adicionales', () => {
    service.addItem({
      productoId: 10,
      nombre: 'Hamburguesa Doble',
      precioUnitario: 5000,
      cantidad: 1,
      adicionales: [{ id: 1, nombre: 'Panceta', precio: 500 }]
    });

    service.addItem({
      productoId: 10,
      nombre: 'Hamburguesa Doble',
      precioUnitario: 5000,
      cantidad: 1,
      adicionales: [{ id: 2, nombre: 'Cheddar extra', precio: 600 }]
    });

    expect(service.items().length).toBe(2);
    expect(service.totalItems()).toBe(2);
    // 5500 + 5600 = 11100
    expect(service.subtotal()).toBe(11100);
  });

  it('debe modificar cantidad con delta positivo y negativo', () => {
    service.addItem({
      productoId: 5,
      nombre: 'Pizza Muzzarella',
      precioUnitario: 4000,
      cantidad: 2,
      adicionales: []
    });

    const idTemporal = service.items()[0].idTemporal;

    service.updateQuantity(idTemporal, 1);
    expect(service.items()[0].cantidad).toBe(3);
    expect(service.subtotal()).toBe(12000);

    service.updateQuantity(idTemporal, -1);
    expect(service.items()[0].cantidad).toBe(2);
    expect(service.subtotal()).toBe(8000);
  });

  it('debe remover el item si la cantidad llega a cero con delta negativo', () => {
    service.addItem({
      productoId: 5,
      nombre: 'Pizza Muzzarella',
      precioUnitario: 4000,
      cantidad: 1,
      adicionales: []
    });

    const idTemporal = service.items()[0].idTemporal;
    service.updateQuantity(idTemporal, -1);

    expect(service.items().length).toBe(0);
    expect(service.totalItems()).toBe(0);
  });

  it('debe eliminar un item especifico con removeItem', () => {
    service.addItem({
      productoId: 1,
      nombre: 'Empanada',
      precioUnitario: 1000,
      cantidad: 3,
      adicionales: []
    });

    const idTemporal = service.items()[0].idTemporal;
    service.removeItem(idTemporal);

    expect(service.items().length).toBe(0);
  });

  it('debe vaciar el carrito completamente con clear', () => {
    service.addItem({
      productoId: 1,
      nombre: 'Empanada',
      precioUnitario: 1000,
      cantidad: 3,
      adicionales: []
    });

    service.clear();

    expect(service.items().length).toBe(0);
    expect(service.totalItems()).toBe(0);
    expect(service.subtotal()).toBe(0);
  });

  it('debe generar el payload estructurado para checkout', () => {
    service.addItem({
      productoId: 12,
      nombre: 'Sandwich Lomito',
      precioUnitario: 6000,
      cantidad: 2,
      adicionales: [{ id: 3, nombre: 'Huevo frito', precio: 400 }]
    });

    const payload = service.getCheckoutPayload(1, 'Av. Costanera 123', 'Timbre 2B');

    expect(payload.metodo_pago_id).toBe(1);
    expect(payload.direccion_envio).toBe('Av. Costanera 123');
    expect(payload.notas).toBe('Timbre 2B');
    expect(payload.items.length).toBe(1);
    expect(payload.items[0]).toEqual({
      producto_id: 12,
      cantidad: 2,
      adicionales: [3]
    });
  });

  it('debe controlar el estado de apertura y cierre del drawer', () => {
    expect(service.isDrawerOpen()).toBe(false);

    service.openCart();
    expect(service.isDrawerOpen()).toBe(true);

    service.closeCart();
    expect(service.isDrawerOpen()).toBe(false);

    service.toggleCart();
    expect(service.isDrawerOpen()).toBe(true);
  });
});

