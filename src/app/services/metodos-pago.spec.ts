import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { MetodosPagoService } from './metodos-pago';

describe('MetodosPagoService', () => {
  let service: MetodosPagoService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()],
    });
    service = TestBed.inject(MetodosPagoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
