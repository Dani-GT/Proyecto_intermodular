/**
 * csrf.middleware.js
 * Protección CSRF mediante patrón Synchronizer Token.
 *
 * Funcionamiento:
 *  - csrfGenerate: genera un token aleatorio en sesión y lo expone como
 *    res.locals.csrfToken para que las vistas EJS lo incluyan en un campo oculto.
 *  - csrfVerify: valida que el token del formulario (campo "_csrf") coincide
 *    con el guardado en sesión antes de procesar la petición POST/PUT/DELETE.
 *
 * Uso en app.js:
 *   const { csrfGenerate, csrfVerify } = require('./src/middleware/csrf.middleware');
 *   app.use(csrfGenerate);   // después de session
 *
 * Uso en rutas sensibles (POST):
 *   router.post('/ruta', csrfVerify, controlador);
 *
 * Uso en vistas EJS:
 *   <input type="hidden" name="_csrf" value="<%= csrfToken %>">
 */

const crypto = require('crypto');

// Genera (o reutiliza) el token CSRF en sesión
function csrfGenerate(req, res, next) {
    if (!req.session.csrfToken) {
        req.session.csrfToken = crypto.randomBytes(32).toString('hex');
    }
    res.locals.csrfToken = req.session.csrfToken;
    next();
}

// Verifica el token en peticiones que modifican estado
function csrfVerify(req, res, next) {
    // Solo aplica a métodos que cambian estado
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();

    const tokenBody   = req.body && req.body._csrf;
    const tokenHeader = req.headers['x-csrf-token'];
    const tokenSesion = req.session && req.session.csrfToken;

    if (!tokenSesion || (tokenBody !== tokenSesion && tokenHeader !== tokenSesion)) {
        req.flash('error', 'Token de seguridad inválido. Por favor, recarga la página e inténtalo de nuevo.');
        return res.redirect('back');
    }
    next();
}

module.exports = { csrfGenerate, csrfVerify };
