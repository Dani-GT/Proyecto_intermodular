const express = require('express');
const router = express.Router();
const controller = require('../controllers/admin.controller');
const { requireAdmin } = require('../middleware/auth.middleware');
const { uploadNoticia, uploadProducto, handleUploadError } = require('../middleware/upload.middleware');
const { csrfVerify } = require('../middleware/csrf.middleware');

// Todas las rutas de admin requieren rol ADMIN
router.use(requireAdmin);

router.get('/dashboard', controller.dashboard);

// Usuarios
router.get('/usuarios', controller.usuarios);
router.post('/usuarios/:id/rol', csrfVerify, controller.cambiarRol);
router.post('/usuarios/:id/eliminar', csrfVerify, controller.deleteUsuario);

// Jugadores / Técnicos (crear persona + inscripción)
router.post('/jugadores', csrfVerify, controller.createJugador);

// Inscripciones
router.get('/inscripciones', controller.inscripciones);
router.post('/inscripciones/:id', csrfVerify, controller.updateInscripcion);
router.post('/inscripciones/:id/eliminar', csrfVerify, controller.deleteInscripcion);

// Productos — con subida de imagen
// Para multipart/form-data el body lo parsea multer, así que csrfVerify va DESPUÉS del upload
router.get('/productos', controller.productos);
router.post('/productos', handleUploadError(uploadProducto), csrfVerify, controller.createProducto);
router.post('/productos/:id', handleUploadError(uploadProducto), csrfVerify, controller.updateProducto);

// Noticias — con subida de imagen
router.get('/noticias', controller.noticias);
router.post('/noticias', handleUploadError(uploadNoticia), csrfVerify, controller.createNoticia);
router.post('/noticias/:id', handleUploadError(uploadNoticia), csrfVerify, controller.updateNoticia);

// Partidos
router.get('/partidos', controller.partidos);
router.post('/partidos', csrfVerify, controller.createPartido);
router.post('/partidos/:id', csrfVerify, controller.updatePartido);

module.exports = router;
