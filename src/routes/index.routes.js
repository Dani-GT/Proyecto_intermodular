const express = require('express');
const router = express.Router();
const indexController = require('../controllers/index.controller');

// Ruta principal
router.get('/', indexController.renderHome);

module.exports = router;
