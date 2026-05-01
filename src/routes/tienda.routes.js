const express = require('express');
const router = express.Router();
const controller = require('../controllers/tienda.controller');
const { requireAuth } = require('../middleware/auth.middleware');
const { csrfVerify } = require('../middleware/csrf.middleware');

router.get('/', controller.index);
router.get('/carrito', controller.verCarrito);
router.post('/carrito/agregar', csrfVerify, controller.addToCart);
router.post('/carrito/actualizar', csrfVerify, controller.updateCart);
router.post('/carrito/eliminar', csrfVerify, controller.removeFromCart);
router.get('/checkout', requireAuth, controller.showCheckout);
router.post('/checkout/confirmar', requireAuth, csrfVerify, controller.showMockPayment);
router.post('/pago', requireAuth, csrfVerify, controller.procesarPago);
router.get('/compra/:id', requireAuth, controller.showCompra);
router.get('/:id', controller.show);

module.exports = router;
