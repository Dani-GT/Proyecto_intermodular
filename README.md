# ⚾ Club Béisbol Granollers — Web Oficial

[Ver en producción](https://proyecto-intermodular-nf0w.onrender.com/)
> Proyecto Intermodular · CFGS Desarrollo de Aplicaciones Web · 2025-2026  
> Desarrollado por **Daniel Galán Tavares**

Aplicación web completa para el Club Béisbol Granollers. Permite a los socios consultar información del club, inscribirse en categorías, comprar en la tienda y mantenerse al día con las noticias y el calendario de partidos. El club puede gestionar todo desde un panel de administración.

---

## Índice

- [Tecnologías utilizadas](#tecnologías-utilizadas)
- [Funcionalidades](#funcionalidades)
- [Notificaciones por email](#notificaciones-por-email)
- [Sesiones](#sesiones)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Instalación en local](#instalación-en-local)
- [Variables de entorno](#variables-de-entorno)
- [Base de datos (Supabase)](#base-de-datos-supabase)
- [Despliegue en Render](#despliegue-en-render)
- [Scripts disponibles](#scripts-disponibles)
- [Usuarios de prueba](#usuarios-de-prueba)
- [Modelo de datos](#modelo-de-datos)

---

## Tecnologías utilizadas

| Capa | Tecnología | Motivo |
|------|-----------|--------|
| Servidor | Node.js + Express | Framework minimalista y ampliamente adoptado para APIs y servidores web MVC |
| Vistas | EJS (Embedded JavaScript Templates) | Renderizado en servidor con sintaxis familiar sin necesidad de bundler |
| ORM | Prisma v5 | Tipado fuerte, migraciones automáticas y cliente generado a partir del schema |
| Base de datos | PostgreSQL en Supabase | BD relacional robusta, gratuita en la nube y compatible con Prisma |
| Autenticación | express-session + bcryptjs | Sesiones persistidas en BD y contraseñas hasheadas con salt automático |
| Almacenamiento de sesiones | pg / sessionStore propio | Las sesiones se guardan en PostgreSQL en lugar de en memoria, necesario para Render |
| Subida de ficheros | Multer + Cloudinary | Multer gestiona multipart/form-data; en producción las imágenes se suben a Cloudinary para evitar la pérdida de ficheros en el sistema efímero de Render |
| Envío de emails | Resend API (fetch nativo) | Servicio externo vía HTTPS REST; no requiere SMTP (bloqueado en Render free tier) |
| Despliegue | Render | Plataforma PaaS con integración continua desde GitHub |

El proyecto sigue una arquitectura **MVC** (Modelo–Vista–Controlador):
- Los **modelos** los define Prisma en `schema.prisma`
- Los **controladores** contienen toda la lógica de negocio (`src/controllers/`)
- Las **vistas** son plantillas EJS con partials reutilizables (`navbar`, `footer`, `flash`...)

---

## Funcionalidades

### Usuarios y acceso
- Registro e inicio de sesión con contraseñas hasheadas con bcrypt
- Cuatro roles: `SOCIO`, `JUGADOR`, `TÉCNICO` y `ADMIN`
- Cada usuario puede ver y editar sus propios datos desde su perfil
- Rutas protegidas según rol (middleware `requireAuth` y `requireAdmin`)
- Al registrarse un nuevo socio, el administrador recibe un email automático

### Inscripciones
- Formulario de inscripción a categorías: Sub10, Sub12, Sub14, Sub16, Sub18 y Sénior
- Las categorías disponibles se filtran automáticamente según la edad del usuario
- El usuario elige si quiere inscribirse como **jugador** o como **técnico**
- Si el inscrito es **menor de edad**, se exigen los datos del padre/madre o tutor legal
- Si el menor ya facilitó los datos del tutor al registrarse, no se le vuelven a pedir
- No se puede enviar una nueva solicitud si ya hay una `PENDIENTE` o `APROBADA`
- Al aprobar una solicitud desde el panel admin, el rol cambia automáticamente a `JUGADOR` o `TÉCNICO`
- Al rechazar, el rol vuelve a `SOCIO`
- Al enviar una solicitud, el administrador recibe un email automático con todos los datos

### Categorías
- Página propia para cada categoría con el cuerpo técnico y la plantilla de jugadores
- Calendario de próximos partidos y últimos resultados por categoría
- Filtro por categoría en las páginas de calendario y resultados globales

### Tienda
- Catálogo de productos con filtros por categoría (Ropa, Equipamiento, Merchandising)
- Carrito gestionado en sesión
- Proceso de compra: carrito → datos de envío → pago → confirmación
- Al completar una compra, el administrador recibe un email automático con el detalle del pedido

### Noticias
- Listado con noticia destacada, grid de noticias y sidebar de recientes
- Página de detalle de cada noticia

### Panel de administración (`/admin`)
- **Dashboard** con estadísticas generales
- **Usuarios**: listado, cambio de rol y eliminación
- **Inscripciones**: listado con rol solicitado, datos del tutor legal si aplica, y cambio de estado
- **Jugadores y técnicos**: creación directa desde el panel sin pasar por el proceso de inscripción
- **Productos**: alta, edición y gestión de stock, con subida de imagen (guardada en Cloudinary en producción)
- **Noticias**: alta y edición con subida de imagen (guardada en Cloudinary en producción)
- **Partidos**: creación y registro de resultados por categoría

---

## Notificaciones por email

El sistema envía emails automáticos al administrador en tres situaciones:

| Evento | Asunto del email |
|--------|-----------------|
| Nuevo registro de socio | `⚾ Nuevo socio registrado — Nombre Apellidos` |
| Nueva solicitud de inscripción | `📋 Nueva inscripción — Nombre Apellidos (Categoría)` |
| Nueva compra en la tienda | `🛍️ Nuevo pedido #XXXXXXXX — Nombre Apellidos` |

Los emails se envían a través de **[Resend](https://resend.com)** usando su API REST directamente con `fetch` nativo de Node.js (sin librerías adicionales). Esto evita el problema de que Render free tier bloquea las conexiones SMTP salientes.

Si la variable `RESEND_API_KEY` no está configurada, el servidor arranca igualmente y registra un aviso en los logs, pero no se envían correos.

---

## Sesiones

Las sesiones **no se guardan en memoria** (lo que se perdería al reiniciar el servidor). Se persisten en la **misma base de datos PostgreSQL de Supabase**, en una tabla llamada `user_sessions`, mediante un store personalizado (`src/lib/sessionStore.js`).

Cuando un usuario hace login, se crea un registro en esa tabla con un ID de sesión único. Ese ID viaja en una **cookie** cifrada en el navegador (`httpOnly`, `secure` en producción, duración 7 días). En cada petición, el servidor lee la cookie, busca la sesión en la base de datos y recupera los datos del usuario sin necesidad de volver a consultar la tabla `personas`.

---

## Estructura del proyecto

```
Proyecto_intermodular/
├── app.js                        # Punto de entrada: Express, sesiones, rutas
├── package.json
├── render.yaml                   # Configuración del despliegue en Render
├── er_diagram.svg                # Diagrama Entidad-Relación completo
├── prisma/
│   ├── schema.prisma             # Modelos y relaciones de la BD
│   ├── seed.js                   # Datos de prueba
│   └── migrations/               # Historial de migraciones
└── src/
    ├── controllers/
    │   ├── admin.controller.js
    │   ├── auth.controller.js
    │   ├── categoria.controller.js
    │   ├── index.controller.js
    │   ├── inscripcion.controller.js
    │   ├── noticia.controller.js
    │   └── tienda.controller.js
    ├── middleware/
    │   ├── auth.middleware.js     # requireAuth, requireAdmin, redirectIfAuth
    │   └── upload.middleware.js   # Multer para imágenes de noticias y productos
    ├── routes/
    │   ├── admin.routes.js
    │   ├── auth.routes.js
    │   ├── categoria.routes.js
    │   ├── index.routes.js
    │   ├── inscripcion.routes.js
    │   ├── noticia.routes.js
    │   └── tienda.routes.js
    ├── lib/
    │   ├── prisma.js             # Instancia singleton del cliente Prisma
    │   ├── sessionStore.js       # Store de sesiones sobre PostgreSQL
    │   └── mailer.js             # Notificaciones por email via Resend API
    ├── views/
    │   ├── partials/             # head.ejs, navbar.ejs, footer.ejs, flash.ejs
    │   ├── admin/                # dashboard, usuarios, inscripciones, productos, noticias, partidos
    │   ├── auth/                 # login.ejs, registro.ejs, perfil.ejs
    │   ├── categorias/           # index, show, calendario, resultados
    │   ├── inscripcion/          # form.ejs, mis-inscripciones.ejs
    │   ├── noticias/             # index.ejs, show.ejs
    │   ├── tienda/               # index, producto, carrito, checkout, pago, confirmacion
    │   ├── index.ejs
    │   ├── club.ejs
    │   ├── contacto.ejs
    │   └── 404.ejs
    └── public/
        ├── css/style.css
        ├── js/main.js
        └── images/
            ├── noticias/         # Imágenes subidas para noticias
            └── productos/        # Imágenes subidas para productos
```

---

## Instalación en local

### Requisitos previos

- [Node.js](https://nodejs.org/) v18 o superior
- Una cuenta gratuita en [Supabase](https://supabase.com)
- Una cuenta gratuita en [Resend](https://resend.com) (opcional, para emails)
- Una cuenta gratuita en [Cloudinary](https://cloudinary.com) (opcional, para subida de imágenes en producción)
- Git

### Pasos

```bash
# 1. Clona el repositorio
git clone https://github.com/Dani-GT/Proyecto_intermodular.git
cd Proyecto_intermodular

# 2. Instala las dependencias
npm install

# 3. Crea el archivo de variables de entorno y rellénalo
cp .env.example .env
```

---

## Variables de entorno

Crea un archivo `.env` en la raíz del proyecto (el `.env` no se sube al repositorio por seguridad):

```env
# ── Base de datos (Supabase) ──────────────────────────────────────────────────
# Obtén las URLs en Supabase → Settings → Database → Connection string
DATABASE_URL="postgresql://postgres:TU_PASSWORD@db.XXXXXXXXXX.supabase.co:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:TU_PASSWORD@db.XXXXXXXXXX.supabase.co:5432/postgres"

# ── Sesiones ──────────────────────────────────────────────────────────────────
# Cadena aleatoria y larga para firmar las cookies de sesión
SESSION_SECRET="cambia-esto-por-algo-secreto"

# ── Email (Resend) ────────────────────────────────────────────────────────────
# Obtén tu API key en resend.com → API Keys → Create API Key
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxx"
# Email del administrador que recibirá las notificaciones
ADMIN_EMAIL="tu@email.com"

# ── Cloudinary (imágenes subidas desde el admin) ─────────────────────────────
# Obtén las credenciales en cloudinary.com → Dashboard
# Sin estas variables las imágenes se guardan en disco (válido solo en local)
CLOUDINARY_CLOUD_NAME="tu_cloud_name"
CLOUDINARY_API_KEY="tu_api_key"
CLOUDINARY_API_SECRET="tu_api_secret"

# ── Entorno ───────────────────────────────────────────────────────────────────
NODE_ENV="development"
PORT=3000
```

> Para generar un SESSION_SECRET seguro:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

> ⚠️ Sin `RESEND_API_KEY` el servidor arranca igualmente pero no se enviarán correos. Se mostrará `[Mailer] ⚠️ RESEND_API_KEY no configurado` en los logs.

> ⚠️ Sin las variables de Cloudinary, las imágenes subidas desde el admin se guardan en disco local. Esto es válido en desarrollo, pero en Render (sistema de ficheros efímero) las imágenes se perderían al reiniciar el servidor.

---

## Base de datos (Supabase)

### Crear el proyecto

1. Entra en [supabase.com](https://supabase.com) → **New project**
2. Elige un nombre, región (EU West recomendado) y contraseña
3. Espera a que se inicialice (~2 minutos)

### Obtener las URLs de conexión

Ve a **Settings → Database → Connection string**:
- URI con PgBouncer → `DATABASE_URL`
- URI directa → `DIRECT_URL`

### Aplicar el esquema y cargar datos

```bash
# Genera el cliente de Prisma (obligatorio tras clonar)
npm run db:generate

# Sincroniza el esquema con la base de datos
npm run db:push

# Carga los datos de prueba
npm run db:seed
```

---

## Ejecutar en local

```bash
# Modo desarrollo (se reinicia solo al guardar cambios)
npm run dev

# Modo producción
npm start
```

Abre el navegador en [http://localhost:3000](http://localhost:3000)

---

## Despliegue en Render

El repositorio incluye un `render.yaml` que Render detecta automáticamente.

1. Ve a [render.com](https://render.com) → **New → Web Service**
2. Conecta tu repositorio de GitHub
3. Render leerá el `render.yaml` y configurará el build automáticamente
4. En **Environment → Add environment variable**, añade manualmente:
   - `DATABASE_URL` → URL de conexión con PgBouncer de Supabase
   - `DIRECT_URL` → URL directa de Supabase (para migraciones)
   - `RESEND_API_KEY` → tu clave de Resend
   - `ADMIN_EMAIL` → email donde recibirás las notificaciones
   - `CLOUDINARY_CLOUD_NAME` → cloud name de tu cuenta Cloudinary
   - `CLOUDINARY_API_KEY` → API key de Cloudinary
   - `CLOUDINARY_API_SECRET` → API secret de Cloudinary
5. El resto de variables ya están definidas en el `render.yaml`

El comando de build configurado es:
```
npm install && npx prisma generate && npx prisma migrate deploy
```

> **Importante:** para que `prisma migrate deploy` funcione en Render necesitas subir la carpeta `prisma/migrations/` al repositorio. Si usas `db:push` en local, genera la migración inicial antes del primer despliegue:
> ```bash
> npm run db:migrate   # escribe "init" cuando lo pida
> git add prisma/migrations/
> git commit -m "add initial migration"
> git push
> ```

---

## Scripts disponibles

| Script | Descripción |
|--------|-------------|
| `npm start` | Arranca el servidor en producción |
| `npm run dev` | Arranca con nodemon (recarga automática en desarrollo) |
| `npm run db:generate` | Genera el cliente de Prisma a partir del schema |
| `npm run db:push` | Sincroniza el schema con la BD sin crear migraciones (desarrollo) |
| `npm run db:migrate` | Crea y aplica una migración versionada |
| `npm run db:studio` | Abre Prisma Studio (interfaz gráfica de la BD en el navegador) |
| `npm run db:seed` | Puebla la base de datos con datos de prueba |
| `node scripts/update-noticias-imagenes.js` | Asigna imágenes estáticas a noticias existentes en la BD |
| `node scripts/update-productos-imagenes.js` | Asigna imágenes estáticas a productos existentes en la BD |

---

## Usuarios de prueba

Después de ejecutar `npm run db:seed` puedes entrar con estas cuentas:

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | admin@cbgranollers.cat | Admin1234! |
| Socio | socio@ejemplo.com | User1234! |
| Jugador (Sub14) | jugador@ejemplo.com | User1234! |

---

## Modelo de datos

El diagrama ER completo está en [`er_diagram.svg`](./er_diagram.svg).

```
Persona ──1:1── Rol
        ──1:N── Inscripcion ──1:1── TutorLegal
        ──1:N── Compra ──1:N── CompraProducto ──N:1── Producto

Categoria ──1:N── Inscripcion
          ──1:N── Partido

Noticia  (entidad independiente, gestionada desde el panel admin)
```

| Entidad | Descripción |
|---------|-------------|
| **Persona** | Usuarios registrados. Incluye opcionalmente los datos del tutor legal para menores |
| **Rol** | Tipo de usuario: `SOCIO`, `JUGADOR`, `TÉCNICO` o `ADMIN` |
| **Categoria** | Categorías del club: Sub10, Sub12, Sub14, Sub16, Sub18, Sénior |
| **Inscripcion** | Solicitud de un usuario para unirse a una categoría (PENDIENTE / APROBADA / RECHAZADA) |
| **TutorLegal** | Datos del tutor obligatorios cuando el inscrito es menor de edad |
| **Partido** | Partidos con rival, fecha, campo, si es local/visitante y resultado |
| **Noticia** | Artículos publicados por el club, con imagen y opción de marcarla como destacada |
| **Producto** | Artículos de la tienda con precio, stock e imagen (Ropa / Equipamiento / Merchandising) |
| **Compra** | Cabecera del pedido de un usuario con total y estado |
| **CompraProducto** | Líneas del pedido: producto, cantidad y precio unitario en el momento de la compra |

---

*Proyecto realizado para el módulo de Proyecto Intermodular del CFGS DAW · Curso 2025-2026*
