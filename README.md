# ⚾ CB Granollers — Web Oficial

Página web completa del **Club Béisbol Granollers**, desarrollada como proyecto intermodular del CFGS Desarrollo de Aplicaciones Web (DAW). Incluye gestión de socios, inscripciones por categoría, tienda online, publicación de noticias y un panel de administración completo.

🌐 **Demo en producción:** [https://cb-granollers.onrender.com](https://cb-granollers.onrender.com)

---

## Tabla de contenidos

1. [Tecnologías](#tecnologías)
2. [Características](#características)
3. [Arquitectura y estructura del proyecto](#arquitectura-y-estructura-del-proyecto)
4. [Modelos de datos](#modelos-de-datos)
5. [Variables de entorno](#variables-de-entorno)
6. [Instalación y desarrollo local](#instalación-y-desarrollo-local)
7. [Scripts disponibles](#scripts-disponibles)
8. [Despliegue en Render](#despliegue-en-render)
9. [Subida de imágenes — Cloudinary](#subida-de-imágenes--cloudinary)
10. [Email transaccional — Resend](#email-transaccional--resend)
11. [Optimizaciones de rendimiento](#optimizaciones-de-rendimiento)
12. [Autor](#autor)

---

## Tecnologías

| Capa | Tecnología |
|------|-----------|
| Servidor | Node.js ≥ 18 + Express 4 |
| Plantillas | EJS 3 |
| ORM | Prisma 5 |
| Base de datos | PostgreSQL (Supabase) |
| Sesiones | express-session + almacén personalizado en PostgreSQL |
| Subida de imágenes | Multer + Cloudinary v1 (producción) / disco local (desarrollo) |
| Email | Resend REST API (fetch nativo, sin SMTP) |
| Estilos | CSS puro con custom properties (tema claro/oscuro) |
| JS frontend | Vanilla JS (`main.js`) |
| Despliegue | Render (plan gratuito) |
| Hosting imágenes | Cloudinary (carpetas `cbgranollers/noticias` y `cbgranollers/productos`) |

---

## Características

### Públicas (sin iniciar sesión)
- **Página de inicio** con hero, noticias destacadas, categorías y llamada a la acción
- **El Club** — historia, galería y timeline (desde 1985)
- **Categorías** — Sub-10, Sub-12, Sub-14, Sub-16, Sub-18 y Sénior con entrenadores y horarios
- **Calendario y resultados** de partidos por categoría
- **Noticias** — listado y detalle con imagen
- **Tienda** — catálogo con filtro por categoría (ROPA, EQUIPAMIENTO, MERCHANDISING)
- **Formulario de contacto**
- Tema claro/oscuro persistido en `localStorage`
- SEO básico (Open Graph, Twitter Card, sitemap.xml, robots.txt)

### Para socios autenticados
- **Registro** con validación de mayoría de edad (solicita datos del tutor legal para menores)
- **Inicio de sesión / Cierre de sesión**
- **Mi perfil** — ver inscripciones, historial de compras y editar datos personales o contraseña
- **Inscripción** a categorías con selección de rol (JUGADOR / TÉCNICO)
- **Carrito y compra** — añadir productos, revisar carrito, proceso de checkout y confirmación

### Panel de administración (`/admin`)
Accesible únicamente con rol `ADMIN`.

- **Dashboard** — resumen de socios, inscripciones, noticias y productos
- **Inscripciones** — listado completo, cambio de estado (PENDIENTE / APROBADA / RECHAZADA) y notas con datos del tutor legal
- **Usuarios** — listado de socios, cambio de rol, eliminación
- **Productos** — crear, editar y eliminar productos con subida de imagen (Cloudinary en producción)
- **Noticias** — crear, editar y eliminar noticias con subida de imagen (Cloudinary en producción)
- **Partidos** — crear, editar y eliminar partidos por categoría con resultado

### Notificaciones por email
El administrador recibe un email automático ante:
- Nuevo registro de socio (incluyendo datos del tutor si es menor)
- Nueva solicitud de inscripción
- Nuevo pedido de la tienda con desglose de productos y total

---

## Arquitectura y estructura del proyecto

```
Proyecto_intermodular/
├── app.js                            # Punto de entrada, configuración Express
├── package.json
├── render.yaml                       # Configuración de despliegue en Render
├── prisma/
│   ├── schema.prisma                 # Modelos de datos
│   └── seed.js                       # Datos iniciales (categorías, productos, admin)
├── scripts/
│   ├── update-productos-imagenes.js  # Actualiza rutas de imágenes de productos en BD
│   └── update-noticias-imagenes.js   # Actualiza rutas de imágenes de noticias en BD
└── src/
    ├── controllers/                  # Lógica de negocio por módulo
    │   ├── admin.controller.js
    │   ├── auth.controller.js
    │   ├── categoria.controller.js
    │   ├── index.controller.js
    │   ├── inscripcion.controller.js
    │   ├── noticia.controller.js
    │   └── tienda.controller.js
    ├── lib/
    │   ├── mailer.js                 # Envío de emails via Resend API
    │   ├── prisma.js                 # Singleton del cliente Prisma
    │   └── sessionStore.js           # Almacén de sesiones en PostgreSQL
    ├── middleware/
    │   ├── auth.middleware.js        # Guards: requireAuth, requireAdmin
    │   └── upload.middleware.js      # Multer: Cloudinary (prod) o disco (dev)
    ├── routes/                       # Definición de rutas por módulo
    └── public/
        ├── css/style.css             # Estilos globales (38 KB minificado)
        ├── js/main.js                # JavaScript frontend
        ├── images/                   # Imágenes estáticas en WebP
        │   └── productos/            # Imágenes del catálogo inicial
        ├── robots.txt
        └── sitemap.xml
    └── views/
        ├── partials/                 # head, navbar, footer, flash
        ├── admin/                    # Vistas del panel de administración
        ├── auth/                     # login, registro, perfil
        ├── categorias/               # index, show, calendario, resultados
        ├── inscripcion/              # Formulario y mis inscripciones
        ├── noticias/                 # Listado y detalle
        ├── tienda/                   # Catálogo, carrito, checkout, pago, confirmación
        ├── index.ejs                 # Página de inicio
        ├── club.ejs                  # Historia del club
        ├── contacto.ejs
        └── 404.ejs
```

El proyecto sigue el patrón **MVC**: las rutas delegan en controladores que acceden a la base de datos a través del cliente Prisma y devuelven datos a las vistas EJS.

---

## Modelos de datos

```
Persona ──── Rol (1:1)
        ──── Inscripcion (1:N) ──── TutorLegal (1:1)
        ──── Compra (1:N) ────────── CompraProducto (N:M) ──── Producto

Categoria ── Inscripcion (1:N)
          ── Partido (1:N)

Noticia     (independiente)
```

| Modelo | Descripción |
|--------|-------------|
| `Persona` | Usuario del sistema. Incluye campos opcionales para datos del tutor legal (menores) |
| `Rol` | Tipo de usuario: `SOCIO`, `JUGADOR`, `TÉCNICO`, `ADMIN` |
| `Categoria` | Categoría deportiva: SUB10–SUB18 + SENIOR |
| `Inscripcion` | Solicitud de un socio a una categoría. Estado: `PENDIENTE`, `APROBADA`, `RECHAZADA` |
| `TutorLegal` | Datos del tutor vinculados a una inscripción (cuando el jugador es menor) |
| `Partido` | Partido de una categoría con fecha, rival, campo y resultado |
| `Noticia` | Artículo publicable con imagen, resumen y flag `destacada` |
| `Producto` | Artículo de la tienda con precio, stock e imagen. Categorías: `ROPA`, `EQUIPAMIENTO`, `MERCHANDISING` |
| `Compra` | Pedido de un socio. Estado: `PENDIENTE`, `PAGADA`, `COMPLETADA`, `CANCELADA`, `ENVIADA` |
| `CompraProducto` | Línea de pedido (relación N:M entre Compra y Producto con cantidad y precio unitario) |

---

## Variables de entorno

Crea un archivo `.env` en la raíz del proyecto basándote en `.env.example`:

```env
# ── Base de datos (Supabase) ──────────────────────────────────────────────────
# Obtén las URLs en: Supabase → Settings → Database → Connection string
DATABASE_URL="postgresql://postgres:TU_PASSWORD@db.XXXXXXXXXX.supabase.co:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:TU_PASSWORD@db.XXXXXXXXXX.supabase.co:5432/postgres"

# ── Sesiones ──────────────────────────────────────────────────────────────────
# Genera un valor con: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
SESSION_SECRET="cambia-esto-por-algo-secreto"

# ── Cloudinary (imágenes subidas desde el admin) ─────────────────────────────
# Obtén las credenciales en: cloudinary.com → Dashboard
CLOUDINARY_CLOUD_NAME="tu_cloud_name"
CLOUDINARY_API_KEY="tu_api_key"
CLOUDINARY_API_SECRET="tu_api_secret"

# ── Email (Resend) ────────────────────────────────────────────────────────────
# Obtén tu API key en: resend.com → API Keys → Create API Key
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxx"
ADMIN_EMAIL="tu@email.com"

# ── Entorno ───────────────────────────────────────────────────────────────────
NODE_ENV="development"
PORT=3000
```

> **Cloudinary es opcional en desarrollo.** Si las tres variables `CLOUDINARY_*` no están definidas, las imágenes se guardan en disco local (`src/public/images/`). En producción (Render) el sistema de archivos es efímero, por lo que Cloudinary es obligatorio para que las imágenes subidas desde el admin persistan entre deploys.

> **Supabase — plan gratuito:** La base de datos se pausa automáticamente tras 7 días sin actividad. Si la app no responde, entra en el [dashboard de Supabase](https://supabase.com/dashboard) y pulsa **Restore project**.

---

## Instalación y desarrollo local

### Requisitos previos
- Node.js ≥ 18
- Una base de datos PostgreSQL (se recomienda Supabase)
- (Opcional) Cuenta en Cloudinary para la subida de imágenes desde el admin

### Pasos

```bash
# 1. Clonar el repositorio
git clone https://github.com/Dani-GT/Proyecto_intermodular.git
cd Proyecto_intermodular

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Edita .env con tus credenciales

# 4. Aplicar el esquema a la base de datos
npm run db:push

# 5. (Opcional) Cargar datos de ejemplo
npm run db:seed

# 6. Iniciar en modo desarrollo
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000).

El seed crea un usuario administrador con las credenciales:
- **Email:** `admin@cbgranollers.com`
- **Contraseña:** `Admin1234!`

---

## Scripts disponibles

| Script | Comando | Descripción |
|--------|---------|-------------|
| Producción | `npm start` | Inicia el servidor con `node app.js` |
| Desarrollo | `npm run dev` | Inicia con `nodemon` (recarga automática) |
| Generar cliente Prisma | `npm run db:generate` | Regenera `@prisma/client` |
| Migración (dev) | `npm run db:migrate` | Crea y aplica una nueva migración |
| Push esquema | `npm run db:push` | Aplica el esquema sin crear migración (ideal para primeros pasos) |
| Seed | `npm run db:seed` | Carga categorías, productos e imágenes predeterminadas en la BD |
| Prisma Studio | `npm run db:studio` | Interfaz visual para explorar y editar la BD |
| Actualizar imágenes productos | `node scripts/update-productos-imagenes.js` | Actualiza las rutas de imagen de los productos del seed a las versiones WebP locales |
| Actualizar imágenes noticias | `node scripts/update-noticias-imagenes.js` | Actualiza rutas de imagen de noticias existentes en la BD |

---

## Despliegue en Render

El repositorio incluye `render.yaml` con la configuración lista para despliegue automático.

### Pasos

1. Crea un nuevo **Web Service** en [render.com](https://render.com) conectando el repositorio de GitHub.
2. Render detectará el `render.yaml` automáticamente. Si prefieres configurarlo a mano, usa:
   - **Build Command:** `npm install && npx prisma generate && npx prisma db push --skip-generate --accept-data-loss`
   - **Start Command:** `node app.js`
3. Añade las siguientes variables de entorno en el panel de Render:

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | URL con pgBouncer de Supabase (puerto 6543) |
| `DIRECT_URL` | URL directa de Supabase (puerto 5432) |
| `SESSION_SECRET` | Cadena aleatoria secreta (Render puede generarla automáticamente) |
| `CLOUDINARY_CLOUD_NAME` | Nombre del cloud en Cloudinary |
| `CLOUDINARY_API_KEY` | API Key de Cloudinary |
| `CLOUDINARY_API_SECRET` | API Secret de Cloudinary |
| `RESEND_API_KEY` | API Key de Resend para emails |
| `ADMIN_EMAIL` | Email del administrador para notificaciones |
| `NODE_ENV` | `production` |

4. Haz un primer deploy. Render ejecutará el build command que incluye `prisma db push`, creando todas las tablas automáticamente.
5. Ejecuta el seed la primera vez desde tu máquina local (con las mismas variables de entorno):
   ```bash
   npm run db:seed
   ```

### Notas importantes sobre Render (plan gratuito)

- El servicio **se duerme** tras 15 minutos de inactividad. La primera petición tras el sueño tarda unos segundos.
- El sistema de archivos es **efímero**: cualquier archivo escrito en disco desaparece al reiniciar. Por eso Cloudinary es obligatorio en producción.
- Las sesiones se persisten en PostgreSQL para sobrevivir reinicios y deploys.

---

## Subida de imágenes — Cloudinary

El middleware `src/middleware/upload.middleware.js` detecta automáticamente si las variables `CLOUDINARY_*` están definidas:

- **Con Cloudinary** (producción): las imágenes se suben directamente a Cloudinary. `req.file.path` contiene la URL pública (`https://res.cloudinary.com/...`).
- **Sin Cloudinary** (desarrollo local): las imágenes se guardan en `src/public/images/noticias/` o `src/public/images/productos/` con nombre único (timestamp + hash aleatorio).

Los controladores distinguen ambos casos para asignar la URL correcta:

```js
const imagenUrl = req.file
  ? (req.file.path?.startsWith('http') ? req.file.path : `/images/productos/${req.file.filename}`)
  : (req.body.imagenUrl || null);
```

**Versión requerida:** `cloudinary@^1.41.3` — compatible con `multer-storage-cloudinary@4.0.0`, que requiere la API v1 de Cloudinary. Se accede a través de `require('cloudinary').v2`.

Las imágenes se organizan en Cloudinary en:
- `cbgranollers/noticias` — imágenes de artículos
- `cbgranollers/productos` — imágenes de la tienda

---

## Email transaccional — Resend

El módulo `src/lib/mailer.js` usa **fetch nativo de Node.js 18+** para llamar directamente a la API REST de Resend, sin dependencias de SMTP. Esto es necesario porque el plan gratuito de Render bloquea las conexiones SMTP salientes (puertos 25, 465, 587).

Se envían tres tipos de email al administrador:

| Función | Cuándo se activa |
|---------|-----------------|
| `notificarRegistro(persona)` | Nuevo registro de socio |
| `notificarInscripcion(inscripcion, persona)` | Nueva solicitud de inscripción |
| `notificarCompra(compra, persona)` | Nuevo pedido realizado |

Si `RESEND_API_KEY` no está definida, las funciones registran un aviso en consola y no lanzan ningún error, por lo que la aplicación funciona correctamente sin email configurado.

---

## Optimizaciones de rendimiento

A lo largo del desarrollo se aplicaron diversas mejoras orientadas a Core Web Vitals (PageSpeed Insights, tamaño móvil):

### Imágenes
- Todas las imágenes se almacenan en formato **WebP** y se comprimieron con Pillow (Python), consiguiendo reducciones de entre el 34 % y el 77 % respecto a los originales.
- Las imágenes del catálogo y la galería usan rutas locales `/images/...` en vez de URLs externas.

### LCP (Largest Contentful Paint)
- El hero de la página de inicio usa una etiqueta `<img>` real (no `background-image` CSS) para que el navegador descubra el recurso antes en el parse del HTML.
- Se añade `fetchpriority="high"` al hero y se pasa la ruta como variable `preloadHero` al partial `head.ejs` para generar un `<link rel="preload" as="image">` lo antes posible en el `<head>`.
- El atributo `decoding="async"` **no se usa** en la imagen hero: introduce un retraso de ~5 s en el renderizado del LCP.
- Las animaciones CSS del hero (y `will-change: transform`) se activan únicamente tras el evento `window.load`, evitando que la GPU cree capas durante la pintura inicial.

### Render-blocking resources
- **Google Fonts** se carga de forma no bloqueante:
  ```html
  <link rel="preload" as="style" href="https://fonts.googleapis.com/css2?..." onload="this.onload=null;this.rel='stylesheet'">
  <noscript><link rel="stylesheet" href="..."></noscript>
  ```
- El script `main.js` incluye el atributo `defer` para no bloquear el renderizado.
- El CSS principal (`style.css`) permanece bloqueante para evitar el efecto FOUC (flash de contenido sin estilos) visible al navegar entre páginas.

### Forced reflow
- Los paneles de tabs (perfil) y filtros (tienda) usan la clase `.hidden` en vez de `style.display`, y agrupan todas las escrituras DOM dentro de `requestAnimationFrame`, eliminando reflows forzados.
- `fadeOut` agrupa todas sus escrituras de estilo en un único frame.

### CSS
- `style.css` minificado: de ~58 KB a ~38 KB (−34 %).
- Clase utilitaria `.hidden { display: none !important }` usada en tabs y filtros.
- `margin-bottom` añadido al `.page-header` en mobile para separarlo del contenido siguiente.

### Critical inline CSS
Bloque inline en `head.ejs` para evitar el FOUC mientras se carga el stylesheet principal y aplicar el tema guardado sin parpadeo:

```html
<style>
  :root { --bg: #f8fafc; --text: #0f172a; }
  [data-theme="dark"] { --bg: #0f172a; --text: #f1f5f9; }
  body { margin: 0; background: var(--bg); color: var(--text); font-family: system-ui, sans-serif; }
  .navbar { position: sticky; top: 0; z-index: 100; background: var(--bg); }
</style>
```

---

## Autor

**Daniel Galán Tavares**  
CFGS Desarrollo de Aplicaciones Web — Proyecto Intermodular 2025-2026  
[danielgalantavares@gmail.com](mailto:danielgalantavares@gmail.com) · [GitHub](https://github.com/Dani-GT/Proyecto_intermodular)
