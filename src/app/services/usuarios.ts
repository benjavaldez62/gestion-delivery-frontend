import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin } from 'rxjs';
import { map } from 'rxjs/operators';
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
    role_id: number;
    role?: Rol;
    deleted_at?: string | null;

    // datos extras para el /me
    telefono: number | null;
    direccion: string | null;
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
    usuario: Usuario;
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
}
