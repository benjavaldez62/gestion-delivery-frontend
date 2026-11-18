# Sistema de Gestión de Delivery — La Posta (Frontend)

Aplicación web desarrollada en **Angular 22** para la plataforma de pedidos y delivery del restaurante "La Posta". Brinda un portal público para explorar el catálogo y armar pedidos con derivación a Telegram, junto con paneles operativos y administrativos protegidos por rol que consumen la API REST del backend en Laravel.

---

## 1. Arquitectura y Tecnologías

El proyecto implementa una arquitectura modular basada en **Standalone Components**, gestión de estado reactiva con **Angular Signals** y tipado estricto en **TypeScript**:

| Componente | Tecnología | Versión | Rol en el Sistema |
| :--- | :--- | :---: | :--- |
| **Framework** | Angular | `^22.2.0` | Standalone Components y control de flujo moderno (`@if`, `@for`, `@switch`). |
| **Lenguaje** | TypeScript | `~6.0.2` | Tipado estático para modelos, servicios y formularios reactivos. |
| **Gestión de Estado** | Signals API | Nativo | Estado reactivo síncrono (`signal`, `computed`, `effect`). |
| **Programación Reactiva** | RxJS | `~7.8.0` | Composición HTTP, `forkJoin`, polling con `exhaustMap` y manejo de `404`. |
| **Estilos y Tipografía** | Bootstrap + CSS Custom | `^5.3.8` | Grilla responsiva, paleta de marca (`#FF5200`) y fuentes `Outfit` + `Inter`. |
| **Iconografía** | Bootstrap Icons + SVG | `1.11.3` | Íconos vectoriales e inline accesibles (`aria-hidden`), sin emojis en código ni UI. |
| **Autenticación Externa** | Google Identity Services | `@types/google.accounts ^0.0.18` | Botón de acceso con Google integrado en `/login`. |
| **Testing** | Vitest + jsdom | `^5.0.0` / `^30.0.0` | Suite de pruebas unitarias y de componentes vía `@angular/build:unit-test`. |

---

## 2. Módulos y Funcionalidades Principales

### 2.1. Inicio, Menú y Tarjetas de Producto (`Inicio`, `MenuListComponent`, `ProductCardComponent`)
Ubicación: `src/app/pages/inicio/`, `src/app/pages/menu/`, `src/app/components/menu-list/`, `src/app/components/product-card/`
- En `/inicio` se presentan las categorías activas en carrusel y accesos directos al catálogo filtrado por categoría.
- En `/menu`, `MenuListComponent` muestra inicialmente las categorías disponibles y la opción **Ver todos los productos**, además de un buscador por nombre tolerante a tildes y mayúsculas.
- `ProductCardComponent` permite ajustar cantidad, consultar imágenes con fallback por categoría (`utils/categoria-imagen.ts`) y desplegar hasta 2 adicionales en categorías habilitadas mediante `supportsAdditionals()` (`models/menu.ts`, con normalización NFD para reconocer categorías acentuadas como `Sándwiches`).

### 2.2. Gestión Reactiva de Carrito (`CartService`, `/carrito`, `HeaderComponent`)
Ubicación: `src/app/services/cart.ts`, `src/app/pages/carrito/`, `src/app/components/header/`
- **Estado Global con Signals:** Expone `items`, `totalCount`, `subtotal`, `costoEnvio` (`$1500`) y `montoTotal`.
- **Persistencia en `localStorage`:** Sincronización automática bajo la clave `la_posta_cart`, validando estructura de array al hidratar en `loadFromStorage()`.
- **Identificador Compuesto:** Cada línea utiliza `idTemporal` (`{productoId}_{adicionalIdsOrdenados}`) para evitar colisiones entre combinaciones distintas de adicionales sobre un mismo producto.
- **Vista Dedicada y Previsualización:** `HeaderComponent` muestra el contador reactivo del carrito y un acceso rápido, mientras que `/carrito` permite modificar cantidades, editar adicionales en línea, quitar ítems o continuar al checkout.

