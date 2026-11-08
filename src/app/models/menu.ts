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
