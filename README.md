# Sistema de Gestión de Delivery — La Posta (Frontend)

Aplicación web desarrollada en **Angular 19** para la plataforma de pedidos y delivery del restaurante "La Posta". El sistema provee un portal interactivo y responsivo para clientes y personal operativo, integrando catálogo dinámico de productos, gestión reactiva de carrito de compras con persistencia local, selector de modificadores y consumo de la API REST del backend.

---

## 1. Arquitectura y Tecnologías

El proyecto sigue una arquitectura modular desacoplada basada en componentes independientes (*Standalone Components*), gestión de estado mediante **Angular Signals** y tipado estricto en **TypeScript**:

| Componente | Tecnología | Versión | Rol en el Sistema |
| :--- | :--- | :---: | :--- |
| **Framework** | Angular | `^19.0.0` | Arquitectura basada en Standalone Components y nueva sintaxis de control de flujo (`@if`, `@for`). |
| **Lenguaje** | TypeScript | `~5.6.2` | Tipado estático estricto para modelos de dominio, servicios e interfaces. |
| **Gestión de Estado** | Signals API | Nativo | Estado reactivo síncrono y predecible mediante `signal`, `computed` y `effect`. |
| **Diseño y Estilos** | Bootstrap | `^5.3.3` | Sistema de grillas responsivo, layout móvil y componentes de interfaz. |
| **Iconografía** | SVG Vectorial | Estándar W3C | Iconografía vectorial inline accesible (`aria-hidden`) sin dependencias de fuentes pesadas ni emojis. |
| **Testing** | Vitest | `^2.1.8` | Suite de pruebas unitarias y de integración rápida para servicios y componentes. |
| **HTTP Client** | `@angular/common/http` | `^19.0.0` | Comunicación asíncrona con el backend mediante `provideHttpClient()`. |

---

## 2. Módulos y Componentes Clave

### 2.1. Gestión Reactiva de Carrito (`CartService`)
Ubicación: `src/app/services/cart.ts`
- **Estado Global con Signals:** Expone señales reactivas para la lista de ítems (`itemsSignal`), subtotal (`subtotal`), costo de envío (`costoEnvio`) y monto total (`montoTotal`).
- **Persistencia en LocalStorage:** Sincronización bidireccional automática mediante `effect()`. Los ítems se recuperan al cargar la página y se guardan ante cualquier modificación bajo la clave `la_posta_cart`.
- **Identificador Compuesto:** Cada ítem utiliza una clave `idTemporal` compuesta por `productoId` y los IDs ordenados de sus adicionales (`{productoId}_{adicionalId1}_{adicionalId2}`), garantizando que productos iguales con combinaciones diferentes de modificadores no colisionen.
- **Cálculo Financiero:** Cada adicional se computa sobre el precio unitario del producto (`(precio_producto + sum(adicionales)) * cantidad`).

### 2.2. Panel Lateral Deslizable (`CartDrawer`)
Ubicación: `src/app/components/cart-drawer/`
- Componente *Standalone* montado en el layout principal con animación lateral suave y fondo con desenfoque (`backdrop-filter: blur(4px)`).
- Visualización detallada de cada producto, sus adicionales seleccionados con precio unitario, selector interactivo de cantidades y eliminación individual o vaciado completo.
- Botón de checkout conectado al payload estándar para el envío de órdenes a la API de backend.

### 2.3. Navegación y Encabezado (`HeaderComponent`)
Ubicación: `src/app/components/header/`
- Barra de navegación principal que incluye acceso a las secciones de Inicio, Categorías y Gestión.
- Botón de carrito con indicador numérico reactivo (*badge*) sincronizado en tiempo real con la cantidad total de artículos del `CartService`.

### 2.4. Catálogo y Categorías (`CategoriasService` y Vistas)
Ubicación: `src/app/services/categorias.ts`, `src/app/pages/categorias/`, `src/app/pages/inicio/`
- Consumo de endpoints de categorías y productos activos desde la API REST.

### 2.5. Checkout
- La ruta `/checkout` permite completar dirección, teléfono, aclaraciones y método de pago, y consultar el resumen del carrito.
- Al continuar se guarda un borrador mediante `POST /api/checkout/borradores`. El servidor valida los productos y recalcula los precios; los importes del carrito son estimados.
- El borrador no es un pedido confirmado y no se envía automáticamente a Telegram. La vinculación con el bot y la creación definitiva del pedido son tareas pendientes; se conserva el carrito.
- La URL local de la API se configura en `src/app/config/api.ts`. El costo de envío estimado es de $1500 y debe coincidir con el costo calculado por el backend.

---

## 3. Estructura del Proyecto

```text
frontend/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── cart-drawer/      # Panel lateral interactivo del carrito de compras
│   │   │   ├── footer/           # Pie de página institucional
│   │   │   └── header/           # Encabezado, navegación y badge de carrito
│   │   ├── models/
│   │   │   └── cart.ts           # Interfaces de TypeScript (CartItem, CartItemAdicional, CheckoutPayload)
│   │   ├── pages/
│   │   │   ├── categorias/       # Vista de categorías de productos
│   │   │   └── inicio/           # Vista principal de bienvenida y destacados
│   │   ├── services/
│   │   │   ├── cart.ts           # Servicio reactivo de carrito con Signals y LocalStorage
│   │   │   └── categorias.ts     # Servicio para consumo de categorías del backend
│   │   ├── app.config.ts         # Configuración de proveedores (provideRouter, provideHttpClient)
│   │   ├── app.html              # Layout raíz con Header, RouterOutlet, CartDrawer y Footer
│   │   ├── app.routes.ts         # Definición de rutas del cliente
│   │   └── app.ts                # Componente raíz Standalone
│   ├── index.html
│   └── styles.css                # Estilos globales y utilidades
├── public/                       # Recursos estáticos
├── package.json
└── tsconfig.json
```

---

## 4. Requisitos Previos

- **Node.js:** Versión 18.x o 20.x LTS recomendada.
- **npm:** Versión 9.x o superior.
- **Angular CLI:** Versión 19.x (`npm install -g @angular/cli`).
- **Backend Activo:** Servidor Laravel ejecutándose localmente en `http://localhost:8000`.

---

## 5. Instalación y Configuración

1. Clonar el repositorio y posicionarse en la carpeta `frontend`:
   ```bash
   git clone https://github.com/benjavaldez62/gestion-delivery-frontend.git
   cd gestion-delivery-frontend
   ```

2. Instalar las dependencias del proyecto:
   ```bash
   npm install
   ```

---

## 6. Comandos de Ejecución

### Servidor de Desarrollo
Para iniciar el servidor local con recarga en caliente:
```bash
npm start
# o alternativamente:
ng serve
```
La aplicación estará accesible en `http://localhost:4200/`.

### Pruebas Unitarias (Vitest)
El proyecto utiliza **Vitest** como motor de pruebas de alta velocidad:
```bash
# Ejecutar todas las pruebas una sola vez (modo CI):
npm test -- --watch=false

# Ejecutar pruebas en modo observador:
npm test
```

### Compilación para Producción
Para generar los binarios optimizados en el directorio `dist/`:
```bash
npm run build
```

---

## 7. Convenciones de Desarrollo

- **Conventional Commits:** Todos los mensajes de commit deben seguir la especificación estándar (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`).
- **Prohibición de Emojis:** Queda expresamente prohibido incorporar emojis en archivos de código, plantillas HTML o estilos CSS. Toda iconografía debe representarse mediante vectores SVG accesibles.
- **Idioma del Repositorio:** Comentarios de código, nombres de interfaces, modelos y documentación deben redactarse en español neutro y profesional.
