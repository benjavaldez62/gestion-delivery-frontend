import { Injectable, OnInit, inject } from '@angular/core'; // 
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../config/api';


// Interfaz para las categorias que vienen por API
export interface Categoria {
    id: number;
    nombre: string;
}
export interface Adicional {
    id: number;
    nombre: string;
    descripcion: string | null;
    activo: boolean;
    precio: number;
    categoria_id?: number;
    categoria?: Categoria;
    deleted_at?: string | null;
}

export interface nuevoAdicional {
    nombre: string;
    descripcion: string | null;
    precio: number; 
    categoria_id: number; 
    activo: true;
}

export interface AdicionalActualizado {
    nombre: string;
    descripcion?: string;
    precio: number;
    categoria_id: number;
}

interface RespuestaAdicionales {
    message: string;
    adicionales: Adicional[];
}

interface RespuestaAdicionalesDesactivados {
    message: string;
    adicionalesDesactivados: Adicional[];
}

interface RespuestaAdicional {
    message: string;
    adicional: Adicional;
}

interface RespuestaCategorias {
    message?: string;
    categorias: Categoria[];
}

@Injectable({ providedIn: 'root' })
export class AdicionalesService {

    private http = inject(HttpClient);
    private apiUrl = `${apiUrl}/adicionales`;

    // Listado de Adicionales activos
    obtenerAdicionales(): Observable<RespuestaAdicionales> {
        return this.http.get<RespuestaAdicionales>(this.apiUrl);
    }

    // Listado de Adicionales desactivados
    obtenerAdicionalesDesactivados(): Observable<RespuestaAdicionalesDesactivados> {
        return this.http.get<RespuestaAdicionalesDesactivados>(`${this.apiUrl}-desactivados`)
    }

    obtenerCategorias(): Observable<RespuestaCategorias> {
        return this.http.get<RespuestaCategorias>(`${apiUrl}/categorias`);
    }

    // ABM Adicionales
    crearAdicional(datos: nuevoAdicional): Observable<RespuestaAdicional> {
        return this.http.post<RespuestaAdicional>(this.apiUrl, datos);
    }

    actualizarAdicional(id: number, datos: AdicionalActualizado): Observable<RespuestaAdicional> {
        return this.http.put<RespuestaAdicional>(`${this.apiUrl}/${id}`, datos);
    }

    eliminarAdicional(id: number): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
    }

    restaurarAdicional(id: number): Observable<{ message: string }> {
        return this.http.put<{ message: string }>(`${this.apiUrl}/${id}/restore`, {});
    }
}
