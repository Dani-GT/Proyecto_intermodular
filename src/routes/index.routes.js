const express = require('express');
const router = express.Router();
const controller = require('../controllers/index.controller');
const { csrfVerify } = require('../middleware/csrf.middleware');

router.get('/', controller.renderHome);
router.get('/club', controller.renderClub);
router.get('/contacto', controller.renderContacto);
router.post('/contacto', csrfVerify, controller.procesarContacto);

module.exports = router;
