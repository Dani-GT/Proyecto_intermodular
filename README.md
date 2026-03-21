# ⚾ CB Granollers — Web Oficial

Proyecto web del Club Béisbol Granollers, desarrollado como Proyecto Intermodular del CFGS DAW.

**Stack:** Node.js · Express · EJS · Prisma ORM · PostgreSQL (Supabase) · Despliegue en Render

---

## Tabla de contenidos

- [Requisitos previos](#requisitos-previos)
- [Instalación local](#instalación-local)
- [Configurar Supabase (base de datos)](#configurar-supabase)
- [Ejecutar en local](#ejecutar-en-local)
- [Desplegar en Render](#desplegar-en-render)
- [Scripts disponibles](#scripts-disponibles)
- [Credenciales de prueba](#credenciales-de-prueba)
- [Estructura del proyecto](#estructura-del-proyecto)

---

## Requisitos previos

- [Node.js](https://nodejs.org/) v18 o superior
- Una cuenta en [Supabase](https://supabase.com) (gratuita)
- Una cuenta en [Render](https://render.com) (gratuita)
- Git

---

## Instalación local

```bash
# 1. Clona el repositorio
git clone https://github.com/Dani-GT/Proyecto_intermodular.git
cd Proyecto_intermodular

# 2. Instala las dependencias
npm install

# 3. Crea el archivo .env a partir del ejemplo
cp .env.example .env
```

A continuación, rellena el archivo `.env` con tus valores reales (ver sección siguiente).

---

## Configurar Supabase

### 1. Crear el proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) → **New project**
2. Pon un nombre (ej. `cb-granollers`), elige una región (EU West) y una contraseña segura
3. Espera a que el proyecto se inicialice (~1 min)

### 2. Obtener la cadena de conexión

1. En el panel de Supabase ve a **Settings** → **Database**
2. Baja hasta **Connection string** → selecciona la pestaña **URI**
3. Copia la URL; tiene este formato:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxx.supabase.co:5432/postgres
   ```
4. Sustituye `[YOUR-PASSWORD]` por la contraseña que elegiste al crear el proyecto

### 3. Configurar el .env local

Edita el archivo `.env`:

```env
DATABASE_URL="postgresql://postgres:TU_PASSWORD@db.xxxxxxxxxxxx.supabase.co:5432/postgres"
SESSION_SECRET="una-cadena-aleatoria-larga-y-segura"
NODE_ENV="development"
PORT=3000
```

> **Tip:** Genera un SESSION_SECRET seguro con: `openssl rand -base64 32`

### 4. Aplicar el esquema y sembrar datos

```bash
# Genera el cliente de Prisma
npm run db:generate

# Aplica el esquema a la base de datos de Supabase
npm run db:push

# (Opcional pero recomendado) Carga datos de prueba
npm run db:seed
```

> **Nota sobre migraciones:** En desarrollo se usa `db:push` para sincronizar rápido.
> En producción, Render ejecuta `prisma migrate deploy` usando las migraciones versionadas.
> Si prefieres el flujo de migraciones en local, usa `npm run db:migrate` en lugar de `db:push`.

---

## Ejecutar en local

```bash
# Modo desarrollo (con hot-reload gracias a nodemon)
npm run dev

# Modo producción
npm start
```

La aplicación estará disponible en: [http://localhost:3000](http://localhost:3000)

---

## Desplegar en Render

### Opción A — Usando render.yaml (recomendado)

El repositorio incluye un `render.yaml` con toda la configuración. Render lo detecta automáticamente.

1. Ve a [render.com](https://render.com) → **New** → **Web Service**
2. Conecta tu repositorio de GitHub
3. Render detectará el `render.yaml` y preconfigurar todo
4. Añade la variable de entorno **manualmente** en el dashboard de Render:
   - `DATABASE_URL` → tu cadena de conexión de Supabase
5. Haz clic en **Deploy**

### Opción B — Configuración manual en Render

Si prefieres configurar a mano:

| Campo | Valor |
|-------|-------|
| **Environment** | Node |
| **Build Command** | `npm install && npx prisma generate && npx prisma migrate deploy` |
| **Start Command** | `node app.js` |

Variables de entorno a añadir en Render → **Environment**:

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | Tu URL de Supabase |
| `SESSION_SECRET` | Una cadena aleatoria segura |
| `NODE_ENV` | `production` |

> **Importante:** `SESSION_SECRET` se puede generar automáticamente desde Render marcando "Generate Value".

### Preparar migraciones para producción

Antes del primer despliegue en Render, genera la migración inicial en local:

```bash
# Crea la migración inicial (necesita un .env con DATABASE_URL configurado)
npm run db:migrate
# Cuando pregunte el nombre, escribe algo como: init

# Sube los cambios a GitHub incluyendo la carpeta prisma/migrations/
git add prisma/migrations/
git commit -m "chore: add initial migration"
git push
```

Render ejecutará `prisma migrate deploy` en cada despliegue para aplicar migraciones pendientes.

---

## Scripts disponibles

| Script | Descripción |
|--------|-------------|
| `npm start` | Inicia el servidor en producción |
| `npm run dev` | Inicia con nodemon (hot-reload) |
| `npm run db:generate` | Genera el cliente de Prisma |
| `npm run db:migrate` | Crea y aplica una nueva migración (dev) |
| `npm run db:push` | Sincroniza el esquema sin migraciones (dev rápido) |
| `npm run db:studio` | Abre Prisma Studio (interfaz visual de la BD) |
| `npm run db:seed` | Carga datos de prueba en la base de datos |

---

## Credenciales de prueba

Tras ejecutar `npm run db:seed`:

| Rol | Email | Contraseña |
|-----|-------|------------|
| **Admin** | admin@cbgranollers.cat | Admin1234! |
| **Socio** | socio@ejemplo.com | User1234! |
| **Jugador** | jugador@ejemplo.com | User1234! |

---

## Estructura del proyecto

```
Proyecto_intermodular/
├── app.js                    # Punto de entrada, configuración de Express
├── package.json
├── render.yaml               # Configuración de despliegue en Render
├── .env.example              # Plantilla de variables de entorno
├── prisma/
│   ├── schema.prisma         # Modelos de base de datos
│   ├── seed.js               # Datos de prueba
│   └── migrations/           # Migraciones versionadas
└── src/
    ├── controllers/          # Lógica de negocio
    │   ├── auth.controller.js
    │   ├── index.controller.js
    │   ├── categoria.controller.js
    │   ├── inscripcion.controller.js
    │   ├── tienda.controller.js
    │   ├── noticia.controller.js
    │   └── admin.controller.js
    ├── routes/               # Definición de rutas
    │   ├── index.routes.js
    │   ├── auth.routes.js
    │   ├── categoria.routes.js
    │   ├── inscripcion.routes.js
    │   ├── tienda.routes.js
    │   ├── noticia.routes.js
    │   └── admin.routes.js
    ├── middleware/
    │   └── auth.middleware.js # requireAuth, requireAdmin, redirectIfAuth
    ├── lib/
    │   └── prisma.js         # Singleton del cliente Prisma
    ├── views/                # Templates EJS
    │   ├── partials/         # head, navbar, footer, flash
    │   ├── auth/             # login, registro, perfil
    │   ├── categorias/       # index, show, calendario, resultados
    │   ├── tienda/           # index, producto, carrito, checkout, confirmacion
    │   ├── noticias/         # index, show
    │   ├── admin/            # dashboard, usuarios, inscripciones, productos, noticias, partidos
    │   ├── index.ejs
    │   ├── club.ejs
    │   ├── contacto.ejs
    │   └── 404.ejs
    └── public/
        ├── css/style.css     # Estilos globales
        ├── js/main.js        # Scripts del cliente
        └── images/           # Imágenes estáticas
```

---

## Funcionalidades principales

- **Registro e inicio de sesión** con contraseñas hasheadas (bcrypt)
- **Roles de usuario:** SOCIO, JUGADOR, TÉCNICO, ADMIN
- **Inscripción a categorías** (Sub10 a Senior)
- **Tienda online** con carrito en sesión y proceso de compra
- **Noticias** del club
- **Calendario y resultados** por categoría
- **Panel de administración** — gestión de usuarios, inscripciones, productos, noticias y partidos

---

*Desarrollado por Daniel Galán Tavares — CFGS DAW — Proyecto Intermodular 2024-2025*
