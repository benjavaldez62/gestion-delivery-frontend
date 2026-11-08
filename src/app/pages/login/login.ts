import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth';

@Component({
  imports: [FormsModule],
  selector: 'app-login',
  standalone: true,
  styleUrl: './login.css',
  templateUrl: './login.html',
})

export class Login {
  email = '';
  password = '';
  cargando = false;
  error = '';
  mensaje = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  iniciarSesion(): void {
    this.error = '';
    this.mensaje = '';

    // Validacion y manejo de error cuando es inválido
    if (!this.email.trim() || !this.password) {
      this.error = 'Ingresá tu correo y contraseña.';
      return;
    }

    this.cargando = true;
    this.authService.login({
      email: this.email.trim(),
      password: this.password

    }).subscribe({
      next: (respuesta) => {
        this.cargando = false;
        this.mensaje = respuesta.message;
        this.router.navigate(['/categorias']);
      },
      error: (err: HttpErrorResponse) => {
        this.cargando = false;

        if (err.status === 401) {
          this.error = 'El correo o la contraseña son incorrectos.';
        } else if (err.status === 422) {
          this.error = 'Revisá los datos ingresados.';
        } else if (err.status === 0) {
          this.error = 'No se pudo conectar con la API de Laravel.';
        } else {
          this.error = err.error?.message || 'Ocurrió un error al iniciar sesión.';
        }
      }
    });
  }
}
