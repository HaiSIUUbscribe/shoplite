const express = require('express');
const payments = require('../controllers/payments');

const router = express.Router();

router.get('/vnpay/return', payments.vnpayReturn);
router.get('/vnpay/ipn', payments.vnpayIpn);

module.exports = router;
