import { Component, AfterViewInit, ElementRef, NgZone, viewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../services/auth';
import { googleClientId } from '../../config/api';

@Component({
  imports: [FormsModule],
  selector: 'app-login',
  standalone: true,
  styleUrl: './login.css',
  templateUrl: './login.html',
})

export class Login implements AfterViewInit {
  email = '';
  password = '';
  cargando = false;
  error = '';
  mensaje = '';

  // Referencia al <div #googleBtn> del HTML
  googleBtn = viewChild<ElementRef<HTMLDivElement>>('googleBtn');

  constructor(
    private authService: AuthService,
    private router: Router,
    private zone: NgZone
  ) { }

  // LogIn con Google
  async ngAfterViewInit(): Promise<void> {
    try {
      await this.authService.cargarScriptGoogle();
    } catch {
      this.error = 'No se pudo cargar el inicio de sesión con Google.';
      return;
    }

    const contenedor = this.googleBtn()?.nativeElement;

    if(!contenedor) return;

    google.accounts.id.initialize({
      client_id: googleClientId,
      callback: (respuesta) =>
        // El callback de Google corre fuera de Angular, hay que volver a la zona
        this.zone.run(() => this.iniciarSesionConGoogle(respuesta.credential)),
    });

    google.accounts.id.renderButton(contenedor, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      width: 400, // max permitido por Google
      locale: 'es',
    });
  }

  private iniciarSesionConGoogle(idToken: string): void {
    this.error = '';
    this.mensaje = '';
    this.cargando = true;

    this.authService.loginConGoogle(idToken).subscribe({
      next: (respuesta) => {
        this.cargando = false;
        this.mensaje = respuesta.message;
        this.router.navigate(['/categorias']);
      },
      error: (err: HttpErrorResponse) => {
        this.cargando = false;

        if (err.status === 0) {
          this.error = 'No se pudo conectar con la API de Laravel.';
        } else {
          // Muestra el mensaje del backend
          this.error = err.error?.message || 'No se pudo iniciar sesión con Google.';
        }
      }
    });
  }

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