### 2.3. Checkout y Confirmación por Telegram (`/checkout`)
Ubicación: `src/app/pages/checkout/` (`checkout.ts`, `payment-selector.ts`)
- Solicita nombre completo y dirección (hasta 25 caracteres cada uno), teléfono (hasta 25 dígitos con `+` opcional al inicio), aclaraciones (hasta 255 caracteres) y método de pago.
- Al continuar envía `POST /api/checkout/borradores`. El servidor valida los productos y recalcula los importes; los valores mostrados en el carrito son estimados y el costo de envío estimado ($1500) coincide con el configurado en el backend.
- Actualmente solo está operativo el pago en efectivo (`tarjeta` y `transferencia` figuran deshabilitados). Permite ingresar el monto con el que abona el cliente para estimar el vuelto; el pago no se confirma automáticamente al registrar el pre-pedido.
- Tras guardar el borrador se consulta `GET /api/configuracion-publica` para construir el enlace hacia el bot configurado en el backend (`TelegramMessageBuilderService`) sin exponer tokens en el frontend. Si la configuración pública falla, informa el error y permite reintentar conservando el carrito y sin duplicar el pre-pedido.

### 2.4. Autenticación, Recuperación de Contraseña, Guards e Interceptor
Ubicación: `src/app/pages/login/`, `src/app/pages/recuperacion/`, `src/app/pages/perfil/`, `src/app/guards/`, `src/app/interceptors/`, `src/app/services/auth.ts`
- **Acceso por Rol y Redirección:** `AuthService.rutaInicial()` redirige según el rol autenticado (`Administrador` / `SuperAdmin` -> `/dashboard`, `Cocinero` -> `/cocina`, `Repartidor` -> `/repartos`, `Cliente` o desconocido -> `/inicio`). `authGuard` y `guardRole` protegen las rutas y evitan bucles de redirección.
- **Google Sign-In:** Integrado en `/login` usando `googleClientId` (`src/app/config/api.ts`). Requiere tener el origen local o productivo autorizado en Google Cloud Console y `GOOGLE_CLIENT_ID` configurado en el backend.
- **Interceptor HTTP (`authInterceptor`):** Inyecta el Bearer Token en peticiones hacia `apiUrl` (`config/api.ts`), excluye `/login` y `/auth/google`, y ante una respuesta `401` limpia la sesión y redirige a `/login`.
- **Recuperación de contraseña:** Desde `/login`, `/recuperar-contrasena` envía `POST /api/forgot-password` distinguiendo correos del dominio `test.com` (instruye contactar al administrador), cuenta inexistente, inactiva o fallo SMTP. `/restablecer-contrasena` lee token y correo desde el fragmento de la URL, limpia la barra de direcciones, valida nueva contraseña local (sin modificar cuentas de Google) y cierra la sesión local tras guardar.
- **Perfil (`/perfil`):** Permite al usuario autenticado actualizar su nombre, correo, teléfono y dirección (`PUT /api/profile`), reflejando el nuevo nombre de inmediato en el encabezado.

### 2.5. Panel Administrativo y Tableros Operativos
- **Dashboard (`/dashboard`):** Indicadores clave, equipo disponible, alertas de pedidos sin asignar y gráficos de distribución por estado y método de pago con selector de período (`Hoy`, `7 días`, `30 días`, `Todo`).
- **Pedidos (`/pedidos`):** Listado de órdenes para asignación de cocinero y repartidor, priorizando `nombre_cliente` con respaldo a `cliente.username` mediante `resolverNombreClientePedido()` (`utils/cliente-pedido.ts`).
- **Cocina (`/cocina`):** Tablero Kanban (`Pendiente`, `En preparación`, `Listo para entregar`) con actualización automática cada 20 segundos y tolerancia a fallos de red en polling.
- **Repartos (`/repartos`):** Tablero Kanban (`Listo para entregar`, `En camino`, `Entregado`), registro automático de cobro en efectivo al entregar, manejo de alertas ante fallos de envío de ticket y reintento manual sin duplicar cobros, usando `exhaustMap` en polling.
- **Pagos (`/pagos`):** Resumen de ingresos cobrados en la zona horaria del backend (`pagos_timezone`), consulta de envíos cobrados por repartidor según fecha (valor estimado como total menos subtotal, no representa liquidación pagada), filtros combinados por búsqueda/estado/método y visor seguro del ticket original guardado.
- **ABMs (`/categorias`, `/productos`, `/adicionales`, `/metodos-pago`, `/roles`, `/usuarios`):** Gestión de registros activos y desactivados con alta, edición, baja lógica, restauración y carga concurrente con `forkJoin`.

---

## 3. Mapa de Rutas y Control de Acceso

Definido en `src/app/app.routes.ts`:

