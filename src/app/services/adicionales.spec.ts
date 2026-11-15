import { TestBed } from '@angular/core/testing';
import { Adicionales } from './adicionales';

describe('Adicionales', () => {
  let service: Adicionales;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Adicionales);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
