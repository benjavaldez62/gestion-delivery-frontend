import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { Header } from './header';

describe('Header', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('no ofrece cargar datos demo en el carrito vacío', () => {
    component.cart.clear();
    component.cart.openCart();
    fixture.detectChanges();
    const texto = (fixture.nativeElement as HTMLElement).textContent;
    expect(texto).toContain('Tu carrito está vacío');
    expect(texto).not.toContain('Cargar demo');
    const enlace = (fixture.nativeElement as HTMLElement).querySelector<HTMLAnchorElement>('.mozzo-cart-dropdown a');
    expect(enlace?.textContent).toContain('Ver catálogo');
    expect(enlace?.getAttribute('href')).toBe('/menu');
  });

  it('muestra Pagos sin un acceso separado a métodos de pago', async () => {
    vi.spyOn(component.authService, 'obtenerRol').mockReturnValue('Administrador');
    const adminFixture = TestBed.createComponent(Header);
    adminFixture.detectChanges();
    await adminFixture.whenStable();
    const header = adminFixture.nativeElement as HTMLElement;
    expect(header.textContent).toContain('Pagos');
    expect(header.textContent).not.toContain('Métodos de Pago');
  });
});
