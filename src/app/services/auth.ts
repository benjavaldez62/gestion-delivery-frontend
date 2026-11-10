import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { apiUrl, googleClientId } from '../config/api';

export interface Usuario {
    id: number;
    name: string;
    email: string;
    role: {
        id: number;
        nombre: string;
    } | null;
}

export interface LoginResponse {
    success: boolean;
    message: string;
    data: {
        access_token: string;
        token_type: string;
        user: Usuario;
    };
}

export interface Credenciales {
    email: string;
    password: string;
}

export interface PasswordResponse {
    message: string;
}

@Injectable({
    providedIn: 'root'
})

export class AuthService {
    private googleScript?: Promise<void>;
    private readonly token = signal<string | null>(localStorage.getItem('token'));
    private readonly rolUsuario = signal<string | null>(localStorage.getItem('rol_usuario'));

    constructor(private http: HttpClient) { }
    
    // Iniciar sesión
    login(credenciales: Credenciales): Observable<LoginResponse> {
        return this.http
            .post<LoginResponse>(
                `${apiUrl}/login`,
                credenciales
            )
            .pipe(
                tap(respuesta => {
                    this.guardarSesion(respuesta.data.access_token, respuesta.data.user);
                })
            );
    }

    // Iniciar sesión con Google
    loginConGoogle(idToken:string): Observable<LoginResponse> {
        return this.http
            .post<LoginResponse>(
                `${apiUrl}/auth/google`,
                { idToken }
            )
            .pipe(
                tap(respuesta => {
                    this.guardarSesion(respuesta.data.access_token, respuesta.data.user);
                })
            );
    }

    solicitarRecuperacion(email: string): Observable<PasswordResponse> {
        return this.http.post<PasswordResponse>(`${apiUrl}/forgot-password`, { email });
    }

    restablecerContrasena(email: string, token: string, password: string, passwordConfirmation: string): Observable<PasswordResponse> {
        return this.http.post<PasswordResponse>(`${apiUrl}/reset-password`, {
            email,
            token,
            password,
            password_confirmation: passwordConfirmation,
        });
    }

    // Cargamos el script de Google Identity Services
    cargarScriptGoogle(): Promise<void> {
        if(this.googleScript) 
        {
            return this.googleScript;
        }

        this.googleScript = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            script.onload = () => resolve();
            script.onerror = () => {

                // En caso de falla, permitimos la opcion de 'Reintentar'
                this.googleScript = undefined;
                reject(new Error('No se pudo cargar Google Identity Services'));
            };
            document.head.appendChild(script);
        });
        return this.googleScript;
    }
    
    // Obtener el token guardado
    obtenerToken(): string | null {
        return this.token();
    }

    // Comprobar si existe un token
    estaAutenticado(): boolean {
        return !!this.obtenerToken();
    }

    obtenerRol(): string | null {
        return this.rolUsuario();
    }

    rutaInicial(): string {
        const rol = this.obtenerRol()?.trim().toLocaleLowerCase();

        if (rol === 'administrador' || rol === 'superadmin') {
            return '/pedidos';
        }
        if (rol === 'cocinero') {
            return '/cocina';
        }
        if (rol === 'repartidor') {
            return '/repartos';
        }
        return '/categorias';
    }

    // Cerrar sesión - LogOut
    logout(): Observable<{ success: boolean; message: string }> 
    {
        return this.http.post<{ success: boolean; message: string }>(`${apiUrl}/logout`, {});
    }

    // limpiamos la sesión - revocamos token
    limpiarSesion(): void {
        localStorage.removeItem('token');
        localStorage.removeItem('rol_usuario');
        this.token.set(null);
        this.rolUsuario.set(null);
    }

    private guardarSesion(token: string, usuario: Usuario): void {
        localStorage.setItem('token', token);
        this.token.set(token);
        if (usuario.role?.nombre) {
            localStorage.setItem('rol_usuario', usuario.role.nombre);
            this.rolUsuario.set(usuario.role.nombre);
        } else {
            localStorage.removeItem('rol_usuario');
            this.rolUsuario.set(null);
        }
    }
}
