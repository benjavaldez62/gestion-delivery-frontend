import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ProductosService } from './productos';
import { apiUrl } from '../config/api';

describe('ProductosService', () => {
  let service: ProductosService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ProductosService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('returns active products from the catalog endpoint', () => {
    let response: unknown;
    service.obtenerProductos().subscribe((productos) => response = productos);

    httpTesting.expectOne(`${apiUrl}/productos`).flush({
      message: 'ok',
      productos: [{ id: 1, nombre: 'Pizza', activo: true }],
    });

    expect(response).toEqual([{ id: 1, nombre: 'Pizza', activo: true }]);
  });

  it('treats an empty active or inactive listing as an empty collection', () => {
    let activos: unknown;
    let inactivos: unknown;

    service.obtenerProductos().subscribe((productos) => activos = productos);
    service.obtenerProductosDesactivados().subscribe((productos) => inactivos = productos);

    httpTesting.expectOne(`${apiUrl}/productos`).flush(
      { message: 'No hay productos disponibles.' },
      { status: 404, statusText: 'Not Found' },
    );
    httpTesting.expectOne(`${apiUrl}/productos-desactivados`).flush(
      { message: 'No hay productos desactivados.' },
      { status: 404, statusText: 'Not Found' },
    );

    expect(activos).toEqual([]);
    expect(inactivos).toEqual([]);
  });
});
