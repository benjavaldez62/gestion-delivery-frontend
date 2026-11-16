import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Adicionales } from './adicionales';
import { AdicionalesService } from '../../services/adicionales';

describe('Adicionales', () => {
  let component: Adicionales;
  let fixture: ComponentFixture<Adicionales>;
  const adicionalesServiceMock = {
    obtenerAdicionales: () => of({ adicionales: [] }),
    obtenerAdicionalesDesactivados: () => of({ adicionalesDesactivados: [] }),
    obtenerCategorias: () => of({ categorias: [{ id: 7, nombre: 'Salsas' }] }),
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
});
