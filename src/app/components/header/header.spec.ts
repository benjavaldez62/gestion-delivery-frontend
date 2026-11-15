import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';
import { apiUrl } from '../../config/api';
import { Header } from './header';

describe('Header', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

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

  it('muestra el nombre y las acciones del usuario autenticado en el menú de perfil', () => {
    component.authService.login({ email: 'cook@example.com', password: 'password' }).subscribe();
    http.expectOne(`${apiUrl}/login`).flush({
      success: true,
      message: 'Login exitoso.',
      data: {
        access_token: 'token',
        token_type: 'Bearer',
        user: { id: 2, name: 'Cocinero Prueba', email: 'cook@example.com', role: { id: 2, nombre: 'Cocinero' } },
      },
    });
    fixture.detectChanges();

    const header = fixture.nativeElement as HTMLElement;
    expect(header.querySelector('.profile-menu-toggle')?.textContent).toContain('Cocinero Prueba');
    expect(header.querySelector('.profile-menu-panel')?.textContent).toContain('Editar perfil');
    expect(header.querySelector('.profile-menu-panel')?.textContent).toContain('Cerrar sesión');
    expect(header.querySelector('.profile-menu-panel a')?.getAttribute('href')).toBe('/perfil');
  });

  it('cierra la sesión desde el menú de perfil', () => {
    const navegar = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    component.authService.login({ email: 'cook@example.com', password: 'password' }).subscribe();
    http.expectOne(`${apiUrl}/login`).flush({
      success: true,
      message: 'Login exitoso.',
      data: {
        access_token: 'token',
        token_type: 'Bearer',
        user: { id: 2, name: 'Cocinero Prueba', email: 'cook@example.com', role: { id: 2, nombre: 'Cocinero' } },
      },
    });
    fixture.detectChanges();

    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('.profile-menu-logout')!.click();
    http.expectOne(`${apiUrl}/logout`).flush({ success: true, message: 'Sesión cerrada.' });

    expect(component.authService.estaAutenticado()).toBe(false);
    expect(component.authService.obtenerNombre()).toBeNull();
    expect(navegar).toHaveBeenCalledWith(['/login']);
  });
});
