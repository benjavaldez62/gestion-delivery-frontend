import { Injectable, signal, computed, effect } from '@angular/core';
import { CartItem, CartItemAdicional, CartSummary, CheckoutPayload } from '../models/cart';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private readonly STORAGE_KEY = 'la_posta_cart';
  public readonly COSTO_ENVIO_FIJO = 1500;

  // Estado reactivo con Angular Signals
  private readonly itemsSignal = signal<CartItem[]>(this.loadFromStorage());
  private readonly isOpenSignal = signal<boolean>(false);

  // Señales públicas de solo lectura
  readonly items = this.itemsSignal.asReadonly();
  readonly isDrawerOpen = this.isOpenSignal.asReadonly();

  readonly totalItems = computed(() =>
    this.itemsSignal().reduce((acc, item) => acc + item.cantidad, 0)
  );

  readonly subtotal = computed(() =>
    this.itemsSignal().reduce((acc, item) => acc + item.subtotal, 0)
  );

  readonly costoEnvio = computed(() =>
    this.itemsSignal().length > 0 ? this.COSTO_ENVIO_FIJO : 0
  );

  readonly montoTotal = computed(() =>
    this.subtotal() + this.costoEnvio()
  );

  readonly summary = computed<CartSummary>(() => ({
    cantidadTotal: this.totalItems(),
    subtotal: this.subtotal(),
    costoEnvio: this.costoEnvio(),
    montoTotal: this.montoTotal(),
  }));

  constructor() {
    // Sincronización automática de estado hacia LocalStorage
    effect(() => {
      this.saveToStorage(this.itemsSignal());
    });
  }

  // Control de apertura/cierre del Drawer lateral
  openCart(): void {
    this.isOpenSignal.set(true);
  }

  closeCart(): void {
    this.isOpenSignal.set(false);
  }

  toggleCart(): void {
    this.isOpenSignal.update(abierto => !abierto);
  }

  // Agregar producto con adicionales
  addItem(item: Omit<CartItem, 'idTemporal' | 'subtotal'>): void {
    const additionalIds = (item.adicionales || [])
      .map(a => a.id)
      .sort((a, b) => a - b)
      .join('-');
    const compositeKey = `${item.productoId}_${additionalIds}`;

    this.itemsSignal.update(items => {
      const existingIndex = items.findIndex(i => i.idTemporal === compositeKey);
      const additionalCost = (item.adicionales || []).reduce((sum, a) => sum + a.precio, 0);
      const lineUnit = item.precioUnitario + additionalCost;

      if (existingIndex > -1) {
        const updated = [...items];
        const current = updated[existingIndex];
        const newQty = current.cantidad + item.cantidad;
        updated[existingIndex] = {
          ...current,
          cantidad: newQty,
          subtotal: lineUnit * newQty
        };
        return updated;
      }

      return [
        ...items,
        {
          ...item,
          idTemporal: compositeKey,
          subtotal: lineUnit * item.cantidad
        }
      ];
    });
  }

  // Modificar cantidad (delta: +1 o -1). Si llega a 0, se remueve.
  updateQuantity(idTemporal: string, delta: number): void {
    this.itemsSignal.update(items => {
      const target = items.find(i => i.idTemporal === idTemporal);
      if (!target) return items;

      const newQty = target.cantidad + delta;
      if (newQty <= 0) {
        return items.filter(i => i.idTemporal !== idTemporal);
      }

      const additionalCost = (target.adicionales || []).reduce((sum, a) => sum + a.precio, 0);
      const lineUnit = target.precioUnitario + additionalCost;

      return items.map(i =>
        i.idTemporal === idTemporal
          ? { ...i, cantidad: newQty, subtotal: lineUnit * newQty }
          : i
      );
    });
  }

  // Eliminar un ítem específico del carrito
  removeItem(idTemporal: string): void {
    this.itemsSignal.update(items => items.filter(i => i.idTemporal !== idTemporal));
  }

  // Vaciar completamente el carrito
  clear(): void {
    this.itemsSignal.set([]);
    this.removeStorage();
  }

  // Alias para mantener compatibilidad
  clearCart(): void {
    this.clear();
  }

  // Generador de payload estructurado para confirmación atómica en backend
  getCheckoutPayload(metodoPagoId: number, direccionEnvio?: string, notas?: string): CheckoutPayload {
    return {
      metodo_pago_id: metodoPagoId,
      direccion_envio: direccionEnvio,
      notas: notas,
      items: this.itemsSignal().map(item => ({
        producto_id: item.productoId,
        cantidad: item.cantidad,
        adicionales: (item.adicionales || []).map(a => a.id)
      }))
    };
  }

  // Métodos seguros de acceso a LocalStorage (con fallback para SSR / tests)
  private loadFromStorage(): CartItem[] {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(this.STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
      }
    } catch (e) {
      console.warn('No se pudo acceder a localStorage:', e);
    }
    return [];
  }

  private saveToStorage(items: CartItem[]): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(this.STORAGE_KEY, JSON.stringify(items));
      }
    } catch (e) {
      console.warn('No se pudo guardar en localStorage:', e);
    }
  }

  private removeStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(this.STORAGE_KEY);
      }
    } catch (e) {
      console.warn('No se pudo limpiar localStorage:', e);
    }
  }
}
