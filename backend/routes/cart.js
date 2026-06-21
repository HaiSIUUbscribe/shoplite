const express = require('express');
const { getCart, addToCart, updateQuantity, removeItem, clearCart } = require('../controllers/cart');
const { authenticate } = require('../middlewares/auth');
const { validate, idRules, cartAddRules, cartQuantityRules } = require('../middlewares/validate');

const router = express.Router();

router.use(authenticate);

router.get('/', getCart);
router.post('/', cartAddRules, validate, addToCart);
router.put('/:id', cartQuantityRules, validate, updateQuantity);
router.delete('/:id', idRules, validate, removeItem);
router.delete('/', clearCart);

module.exports = router;
