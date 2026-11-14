import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UsuariosService, Usuario, Rol } from '../../services/usuarios';

@Component({
  imports: [FormsModule],
  selector: 'app-usuarios',
  styleUrl: './usuarios.css',
  templateUrl: './usuarios.html',
})
export class Usuarios implements OnInit {
  private usuariosService = inject(UsuariosService);

  usuarios = signal<Usuario[]>([]);
  usuariosDesactivados = signal<Usuario[]>([]);
  roles = signal<Rol[]>([]);
  rolesSeleccionados = signal<number[]>([]);
  usuariosFiltrados = computed(() => this.filtrarPorRol(this.usuarios()));
  usuariosDesactivadosFiltrados = computed(() => this.filtrarPorRol(this.usuariosDesactivados()));
  cantidadUsuariosPorRol = computed(() => {
    const cantidades = new Map<number, number>();
    const usuarios = [...this.usuarios(), ...this.usuariosDesactivados()];

    for (const usuario of usuarios) {
      const roleId = usuario.role?.id ?? usuario.role_id;
      if (roleId !== undefined) {
        cantidades.set(roleId, (cantidades.get(roleId) ?? 0) + 1);
      }
    }

    return cantidades;
  });

  cargando = signal(true);
  error = signal('');
  errorRoles = signal('');
  errorGuardar = signal('');
  mensaje = signal('');
  guardando = signal(false);
  modalAbierto = signal(false);
  usuarioEditando = signal<number | null>(null);

  name = '';
  email = '';
  password = '';
  roleId: number | null = null;
  telefono = '';
  direccion = '';

  ngOnInit(): void {
    this.cargarUsuarios();
    this.cargarRoles();
  }

  cargarUsuarios(): void {

    // 1. Cargamos usuarios disponibles
    this.usuariosService.obtenerUsuarios().subscribe({
      next: (respuesta) => {
        this.usuarios.set(respuesta.usuarios);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al obtener usuarios:', err);
        this.error.set('No se pudieron cargar los usuarios.');
        this.cargando.set(false);
      }
    });

    // 2. Cargamos usuarios desactivadas
    this.usuariosService.obtenerUsuariosDesactivados().subscribe({
      next: (respuesta) => {
        this.usuariosDesactivados.set(respuesta.usuariosDesactivados);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al obtener usuarios desactivados:', err);
      }
    });
  }

  private cargarRoles(): void {
    this.usuariosService.obtenerRoles().subscribe({
      next: (respuesta) => {
        this.roles.set(respuesta.roles);
        this.errorRoles.set('');
      },
      error: (err) => {
        console.error('Error al obtener roles:', err);
        this.errorRoles.set('No se pudieron cargar los roles.');
        this.error.set('No se pudieron cargar los roles.');
      }
    });
  }

  actualizarFiltroRol(roleId: number, seleccionado: boolean): void {
    this.rolesSeleccionados.update((seleccionados) =>
      seleccionado
        ? (seleccionados.includes(roleId) ? seleccionados : [...seleccionados, roleId])
        : seleccionados.filter((id) => id !== roleId)
    );
  }

  limpiarFiltrosRoles(): void {
    this.rolesSeleccionados.set([]);
  }

  private filtrarPorRol(usuarios: Usuario[]): Usuario[] {
    const rolesSeleccionados = this.rolesSeleccionados();
    if (rolesSeleccionados.length === 0) {
      return usuarios;
    }

    return usuarios.filter((usuario) => {
      const roleId = usuario.role?.id ?? usuario.role_id;
      return roleId !== undefined && rolesSeleccionados.includes(roleId);
    });
  }

  abrirModal(): void {
    this.limpiarFormulario();
    this.usuarioEditando.set(null);
    this.errorGuardar.set('');
    this.mensaje.set('');
    this.modalAbierto.set(true);
  }

  editarUsuario(usuario: Usuario): void {
    this.usuarioEditando.set(usuario.id);
    this.name = usuario.name;
    this.email = usuario.email;
    this.password = '';
    this.roleId = usuario.role?.id ?? usuario.role_id ?? null;
    this.telefono = usuario.telefono ?? '';
    this.direccion = usuario.direccion ?? '';
    this.errorGuardar.set('');
    this.mensaje.set('');
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    if (this.guardando()) {
      return;
    }

    this.modalAbierto.set(false);
    this.usuarioEditando.set(null);
  }

