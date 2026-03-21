const express = require('express');
const router = express.Router();
const controller = require('../controllers/categoria.controller');

router.get('/', controller.index);
router.get('/calendario', controller.calendario);
router.get('/resultados', controller.resultados);
router.get('/:id', controller.show);

module.exports = router;
