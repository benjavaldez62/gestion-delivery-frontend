import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { CategoriasService } from './categorias';

describe('CategoriasService', () => {
  let service: CategoriasService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()]
    });
    service = TestBed.inject(CategoriasService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
