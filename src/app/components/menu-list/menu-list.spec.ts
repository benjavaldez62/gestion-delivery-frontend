import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { MenuProduct, MenuAdditional } from '../../models/menu';
import { CartService } from '../../services/cart';
import { Categoria, CategoriasService } from '../../services/categorias';
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
  let categoriasService: {
    obtenerCategorias: () => Observable<{ message: string; categorias: Categoria[] }>;
  };
  let queryParams: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let cart: CartService;

  beforeEach(() => {
    queryParams = new BehaviorSubject(convertToParamMap({}));
    categoriasService = {
      obtenerCategorias: () => of({
        message: 'Categorías cargadas',
        categorias: [
          { id: 2, nombre: 'Pizzas', descripcion: '', activo: true },
          { id: 3, nombre: 'Empanadas', descripcion: '', activo: true },
          { id: 4, nombre: 'Oculta', descripcion: '', activo: false },
        ],
      }),
    };
    menuService = {
      getProducts: () => of([product]),
      getAdditionals: () => of(additionals),
    };

    TestBed.configureTestingModule({
      imports: [MenuListComponent],
      providers: [
        { provide: MenuService, useValue: menuService },
        { provide: CategoriasService, useValue: categoriasService },
        { provide: ActivatedRoute, useValue: { queryParamMap: queryParams.asObservable() } },
        CartService,
      ],
    });

    fixture = TestBed.createComponent(MenuListComponent);
    cart = TestBed.inject(CartService);
    cart.clear();
    fixture.detectChanges();
  });

  afterEach(() => cart.clear());

  it('al ingresar solo muestra los botones de categorías y el acceso a todos los productos', () => {
    expect(fixture.componentInstance.products()).toEqual([product]);
    expect(fixture.nativeElement.textContent).toContain('Nuestro Menú');
    expect(fixture.nativeElement.textContent).toContain('Pizzas');
    expect(fixture.nativeElement.textContent).not.toContain('Oculta');
    expect(fixture.nativeElement.textContent).toContain('Ver todos los productos');
    expect(fixture.nativeElement.textContent).not.toContain('Pizza muzzarella');
    expect(fixture.nativeElement.querySelector('app-product-card')).toBeNull();
  });

  it('filtra los productos por la categoría seleccionada y permite volver a verlos todos', () => {
    const anotherProduct: MenuProduct = {
      ...product,
      id: 8,
      nombre: 'Empanada de carne',
      categoria: { id: 3, nombre: 'Empanadas' },
    };
    const component = fixture.componentInstance;
    component.products.set([product, anotherProduct]);
    fixture.detectChanges();

    const categoryButtons = fixture.nativeElement.querySelectorAll('.menu-category-button') as NodeListOf<HTMLButtonElement>;
    categoryButtons[1].click();
    fixture.detectChanges();

    expect(component.filteredProducts()).toEqual([anotherProduct]);
    expect(component.selectedCategoryId()).toBe(3);
    expect(fixture.nativeElement.textContent).toContain('Empanada de carne');
    expect(fixture.nativeElement.textContent).not.toContain('Pizza muzzarella');

    const allProductsButton = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>
    )
      .find((button) => button.textContent.includes('Ver todos los productos')) as HTMLButtonElement;
    allProductsButton.click();
    fixture.detectChanges();

    expect(component.filteredProducts()).toEqual([product, anotherProduct]);
    expect(fixture.nativeElement.textContent).toContain('Pizza muzzarella');
  });

  it('muestra botones para las categorías activas provenientes del servicio', () => {
    const component = fixture.componentInstance;

    expect(component.categories().map(({ id }) => id)).toEqual([2, 3]);
    const categoryButtons = fixture.nativeElement.querySelectorAll('.menu-category-button') as NodeListOf<HTMLButtonElement>;
    expect(categoryButtons).toHaveLength(2);
    expect(categoryButtons[0].textContent.trim()).toBe('Pizzas');
    expect(categoryButtons[1].textContent.trim()).toBe('Empanadas');
    expect(categoryButtons[0].className).toBe(categoryButtons[1].className);
  });

  it('selecciona la categoría recibida desde Inicio por el parámetro de navegación', () => {
    const anotherProduct: MenuProduct = {
      ...product,
      id: 8,
      nombre: 'Empanada de carne',
      categoria: { id: 3, nombre: 'Empanadas' },
    };
    fixture.componentInstance.products.set([product, anotherProduct]);
    queryParams.next(convertToParamMap({ categoriaId: '3' }));
    fixture.detectChanges();

    expect(fixture.componentInstance.selectedCategoryId()).toBe(3);
    expect(fixture.componentInstance.hasProductSelection()).toBe(true);
    expect(fixture.componentInstance.filteredProducts()).toEqual([anotherProduct]);
    expect(fixture.nativeElement.textContent).toContain('Empanadas');
    expect(fixture.nativeElement.textContent).toContain('Empanada de carne');
    expect(fixture.nativeElement.textContent).not.toContain('Pizza muzzarella');
  });

  it('despliega los adicionales en la tarjeta, limita la selección a dos y los agrega al carrito', () => {
    const component = fixture.componentInstance;
    component.mostrarTodosLosProductos();
    fixture.detectChanges();
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

  it('muestra el precio de los adicionales solo en el producto que los tiene seleccionados', () => {
    const component = fixture.componentInstance;
    const roquefort: MenuProduct = {
      ...product,
      id: 8,
      nombre: 'Pizza roquefort',
      precio: 7000,
    };
    component.products.set([product, roquefort]);
    component.mostrarTodosLosProductos();
    fixture.detectChanges();

    const cards = fixture.nativeElement.querySelectorAll('app-product-card') as NodeListOf<HTMLElement>;
    const additionalsToggle = cards[0].querySelector('.menu-additionals-toggle input') as HTMLInputElement;
    additionalsToggle.checked = true;
    additionalsToggle.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const olivesCheckbox = cards[0].querySelectorAll('.menu-additional-option input')[1] as HTMLInputElement;
    olivesCheckbox.checked = true;
    olivesCheckbox.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(cards[0].querySelector('.menu-product-total')?.textContent).toContain('$5,200');
    expect(cards[1].querySelector('.menu-product-total')?.textContent).toContain('$7,000');

    (cards[1].querySelector('.menu-product-add') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(cart.items()).toHaveLength(1);
    expect(cart.items()[0].nombre).toBe('Pizza roquefort');
    expect(cart.items()[0].subtotal).toBe(7000);
    expect(cart.items()[0].adicionales).toEqual([]);
  });

  it('permite agregar el producto sin adicionales cuando falla su consulta', () => {
    const component = fixture.componentInstance;
    component.mostrarTodosLosProductos();
    fixture.detectChanges();
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
    component.mostrarTodosLosProductos();
    fixture.detectChanges();
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
    component.mostrarTodosLosProductos();
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
