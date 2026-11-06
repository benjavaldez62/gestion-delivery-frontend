import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Carrito } from './carrito';
import { CartService } from '../../services/cart';

describe('Carrito Page', () => {
  let component: Carrito;
  let fixture: ComponentFixture<Carrito>;
  let cartService: CartService;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [Carrito],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Carrito);
    component = fixture.componentInstance;
    cartService = TestBed.inject(CartService);
    cartService.clear();
    await fixture.whenStable();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe mostrar mensaje de carrito vacio cuando no hay items', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Tu carrito está vacío');
  });

  it('debe listar los productos y mostrar el total cuando hay items', () => {
    cartService.addItem({
      productoId: 10,
      nombre: 'Burger Artesanal',
      precioUnitario: 1200,
      cantidad: 2,
      adicionales: [],
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('Burger Artesanal');
    expect(compiled.textContent).toContain('Resumen de compra');
    expect(compiled.textContent).toContain('Continuar compra');
  });

  it('debe incrementar y decrementar la cantidad del item', () => {
    cartService.addItem({
      productoId: 10,
      nombre: 'Burger Artesanal',
      precioUnitario: 1200,
      cantidad: 2,
      adicionales: [],
    });
    fixture.detectChanges();

    const idTemporal = cartService.items()[0].idTemporal;
    component.increment(idTemporal);
    expect(cartService.items()[0].cantidad).toBe(3);

    component.decrement(idTemporal);
    expect(cartService.items()[0].cantidad).toBe(2);
  });

  it('debe eliminar un item del carrito', () => {
    cartService.addItem({
      productoId: 10,
      nombre: 'Burger Artesanal',
      precioUnitario: 1200,
      cantidad: 2,
      adicionales: [],
    });
    fixture.detectChanges();

    const idTemporal = cartService.items()[0].idTemporal;
    component.remove(idTemporal);
    expect(cartService.items().length).toBe(0);
  });
});
