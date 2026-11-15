import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { apiUrl } from '../config/api';

export interface Role {
    id: number;
    nombre: string;
}

export interface NuevoRole {
    nombre: string;
}

interface RespuestaRole {
    message: string;
    rol: Role;
}

interface RespuestaRoles {
    message: string;
    roles: Role[];
}

interface RespuestaRolesDesactivados {
    message: string;
    rolesDesactivados: Role[];
}

@Injectable({ providedIn: 'root' })

export class RolesService {
    private http = inject(HttpClient);
    private apiUrl = `${apiUrl}/roles`;

    obtenerRoles(): Observable<RespuestaRoles> {
        return this.http.get<RespuestaRoles>(this.apiUrl);
    }

    obtenerRolesDesactivados(): Observable<RespuestaRolesDesactivados> {
        return this.http.get<RespuestaRolesDesactivados>(`${apiUrl}/roles-desactivados`);
    }

    // ABM Roles
    crearRole(datos: NuevoRole): Observable<RespuestaRole> {
        return this.http.post<RespuestaRole>(this.apiUrl, datos);
    }

    actualizarRole(id: number, datos: NuevoRole): Observable<{ message: string }> {
        return this.http.put<{ message: string }>(`${this.apiUrl}/${id}`, datos);
    }

    eliminarRole(id: number): Observable<{ message: string }> {
        return this.http.delete<{ message:string }>(`${this.apiUrl}/${id}`);
    }

    restaurarRole(id: number): Observable<{ message: string }> {
        return this.http.put<{ message: string }>(`${this.apiUrl}/${id}/restore`, {});
    }
}