import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../services/auth';

@Component({
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  selector: 'app-perfil',
  standalone: true,
  templateUrl: './perfil.html',
})
export class Perfil implements OnInit {
  readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly cargando = signal(true);
  readonly guardando = signal(false);
  readonly error = signal('');
  readonly mensaje = signal('');
  readonly formulario = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(25), Validators.pattern(/\S/)]],
    email: ['', [Validators.required, Validators.email, Validators.pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/), Validators.maxLength(255)]],
    telefono: ['', [Validators.pattern(/^\+?[0-9]{1,25}$/)]],
    direccion: ['', [Validators.maxLength(25), Validators.pattern(/\S/)]],
  });

  filtrarTelefono(event: Event): void {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    const original = input.value;
    const limpiar = (valor: string) => (valor.startsWith('+') ? '+' : '') + valor.replace(/[^0-9]/g, '');
    const telefono = limpiar(original);
    if (original !== telefono) {
      const posicion = limpiar(original.slice(0, input.selectionStart ?? original.length)).length;
      input.value = telefono;
      this.formulario.controls.telefono.setValue(telefono);
      input.setSelectionRange(posicion, posicion);
    }
  }

  ngOnInit(): void {
    this.auth.obtenerPerfil().pipe(finalize(() => this.cargando.set(false))).subscribe({
      next: perfil => this.formulario.patchValue({
        name: perfil.name,
        email: perfil.email,
        telefono: perfil.telefono ?? '',
        direccion: perfil.direccion ?? '',
      }),
      error: (error: unknown) => this.error.set(this.mensajeError(error, 'No se pudo cargar el perfil.')),
    });
  }

  guardar(): void {
    if (this.formulario.invalid || this.guardando()) {
      this.formulario.markAllAsTouched();
      return;
    }

    const valores = this.formulario.getRawValue();
    this.error.set('');
    this.mensaje.set('');
    this.guardando.set(true);
    this.auth.actualizarPerfil({
      name: valores.name.trim(),
      email: valores.email.trim(),
      telefono: valores.telefono.trim() || null,
      direccion: valores.direccion.trim() || null,
    }).pipe(finalize(() => this.guardando.set(false))).subscribe({
      next: respuesta => {
        this.mensaje.set(respuesta.message);
        this.formulario.patchValue({
          name: respuesta.user.name,
          email: respuesta.user.email,
          telefono: respuesta.user.telefono ?? '',
          direccion: respuesta.user.direccion ?? '',
        });
      },
      error: (error: unknown) => this.error.set(this.mensajeError(error, 'No se pudo guardar el perfil.')),
    });
  }

  private mensajeError(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      const errores = error.error?.errors as Record<string, string[]> | undefined;
      const primerError = errores ? Object.values(errores).flat()[0] : null;
      return primerError || error.error?.message || fallback;
    }
    return fallback;
  }
}
