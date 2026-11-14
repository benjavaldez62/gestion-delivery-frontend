import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Usuarios } from './usuarios';
import { Usuario, UsuariosService } from '../../services/usuarios';

describe('Usuarios', () => {
  let component: Usuarios;
  let fixture: ComponentFixture<Usuarios>;
  const usuariosServiceMock = {
    obtenerUsuarios: () => of({ usuarios: [] }),
    obtenerUsuariosDesactivados: () => of({ usuariosDesactivados: [] }),
    obtenerRoles: () => of({ roles: [] }),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Usuarios],
      providers: [{ provide: UsuariosService, useValue: usuariosServiceMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(Usuarios);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
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
});
