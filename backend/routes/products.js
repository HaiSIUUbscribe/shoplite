const express = require('express');
const router = express.Router();
const products = require('../controllers/products');
const { authenticate, isAdmin } = require('../middlewares/auth');
const { uploadExcel, uploadProductImages } = require('../middlewares/upload');
const { validate, idRules, productRules, productListRules } = require('../middlewares/validate');

router.get('/', productListRules, validate, products.getProducts);
router.get('/categories', products.getCategories);
router.get('/import-template', authenticate, isAdmin, products.downloadImportTemplate);
router.post('/import', authenticate, isAdmin, uploadExcel, products.importProducts);
router.post('/images/upload', authenticate, isAdmin, uploadProductImages, products.uploadImages);
router.get('/:id', idRules, validate, products.getProductById);
router.post('/', authenticate, isAdmin, productRules, validate, products.createProduct);
router.put('/:id', authenticate, isAdmin, idRules, productRules, validate, products.updateProduct);
router.delete('/:id', authenticate, isAdmin, idRules, validate, products.deleteProduct);

module.exports = router;
