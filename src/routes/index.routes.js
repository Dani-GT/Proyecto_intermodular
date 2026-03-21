const express = require('express');
const router = express.Router();
const controller = require('../controllers/index.controller');

router.get('/', controller.renderHome);
router.get('/club', controller.renderClub);
router.get('/contacto', controller.renderContacto);

module.exports = router;
