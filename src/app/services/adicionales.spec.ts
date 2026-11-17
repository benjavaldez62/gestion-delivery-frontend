import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { AdicionalesService } from './adicionales';

describe('AdicionalesService', () => {
  let service: AdicionalesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()],
    });
    service = TestBed.inject(AdicionalesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
