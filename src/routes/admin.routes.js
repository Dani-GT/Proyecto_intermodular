const express = require('express');
const router = express.Router();
const controller = require('../controllers/admin.controller');
const { requireAdmin } = require('../middleware/auth.middleware');
const { uploadNoticia, uploadProducto, handleUploadError } = require('../middleware/upload.middleware');

// Todas las rutas de admin requieren rol ADMIN
router.use(requireAdmin);

router.get('/dashboard', controller.dashboard);

// Usuarios
router.get('/usuarios', controller.usuarios);
router.post('/usuarios/:id/rol', controller.cambiarRol);
router.post('/usuarios/:id/eliminar', controller.deleteUsuario);

// Jugadores / Técnicos (crear persona + inscripción)
router.post('/jugadores', controller.createJugador);

// Inscripciones
router.get('/inscripciones', controller.inscripciones);
router.post('/inscripciones/:id', controller.updateInscripcion);
router.post('/inscripciones/:id/eliminar', controller.deleteInscripcion);

// Productos — con subida de imagen
router.get('/productos', controller.productos);
router.post('/productos', handleUploadError(uploadProducto), controller.createProducto);
router.post('/productos/:id', handleUploadError(uploadProducto), controller.updateProducto);

// Noticias — con subida de imagen
router.get('/noticias', controller.noticias);
router.post('/noticias', handleUploadError(uploadNoticia), controller.createNoticia);
router.post('/noticias/:id', handleUploadError(uploadNoticia), controller.updateNoticia);

// Partidos
router.get('/partidos', controller.partidos);
router.post('/partidos', controller.createPartido);
router.post('/partidos/:id', controller.updatePartido);

module.exports = router;
