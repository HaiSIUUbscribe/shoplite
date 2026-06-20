const express = require('express');
const router = express.Router();
const orders = require('../controllers/orders');
const { authenticate, isAdmin } = require('../middlewares/auth');
const { validate, idRules, orderRules, statusRules } = require('../middlewares/validate');

router.post('/', authenticate, orderRules, validate, orders.createOrder);
router.get('/my', authenticate, orders.getMyOrders);
router.get('/', authenticate, isAdmin, orders.getAllOrders);
router.get('/:id', authenticate, idRules, validate, orders.getOrderById);
router.put('/:id/status', authenticate, isAdmin, statusRules, validate, orders.updateStatus);

module.exports = router;
