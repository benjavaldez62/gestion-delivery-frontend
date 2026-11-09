import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { apiUrl, googleClientId } from '../config/api';

export interface Usuario {
    id: number;
    name: string;
    email: string;
    role_id: number;
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

@Injectable({
    providedIn: 'root'
})

export class AuthService {
    private apiUrl = 'http://127.0.0.1:8000/api';
    private googleScript?: Promise<void>;

    constructor(private http: HttpClient) { }
    
    // Iniciar sesión
    login(credenciales: Credenciales): Observable<LoginResponse> {
        return this.http
            .post<LoginResponse>(
                `${this.apiUrl}/login`,
                credenciales
            )
            .pipe(
                tap(respuesta => {
                    localStorage.setItem(
                        'token',
                        respuesta.data.access_token
                    );
                })
            );
    }

    // Iniciar sesión con Google
    loginConGoogle(idToken:string): Observable<LoginResponse> {
        return this.http
            .post<LoginResponse>(
                `${this.apiUrl}/auth/google`,
                { idToken }
            )
            .pipe(
                tap(respuesta => {
                    localStorage.setItem(
                        'token',
                        respuesta.data.access_token
                    );
                })
            );
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
        return localStorage.getItem('token');
    }

    // Comprobar si existe un token
    estaAutenticado(): boolean {
        return !!this.obtenerToken();
    }

    // Cerrar sesión - LogOut
    logout(): Observable<{ success: boolean; message: string }> 
    {
        return this.http.post<{ success: boolean; message: string }>(`${this.apiUrl}/logout`, {});
    }

    // limpiamos la sesión - revocamos token
    limpiarSesion(): void {
        localStorage.removeItem('token');
    }
}
