const { body } = require('express-validator');
const { idParam } = require('./common');

const cartAddRules = [
  body('productId').isInt({ min: 1 }).withMessage('Mã sản phẩm không hợp lệ.').toInt(),
  body('quantity').optional().isInt({ min: 1, max: 99 }).withMessage('Số lượng phải từ 1 đến 99.').toInt(),
  body('size').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 50 }).withMessage('Size không hợp lệ.'),
  body('color').optional({ nullable: true, checkFalsy: true }).trim().isLength({ max: 50 }).withMessage('Màu sắc không hợp lệ.'),
];

const cartQuantityRules = [
  idParam,
  body('quantity').isInt({ min: 1, max: 99 }).withMessage('Số lượng phải từ 1 đến 99.').toInt(),
];

module.exports = {
  cartAddRules,
  cartQuantityRules,
};
