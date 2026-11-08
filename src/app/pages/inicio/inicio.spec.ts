import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Categoria, CategoriasService } from '../../services/categorias';
import { of } from 'rxjs';
import { Inicio } from './inicio';

describe('Inicio', () => {
  let component: Inicio;
  let fixture: ComponentFixture<Inicio>;

  beforeEach(async () => {
    const categories: Categoria[] = [
      { id: 12, nombre: 'Hamburguesas', descripcion: '', activo: true },
      { id: 25, nombre: 'Pastas', descripcion: '', activo: true },
      { id: 37, nombre: 'Pizzas', descripcion: '', activo: true },
      { id: 42, nombre: 'Empanadas', descripcion: '', activo: true },
      { id: 52, nombre: 'Desactivada', descripcion: '', activo: false },
    ];
    await TestBed.configureTestingModule({
      imports: [Inicio],
      providers: [
        provideRouter([]),
        {
          provide: CategoriasService,
          useValue: { obtenerCategorias: () => of({ message: 'ok', categorias: categories }) },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Inicio);
    component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('debe renderizar el boton Ver Menu y las categorias activas', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const cta = compiled.querySelector('.mozzo-hero-cta');
    expect(cta).toBeTruthy();
    expect(cta?.textContent).toContain('Ver Menú');
    expect((cta as HTMLAnchorElement).getAttribute('href')).toBe('/menu');
    expect(compiled.querySelectorAll('.mozzo-category-item').length).toBe(4);
  });

  it('enlaza las categorías del carrusel con sus ids del backend', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const categoryLink = compiled.querySelector('.mozzo-category-link') as HTMLAnchorElement;
    const imageLink = compiled.querySelector('.mozzo-card-split') as HTMLAnchorElement;

    expect(categoryLink.getAttribute('href')).toBe('/menu?categoriaId=12');
    expect(imageLink.getAttribute('href')).toBe('/menu?categoriaId=12');
  });

  it('muestra las tres tarjetas de Inicio con los nuevos nombres', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('Hamburguesa Clásica');
    expect(compiled.textContent).toContain('Ravioles de queso');
    expect(compiled.textContent).toContain('Pizza margherita');
  });

  it('redirige cada tarjeta inferior a su categoría correspondiente del backend', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const offerLinks = Array.from(
      compiled.querySelectorAll('.mozzo-offers-section a')
    ) as HTMLAnchorElement[];

    expect(offerLinks.map((link) => link.getAttribute('href'))).toEqual([
      '/menu?categoriaId=12',
      '/menu?categoriaId=25',
      '/menu?categoriaId=37',
    ]);
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
