import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { CartDrawer } from './cart-drawer';
import { CartService } from '../../services/cart';

describe('CartDrawer', () => {
  let component: CartDrawer;
  let fixture: ComponentFixture<CartDrawer>;
  let cartService: CartService;
  let router: Router;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [CartDrawer],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(CartDrawer);
    component = fixture.componentInstance;
    cartService = TestBed.inject(CartService);
    router = TestBed.inject(Router);
    cartService.clear();
    await fixture.whenStable();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('debe crearse correctamente', () => {
    expect(component).toBeTruthy();
  });

  it('debe reflejar el estado de vacio cuando no hay items', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.cart-empty')).toBeTruthy();
  });

  it('debe renderizar items y totales cuando el carrito tiene productos', () => {
    cartService.addItem({
      productoId: 1,
      nombre: 'Pizza Margherita',
      precioUnitario: 3500,
      cantidad: 1,
      adicionales: []
    });
    cartService.openCart();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.cart-item')).toBeTruthy();
    expect(compiled.querySelector('.item-name')?.textContent).toContain('Pizza Margherita');
    expect(compiled.querySelector('.cart-drawer')?.classList.contains('open')).toBe(true);
  });

  it('debe invocar cierre del drawer al llamar a close()', () => {
    cartService.openCart();
    expect(cartService.isDrawerOpen()).toBe(true);

    component.close();
    expect(cartService.isDrawerOpen()).toBe(false);
  });

  it('debe cerrar el carrito y navegar al checkout al invocar irAlCheckout()', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    cartService.openCart();

    component.irAlCheckout();

    expect(cartService.isDrawerOpen()).toBe(false);
    expect(navigateSpy).toHaveBeenCalledWith(['/checkout']);
  });
});

