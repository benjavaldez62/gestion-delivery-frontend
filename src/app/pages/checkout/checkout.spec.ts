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
    component.formulario.setValue({ direccion: '   ', telefono: 'abc', notas: '', metodoPago: 'efectivo', montoRecibido: null });
    expect(component.formulario.invalid).toBe(true);
    component.formulario.controls.telefono.setValue('+---1-');
    expect(component.formulario.controls.telefono.invalid).toBe(true);
    component.guardar();
    http.expectNone(`${apiUrl}/checkout/borradores`);
  });

  it('muestra el resumen y envia un solo borrador con los datos del carrito', () => {
    agregarProducto();
    component.formulario.setValue({ direccion: ' Calle 123 ', telefono: '123456789', notas: 'Timbre', metodoPago: 'tarjeta', montoRecibido: null });
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
    component.formulario.setValue({ direccion: 'Calle 123', telefono: '123456789', notas: '', metodoPago: 'efectivo', montoRecibido: null });
    component.guardar();
    http.expectOne(`${apiUrl}/checkout/borradores`).flush({}, { status: 422, statusText: 'Unprocessable Entity' });
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('revisá los datos');
    expect(cart.items().length).toBe(1);
    expect(component.guardando()).toBe(false);
  });

  it('valida el monto en efectivo y muestra el vuelto estimado', () => {
    agregarProducto();
    component.formulario.setValue({ direccion: 'Calle 123', telefono: '123456789', notas: '', metodoPago: 'efectivo', montoRecibido: 3800 });
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('debe cubrir el total estimado');
    component.guardar();
    http.expectNone(`${apiUrl}/checkout/borradores`);

    component.formulario.controls.montoRecibido.setValue(4000);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Vuelto estimado: $100.00');
    component.formulario.controls.montoRecibido.setValue(4000.001);
    expect(component.formulario.invalid).toBe(true);
    component.formulario.controls.metodoPago.setValue('transferencia');
    expect(component.formulario.controls.montoRecibido.value).toBeNull();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('pago digital todavía no está habilitado');
  });

  it('prepara Telegram con los precios del servidor y requiere confirmación', () => {
    agregarProducto();
    component.formulario.setValue({ direccion: 'Calle & 123', telefono: '123456789', notas: 'Sin cebolla', metodoPago: 'efectivo', montoRecibido: 5000 });
    component.guardar();
    const request = http.expectOne(`${apiUrl}/checkout/borradores`);
    expect(request.request.body.monto_recibido).toBe(5000);
    request.flush({
      id: 'ref-1', message: 'Guardado', subtotal: 2500, costo_envio: 1500, monto_total: 4000,
      items: [{ producto_id: 10, nombre: 'Hamburguesa', precio_unitario: 1050, cantidad: 2,
        adicionales: [{ id: 3, nombre: 'Queso', precio: 200 }], subtotal: 2500 }],
    });
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('a[href*="t.me"]')).toBeNull();
    component.prepararTelegram();
    fixture.detectChanges();
    const enlace = (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>('a[href*="t.me"]');
    expect(enlace).not.toBeNull();
    const url = new URL(enlace!.href);
    expect(url.hostname).toBe('t.me');
    expect(url.pathname).toBe('/Restauransbot');
    expect(url.searchParams.get('text')).toContain('Total: $4000.00');
    expect(url.searchParams.get('text')).toContain('Vuelto: $1000.00');
    expect(url.searchParams.get('text')).toContain('Calle & 123');
    expect(url.searchParams.get('text')).toContain('Queso');
    expect(url.searchParams.get('text')).toContain('no confirma el pedido ni el pago');
    component.confirmandoTelegram.set(false);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('a[href*="t.me"]')).toBeNull();
  });
});
