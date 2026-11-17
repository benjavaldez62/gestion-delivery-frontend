import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, forkJoin, of, throwError } from 'rxjs';
import { NuevoRole, RolesService, Role } from '../../services/roles';

@Component({
  imports: [FormsModule],
  selector: 'app-roles',
  styleUrl: './roles.css',
  templateUrl: './roles.html',
})
export class Roles implements OnInit {
  private rolesService = inject(RolesService);

  roles = signal<Role[]>([]);
  rolesDesactivados = signal<Role[]>([]);
  cargando = signal(true);
  error = signal('');
  mensaje = signal('');
  modalAbierto = signal(false);
  roleEditando = signal<number | null>(null);
  guardando = signal(false);
  errorGuardar = signal('');

  nombre = '';

  ngOnInit(): void {
    this.cargarRoles();
  }

  abrirModal(): void {
    this.roleEditando.set(null);
    this.nombre = '';
    this.error.set('');
    this.errorGuardar.set('');
    this.mensaje.set('');
    this.modalAbierto.set(true);
  }

  editarRole(role: Role): void {
    this.roleEditando.set(role.id);
    this.nombre = role.nombre;
    this.error.set('');
    this.errorGuardar.set('');
    this.mensaje.set('');
    this.modalAbierto.set(true);
  }

  cerrarModal(): void {
    if (this.guardando()) {
      return;
    }

    this.modalAbierto.set(false);
    this.roleEditando.set(null);
  }

  cargarRoles(): void {
    this.cargando.set(true);
    this.error.set('');

    forkJoin({
      activos: this.rolesService.obtenerRoles().pipe(
        catchError((err) => {
          if (err.status === 404) {
            return of({ message: 'No hay roles disponibles.', roles: [] as Role[] });
          }

          return throwError(() => err);
        })
      ),
      desactivados: this.rolesService.obtenerRolesDesactivados().pipe(
        catchError((err) => {
          if (err.status === 404) {
            return of({ message: 'No hay roles desactivados.', rolesDesactivados: [] as Role[] });
          }

          return throwError(() => err);
        })
      ),
    }).subscribe({
      next: ({ activos, desactivados }) => {
        this.roles.set(activos.roles);
        this.rolesDesactivados.set(desactivados.rolesDesactivados);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al cargar roles:', err);
        this.error.set('No se pudieron cargar los roles.');
        this.cargando.set(false);
      },
    });
  }

  guardarRole(): void {
    this.mensaje.set('');
    this.error.set('');
    this.errorGuardar.set('');

    const datos: NuevoRole = {
      nombre: this.nombre.trim(),
    };

    if (datos.nombre.length === 0) {
      this.errorGuardar.set('El nombre del rol es obligatorio.');
      return;
    }

    if (datos.nombre.length > 30) {
      this.errorGuardar.set('El nombre del rol no debe superar los 30 caracteres.');
      return;
    }

    this.guardando.set(true);

    const id = this.roleEditando();
    const solicitud =
      id === null
        ? this.rolesService.crearRole(datos)
        : this.rolesService.actualizarRole(id, datos);

    solicitud.subscribe({
      next: (respuesta) => {
        this.mensaje.set(respuesta.message);
        this.nombre = '';
        this.guardando.set(false);
        this.modalAbierto.set(false);
        this.roleEditando.set(null);
        this.cargarRoles();
      },
      error: (err) => {
        console.error('Error al guardar el rol:', err);

        if (err.status === 422) {
          this.errorGuardar.set(
            err.error?.errors?.nombre?.[0] ??
            err.error?.message ??
            'Revisá los datos ingresados.'
          );
        } else {
          this.errorGuardar.set(err.error?.message ?? 'No se pudo guardar el rol.');
        }

        this.guardando.set(false);
      },
    });
  }

  // eliminar
  eliminarRole(role: Role): void {
    const confirmar = confirm(`¿Estás seguro que quieres eliminar el rol "${role.nombre}"?`);

    // caso 'Cancelar'
    if (!confirmar) { return; }

    // Caso 'Eliminar'
    this.error.set('');
    this.mensaje.set('');
    this.rolesService.eliminarRole(role.id).subscribe({
      next: (respuesta) => {
        this.mensaje.set(respuesta.message);
        this.cargarRoles();
      },
      error: (err) => {
        console.error('Error al eliminar el rol:', err);

        this.error.set(err.error?.message ?? 'No se pudo eliminar el rol.');
      }
    })
  }

  // restaurar
  restaurarRole(role: Role): void {
    const confirmar = confirm(`¿Querés restaurar el rol "${role.nombre}"?`);

    // caso 'Cancelar'
    if (!confirmar) {
      return;
    }

    // caso 'Restaurar'
    this.error.set('');
    this.mensaje.set('');
    this.rolesService.restaurarRole(role.id).subscribe({
      next: (respuesta) => {
        this.mensaje.set(respuesta.message);
        this.cargarRoles();
      },
      error: (err) => {
        console.error('Error al restaurar el rol:', err);
        this.error.set(err.error?.message ?? 'No se pudo restaurar el rol.');
      }
    });
  }

}

