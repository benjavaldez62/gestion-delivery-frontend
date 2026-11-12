import { Component, AfterViewInit, ElementRef, NgZone, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { finalize } from 'rxjs';
import { AuthService } from '../../services/auth';
import { googleClientId } from '../../config/api';

@Component({
  imports: [FormsModule, RouterLink],
  selector: 'app-login',
  standalone: true,
  styleUrl: './login.css',
  templateUrl: './login.html',
})

export class Login implements AfterViewInit {
  email = '';
  password = '';
  readonly cargando = signal(false);
  readonly error = signal('');
  readonly mensaje = signal('');

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
      this.error.set('No se pudo cargar el inicio de sesión con Google.');
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
    if (this.cargando()) return;
    this.error.set('');
    this.mensaje.set('');
    this.cargando.set(true);

    this.authService.loginConGoogle(idToken).pipe(finalize(() => this.cargando.set(false))).subscribe({
      next: (respuesta) => {
        this.mensaje.set(respuesta.message);
        this.router.navigateByUrl(this.authService.rutaInicial());
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 0) {
          this.error.set('No se pudo conectar con la API de Laravel.');
        } else {
          // Muestra el mensaje del backend
          this.error.set(err.error?.message || 'No se pudo iniciar sesión con Google.');
        }
      }
    });
  }

  iniciarSesion(): void {
    if (this.cargando()) return;
    this.error.set('');
    this.mensaje.set('');

    // Validacion y manejo de error cuando es inválido
    if (!this.email.trim() || !this.password) {
      this.error.set('Ingresá tu correo y contraseña.');
      return;
    }

    this.cargando.set(true);
    this.authService.login({
      email: this.email.trim(),
      password: this.password
    }).pipe(finalize(() => this.cargando.set(false))).subscribe({
      next: (respuesta) => {
        this.mensaje.set(respuesta.message);
        this.router.navigateByUrl(this.authService.rutaInicial());
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 401) {
          this.error.set('El correo o la contraseña son incorrectos.');
        } else if (err.status === 422) {
          this.error.set('Revisá los datos ingresados.');
        } else if (err.status === 0) {
          this.error.set('No se pudo conectar con la API de Laravel.');
        } else {
          this.error.set(err.error?.message || 'Ocurrió un error al iniciar sesión.');
        }
      }
    });
  }
}
