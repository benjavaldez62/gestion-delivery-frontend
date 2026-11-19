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
    restaurarUsuario: vi.fn(() => of({ message: 'Usuario restaurado.' })),
  };
  const authServiceMock = {
    obtenerUsuarioId: vi.fn(() => 9),
  };

  beforeEach(async () => {
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
