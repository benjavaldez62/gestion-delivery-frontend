import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { apiUrl } from '../config/api';
import { MenuService } from './menu';

describe('MenuService', () => {
  let service: MenuService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(MenuService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('obtiene los productos desde el endpoint público', () => {
    const products = [
      {
        id: 1,
        nombre: 'Pizza muzzarella',
        descripcion: 'Salsa, queso y aceitunas',
        imagen: null,
        precio: 5000,
        activo: true,
        categoria: { id: 2, nombre: 'Pizzas' },
      },
    ];

    service.getProducts().subscribe((result) => expect(result).toEqual(products));

    const request = httpTesting.expectOne(`${apiUrl}/productos`);
    expect(request.request.method).toBe('GET');
    request.flush({ message: 'ok', productos: products });
  });

  it('interpreta la respuesta 404 documentada como un menú vacío', () => {
    service.getProducts().subscribe((result) => expect(result).toEqual([]));

    httpTesting.expectOne(`${apiUrl}/productos`).flush(
      { message: 'No hay productos disponibles para mostrar.' },
      { status: 404, statusText: 'Not Found' }
    );
  });

  it('propaga el error si no se puede conectar con el backend, sin sustituir el catálogo', () => {
    let response: unknown;

    service.getProducts().subscribe({
      error: (error: unknown) => {
        response = error;
      },
    });

    httpTesting.expectOne(`${apiUrl}/productos`).error(new ProgressEvent('error'));
    expect(response).toBeTruthy();
  });

  it('obtiene adicionales precargados por categoría', () => {
    const additionals = [
      {
        id: 4,
        categoria_id: 2,
        nombre: 'Extra queso',
        descripcion: null,
        precio: 500,
        activo: true,
      },
    ];

    service.getAdditionals(2).subscribe((result) => expect(result).toEqual(additionals));

    const request = httpTesting.expectOne(`${apiUrl}/categorias/2/adicionales`);
    expect(request.request.method).toBe('GET');
    request.flush({ message: 'ok', adicionales: additionals });
  });
});
