import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { Usuarios } from './usuarios';
import { Usuario, UsuariosService } from '../../services/usuarios';
import { AuthService } from '../../services/auth';

describe('Usuarios', () => {
  let component: Usuarios;
  let fixture: ComponentFixture<Usuarios>;
  const usuariosServiceMock = {
    obtenerUsuarios: vi.fn(() => of({ usuarios: [] as Usuario[] })),
    obtenerUsuariosDesactivados: vi.fn(() => of({ usuariosDesactivados: [] as Usuario[] })),
    obtenerRoles: () => of({ roles: [] }),
    actualizarUsuario: vi.fn(() => of({ message: 'Usuario actualizado.', user: {} as Usuario })),
    eliminarUsuario: vi.fn(() => of({ message: 'Usuario eliminado.' })),
    restaurarUsuario: vi.fn(() => of({ message: 'Usuario restaurado.' })),
  };
  const authServiceMock = {
    obtenerUsuarioId: vi.fn(() => 9),
    obtenerRol: vi.fn(() => 'Administrador'),
  };

  beforeEach(async () => {
    authServiceMock.obtenerUsuarioId.mockReturnValue(9);
    authServiceMock.obtenerRol.mockReturnValue('Administrador');

    await TestBed.configureTestingModule({
      imports: [Usuarios],
      providers: [
        { provide: UsuariosService, useValue: usuariosServiceMock },
        { provide: AuthService, useValue: authServiceMock },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(Usuarios);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('prevents an administrator from changing a SuperAdmin account role or assigning it to another user', () => {
    const superAdmin: Usuario = {
      id: 20,
      name: 'Super Admin',
      email: 'superadmin@test.com',
      activo: true,
      role_id: 3,
      role: { id: 3, nombre: 'SuperAdmin' },
      telefono: null,
      direccion: null,
    };
    const superAdminRole = { id: 3, nombre: 'SuperAdmin' };

    component.editarUsuario(superAdmin);
    expect(component.rolEditadoDeshabilitado()).toBe(true);

    component.editarUsuario({ ...superAdmin, role: { id: 2, nombre: 'Cocinero' }, role_id: 2 });
    expect(component.rolEditadoDeshabilitado()).toBe(false);
    expect(component.opcionRolDeshabilitada(superAdminRole)).toBe(true);

    authServiceMock.obtenerRol.mockReturnValue('SuperAdmin');
    component.editarUsuario(superAdmin);
    expect(component.rolEditadoDeshabilitado()).toBe(false);
    expect(component.opcionRolDeshabilitada(superAdminRole)).toBe(false);
  });

  it('disables role changes on other Administrator accounts for an Administrator, but permits SuperAdmin', () => {
    const administrator: Usuario = {
      id: 20,
      name: 'Otro Administrador',
      email: 'admin2@test.com',
      activo: true,
      role_id: 1,
      role: { id: 1, nombre: 'Administrador' },
      telefono: null,
      direccion: null,
    };

    component.editarUsuario(administrator);
    expect(component.rolEditadoDeshabilitado()).toBe(true);

    authServiceMock.obtenerRol.mockReturnValue('SuperAdmin');
    component.editarUsuario(administrator);
    expect(component.rolEditadoDeshabilitado()).toBe(false);
  });

  it('disables SuperAdmin actions for Administrators and enables them for SuperAdmins', async () => {
    fixture.detectChanges();
    component.usuarios.set([
      {
        id: 20,
        name: 'Super Admin',
        email: 'superadmin@test.com',
        activo: true,
        role_id: 3,
        role: { id: 3, nombre: 'SuperAdmin' },
        telefono: null,
        direccion: null,
      },
    ]);
    fixture.detectChanges();

    const editButton: HTMLButtonElement = fixture.nativeElement.querySelector('.btn-editar-usuario');
    const deactivateButton: HTMLButtonElement = fixture.nativeElement.querySelector('.btn-desactivar-usuario');

    expect(editButton.disabled).toBe(true);
    expect(editButton.classList.contains('btn-editar-usuario')).toBe(true);
    expect(deactivateButton.disabled).toBe(true);
    expect(deactivateButton.classList.contains('btn-desactivar-usuario')).toBe(true);

    fixture.destroy();
    authServiceMock.obtenerRol.mockReturnValue('SuperAdmin');
    fixture = TestBed.createComponent(Usuarios);
    component = fixture.componentInstance;
    await fixture.whenStable();
    component.usuarios.set([
      {
        id: 20,
        name: 'Super Admin',
        email: 'superadmin@test.com',
        activo: true,
        role_id: 3,
        role: { id: 3, nombre: 'SuperAdmin' },
        telefono: null,
        direccion: null,
      },
    ]);
    fixture.detectChanges();

    const superAdminEditButton: HTMLButtonElement = fixture.nativeElement.querySelector('.btn-editar-usuario');
    const superAdminDeactivateButton: HTMLButtonElement = fixture.nativeElement.querySelector('.btn-desactivar-usuario');
    expect(superAdminEditButton.disabled).toBe(false);
    expect(superAdminDeactivateButton.disabled).toBe(false);
  });

  it('shows the backend reason when a user with active assigned orders cannot be deactivated', () => {
    const user: Usuario = {
      id: 12,
      name: 'Cocinero Activo',
      email: 'cocinero@test.com',
      activo: true,
      role_id: 2,
      role: { id: 2, nombre: 'Cocinero' },
      telefono: null,
      direccion: null,
    };
    const motivo = 'No se puede desactivar al usuario porque tiene pedidos activos asignados. Completa esos pedidos antes de continuar. ';
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    usuariosServiceMock.eliminarUsuario.mockReturnValue(
      throwError(() => ({ status: 409, error: { message: motivo } }))
    );

    component.eliminarUsuario(user);

    expect(component.error()).toBe(motivo);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('limpia la lista de desactivados si restaurar deja esa lista vacía', () => {
    const usuario: Usuario = {
      id: 2,
      name: 'Usuario 2',
      email: 'usuario2@test.com',
      activo: true,
      role_id: 1,
      telefono: null,
      direccion: null,
    };
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    usuariosServiceMock.restaurarUsuario.mockReturnValue(of({ message: 'Usuario restaurado.' }));
    usuariosServiceMock.obtenerUsuarios.mockReturnValue(of({ usuarios: [usuario] }));
    usuariosServiceMock.obtenerUsuariosDesactivados.mockReturnValue(
      throwError(() => ({ status: 404 }))
    );
    component.usuariosDesactivados.set([usuario]);

    component.restaurarUsuario(usuario);

    expect(component.usuarios()).toEqual([usuario]);
    expect(component.usuariosDesactivados()).toEqual([]);
  });

  it('filters active and inactive users by selected roles and clears the filters', () => {
    const usuarios: Usuario[] = [
      { id: 1, name: 'Usuario 1', email: 'usuario1@test.com', activo: true, role_id: 1, role: { id: 1, nombre: 'Administrador' }, telefono: null, direccion: null },
      { id: 2, name: 'Usuario 2', email: 'usuario2@test.com', activo: true, role_id: 2, role: { id: 2, nombre: 'Cocinero' }, telefono: null, direccion: null },
      { id: 3, name: 'Usuario 3', email: 'usuario3@test.com', activo: true, role_id: 3, role: { id: 3, nombre: 'Repartidor' }, telefono: null, direccion: null },
    ];
    component.usuarios.set(usuarios);
    component.usuariosDesactivados.set(usuarios);

    expect(component.cantidadUsuariosPorRol().get(1)).toBe(2);
    expect(component.cantidadUsuariosPorRol().get(2)).toBe(2);
    expect(component.cantidadUsuariosPorRol().get(3)).toBe(2);

    component.actualizarFiltroRol(1, true);
    component.actualizarFiltroRol(2, true);

    expect(component.usuariosFiltrados().map((usuario) => usuario.id)).toEqual([1, 2]);
    expect(component.usuariosDesactivadosFiltrados().map((usuario) => usuario.id)).toEqual([1, 2]);

    component.limpiarFiltrosRoles();

    expect(component.usuariosFiltrados().map((usuario) => usuario.id)).toEqual([1, 2, 3]);
  });

  it('permite editar un usuario sin teléfono ni dirección omitiendo campos vacíos', () => {
    const usuarioSinContacto: Usuario = {
      id: 9,
      name: 'Usuario Completo',
      email: 'completo@test.com',
      activo: true,
      role_id: 2,
      telefono: null,
      direccion: null,
    };

    component.editarUsuario(usuarioSinContacto);
    component.roleId = 1;
    component.guardarUsuario();

    expect(component.errorGuardar()).toBe('');
    expect(usuariosServiceMock.actualizarUsuario).toHaveBeenCalledWith(9, {
      name: 'Usuario Completo',
      email: 'completo@test.com',
    });
  });
});
