const { body } = require('express-validator');
const { idParam } = require('./common');

const orderRules = [
  body('items').isArray({ min: 1, max: 100 }).withMessage('Giỏ hàng phải có từ 1 đến 100 sản phẩm.'),
  body('items.*.product_id').isInt({ min: 1 }).withMessage('Mã sản phẩm không hợp lệ.').toInt(),
  body('items.*.qty').isInt({ min: 1, max: 99 }).withMessage('Số lượng phải từ 1 đến 99.').toInt(),
  body('items.*.size').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 30 }).withMessage('Size sản phẩm không hợp lệ.'),
  body('items.*.color').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 30 }).withMessage('Màu sản phẩm không hợp lệ.'),
  body('customer_name').trim().isLength({ min: 2, max: 120 }).withMessage('Họ tên người nhận không hợp lệ.'),
  body('customer_email').trim().normalizeEmail().isEmail().withMessage('Email người nhận không hợp lệ.'),
  body('customer_phone').trim().matches(/^[0-9+().\s-]{8,20}$/).withMessage('Số điện thoại không hợp lệ.'),
  body('customer_address').trim().isLength({ min: 10, max: 500 }).withMessage('Địa chỉ phải có từ 10 đến 500 ký tự.'),
  body('payment_method').optional().isIn(['cod', 'bank_transfer', 'vnpay']).withMessage('Phương thức thanh toán không hợp lệ.'),
  body('voucher_code')
    .optional({ checkFalsy: true })
    .trim()
    .matches(/^[A-Za-z0-9-]{6,32}$/)
    .withMessage('Mã voucher không hợp lệ.'),
];

const statusRules = [
  idParam,
  body('status').isIn(['pending', 'processing', 'shipping', 'done', 'cancelled']).withMessage('Trạng thái đơn hàng không hợp lệ.'),
];

module.exports = {
  orderRules,
  statusRules,
};
