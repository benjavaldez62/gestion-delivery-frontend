import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../config/api';


// Interfaz para los roles que vienen por API
export interface Rol {
    id: number;
    nombre: string;
}

export interface Usuario {
    id: number;
    name: string;
    email: string;
    activo: boolean;
    role_id?: number;
    role?: Rol;
    deleted_at?: string | null;

    telefono: string | null;
    direccion: string | null;
}

export interface nuevoUsuario {
    name: string;
    email: string;
    password: string;
    role_id: number;
    activo: true;
}

export interface UsuarioActualizado {
    name?: string;
    email: string;
    password?: string;
    role_id: number;
    telefono?: string;
    direccion?: string;
}

interface RespuestaUsuarios {
    message: string;
    usuarios: Usuario[];
}

interface RespuestaUsuariosDesactivados {
    message: string;
    usuariosDesactivados: Usuario[];
}

interface RespuestaUsuario {
    message: string;
    user: Usuario;
}

interface RespuestaRoles {
    message?: string;
    roles: Rol[];
}

@Injectable({ providedIn: 'root' })

export class UsuariosService {
    private http = inject(HttpClient);
    private apiUrl = `${apiUrl}/users`;

    // Listado de usuarios activos
    obtenerUsuarios(): Observable<RespuestaUsuarios> {
        return this.http.get<RespuestaUsuarios>(this.apiUrl);
    }

    // Listado de usuarios desactivados
    obtenerUsuariosDesactivados(): Observable<RespuestaUsuariosDesactivados> {
        return this.http.get<RespuestaUsuariosDesactivados>(`${this.apiUrl}-desactivados`)
    }

    obtenerRoles(): Observable<RespuestaRoles> {
        return this.http.get<RespuestaRoles>(`${apiUrl}/roles`);
    }

    // ABM Usuarios
    crearUsuario(datos: nuevoUsuario): Observable<RespuestaUsuario> {
        return this.http.post<RespuestaUsuario>(this.apiUrl, datos);
    }

    actualizarUsuario(id: number, datos: UsuarioActualizado): Observable<RespuestaUsuario> {
        return this.http.put<RespuestaUsuario>(`${this.apiUrl}/${id}`, datos);
    }

    eliminarUsuario(id: number): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
    }

    restaurarUsuario(id: number): Observable<{ message: string }> {
        return this.http.put<{ message: string }>(`${this.apiUrl}/${id}/restore`, {});
    }
}
