require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Motor de vistas ─────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'src/views'));

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'src/public')));

// ─── Sesiones ────────────────────────────────────────────────────────────────
app.use(session({
    secret: process.env.SESSION_SECRET || 'cbg-secret-2025',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 1000 * 60 * 60 * 24 * 7 // 7 días
    }
}));

// ─── Flash messages ───────────────────────────────────────────────────────────
app.use(flash());

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
