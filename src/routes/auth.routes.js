const express = require('express');
const router = express.Router();
const controller = require('../controllers/auth.controller');
const { requireAuth, redirectIfAuth } = require('../middleware/auth.middleware');

router.get('/registro', redirectIfAuth, controller.showRegister);
router.post('/registro', redirectIfAuth, controller.register);

router.get('/login', redirectIfAuth, controller.showLogin);
router.post('/login', redirectIfAuth, controller.login);

router.post('/logout', controller.logout);

router.get('/perfil', requireAuth, controller.showPerfil);

module.exports = router;
