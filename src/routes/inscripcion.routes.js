const express = require('express');
const router = express.Router();
const controller = require('../controllers/inscripcion.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { csrfVerify } = require('../middleware/csrf.middleware');

router.get('/', requireAuth, controller.showForm);
router.post('/', requireAuth, csrfVerify, controller.inscribir);
router.get('/mis-inscripciones', requireAuth, controller.misInscripciones);

module.exports = router;
