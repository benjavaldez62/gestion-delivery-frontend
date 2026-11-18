/**
 * Resuelve la URL base de la API REST según el host y protocolo desde los que se accede
 * a la aplicación. En entorno local mantiene `http://127.0.0.1:8000/api` por compatibilidad
 * IPv4 en Windows; desde otros dispositivos en red local (LAN) apunta automáticamente al
 * mismo host en el puerto `8000`.
 *
 * @param hostname Nombre de host o dirección IP opcional (por defecto `window.location.hostname`).
 * @param protocol Protocolo opcional (por defecto `window.location.protocol`).
 * @returns URL base de la API sin barra final.
 */
export function resolverApiUrl(hostname?: string, protocol?: string): string {
  const hostActual = hostname ?? (typeof window !== 'undefined' ? window.location.hostname : '');
  const protocoloActual = protocol ?? (typeof window !== 'undefined' ? window.location.protocol : 'http:');
  const hostNormalizado = hostActual.trim();
  const proto = protocoloActual === 'https:' ? 'https:' : 'http:';

  if (!hostNormalizado || hostNormalizado === 'localhost' || hostNormalizado === '127.0.0.1') {
    return 'http://127.0.0.1:8000/api';
  }

  return `${proto}//${hostNormalizado}:8000/api`;
}

export const apiUrl = resolverApiUrl();
export const googleClientId = '260548849342-vc0g3lhos93j1j90hhu14votaomnrib7.apps.googleusercontent.com';