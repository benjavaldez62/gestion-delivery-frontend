import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-recuperar-contrasena',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './recuperar-contrasena.html',
  styleUrls: ['../login/login.css', './recuperacion.css'],
})
export class RecuperarContrasena {
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  readonly formulario = this.fb.nonNullable.group({
    correo: ['', [Validators.required, Validators.email, Validators.maxLength(255)]],
  });
  readonly correo = this.formulario.controls.correo;
  readonly cargando = signal(false);
  readonly error = signal('');
  readonly mensaje = signal('');

  solicitar(): void {
    if (this.cargando()) return;
    if (this.correo.invalid) {
      this.correo.markAsTouched();
      return;
    }

    this.error.set('');
    this.mensaje.set('');
    this.cargando.set(true);
    this.auth.solicitarRecuperacion(this.correo.value.trim())
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: respuesta => this.mensaje.set(respuesta.message),
        error: (error: HttpErrorResponse) => this.error.set(
          error.status === 429
            ? 'Realizaste demasiados intentos. Esperá un momento y volvé a intentar.'
            : error.status === 0
              ? 'No se pudo conectar con la API. Intentá nuevamente.'
              : 'No se pudo procesar la solicitud. Intentá nuevamente.',
        ),
      });
  }
}
