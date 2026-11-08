import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Categoria, CategoriasService } from '../../services/categorias';
import { MenuProduct } from '../../models/menu';
import { MenuService } from '../../services/menu';
import { Menu } from './menu';

describe('Menu', () => {
  let component: Menu;
  let fixture: ComponentFixture<Menu>;

  beforeEach(async () => {
    const product: MenuProduct = {
      id: 1,
      nombre: 'Pizza',
      descripcion: null,
      imagen: null,
      precio: 1000,
      activo: true,
      categoria: { id: 1, nombre: 'Pizzas' },
    };
    const categories: Categoria[] = [
      { id: 1, nombre: 'Pizzas', descripcion: '', activo: true },
    ];
    await TestBed.configureTestingModule({
      imports: [Menu],
      providers: [
        { provide: MenuService, useValue: { getProducts: () => of([product]), getAdditionals: () => of([]) } },
        {
          provide: CategoriasService,
          useValue: { obtenerCategorias: () => of({ message: 'ok', categorias: categories }) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Menu);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
