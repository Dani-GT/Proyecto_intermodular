require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const PgSessionStore = require('./src/lib/sessionStore');
const { csrfGenerate } = require('./src/middleware/csrf.middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Proxy (necesario en Render/Heroku para cookies seguras) ─────────────────
app.set('trust proxy', 1);

// ─── Motor de vistas ─────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));

// ─── Cabeceras de seguridad HTTP (equivalente a helmet) ──────────────────────
app.use((req, res, next) => {
    // Evita que el navegador adivine el tipo MIME
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // Bloquea el renderizado en iframes de otros orígenes (clickjacking)
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    // Activa el filtro XSS del navegador (IE/Edge legacy)
    res.setHeader('X-XSS-Protection', '1; mode=block');
    // Fuerza HTTPS en producción
    if (process.env.NODE_ENV === 'production') {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    // No enviar la cabecera Referrer a otros orígenes
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    // Eliminar cabecera que revela que usamos Express
    res.removeHeader('X-Powered-By');
    next();
});

// ─── Rate limiting en rutas de autenticación ─────────────────────────────────
// Máximo 10 intentos por IP en ventana de 15 minutos
const loginAttempts = new Map();
const RATE_WINDOW_MS  = 15 * 60 * 1000; // 15 min
const RATE_MAX        = 10;

function loginRateLimiter(req, res, next) {
    const ip  = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    const entry = loginAttempts.get(ip) || { count: 0, resetAt: now + RATE_WINDOW_MS };

    // Si la ventana ha expirado, reiniciar
    if (now > entry.resetAt) {
        entry.count   = 0;
        entry.resetAt = now + RATE_WINDOW_MS;
    }

    entry.count++;
    loginAttempts.set(ip, entry);

    if (entry.count > RATE_MAX) {
        const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
        res.set('Retry-After', String(retryAfter));
        req.flash('error', `Demasiados intentos. Espera ${Math.ceil(retryAfter / 60)} minuto(s) e inténtalo de nuevo.`);
        return res.redirect('/auth/login');
    }
    next();
}

// Limpiar IPs caducadas cada 15 min para evitar fuga de memoria
setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of loginAttempts) {
        if (now > entry.resetAt) loginAttempts.delete(ip);
    }
}, RATE_WINDOW_MS);

// Exportar para usar en la ruta de login
app.locals.loginRateLimiter = loginRateLimiter;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'src/public')));

// ─── Sesiones (persistidas en PostgreSQL/Supabase) ───────────────────────────
if (!process.env.SESSION_SECRET) {
    if (process.env.NODE_ENV === 'production') {
        console.error('FATAL: SESSION_SECRET no está definido. El servidor no arrancará en producción sin él.');
        process.exit(1);
    } else {
        console.warn('⚠️  SESSION_SECRET no definido — usando secreto de desarrollo. NUNCA uses esto en producción.');
    }
}

const sessionStore = new PgSessionStore({
    connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL,
    tableName: 'user_sessions',
    ttl: 60 * 60 * 24 * 7, // 7 días
});

app.use(session({
    store: sessionStore,
    secret: process.env.SESSION_SECRET || 'dev-only-secret-no-usar-en-prod',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 7 // 7 días
    }
}));

// ─── Flash messages ───────────────────────────────────────────────────────────
app.use(flash());

// ─── Generación del token CSRF (disponible en todas las vistas como csrfToken) ─
app.use(csrfGenerate);

// ─── Variables globales de vistas ─────────────────────────────────────────────
app.use((req, res, next) => {
    res.locals.usuario = req.session.usuario || null;
    res.locals.mensajeExito = req.flash('exito');
    res.locals.mensajeError = req.flash('error');
    res.locals.paginaActual = req.path;
    next();
});

// ─── Rutas ────────────────────────────────────────────────────────────────────
app.use('/', require('./src/routes/index.routes'));
app.use('/auth', require('./src/routes/auth.routes'));
app.use('/categorias', require('./src/routes/categoria.routes'));
app.use('/inscripcion', require('./src/routes/inscripcion.routes'));
app.use('/tienda', require('./src/routes/tienda.routes'));
app.use('/noticias', require('./src/routes/noticia.routes'));
app.use('/admin', require('./src/routes/admin.routes'));

// ─── Error 404 ────────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).render('404', { title: 'Página no encontrada' });
});

// ─── Error 500 ────────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).render('404', { title: 'Error del servidor', mensaje: 'Ha ocurrido un error. Por favor, inténtalo de nuevo.' });
});

// ─── Arranque del servidor ────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
    console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
