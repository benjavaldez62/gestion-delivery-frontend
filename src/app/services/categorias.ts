import { Service } from '@angular/core';
import { Injectable, inject } from '@angular/core'; // 
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { apiUrl } from '../config/api';

/* @Service()
export class Categorias {} */

export interface Categoria {
    id: number;
    nombre: string;
    descripcion: string;
    activo: boolean;
}

interface RespuestaCategorias {
    message: string;
    categorias: Categoria[];
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
}
