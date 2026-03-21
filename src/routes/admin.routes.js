const express = require('express');
const router = express.Router();
const controller = require('../controllers/admin.controller');
const { requireAdmin } = require('../middleware/auth.middleware');

// Todas las rutas de admin requieren rol ADMIN
router.use(requireAdmin);

router.get('/dashboard', controller.dashboard);

// Usuarios
router.get('/usuarios', controller.usuarios);
router.post('/usuarios/:id/rol', controller.cambiarRol);

// Inscripciones
router.get('/inscripciones', controller.inscripciones);
router.post('/inscripciones/:id', controller.updateInscripcion);

// Productos
router.get('/productos', controller.productos);
router.post('/productos', controller.createProducto);
router.post('/productos/:id', controller.updateProducto);

// Noticias
router.get('/noticias', controller.noticias);
router.post('/noticias', controller.createNoticia);

// Partidos
router.get('/partidos', controller.partidos);
router.post('/partidos', controller.createPartido);
router.post('/partidos/:id', controller.updatePartido);

module.exports = router;
