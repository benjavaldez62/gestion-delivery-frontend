//define la forma de esos datos; no contiene productos.
export interface MenuCategory {
  id: number;
  nombre: string;
}

export interface MenuProduct {
  id: number;
  nombre: string;
  descripcion: string | null;
  imagen: string | null;
  precio: number;
  activo: boolean;
  categoria: MenuCategory | null;
}

export interface MenuAdditional {
  id: number;
  categoria_id: number | null;
  nombre: string;
  descripcion: string | null;
  precio: number;
  activo: boolean;
}

const CATEGORIES_WITH_ADDITIONALS = new Set([
  'pizzas',
  'hamburguesas',
  'pastas',
  'sandwiches',
]);

export function supportsAdditionals(categoryName: string | undefined): boolean {
  if (categoryName === undefined) {
    return false;
  }

  const normalized = categoryName
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase();

  return CATEGORIES_WITH_ADDITIONALS.has(normalized);
}
