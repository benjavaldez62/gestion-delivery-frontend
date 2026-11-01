/**
 * Modelos e interfaces para el Carrito de Compras (SD-239)
 */

export interface CartItemAdicional {
  id: number;
  nombre: string;
  precio: number;
}

export interface CartItem {
  idTemporal: string; // Clave compuesta: productoId_adicionalesIds
  productoId: number;
  nombre: string;
  precioUnitario: number;
  cantidad: number;
  imagenUrl?: string;
  adicionales: CartItemAdicional[];
  subtotal: number;
}

export interface CartSummary {
  cantidadTotal: number;
  subtotal: number;
  costoEnvio: number;
  montoTotal: number;
}

export interface CheckoutPayloadItem {
  producto_id: number;
  cantidad: number;
  adicionales: number[];
}

export interface CheckoutPayload {
  metodo_pago_id: number;
  direccion_envio?: string;
  notas?: string;
  items: CheckoutPayloadItem[];
}

