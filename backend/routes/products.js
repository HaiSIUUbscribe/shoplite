const express = require('express');
const router = express.Router();
const products = require('../controllers/products');
const reviews = require('../controllers/reviews');
const { authenticate, isAdmin } = require('../middlewares/auth');
const { uploadExcel, uploadProductImages } = require('../middlewares/upload');
const { validate, idRules, productRules, productListRules, reviewRules } = require('../middlewares/validate');

router.get('/', productListRules, validate, products.getProducts);
router.get('/categories', products.getCategories);
router.get('/reviews/mine', authenticate, reviews.getMyReviewedProductIds);
router.get('/import-template', authenticate, isAdmin, products.downloadImportTemplate);
router.post('/import', authenticate, isAdmin, uploadExcel, products.importProducts);
router.post('/images/upload', authenticate, isAdmin, uploadProductImages, products.uploadImages);
router.get('/:id', idRules, validate, products.getProductById);
router.post('/', authenticate, isAdmin, productRules, validate, products.createProduct);
router.put('/:id', authenticate, isAdmin, idRules, productRules, validate, products.updateProduct);
router.delete('/:id', authenticate, isAdmin, idRules, validate, products.deleteProduct);

router.get('/:id/reviews', idRules, validate, reviews.getByProduct);
router.post('/:id/reviews', authenticate, reviewRules, validate, reviews.create);

module.exports = router;
