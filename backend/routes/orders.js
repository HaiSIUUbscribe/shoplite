const express = require('express');
const router = express.Router();
const { authenticate, isAdmin } = require('../middlewares/auth');
const { createOrder, getMyOrders, getAllOrders, updateStatus } = require('../controllers/orders');

// Client routes
router.post('/', authenticate, createOrder);
router.get('/my', authenticate, getMyOrders);

// Admin routes
router.get('/', authenticate, isAdmin, getAllOrders);
router.put('/:id/status', authenticate, isAdmin, updateStatus);

module.exports = router;
