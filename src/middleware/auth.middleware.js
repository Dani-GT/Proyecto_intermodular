// Middleware de autenticación

// Verificar que el usuario está autenticado
const requireAuth = (req, res, next) => {
    if (!req.session.usuario) {
        req.flash('error', 'Debes iniciar sesión para acceder a esta página.');
        return res.redirect('/auth/login');
    }
    next();
};

// Verificar que el usuario es administrador
const requireAdmin = (req, res, next) => {
    if (!req.session.usuario) {
        req.flash('error', 'Debes iniciar sesión para acceder a esta página.');
        return res.redirect('/auth/login');
    }
    if (req.session.usuario.rol !== 'ADMIN') {
        req.flash('error', 'No tienes permisos para acceder a esta sección.');
        return res.redirect('/');
    }
    next();
};

// Redirigir si ya está autenticado (para login/registro)
const redirectIfAuth = (req, res, next) => {
    if (req.session.usuario) {
        return res.redirect('/');
    }
    next();
};

module.exports = { requireAuth, requireAdmin, redirectIfAuth };
