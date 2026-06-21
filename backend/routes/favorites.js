const express = require('express');
const router = express.Router();
const favoritesController = require('../controllers/favorites');
const { authenticate } = require('../middlewares/auth');
const { validate, favoriteCreateRules, favoriteIdRules } = require('../middlewares/validate');

router.use(authenticate); // Tất cả API này yêu cầu đăng nhập

router.get('/', favoritesController.getMine);
router.get('/ids', favoritesController.getMineIds);
router.post('/', favoriteCreateRules, validate, favoritesController.add);
router.delete('/:productId', favoriteIdRules, validate, favoritesController.remove);

module.exports = router;
