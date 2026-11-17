import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { UsuariosService } from './usuarios';

describe('UsuariosService', () => {
  let service: UsuariosService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()],
    });
    service = TestBed.inject(UsuariosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
