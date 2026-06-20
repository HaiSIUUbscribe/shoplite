const crypto = require('crypto');
const { VNPay, ignoreLogger } = require('vnpay');
const ApiError = require('../utils/ApiError');

let client;
let clientConfigKey;

function isConfigured() {
  return Boolean(process.env.VNPAY_TMN_CODE && process.env.VNPAY_SECURE_SECRET);
}

function getClient() {
  if (!isConfigured()) {
    throw new ApiError(503, 'VNPay chưa được cấu hình.', 'VNPAY_NOT_CONFIGURED');
  }

  const configKey = [
    process.env.VNPAY_TMN_CODE,
    process.env.VNPAY_SECURE_SECRET,
    process.env.VNPAY_HOST,
    process.env.VNPAY_TEST_MODE,
  ].join('|');

  if (!client || clientConfigKey !== configKey) {
    client = new VNPay({
      tmnCode: process.env.VNPAY_TMN_CODE,
      secureSecret: process.env.VNPAY_SECURE_SECRET,
      vnpayHost: process.env.VNPAY_HOST || 'https://sandbox.vnpayment.vn',
      testMode: process.env.VNPAY_TEST_MODE !== 'false',
      hashAlgorithm: 'SHA512',
      enableLog: false,
      loggerFn: ignoreLogger,
    });
    clientConfigKey = configKey;
  }
  return client;
}

function getClientIp(req) {
  const forwarded = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return (forwarded || req.socket?.remoteAddress || req.ip || '127.0.0.1').replace(/^::ffff:/, '');
}

function getReturnUrl() {
  if (process.env.VNPAY_RETURN_URL) return process.env.VNPAY_RETURN_URL;
  const apiOrigin = String(process.env.PUBLIC_API_URL || `http://localhost:${process.env.PORT || 3600}`).replace(/\/$/, '');
  return `${apiOrigin}/api/payments/vnpay/return`;
}

function createTxnRef(orderId) {
  return `SL${orderId}${Date.now()}${crypto.randomBytes(3).toString('hex')}`;
}

function buildPaymentUrl({ amount, orderId, txnRef, ipAddress }) {
  return getClient().buildPaymentUrl({
    vnp_Amount: Number(amount),
    vnp_IpAddr: ipAddress,
    vnp_ReturnUrl: getReturnUrl(),
    vnp_TxnRef: txnRef,
    vnp_OrderInfo: `Thanh toan don hang ShopLite ${orderId}`,
    vnp_OrderType: 'other',
    vnp_Locale: 'vn',
  });
}

module.exports = {
  isConfigured,
  getClient,
  getClientIp,
  createTxnRef,
  buildPaymentUrl,
};
