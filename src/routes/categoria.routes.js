const express = require('express');
const router = express.Router();
const controller = require('../controllers/categoria.controller');

router.get('/', controller.index);
router.get('/calendario', controller.calendario);
router.get('/resultados', controller.resultados);

// Rutas por nombre de categoría (sub10, sub12… senior)
router.get('/:nombre/calendario', controller.calendarioCategoria);
router.get('/:nombre/resultados', controller.resultadosCategoria);

// Detalle categoría — acepta nombre (sub10) o id numérico
router.get('/:id', controller.show);

module.exports = router;
