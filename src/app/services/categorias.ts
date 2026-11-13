import { Injectable, inject } from '@angular/core'; // 
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../config/api';

/* @Service()
export class Categorias {} */

export interface Categoria {
    id: number;
    nombre: string;
    descripcion: string | null;
    activo: boolean;
    deleted_at?: string | null;
}

export interface nuevaCategoria {
    nombre: string;
    descripcion: string;
    activo?: boolean;
}

interface RespuestaCategorias {
    message: string;
    categorias: Categoria[];
}

interface RespuestaCategoriasDesactivadas {
    message: string;
    categoriasDesactivadas: Categoria[];
}

interface RespuestaCategoria {
    message: string;
    categoria: Categoria;
}

@Injectable({
    providedIn: 'root'
})
export class CategoriasService {
    private http = inject(HttpClient);
    private apiUrl = `${apiUrl}/categorias`;
    
    obtenerCategorias(): Observable<RespuestaCategorias> {
        return this.http.get<RespuestaCategorias>(this.apiUrl);
    }
    
    obtenerCategoriasDesactivadas(): Observable<RespuestaCategoriasDesactivadas> {
        return this.http.get<RespuestaCategoriasDesactivadas>(`${apiUrl}/categorias-desactivadas`);
    }

    // ABM Categorias
    crearCategoria(datos: nuevaCategoria): Observable<RespuestaCategoria> {
        return this.http.post<RespuestaCategoria>(this.apiUrl, datos);
    }

    actualizarCategoria(id: number, datos: nuevaCategoria): Observable<RespuestaCategoria> {
        return this.http.put<RespuestaCategoria>(`${this.apiUrl}/${id}`, datos);
    }
}
