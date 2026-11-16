import { TestBed } from '@angular/core/testing';
import { MenuProduct } from '../../models/menu';
import { ProductCardComponent } from './product-card';

describe('ProductCardComponent', () => {
  let fixture: ReturnType<typeof TestBed.createComponent<ProductCardComponent>>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ProductCardComponent],
    });

    fixture = TestBed.createComponent(ProductCardComponent);
    fixture.componentRef.setInput('product', {
      id: 21,
      nombre: 'Ensalada Mixta',
      descripcion: null,
      imagen: 'https://www.google.com/imgres?q=ensalada',
      precio: 4500,
      activo: true,
      categoria: { id: 7, nombre: 'Ensaladas' },
    } satisfies MenuProduct);
    fixture.detectChanges();
  });

  it('uses the category image when the product image URL fails', () => {
    const image = fixture.nativeElement.querySelector('.menu-product-image') as HTMLImageElement;
    image.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(image.getAttribute('src')).toBe('assets/img/home-1/menu-l3.png');
  });
});
