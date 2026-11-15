import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { apiUrl } from "../config/api";

export interface MetodoPago {
    id: number;
    nombre: string;
    descripcion: string | null;
    activo: boolean;
    deleted_at?: string | null;
}

export interface nuevoMetodoPago {
    nombre: string;
    descripcion: string;
    activo?: boolean;
}

interface RespuestaMetodoPagos {
    message: string;
    metodosPago: MetodoPago[];
}

interface RespuestaMetodoPago {
    message: string;
    metodoPago: MetodoPago;
}

interface RespuestaMetodoPagosDesactivados {
    message: string;
    metodosPagoDesactivados: MetodoPago[];
}

@Injectable({providedIn: 'root'})
export class MetodosPagoService {
    private http = inject(HttpClient);
    private apiUrl = `${apiUrl}/metodos-pago`;

    obtenerMetodosPago(): Observable<RespuestaMetodoPagos> {
        return this.http.get<RespuestaMetodoPagos>(this.apiUrl);
    }
    obtenerMetodosPagoDesactivados(): Observable<RespuestaMetodoPagosDesactivados> {
        return this.http.get<RespuestaMetodoPagosDesactivados>(`${this.apiUrl}-desactivados`)
    }

    // ABM
    crearMetodoPago(datos: nuevoMetodoPago): Observable<RespuestaMetodoPago> {
        return this.http.post<RespuestaMetodoPago>(this.apiUrl, datos);
    }

    actualizarMetodoPago(id:number, datos: nuevoMetodoPago): Observable<RespuestaMetodoPago> {
        return this.http.put<RespuestaMetodoPago>(`${this.apiUrl}/${id}`, datos);
    }

    eliminarMetodoPago(id:number): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
    }

    restaurarMetodoPago(id:number): Observable<{ message: string }> {
        return this.http.put<{ message: string }>(`${this.apiUrl}/${id}/restore`, { });
    }
}
