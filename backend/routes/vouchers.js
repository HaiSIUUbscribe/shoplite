const express = require('express');
const vouchers = require('../controllers/vouchers');
const { authenticate } = require('../middlewares/auth');
const { validate, voucherValidationRules } = require('../middlewares/validate');

const router = express.Router();

router.post('/claim', authenticate, vouchers.claim);
router.post('/validate', authenticate, voucherValidationRules, validate, vouchers.validate);

module.exports = router;