| Ruta | Componente | Acceso / Guards |
| :--- | :--- | :--- |
| `/` y `/**` | Redirección a `/inicio` | Público |
| `/inicio`, `/menu`, `/carrito`, `/checkout` | `Inicio`, `Menu`, `Carrito`, `Checkout` | Invitados y rol `Cliente` (`guardRole` con `allowAnonymous: true`) |
| `/login` | `Login` | Público |
| `/recuperar-contrasena`, `/restablecer-contrasena` | `RecuperarContrasena`, `RestablecerContrasena` | Público |
| `/perfil` | `Perfil` | Cualquier usuario autenticado (`authGuard`) |
| `/dashboard`, `/pedidos`, `/pagos` | `Dashboard`, `Pedidos`, `Pagos` | `Administrador` / `SuperAdmin` |
| `/categorias`, `/productos`, `/adicionales` | `Categorias`, `Productos`, `Adicionales` | `Administrador` / `SuperAdmin` |
| `/metodos-pago`, `/roles`, `/usuarios` | `MetodoPagos`, `Roles`, `Usuarios` | `Administrador` / `SuperAdmin` |
| `/cocina` | `Cocina` | `Cocinero` |
| `/repartos` | `Repartos` | `Repartidor` |

---

## 4. Estructura del Proyecto

```text
frontend/
├── public/                              # Recursos estáticos
├── src/
│   ├── index.html                       # Fuentes Google (Outfit, Inter) y Bootstrap Icons
│   ├── styles.css                       # Sistema visual, variables de marca (#FF5200) y estilos compartidos
│   └── app/
│       ├── app.config.ts                # Configuración de router y provideHttpClient(withInterceptors(...))
│       ├── app.html                     # Layout raíz (Header, RouterOutlet, Footer)
│       ├── app.routes.ts                # Definición de rutas y guards por rol
│       ├── app.ts                       # Componente raíz Standalone
│       ├── config/
│       │   └── api.ts                   # URL base de la API (apiUrl) y googleClientId
│       ├── components/
│       │   ├── footer/                  # Pie de página institucional
│       │   ├── header/                  # Navegación por rol, badge de carrito y menú de perfil
│       │   ├── menu-list/               # Buscador, selector de categorías y grilla del menú
│       │   └── product-card/            # Tarjeta de producto con stepper y adicionales
│       ├── guards/
│       │   ├── auth-guard.ts            # Protección de rutas autenticadas
│       │   └── role-guard.ts            # Control de acceso por rol y allowAnonymous
│       ├── interceptors/
│       │   └── auth-interceptor.ts      # Inyección de Bearer Token y cierre ante 401
│       ├── models/
│       │   ├── cart.ts                  # Tipos de carrito y payload de checkout
│       │   └── menu.ts                  # Modelos del menú y regla supportsAdditionals()
│       ├── pages/
│       │   ├── adicionales/             # ABM de adicionales
│       │   ├── carrito/                 # Vista dedicada del carrito
│       │   ├── categorias/              # ABM de categorías
│       │   ├── checkout/                # Formulario de checkout y selector de pago
│       │   ├── cocina/                  # Tablero Kanban de cocina
│       │   ├── dashboard/               # Panel de KPIs, alertas y métricas
│       │   ├── inicio/                  # Landing pública y categorías destacadas
│       │   ├── login/                   # Inicio de sesión clásico y con Google
│       │   ├── menu/                    # Página contenedora del catálogo público
│       │   ├── metodos-pago/            # ABM de métodos de pago
│       │   ├── pagos/                   # Consulta de ingresos, envíos y comprobantes
│       │   ├── pedidos/                 # Gestión y asignación administrativa de pedidos
│       │   ├── perfil/                  # Edición del perfil propio
│       │   ├── productos/               # ABM de productos
│       │   ├── recuperacion/            # Solicitud y restablecimiento de contraseña
│       │   ├── repartos/                # Tablero Kanban de repartos
│       │   ├── roles/                   # ABM de roles
│       │   └── usuarios/                # ABM de usuarios
│       ├── services/                    # 18 servicios HTTP/estado (auth, cart, checkout, dashboard, pedidos, pagos, ABMs, telegram)
│       └── utils/
│           ├── categoria-imagen.ts      # Imágenes fallback por categoría
│           ├── cliente-pedido.ts        # Resolución de nombre visible del cliente
│           └── http-404.ts              # Helper ignorar404Vacio() para listados vacíos
├── angular.json                         # Budgets de compilación (anyComponentStyle: 6kB warn / 8kB error)
├── package.json
└── tsconfig.json
```

