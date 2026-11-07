import { TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { MenuProduct, MenuAdditional } from '../../models/menu';
import { CartService } from '../../services/cart';
import { MenuService } from '../../services/menu';
import { MenuListComponent } from './menu-list';

describe('MenuListComponent', () => {
  const product: MenuProduct = {
    id: 7,
    nombre: 'Pizza muzzarella',
    descripcion: 'Salsa y queso',
    imagen: null,
    precio: 5000,
    activo: true,
    categoria: { id: 2, nombre: 'Pizzas' },
  };
  const additionals: MenuAdditional[] = [
    { id: 1, categoria_id: 2, nombre: 'Extra queso', descripcion: null, precio: 500, activo: true },
    { id: 2, categoria_id: 2, nombre: 'Aceitunas', descripcion: null, precio: 200, activo: true },
    { id: 3, categoria_id: 2, nombre: 'Anchoas', descripcion: null, precio: 300, activo: true },
  ];

  let fixture: ReturnType<typeof TestBed.createComponent<MenuListComponent>>;
  let menuService: {
    getProducts: () => Observable<MenuProduct[]>;
    getAdditionals: (categoryId: number) => Observable<MenuAdditional[]>;
  };
  let cart: CartService;

  beforeEach(() => {
    menuService = {
      getProducts: () => of([product]),
      getAdditionals: () => of(additionals),
    };

    TestBed.configureTestingModule({
      imports: [MenuListComponent],
      providers: [{ provide: MenuService, useValue: menuService }, CartService],
    });

    fixture = TestBed.createComponent(MenuListComponent);
    cart = TestBed.inject(CartService);
    cart.clear();
    fixture.detectChanges();
  });

  afterEach(() => cart.clear());

  it('carga y muestra los productos disponibles', () => {
    expect(fixture.componentInstance.products()).toEqual([product]);
    expect(fixture.nativeElement.textContent).toContain('Nuestro Menú');
    expect(fixture.nativeElement.textContent).toContain('Pizza muzzarella');
  });

  it('limita la selección a dos adicionales y los agrega al carrito', () => {
    const component = fixture.componentInstance;
    component.solicitarAgregar(product);

    component.toggleAdicional(1);
    component.toggleAdicional(2);
    component.toggleAdicional(3);

    expect(component.selectedAdditionalIds()).toEqual([1, 2]);

    component.confirmarAgregar();

    expect(cart.items()).toHaveLength(1);
    expect(cart.items()[0].adicionales).toEqual([
      { id: 1, nombre: 'Extra queso', precio: 500 },
      { id: 2, nombre: 'Aceitunas', precio: 200 },
    ]);
    expect(cart.items()[0].subtotal).toBe(5700);
    expect(component.selectedProduct()).toBeNull();
  });

  it('permite agregar el producto sin adicionales cuando falla su consulta', () => {
    const component = fixture.componentInstance;
    vi.spyOn(menuService, 'getAdditionals').mockReturnValue(
      throwError(() => new Error('No se pudo cargar'))
    );

    component.solicitarAgregar(product);

    expect(component.additionalsError()).toContain('Puedes agregar el producto sin adicionales');
    expect(component.additionalsLoading()).toBe(false);

    component.confirmarAgregar();

    expect(cart.items()).toHaveLength(1);
    expect(cart.items()[0].cantidad).toBe(1);
    expect(cart.items()[0].adicionales).toEqual([]);
    expect(component.selectedProduct()).toBeNull();
  });

  it('agrega cualquier cantidad seleccionada y calcula el total', () => {
    const component = fixture.componentInstance;
    component.solicitarAgregar(product);
    component.incrementarCantidad();
    component.incrementarCantidad();
    component.incrementarCantidad();

    expect(component.quantity()).toBe(4);
    expect(component.selectedTotal()).toBe(20000);

    component.confirmarAgregar();

    expect(cart.items()[0].cantidad).toBe(4);
    expect(cart.items()[0].subtotal).toBe(20000);
  });

  it('no agrega productos agotados ni solicita sus adicionales', () => {
    const unavailableProduct = { ...product, activo: false };
    const component = fixture.componentInstance;
    const getAdditionals = vi.spyOn(menuService, 'getAdditionals');

    component.solicitarAgregar(unavailableProduct);

    expect(component.selectedProduct()).toBeNull();
    expect(cart.items()).toEqual([]);
    expect(getAdditionals).not.toHaveBeenCalled();
  });
});
