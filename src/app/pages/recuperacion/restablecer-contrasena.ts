import { HttpErrorResponse } from '@angular/common/http';
import { Location } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../services/auth';

const contrasenasCoinciden: ValidatorFn = control => {
  const password = control.get('password')?.value;
  const confirmacion = control.get('confirmacion')?.value;
  return password === confirmacion ? null : { noCoinciden: true } satisfies ValidationErrors;
};

const contrasenaValida: ValidatorFn = control => {
  const valor: string = control.value;
  return Array.from(valor).length >= 8 && new TextEncoder().encode(valor).length <= 72 && !valor.includes('\0')
    ? null : { contrasena: true };
};

@Component({
  selector: 'app-restablecer-contrasena',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './restablecer-contrasena.html',
  styleUrls: ['../login/login.css', './recuperacion.css'],
})
export class RestablecerContrasena {
  private readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);
  private readonly location = inject(Location);
  private credenciales = this.obtenerCredenciales();

  readonly enlaceValido = !!this.credenciales;
  readonly cargando = signal(false);
  readonly error = signal('');
  readonly mensaje = signal('');
  readonly formulario = this.fb.nonNullable.group({
    password: ['', [Validators.required, contrasenaValida]],
    confirmacion: ['', Validators.required],
  }, { validators: contrasenasCoinciden });

  restablecer(): void {
    const credenciales = this.credenciales;
    if (this.cargando() || !credenciales) return;
    if (this.formulario.invalid) {
      this.formulario.markAllAsTouched();
      return;
    }

    const { password, confirmacion } = this.formulario.getRawValue();
    this.error.set('');
    this.cargando.set(true);
    this.auth.restablecerContrasena(credenciales.email, credenciales.token, password, confirmacion)
      .pipe(finalize(() => this.cargando.set(false)))
      .subscribe({
        next: respuesta => {
          this.auth.limpiarSesion();
          this.formulario.reset();
          this.credenciales = null;
          this.mensaje.set(respuesta.message);
        },
        error: (error: HttpErrorResponse) => this.error.set(
          error.status === 422 && error.error?.errors?.password
            ? 'La contraseña no es válida. Revisá el largo y la confirmación.'
            : error.status === 422
            ? 'El enlace no es válido o venció. Solicitá uno nuevo.'
            : error.status === 429
              ? 'Realizaste demasiados intentos. Esperá un momento y volvé a intentar.'
              : error.status === 0
                ? 'No se pudo conectar con la API. Intentá nuevamente.'
                : 'No se pudo actualizar la contraseña. Intentá nuevamente.',
        ),
      });
  }

  private obtenerCredenciales(): { email: string; token: string } | null {
    const path = this.location.path(true);
    const indice = path.indexOf('#');
    if (indice < 0) return null;

    const fragmento = path.slice(indice + 1);
    this.location.replaceState('/restablecer-contrasena');
    if (!/^[A-Za-z0-9_-]+$/.test(fragmento)) return null;

    try {
      const base64 = fragmento.replace(/-/g, '+').replace(/_/g, '/');
      const binario = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
      const bytes = Uint8Array.from(binario, caracter => caracter.charCodeAt(0));
      const datos: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
      if (typeof datos !== 'object' || datos === null || !('email' in datos) || !('token' in datos)
        || typeof datos.email !== 'string' || typeof datos.token !== 'string' || !datos.email || !datos.token) {
        return null;
      }
      return { email: datos.email, token: datos.token };
    } catch (error) {
      if (!(error instanceof SyntaxError || error instanceof TypeError || error instanceof DOMException)) throw error;
      return null;
    }
  }
}