---

## 5. Requisitos Previos e Instalación

- **Node.js:** Versión `20.x` o `22.x` LTS recomendada.
- **npm:** Versión `10.x` o `11.x` (`packageManager: npm@11.21.0`).
- **Angular CLI:** Versión `22.x` (`@angular/cli ^22.2.2`).
- **Backend Activo:** Servidor Laravel ejecutándose localmente en `http://127.0.0.1:8000`.

### Pasos de Instalación

1. Clonar el repositorio y posicionarse en la rama `dev`:
   ```bash
   git clone https://github.com/benjavaldez62/gestion-delivery-frontend.git
   cd gestion-delivery-frontend
   git checkout dev
   ```
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Verificar `src/app/config/api.ts`: `apiUrl` se resuelve de forma automática mediante `resolverApiUrl()` (`http://127.0.0.1:8000/api` en entorno local o `http://<IP-LOCAL>:8000/api` al acceder desde otro dispositivo en red local), sin requerir edición manual. Confirmar además que `googleClientId` corresponda a un cliente OAuth con el origen del frontend habilitado en Google Cloud Console.

---

## 6. Comandos de Ejecución

### Servidor de Desarrollo

**Modo 100% local (`localhost`):**

```bash
npm start
# o alternativamente:
ng serve
```

La aplicación estará disponible en `http://localhost:4200/`.

**Modo escucha en red local (LAN / múltiples dispositivos):**

Para exponer el servidor de desarrollo a celulares u otros equipos en la misma red local:

```bash
npm run start:lan
# o alternativamente:
ng serve --host 0.0.0.0 --port 4200
```

Consideraciones para que funcione desde otro dispositivo de la red:
1. `src/app/config/api.ts` resuelve automáticamente el host del backend mediante `resolverApiUrl()`: utiliza `http://127.0.0.1:8000/api` en modo local y `http://<IP-LOCAL>:8000/api` cuando se accede desde otro dispositivo en la LAN, sin necesidad de modificar `apiUrl` manualmente.
2. Iniciar el backend con `php artisan serve --host=0.0.0.0 --port=8000` y habilitar CORS en el `.env` del backend configurando `CORS_ALLOW_LAN=true` o definiendo `FRONTEND_URL=http://<IP-LOCAL>:4200` / `CORS_ALLOWED_ORIGINS=http://<IP-LOCAL>:4200` (ejecutar `php artisan config:clear` si corresponde).
3. Permitir tráfico entrante en los puertos TCP `4200` y `8000` en el firewall local si el sistema operativo bloquea conexiones en red privada.
4. Acceder desde los demás dispositivos en `http://<IP-LOCAL>:4200/`. Para iniciar sesión desde una IP HTTP de red local, usar correo y contraseña (Google Identity Services no habilita IPs privadas sin HTTPS).

### Pruebas Unitarias (Vitest)

Suite configurada con `@angular/build:unit-test` (`39` archivos de prueba y `174` tests pasando):

```bash
# Ejecutar todas las pruebas una sola vez (CI):
npm test -- --watch=false

# Ejecutar pruebas en modo observador:
npm test
```

### Compilación para Producción

Genera los archivos optimizados en `dist/frontend/` (con presupuestos `anyComponentStyle` de `6kB` warning / `8kB` error):

```bash
npm run build
```

---

## 7. Convenciones de Desarrollo

- **Rama Base:** Todas las ramas de características, fixes y documentación parten y apuntan hacia `dev`.
- **Conventional Commits:** Usar formato estándar (`feat:`, `fix:`, `docs:`, `test:`, `refactor:`, `chore:`) sin líneas `Co-Authored-By` ni atribuciones de IA.
- **Prohibición de Emojis:** No incorporar emojis en plantillas HTML, código fuente ni estilos CSS; usar Bootstrap Icons o SVGs vectoriales accesibles.
- **Idioma del Repositorio:** Comentarios de código, interfaces, modelos y documentación redactados en español neutro y profesional.

---

## 8. Equipo de Desarrollo (Grupo 2)

Proyecto desarrollado para la cátedra **Programación IV**:

- **Valdez, Benjamín Ezequiel**
- **Alanis, Fabricio**
- **Berra, Agustina Inés**
- **Berra Panelo, Florencia María**
