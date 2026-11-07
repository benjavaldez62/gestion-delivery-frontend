import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { apiUrl } from '../../config/api';
import { CartService } from '../../services/cart';
import { Checkout } from './checkout';

describe('Checkout', () => {
  let fixture: ComponentFixture<Checkout>;
  let component: Checkout;
  let cart: CartService;
  let http: HttpTestingController;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Checkout],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    fixture = TestBed.createComponent(Checkout);
    component = fixture.componentInstance;
    cart = TestBed.inject(CartService);
    http = TestBed.inject(HttpTestingController);
    cart.clear();
  });

  afterEach(() => {
    http.verify();
    localStorage.clear();
  });

  function agregarProducto(): void {
    cart.addItem({
      productoId: 10,
      nombre: 'Hamburguesa',
      precioUnitario: 1000,
      cantidad: 2,
      adicionales: [{ id: 3, nombre: 'Queso', precio: 200 }],
    });
  }

  it('muestra el carrito vacio y no envia solicitudes', () => {
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Tu carrito está vacío');
    component.guardar();
    http.expectNone(`${apiUrl}/checkout/borradores`);
  });

  it('requiere direccion, telefono y metodo de pago', () => {
    agregarProducto();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('button[type=submit]')?.hasAttribute('disabled')).toBe(true);
    component.formulario.setValue({ direccion: '   ', telefono: 'abc', notas: '', metodoPago: 'efectivo' });
    expect(component.formulario.invalid).toBe(true);
    component.formulario.controls.telefono.setValue('+---1-');
    expect(component.formulario.controls.telefono.invalid).toBe(true);
    component.guardar();
    http.expectNone(`${apiUrl}/checkout/borradores`);
  });

  it('muestra el resumen y envia un solo borrador con los datos del carrito', () => {
    agregarProducto();
    component.formulario.setValue({ direccion: ' Calle 123 ', telefono: '123456789', notas: 'Timbre', metodoPago: 'tarjeta' });
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Hamburguesa');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Queso');

    component.guardar();
    component.guardar();
    const request = http.expectOne(`${apiUrl}/checkout/borradores`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      direccion: 'Calle 123',
      telefono: '123456789',
      notas: 'Timbre',
      metodo_pago: 'tarjeta',
      items: [{ producto_id: 10, cantidad: 2, adicionales: [3] }],
    });
    request.flush({ id: 'borrador', message: 'Guardado', subtotal: 2400, costo_envio: 1500, monto_total: 3900 });
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('todavía no fue confirmado');
    expect(cart.items().length).toBe(1);
  });

  it('muestra el error del servidor y conserva el carrito para reintentar', () => {
    agregarProducto();
    component.formulario.setValue({ direccion: 'Calle 123', telefono: '123456789', notas: '', metodoPago: 'efectivo' });
    component.guardar();
    http.expectOne(`${apiUrl}/checkout/borradores`).flush({}, { status: 422, statusText: 'Unprocessable Entity' });
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('revisá los datos');
    expect(cart.items().length).toBe(1);
    expect(component.guardando()).toBe(false);
  });
});
