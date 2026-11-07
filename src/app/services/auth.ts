import { HttpClient, HttpHeaders } from '@angular/common/http';
import { computed, inject, Injectable, signal } from '@angular/core';
import { Observable } from 'rxjs';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://127.0.0.1:8000/api';
  private readonly tokenStorageKey = 'auth_token';
  private readonly userStorageKey = 'auth_user';
  private readonly tokenSignal = signal<string | null>(this.readToken());
  private readonly userSignal = signal<AuthUser | null>(this.readUser());

  readonly token = this.tokenSignal.asReadonly();
  readonly user = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => this.tokenSignal() !== null);

  logout(): Observable<void> {
    const token = this.tokenSignal();
    const options = token
      ? { headers: new HttpHeaders({ Authorization: `Bearer ${token}` }) }
      : {};

    this.clearSession();
    return this.http.post<void>(`${this.apiUrl}/logout`, {}, options);
  }

  private clearSession(): void {
    this.tokenSignal.set(null);
    this.userSignal.set(null);

    if (typeof window === 'undefined') {
      return;
    }

    try {
      window.localStorage.removeItem(this.tokenStorageKey);
      window.localStorage.removeItem(this.userStorageKey);
    } catch (error) {
      console.error('No se pudieron eliminar las credenciales locales:', error);
    }
  }

  private readToken(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      return window.localStorage.getItem(this.tokenStorageKey);
    } catch (error) {
      console.error('No se pudo leer el token local:', error);
      return null;
    }
  }

  private readUser(): AuthUser | null {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const user = window.localStorage.getItem(this.userStorageKey);
      return user ? JSON.parse(user) as AuthUser : null;
    } catch (error) {
      console.error('No se pudo leer el usuario local:', error);
      return null;
    }
  }
}
