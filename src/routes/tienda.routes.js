const express = require('express');
const router = express.Router();
const controller = require('../controllers/tienda.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.get('/', controller.index);
router.get('/carrito', controller.verCarrito);
router.post('/carrito/agregar', controller.addToCart);
router.post('/carrito/actualizar', controller.updateCart);
router.post('/carrito/eliminar', controller.removeFromCart);
router.get('/checkout', requireAuth, controller.showCheckout);
router.post('/checkout/confirmar', requireAuth, controller.showMockPayment);
router.post('/pago', requireAuth, controller.procesarPago);
router.get('/compra/:id', requireAuth, controller.showCompra);
router.get('/:id', controller.show);

module.exports = router;