  guardarUsuario(): void {
    this.mensaje.set('');
    this.errorGuardar.set('');

    const id = this.usuarioEditando();
    const name = this.name.trim();
    const email = this.email.trim();
    const telefono = this.telefono.trim();
    const direccion = this.direccion.trim();
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    if (id === null && name.length === 0) {
      this.errorGuardar.set('El nombre es obligatorio.');
      return;
    }
    if (id !== null && name.length < 8) {
      this.errorGuardar.set('El nombre debe tener al menos 8 caracteres.');
      return;
    }
    if (name.length > 150) {
      this.errorGuardar.set('El nombre no debe superar los 150 caracteres.');
      return;
    }
    if (email.length === 0 || !emailValido) {
      this.errorGuardar.set('Ingresá un correo electrónico válido.');
      return;
    }
    if (email.length > 255) {
      this.errorGuardar.set('El email no debe superar los 255 caracteres.');
      return;
    }
    const roleId = this.roleId;
    if (roleId === null) {
      this.errorGuardar.set('Seleccioná un rol.');
      return;
    }

    if (id === null) {
      if (this.password.length < 8) {
        this.errorGuardar.set('La contraseña debe tener al menos 8 caracteres.');
        return;
      }
    } else {
      if (this.password.length > 0 && this.password.length < 8) {
        this.errorGuardar.set('La contraseña debe tener al menos 8 caracteres.');
        return;
      }
      if (telefono.length < 10 || telefono.length > 15) {
        this.errorGuardar.set('El teléfono debe tener entre 10 y 15 caracteres.');
        return;
      }
      if (direccion.length < 5 || direccion.length > 255) {
        this.errorGuardar.set('La dirección debe tener entre 5 y 255 caracteres.');
        return;
      }
    }

    this.guardando.set(true);
    const solicitud = id === null
      ? this.usuariosService.crearUsuario({
        name,
        email,
        password: this.password,
        role_id: roleId,
        activo: true,
      })
      : this.usuariosService.actualizarUsuario(id, {
        name,
        email,
        role_id: roleId,
        telefono,
        direccion,
        ...(this.password.length > 0 ? { password: this.password } : {}),
      });

    solicitud.subscribe({
      next: (respuesta) => {
        this.mensaje.set(respuesta.message);
        this.guardando.set(false);
        this.modalAbierto.set(false);
        this.usuarioEditando.set(null);
        this.limpiarFormulario();
        this.cargarUsuarios();
      },
      error: (err) => {
        console.error('Error al guardar usuario:', err);
        if (err.status === 422) {
          this.errorGuardar.set(
            err.error?.errors?.name?.[0] ??
            err.error?.errors?.email?.[0] ??
            err.error?.errors?.password?.[0] ??
            err.error?.errors?.role_id?.[0] ??
            err.error?.errors?.telefono?.[0] ??
            err.error?.errors?.direccion?.[0] ??
            err.error?.error ??
            err.error?.message ??
            'Revisá los datos ingresados.'
          );
        } else {
          this.errorGuardar.set('No se pudo guardar el usuario. Verificá la conexión con Laravel.');
        }
        this.guardando.set(false);
      }
    });
  }

  // Eliminar usuario
  eliminarUsuario(usuario: Usuario): void {
    const confirmar = confirm(`¿Estás seguro que querés eliminar al usuario "${usuario.name}"?`);

    // Caso 'Cancelar'
    if (!confirmar) {
      return;
    }

    // Caso 'Aceptar'
    this.error.set('');
    this.mensaje.set('');
    this.usuariosService.eliminarUsuario(usuario.id).subscribe({
      next: (respuesta) => {
        this.mensaje.set(respuesta.message);
        this.cargarUsuarios();
      },
      error: (err) => {
        console.error('Error al eliminar el usuario:', err);
        this.error.set(err.error?.message ?? 'No se pudo eliminar el usuario.');
      }
    });
  }

  // Restaurar usuario
  restaurarUsuario(usuario: Usuario): void {
    const confirmar = confirm(`¿Querés restaurar al usuario "${usuario.name}"?`);

    // Caso 'Cancelar'
    if (!confirmar) {
      return;
    }

    // Caso 'Restaurar'
    this.usuariosService.restaurarUsuario(usuario.id).subscribe({
      next: (respuesta) => {
        this.mensaje.set(respuesta.message);

        // Actualizar listas de usuarios (activos y desactivados )
        this.cargarUsuarios();
      },
      error: (err) => {
        this.error.set(err.error?.message ?? 'No se pudo restaurar el usuario.');
      }
    });
  }

  private limpiarFormulario(): void {
    this.name = '';
    this.email = '';
    this.password = '';
    this.roleId = null;
    this.telefono = '';
    this.direccion = '';
  }
}
