import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { Categoria, CategoriasService } from '../../services/categorias';
import { Categorias } from './categorias';

describe('Categorias', () => {
  let component: Categorias;
  let fixture: ComponentFixture<Categorias>;
  const categoriasServiceMock = {
    obtenerCategorias: vi.fn(() => of({ categorias: [] as Categoria[] })),
    obtenerCategoriasDesactivadas: vi.fn(() => of({ categoriasDesactivadas: [] as Categoria[] })),
    restaurarCategoria: vi.fn(() => of({ message: 'Categoría restaurada.' })),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Categorias],
      providers: [{ provide: CategoriasService, useValue: categoriasServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(Categorias);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('limpia la lista de desactivadas si restaurar deja esa lista vacía', () => {
    const categoria: Categoria = {
      id: 2,
      nombre: 'Salsas',
      descripcion: null,
      activo: true,
    };
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    categoriasServiceMock.restaurarCategoria.mockReturnValue(of({ message: 'Categoría restaurada.' }));
    categoriasServiceMock.obtenerCategorias.mockReturnValue(of({ categorias: [categoria] }));
    categoriasServiceMock.obtenerCategoriasDesactivadas.mockReturnValue(
      throwError(() => ({ status: 404 }))
    );
    component.categoriasDesactivadas.set([categoria]);

    component.restaurarCategoria(categoria);

    expect(component.categorias()).toEqual([categoria]);
    expect(component.categoriasDesactivadas()).toEqual([]);
  });

  it('limpia la lista de activas sin marcar error cuando obtenerCategorias responde 404', () => {
    categoriasServiceMock.obtenerCategorias.mockReturnValueOnce(throwError(() => ({ status: 404 })));
    categoriasServiceMock.obtenerCategoriasDesactivadas.mockReturnValueOnce(
      throwError(() => ({ status: 404 })),
    );

    component.cargarCategorias();

    expect(component.categorias()).toEqual([]);
    expect(component.categoriasDesactivadas()).toEqual([]);
    expect(component.error()).toBe('');
    expect(component.cargando()).toBe(false);
  });
});
