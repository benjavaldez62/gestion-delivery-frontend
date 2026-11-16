export interface ClienteVisiblePedido {
  nombre_cliente?: string | null;
  cliente?: {
    username?: string | null;
  } | null;
}

/**
 * Prioriza el nombre ingresado en checkout sobre el identificador técnico del cliente.
 */
export function resolverNombreClientePedido(pedido: ClienteVisiblePedido): string | null {
  const nombreCliente = pedido.nombre_cliente?.trim();
  if (nombreCliente) {
    return nombreCliente;
  }

  const username = pedido.cliente?.username?.trim();
  return username || null;
}
