const { body, param } = require('express-validator');
const { idParam } = require('./common');

const addressBodyRules = [
  body('label').optional({ nullable: true }).trim().isLength({ max: 60 }).withMessage('Nhãn địa chỉ tối đa 60 ký tự.'),
  body('recipient').trim().isLength({ min: 2, max: 120 }).withMessage('Tên người nhận phải có từ 2 đến 120 ký tự.'),
  body('phone').trim().matches(/^(\+84|0)\d{9,10}$/).withMessage('Số điện thoại không hợp lệ.'),
  body('province').trim().isLength({ min: 2, max: 100 }).withMessage('Tỉnh/Thành phố không hợp lệ.'),
  body('district').trim().isLength({ min: 2, max: 100 }).withMessage('Quận/Huyện không hợp lệ.'),
  body('ward').trim().isLength({ min: 2, max: 100 }).withMessage('Phường/Xã không hợp lệ.'),
  body('street').trim().isLength({ min: 2, max: 300 }).withMessage('Địa chỉ cụ thể phải có từ 2 đến 300 ký tự.'),
  body('is_default').optional().isBoolean().withMessage('Trạng thái địa chỉ mặc định không hợp lệ.').toBoolean(),
];

const addressCreateRules = [...addressBodyRules];
const addressUpdateRules = [idParam, ...addressBodyRules];
const addressIdRules = [idParam];

const favoriteCreateRules = [
  body('productId').isInt({ min: 1 }).withMessage('ID sản phẩm không hợp lệ.').toInt(),
];
const favoriteIdRules = [
  param('productId').isInt({ min: 1 }).withMessage('ID sản phẩm không hợp lệ.').toInt(),
];

module.exports = {
  addressCreateRules,
  addressUpdateRules,
  addressIdRules,
  favoriteCreateRules,
  favoriteIdRules,
};
