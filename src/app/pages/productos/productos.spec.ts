import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Categoria, CategoriasService } from '../../services/categorias';
import { Producto, ProductosService } from '../../services/productos';
import { Productos } from './productos';

describe('Productos', () => {
  let component: Productos;
  let fixture: ComponentFixture<Productos>;
  const productosServiceMock = {
    obtenerProductos: () => of([]),
    obtenerProductosDesactivados: () => of([]),
    crearProducto: vi.fn(() => of({ message: 'Producto creado', producto: {} as Producto })),
    actualizarProducto: vi.fn(() => of({ message: 'Producto actualizado', producto: {} as Producto })),
    eliminarProducto: vi.fn(() => of({ message: 'Producto desactivado' })),
    restaurarProducto: vi.fn(() => of({ message: 'Producto restaurado' })),
  };
  const categoria: Categoria = {
    id: 1,
    nombre: 'Hamburguesas',
    descripcion: null,
    activo: true,
  };
  const categoriasServiceMock = {
    obtenerCategorias: () => of({ message: 'ok', categorias: [categoria] }),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Productos],
      providers: [
        { provide: ProductosService, useValue: productosServiceMock },
        { provide: CategoriasService, useValue: categoriasServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Productos);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('only keeps one category selected at a time', () => {
    component.seleccionarCategoria(1, true);
    component.seleccionarCategoria(2, true);

    expect(component.categoriaId).toBe(2);
  });

  it('creates a product as active and sends its selected category', () => {
    component.nombre = 'Hamburguesa clásica';
    component.descripcion = 'Carne y queso';
    component.precio = 2500;
    component.imagen = '';
    component.seleccionarCategoria(categoria.id, true);

    component.guardarProducto();

    expect(productosServiceMock.crearProducto).toHaveBeenCalledWith({
      nombre: 'Hamburguesa clásica',
      descripcion: 'Carne y queso',
      imagen: null,
      precio: 2500,
      categoria_id: categoria.id,
      activo: true,
    });
    expect(component.notificacion()).toBe('Producto creado con éxito.');
  });

  it('updates the shared form without sending an active field', () => {
    component.editarProducto({
      id: 8,
      nombre: 'Pizza napolitana',
      descripcion: null,
      imagen: null,
      precio: 3200,
      activo: true,
      categoria,
    });

    component.guardarProducto();

    expect(productosServiceMock.actualizarProducto).toHaveBeenCalledWith(8, {
      nombre: 'Pizza napolitana',
      descripcion: null,
      imagen: null,
      precio: 3200,
      categoria_id: categoria.id,
    });
  });

  it('keeps the edit modal open while clearing the image URL', () => {
    const producto: Producto = {
      id: 8,
      nombre: 'Pizza napolitana',
      descripcion: null,
      imagen: 'https://example.com/producto.jpg',
      precio: 3200,
      activo: true,
      categoria,
    };
    component.productos.set([producto]);
    fixture.detectChanges();

    const editButton = fixture.nativeElement.querySelector(
      '[aria-label="Editar Pizza napolitana"]',
    ) as HTMLButtonElement;
    editButton.click();
    fixture.detectChanges();

    const imagenInput = fixture.nativeElement.querySelector('#imagen-producto') as HTMLInputElement;
    imagenInput.click();
    imagenInput.value = '';
    imagenInput.dispatchEvent(new Event('input', { bubbles: true }));
    component.imagen = '';
    fixture.detectChanges();

    expect(component.modalAbierto()).toBe(true);
    expect(imagenInput.value).toBe('');
    expect(fixture.nativeElement.querySelector('.modal')).not.toBeNull();
  });
});
