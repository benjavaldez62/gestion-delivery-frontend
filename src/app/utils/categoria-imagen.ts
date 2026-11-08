import { Categoria } from '../services/categorias';

const IMAGENES_FALLBACK = [
  'assets/img/home-1/menu-l1.png',
  'assets/img/home-1/menu-l2.png',
  'assets/img/home-1/menu-l3.png',
  'assets/img/home-1/menu-l4.png',
  'assets/img/home-1/menu-l5.png',
  'assets/img/home-1/menu-l6.png',
  'assets/img/home-1/pp-categori1.png',
  'assets/img/home-1/pp-categori5.png',
  'assets/img/home-1/pp-categori7.png',
];

export function asignarImagenCategoria(categoria: Pick<Categoria, 'nombre'>, indice: number): string {
  const nombre = categoria.nombre.toLowerCase();
  if (nombre.includes('hamburguesa') || nombre.includes('burger')) {
    return IMAGENES_FALLBACK[0];
  }
  if (nombre.includes('pasta') || nombre.includes('tallar') || nombre.includes('raviol')) {
    return IMAGENES_FALLBACK[1];
  }
  if (nombre.includes('ensalada')) {
    return IMAGENES_FALLBACK[2];
  }
  if (nombre.includes('pizza')) {
    return IMAGENES_FALLBACK[3];
  }
  if (nombre.includes('sandwich') || nombre.includes('lomo')) {
    return IMAGENES_FALLBACK[4];
  }
  if (nombre.includes('milanesa') || nombre.includes('carne')) {
    return IMAGENES_FALLBACK[6];
  }
  if (nombre.includes('empanada')) {
    return IMAGENES_FALLBACK[7];
  }
  return IMAGENES_FALLBACK[indice % IMAGENES_FALLBACK.length];
}
