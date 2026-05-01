const express = require('express');
const router = express.Router();
const controller = require('../controllers/auth.controller');
const { requireAuth, redirectIfAuth } = require('../middleware/auth.middleware');
const { csrfVerify } = require('../middleware/csrf.middleware');

router.get('/registro', redirectIfAuth, controller.showRegister);
router.post('/registro', redirectIfAuth, csrfVerify, controller.register);

router.get('/login', redirectIfAuth, controller.showLogin);
// Rate limiter: máx. 10 intentos por IP / 15 min (middleware definido en app.js)
router.post('/login', redirectIfAuth, (req, res, next) => {
    const limiter = req.app.locals.loginRateLimiter;
    if (limiter) return limiter(req, res, next);
    next();
}, csrfVerify, controller.login);

router.post('/logout', csrfVerify, controller.logout);

router.get('/perfil', requireAuth, controller.showPerfil);
router.post('/perfil/editar', requireAuth, csrfVerify, controller.updatePerfil);
router.post('/perfil/password', requireAuth, csrfVerify, controller.updatePassword);

module.exports = router;
