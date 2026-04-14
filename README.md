# ⚾ Club Béisbol Granollers — Web Oficial

[Ver en producción](https://proyecto-intermodular-nf0w.onrender.com/)
> Proyecto Intermodular · CFGS Desarrollo de Aplicaciones Web · 2025-2026  
> Desarrollado por **Daniel Galán Tavares**


Aplicación web completa para el Club Béisbol Granollers. Permite a los socios consultar información del club, inscribirse en categorías, comprar en la tienda y mantenerse al día con las noticias y el calendario de partidos. El club puede gestionar todo desde un panel de administración.

---

## Índice

- [Tecnologías utilizadas](#tecnologías-utilizadas)
- [Funcionalidades](#funcionalidades)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Instalación en local](#instalación-en-local)
- [Variables de entorno](#variables-de-entorno)
- [Base de datos (Supabase)](#base-de-datos-supabase)
- [Despliegue en Render](#despliegue-en-render)
- [Scripts disponibles](#scripts-disponibles)
- [Usuarios de prueba](#usuarios-de-prueba)
- [Modelo de datos](#modelo-de-datos-resumen)

---

## Tecnologías utilizadas

| Capa | Tecnología |
|------|-----------|
| Servidor | Node.js + Express |
| Vistas | EJS (Embedded JavaScript Templates) |
| ORM | Prisma v5 |
| Base de datos | PostgreSQL (alojada en Supabase) |
| Autenticación | express-session + bcryptjs |
| Subida de ficheros | Multer |
| Envío de emails | Resend API (REST via fetch nativo) |
| Despliegue | Render |

El proyecto sigue una arquitectura **MVC** (Modelo–Vista–Controlador):
- Los **modelos** los define Prisma en `schema.prisma`
- Los **controladores** contienen toda la lógica de negocio
- Las **vistas** son plantillas EJS con partials reutilizables (navbar, footer, flash...)

---

## Funcionalidades

### Usuarios y acceso
- Registro e inicio de sesión con contraseñas hasheadas con bcrypt
- Cuatro roles: `SOCIO`, `JUGADOR`, `TÉCNICO` y `ADMIN`
- Cada usuario solo puede ver y editar sus propios datos desde su perfil
- Rutas protegidas según rol (middleware `requireAuth` y `requireAdmin`)

### Inscripciones
- Formulario de inscripción a categorías (Sub10, Sub12, Sub14, Sub16, Sub18, Sénior)
- El usuario elige si quiere inscribirse como **jugador** o como **técnico**
- Las categorías disponibles se filtran automáticamente según la edad del usuario
- Si el inscrito es **menor de edad**, se exigen los datos del padre/madre o tutor legal (nombre, apellidos y DNI)
- Si el menor ya facilitó los datos del tutor al registrarse, no se le vuelven a pedir
- No se puede enviar una nueva solicitud si ya hay una `PENDIENTE` o `APROBADA`
- Al aprobar una solicitud desde el panel admin, el rol del usuario cambia automáticamente de `SOCIO` a `JUGADOR` o `TÉCNICO`
- Al rechazar, el rol vuelve a `SOCIO`
- Al enviar una nueva inscripción, el administrador recibe un **email automático** con todos los datos

### Categorías
- Página propia para cada categoría con el cuerpo técnico y la plantilla de jugadores
- Calendario de próximos partidos y últimos resultados por categoría
- Filtro por categoría en las páginas de calendario y resultados globales

### Tienda
- Catálogo de productos con filtros por categoría
- Carrito gestionado en sesión
- Proceso de compra simulado: carrito → datos de envío → pago → confirmación

### Noticias
- Listado con noticia destacada, grid de noticias y sidebar de recientes
- Página de detalle de cada noticia

### Panel de administración (`/admin`)
- **Dashboard** con estadísticas generales
- **Usuarios**: listado, cambio de rol y eliminación
- **Inscripciones**: listado con rol solicitado, datos del tutor legal si aplica, y cambio de estado
- **Jugadores y técnicos**: creación directa desde el panel sin pasar por el proceso de inscripción
- **Productos**: alta, edición y gestión de stock, con subida de imagen directa
- **Noticias**: alta y edición con subida de imagen directa
- **Partidos**: creación y registro de resultados por categoría

---

## Estructura del proyecto

```
Proyecto_intermodular/
├── app.js                        # Punto de entrada de Express
├── package.json
├── render.yaml                   # Configuración del despliegue en Render
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
    │   └── mailer.js             # Envío de emails via Resend API (registro, inscripción, compra)
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
- Git

### Pasos

```bash
# 1. Clona el repositorio
git clone https://github.com/Dani-GT/Proyecto_intermodular.git
cd Proyecto_intermodular

# 2. Instala las dependencias
npm install

# 3. Crea el archivo de variables de entorno (ver sección siguiente)
cp .env.example .env
```

---

## Variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
# URL de conexión a Supabase
DATABASE_URL="postgresql://postgres:TU_PASSWORD@db.XXXXXXXXXX.supabase.co:5432/postgres"

# Necesaria para migraciones con prisma migrate
DIRECT_URL="postgresql://postgres:TU_PASSWORD@db.XXXXXXXXXX.supabase.co:5432/postgres"

# Clave secreta para las sesiones (cualquier cadena larga)
SESSION_SECRET="cambia-esto-por-algo-secreto"

# Email — Resend API (https://resend.com)
# Obtén tu API key en resend.com → API Keys → Create API Key
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxx"
# Email del administrador que recibirá las notificaciones
ADMIN_EMAIL="tu@email.com"

NODE_ENV="development"
PORT=3000
```

> ⚠️ Sin `RESEND_API_KEY` el servidor arranca igualmente, pero no se enviarán correos de notificación. En ese caso verás un aviso `[Mailer] ⚠️ RESEND_API_KEY no configurado` en los logs.

> Para generar un SESSION_SECRET seguro:
> ```bash
> node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
> ```

---

## Base de datos (Supabase)

### Crear el proyecto

1. Entra en [supabase.com](https://supabase.com) → **New project**
2. Elige un nombre, región (EU West recomendado) y contraseña
3. Espera a que se inicialice

### Obtener la URL de conexión

Ve a **Settings → Database → Connection string**, copia la URI y pégala en el `.env` como `DATABASE_URL`. Recuerda sustituir `[YOUR-PASSWORD]` por tu contraseña.

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
3. Render leerá el `render.yaml` y configurará el build solo
4. En **Environment → Add environment variable**, añade manualmente:
   - `DATABASE_URL` → tu URL de conexión de Supabase
   - `RESEND_API_KEY` → tu clave de Resend (para el envío de emails)
   - `ADMIN_EMAIL` → email donde llegan las notificaciones (por defecto `danielgalantavares@gmail.com`)
5. El resto de variables ya están definidas en el `render.yaml`

El comando de build configurado es:
```
npm install && npx prisma generate && npx prisma migrate deploy
```

> **Importante:** para que `prisma migrate deploy` funcione en Render necesitas subir la carpeta `prisma/migrations/` al repositorio. Si usas `db:push` en local, genera la migración inicial antes del primer despliegue:
> ```bash
> npm run db:migrate
> # Escribe un nombre como "init" cuando lo pida
> git add prisma/migrations/
> git commit -m "add initial migration"
> git push
> ```

---

## Scripts disponibles

| Script | Descripción |
|--------|-------------|
| `npm start` | Arranca el servidor |
| `npm run dev` | Arranca con nodemon (recarga automática) |
| `npm run db:generate` | Genera el cliente de Prisma |
| `npm run db:push` | Sincroniza el schema con la BD sin crear migraciones (útil en desarrollo) |
| `npm run db:migrate` | Crea y aplica una migración versionada |
| `npm run db:studio` | Abre Prisma Studio (interfaz gráfica de la BD en el navegador) |
| `npm run db:seed` | Puebla la base de datos con datos de prueba |

---

## Usuarios de prueba

Después de ejecutar `npm run db:seed` puedes entrar con estas cuentas:

| Rol | Email | Contraseña |
|-----|-------|------------|
| Admin | admin@cbgranollers.cat | Admin1234! |
| Socio | socio@ejemplo.com | User1234! |
| Jugador (Sub14) | jugador@ejemplo.com | User1234! |

---

## Modelo de datos (resumen)

```
Persona ──< Rol
        ──< Inscripcion ──< TutorLegal
        ──< Compra ──< CompraProducto ──> Producto

Categoria ──< Inscripcion
          ──< Partido
```

Los modelos principales son:

- **Persona** — usuarios registrados
- **Rol** — tipo de usuario (SOCIO, JUGADOR, TÉCNICO, ADMIN)
- **Categoria** — Sub10 a Sénior
- **Inscripcion** — solicitud de un usuario para unirse a una categoría, con estado (PENDIENTE / APROBADA / RECHAZADA)
- **TutorLegal** — datos del tutor, obligatorios si el inscrito es menor de edad
- **Partido** — partidos con rival, fecha, campo y resultado
- **Noticia** — artículos del club
- **Producto / Compra / CompraProducto** — tienda online

---

*Proyecto realizado para el módulo de Proyecto Intermodular del CFGS DAW · Curso 2025-2026*
