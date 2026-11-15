import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { vi } from 'vitest';
import { apiUrl } from '../../config/api';
import { Roles } from './roles';

describe('Roles', () => {
  let component: Roles;
  let fixture: ComponentFixture<Roles>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Roles],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Roles);
    component = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    vi.restoreAllMocks();
  });

  it('should create', () => {
    fixture.detectChanges();
    http.expectOne(`${apiUrl}/roles`).flush({ message: 'OK', roles: [] });
    http.expectOne(`${apiUrl}/roles-desactivados`).flush({ message: 'OK', rolesDesactivados: [] });

    expect(component).toBeTruthy();
  });

  it('removes a restored role from the deactivated list when that endpoint returns 404', () => {
    const role = { id: 4, nombre: 'Cajero' };
    fixture.detectChanges();

    http.expectOne(`${apiUrl}/roles`).flush({ message: 'OK', roles: [] });
    http.expectOne(`${apiUrl}/roles-desactivados`).flush({
      message: 'OK',
      rolesDesactivados: [role],
    });

    vi.spyOn(window, 'confirm').mockReturnValue(true);
    component.restaurarRole(role);

    http.expectOne({
      method: 'PUT',
      url: `${apiUrl}/roles/${role.id}/restore`,
    }).flush({ message: 'Rol restaurado correctamente.' });

    http.expectOne(`${apiUrl}/roles`).flush({ message: 'OK', roles: [role] });
    http.expectOne(`${apiUrl}/roles-desactivados`).flush(
      { message: 'No hay roles desactivados.' },
      { status: 404, statusText: 'Not Found' }
    );

    expect(component.roles()).toEqual([role]);
    expect(component.rolesDesactivados()).toEqual([]);
  });
});
