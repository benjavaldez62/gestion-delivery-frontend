import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { Adicionales } from './adicionales';
import { Adicional, AdicionalesService } from '../../services/adicionales';

describe('Adicionales', () => {
  let component: Adicionales;
  let fixture: ComponentFixture<Adicionales>;
  const adicionalesServiceMock = {
    obtenerAdicionales: vi.fn(() => of({ adicionales: [] as Adicional[] })),
    obtenerAdicionalesDesactivados: vi.fn(() => of({ adicionalesDesactivados: [] as Adicional[] })),
    obtenerCategorias: () => of({ categorias: [{ id: 7, nombre: 'Salsas' }] }),
    restaurarAdicional: vi.fn(() => of({ message: 'Adicional restaurado.' })),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Adicionales],
      providers: [{ provide: AdicionalesService, useValue: adicionalesServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(Adicionales);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('muestra la categoría relacionada por ID en las listas de activos y desactivados', () => {
    component.adicionales.set([
      { id: 1, nombre: 'Salsa picante', descripcion: null, precio: 100, activo: true, categoria_id: 7 },
    ]);
    component.adicionalesDesactivados.set([
      { id: 2, nombre: 'Salsa suave', descripcion: null, precio: 120, activo: false, categoria_id: 7 },
    ]);
    component.cargando.set(false);

    fixture.detectChanges();

    const filas = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(filas[0].cells[3].textContent).toContain('Salsas');
    expect(filas[1].cells[3].textContent).toContain('Salsas');
  });

  it('limpia la lista de desactivados si restaurar deja esa lista vacía', () => {
    const adicional: Adicional = {
      id: 2,
      nombre: 'Salsa suave',
      descripcion: null,
      precio: 120,
      activo: true,
      categoria_id: 7,
    };
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    adicionalesServiceMock.restaurarAdicional.mockReturnValue(of({ message: 'Adicional restaurado.' }));
    adicionalesServiceMock.obtenerAdicionales.mockReturnValue(of({ adicionales: [adicional] }));
    adicionalesServiceMock.obtenerAdicionalesDesactivados.mockReturnValue(
      throwError(() => ({ status: 404 }))
    );
    component.adicionalesDesactivados.set([adicional]);

    component.restaurarAdicional(adicional);

    expect(component.adicionales()).toEqual([adicional]);
    expect(component.adicionalesDesactivados()).toEqual([]);
  });
});
