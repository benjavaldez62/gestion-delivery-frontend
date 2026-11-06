import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { Inicio } from './inicio';

describe('Inicio', () => {
  let component: Inicio;
  let fixture: ComponentFixture<Inicio>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Inicio],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(Inicio);
    component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debe renderizar el hero con el boton Ver catalogo y el carrusel de categorias', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const cta = compiled.querySelector('.mozzo-hero-cta');
    expect(cta).toBeTruthy();
    expect(cta?.textContent).toContain('Ver catálogo');
    expect(compiled.querySelectorAll('.mozzo-category-item').length).toBe(6);
  });

  it('debe avanzar y retroceder el indice del carrusel con siguienteCategoria y anteriorCategoria', () => {
    const inicial = component.indiceActual();
    component.siguienteCategoria();
    expect(component.indiceActual()).toBe((inicial + 1) % component.categoriasBase().length);

    component.anteriorCategoria();
    expect(component.indiceActual()).toBe(inicial);
  });

  it('debe pausar y reanudar el autoplay al interactuar con el carrusel', () => {
    component.pausarAutoplay();
    expect(component.pausado()).toBe(true);

    component.reanudarAutoplay();
    expect(component.pausado()).toBe(false);
  });
});
