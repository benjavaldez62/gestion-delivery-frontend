import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { UsuariosService, Usuario } from '../../services/usuarios';
import { subscribeOn } from 'rxjs';

@Component({
  imports: [FormsModule],
  selector: 'app-usuarios',
  styleUrl: './usuarios.css',
  templateUrl: './usuarios.html',
})

export class Usuarios implements OnInit {

  private usuariosService = inject(UsuariosService)

  usuarios = signal<Usuario[]>([]);
  usuariosDesactivados = signal<Usuario[]>([]);

  cargando = signal(true);
  error = signal('');

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.cargando.set(true);

    // 1. cargamos usuarios activos
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

    // 2. cargamos usuarios desactivados
    this.usuariosService.obtenerUsuariosDesactivados().subscribe({
      next: (respuesta) => {
        this.usuariosDesactivados.set(respuesta.usuariosDesactivados);
        this.cargando.set(false);
      },
      error: (err) => {
        console.error('Error al obtener usuarios desactivados:', err);
      }
    })
  }

}
