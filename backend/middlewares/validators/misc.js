const { body } = require('express-validator');

const contactRules = [
  body('name').trim().isLength({ min: 2, max: 120 }).withMessage('Họ tên không hợp lệ.'),
  body('email').trim().normalizeEmail().isEmail().withMessage('Email không hợp lệ.'),
  body('phone').optional({ checkFalsy: true }).trim().matches(/^[0-9+().\s-]{8,20}$/).withMessage('Số điện thoại không hợp lệ.'),
  body('subject').isIn(['order', 'payment', 'returns', 'product', 'account', 'other']).withMessage('Chủ đề hỗ trợ không hợp lệ.'),
  body('order_id').optional({ checkFalsy: true }).isInt({ min: 1 }).withMessage('Mã đơn hàng không hợp lệ.').toInt(),
  body('message').trim().isLength({ min: 10, max: 3000 }).withMessage('Nội dung phải có từ 10 đến 3.000 ký tự.'),
];

const newsletterRules = [
  body('email')
    .trim()
    .normalizeEmail()
    .isEmail()
    .withMessage('Email không hợp lệ.')
    .isLength({ max: 190 })
    .withMessage('Email không được vượt quá 190 ký tự.'),
];

const voucherValidationRules = [
  body('code').trim().matches(/^[A-Za-z0-9-]{6,32}$/).withMessage('Mã voucher không hợp lệ.'),
  body('email').trim().normalizeEmail().isEmail().withMessage('Email không hợp lệ.'),
  body('subtotal').isFloat({ min: 0 }).withMessage('Tạm tính đơn hàng không hợp lệ.').toFloat(),
];

module.exports = {
  contactRules,
  newsletterRules,
  voucherValidationRules,
};
