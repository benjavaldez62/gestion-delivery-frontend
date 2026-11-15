import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { apiUrl } from '../config/api';
import { NuevoRole, RolesService } from './roles';

describe('RolesService', () => {
  let service: RolesService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(RolesService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('sends role create and update requests to the matching endpoints', () => {
    const datos: NuevoRole = { nombre: 'Cajero' };

    service.crearRole(datos).subscribe();
    const createRequest = http.expectOne(`${apiUrl}/roles`);
    expect(createRequest.request.method).toBe('POST');
    expect(createRequest.request.body).toEqual(datos);
    createRequest.flush({
      message: 'Rol creado correctamente.',
      rol: { id: 4, nombre: datos.nombre },
    });

    service.actualizarRole(4, datos).subscribe();
    const updateRequest = http.expectOne(`${apiUrl}/roles/4`);
    expect(updateRequest.request.method).toBe('PUT');
    expect(updateRequest.request.body).toEqual(datos);
    updateRequest.flush({ message: 'Rol actualizado correctamente.' });
  });

  it('sends role delete and restore requests to the matching endpoints', () => {
    service.eliminarRole(4).subscribe();
    const deleteRequest = http.expectOne(`${apiUrl}/roles/4`);
    expect(deleteRequest.request.method).toBe('DELETE');
    deleteRequest.flush({ message: 'Rol eliminado correctamente.' });

    service.restaurarRole(4).subscribe();
    const restoreRequest = http.expectOne(`${apiUrl}/roles/4/restore`);
    expect(restoreRequest.request.method).toBe('PUT');
    expect(restoreRequest.request.body).toEqual({});
    restoreRequest.flush({ message: 'Rol restaurado correctamente.' });
  });
});
