import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { vi } from 'vitest';
import { apiUrl } from '../../config/api';
import { MetodoPago } from '../../services/metodos-pago';
import { MetodoPagos } from './metodos-pago';

describe('MetodosPago', () => {
  let component: MetodoPagos;
  let fixture: ComponentFixture<MetodoPagos>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MetodoPagos],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(MetodoPagos);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });

  it('should create', () => {
    fixture.detectChanges();
    http.expectOne(`${apiUrl}/metodos-pago`).flush({ message: 'OK', metodosPago: [] });
    http.expectOne(`${apiUrl}/metodos-pago-desactivados`).flush({
      message: 'OK',
      metodosPagoDesactivados: [],
    });

    expect(component).toBeTruthy();
  });

  it('reloads both lists after updating a payment method', () => {
    fixture.detectChanges();
    http.expectOne(`${apiUrl}/metodos-pago`).flush({ message: 'OK', metodosPago: [] });
    http.expectOne(`${apiUrl}/metodos-pago-desactivados`).flush({
      message: 'OK',
      metodosPagoDesactivados: [],
    });

    component.metodoPagoEditando.set(7);
    component.nombre = 'Transferencia';
    component.descripcion = 'Pago bancario';
    component.guardarMetodoPago();

    http.expectOne({ method: 'PUT', url: `${apiUrl}/metodos-pago/7` }).flush({
      message: 'Método de pago actualizado correctamente.',
      metodoPago: { id: 7, nombre: 'Transferencia', descripcion: 'Pago bancario', activo: true },
    });

    const metodoPago: MetodoPago = {
      id: 7,
      nombre: 'Transferencia',
      descripcion: 'Pago bancario',
      activo: true,
    };
    http.expectOne(`${apiUrl}/metodos-pago`).flush({ message: 'OK', metodosPago: [metodoPago] });
    http.expectOne(`${apiUrl}/metodos-pago-desactivados`).flush({
      message: 'OK',
      metodosPagoDesactivados: [],
    });

    expect(component.metodosPago()).toEqual([metodoPago]);
  });

  it('clears the deactivated list after restoring its last payment method', () => {
    const metodoPago: MetodoPago = {
      id: 7,
      nombre: 'Transferencia',
      descripcion: 'Pago bancario',
      activo: true,
    };
    fixture.detectChanges();
    http.expectOne(`${apiUrl}/metodos-pago`).flush({ message: 'OK', metodosPago: [] });
    http.expectOne(`${apiUrl}/metodos-pago-desactivados`).flush({
      message: 'OK',
      metodosPagoDesactivados: [metodoPago],
    });

    vi.spyOn(window, 'confirm').mockReturnValue(true);
    component.restaurarMetodoPago(metodoPago);
    http.expectOne({
      method: 'PUT',
      url: `${apiUrl}/metodos-pago/7/restore`,
    }).flush({ message: 'Método de pago restaurado correctamente.' });

    http.expectOne(`${apiUrl}/metodos-pago`).flush({ message: 'OK', metodosPago: [metodoPago] });
    http.expectOne(`${apiUrl}/metodos-pago-desactivados`).flush(
      { message: 'No hay métodos de pago desactivados para mostrar.' },
      { status: 404, statusText: 'Not Found' }
    );

    expect(component.metodosPago()).toEqual([metodoPago]);
    expect(component.metodosPagoDesactivados()).toEqual([]);
  });
});
