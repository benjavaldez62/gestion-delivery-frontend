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

  it('despliega los adicionales en la tarjeta, limita la selección a dos y los agrega al carrito', () => {
    const component = fixture.componentInstance;
    const checkbox = fixture.nativeElement.querySelector('.menu-additionals-toggle input') as HTMLInputElement;
    expect(checkbox).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Agregar adicionales');

    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(component.expandedProductId()).toBe(product.id);
    expect(fixture.nativeElement.textContent).toContain('Extra queso');

    const additionalCheckboxes = Array.from(
      fixture.nativeElement.querySelectorAll('.menu-additional-option input')
    ) as HTMLInputElement[];
    additionalCheckboxes[0].checked = true;
    additionalCheckboxes[0].dispatchEvent(new Event('change'));
    fixture.detectChanges();
    additionalCheckboxes[1].checked = true;
    additionalCheckboxes[1].dispatchEvent(new Event('change'));
    fixture.detectChanges();
    additionalCheckboxes[2].checked = true;
    additionalCheckboxes[2].dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(component.selectedAdditionalIds()).toEqual([1, 2]);
    expect(additionalCheckboxes[2].disabled).toBe(true);

    const addButton = fixture.nativeElement.querySelector('.menu-product-add') as HTMLButtonElement;
    addButton.click();
    fixture.detectChanges();

    expect(cart.items()).toHaveLength(1);
    expect(cart.items()[0].adicionales).toEqual([
      { id: 1, nombre: 'Extra queso', precio: 500 },
      { id: 2, nombre: 'Aceitunas', precio: 200 },
    ]);
    expect(cart.items()[0].subtotal).toBe(5700);
    expect(component.expandedProductId()).toBeNull();
    expect(component.successMessage()).toBe('Pizza muzzarella agregado correctamente');
    expect(fixture.nativeElement.textContent).toContain('Pizza muzzarella agregado correctamente');
  });

  it('permite agregar el producto sin adicionales cuando falla su consulta', () => {
    const component = fixture.componentInstance;
    vi.spyOn(menuService, 'getAdditionals').mockReturnValue(
      throwError(() => new Error('No se pudo cargar'))
    );

    component.toggleAdditionals(product, true);

    expect(component.additionalsError()).toContain('Puedes agregar el producto sin adicionales');
    expect(component.additionalsLoading()).toBe(false);

    component.solicitarAgregar(product, 1);

    expect(cart.items()).toHaveLength(1);
    expect(cart.items()[0].cantidad).toBe(1);
    expect(cart.items()[0].adicionales).toEqual([]);
    expect(component.expandedProductId()).toBeNull();
  });

  it('agrega cualquier cantidad seleccionada y calcula el total', () => {
    const component = fixture.componentInstance;
    component.changeQuantity(product.id, 3);

    expect(component.quantityFor(product.id)).toBe(4);

    component.solicitarAgregar(product, component.quantityFor(product.id));

    expect(cart.items()[0].cantidad).toBe(4);
    expect(cart.items()[0].subtotal).toBe(20000);
    expect(component.quantityFor(product.id)).toBe(1);
    expect(component.successMessage()).toBe('4 Pizza muzzarella agregados correctamente');
  });

  it('agrega directamente productos de categorías que no permiten adicionales', () => {
    const component = fixture.componentInstance;
    const empanada: MenuProduct = {
      ...product,
      id: 8,
      nombre: 'Empanada de carne',
      categoria: { id: 2, nombre: 'Empanadas' },
    };
    const getAdditionals = vi.spyOn(menuService, 'getAdditionals');

    component.solicitarAgregar(empanada, 1);

    expect(getAdditionals).not.toHaveBeenCalled();
    expect(cart.items()).toHaveLength(1);
    expect(cart.items()[0].categoriaNombre).toBe('Empanadas');
    expect(component.expandedProductId()).toBeNull();
  });

  it('no agrega productos agotados ni solicita sus adicionales', () => {
    const unavailableProduct = { ...product, activo: false };
    const component = fixture.componentInstance;
    const getAdditionals = vi.spyOn(menuService, 'getAdditionals');

    component.solicitarAgregar(unavailableProduct, 1);

    expect(component.expandedProductId()).toBeNull();
    expect(cart.items()).toEqual([]);
    expect(getAdditionals).not.toHaveBeenCalled();
  });
});
