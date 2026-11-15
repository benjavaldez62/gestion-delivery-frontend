import { TestBed } from '@angular/core/testing';
import { MetodosPago } from './metodos-pago';

describe('MetodosPago', () => {
  let service: MetodosPago;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MetodosPago);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
