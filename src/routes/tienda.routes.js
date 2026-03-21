const express = require('express');
const router = express.Router();
const controller = require('../controllers/tienda.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.get('/', controller.index);
router.get('/carrito', controller.verCarrito);
router.post('/carrito/add', controller.addToCart);
router.post('/carrito/update', controller.updateCart);
router.post('/carrito/remove/:productoId', controller.removeFromCart);
router.get('/checkout', requireAuth, controller.showCheckout);
router.post('/checkout', requireAuth, controller.confirmarCompra);
router.get('/compra/:id', requireAuth, controller.showCompra);
router.get('/:id', controller.show);

module.exports = router;
