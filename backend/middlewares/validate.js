const { body, param, query, validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

const validate = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) return next();

  const details = result.array({ onlyFirstError: true }).map((error) => ({
    field: error.path,
    message: error.msg,
  }));
  return next(new ApiError(422, 'Dữ liệu gửi lên chưa hợp lệ.', 'VALIDATION_ERROR', details));
};

const idParam = param('id').isInt({ min: 1 }).withMessage('ID không hợp lệ.').toInt();

const registerRules = [
  body('name').trim().isLength({ min: 2, max: 120 }).withMessage('Họ tên phải có từ 2 đến 120 ký tự.'),
  body('email').trim().normalizeEmail().isEmail().withMessage('Email không hợp lệ.'),
  body('password').isLength({ min: 8, max: 72 }).withMessage('Mật khẩu phải có từ 8 đến 72 ký tự.'),
];

const loginRules = [
  body('email').trim().normalizeEmail().isEmail().withMessage('Email không hợp lệ.'),
  body('password').notEmpty().withMessage('Vui lòng nhập mật khẩu.'),
];

const forgotPasswordRules = [
  body('email').trim().normalizeEmail().isEmail().withMessage('Email không hợp lệ.'),
];

const resetPasswordRules = [
  body('token').notEmpty().withMessage('Thiếu mã đặt lại mật khẩu.'),
  body('password').isLength({ min: 8, max: 72 }).withMessage('Mật khẩu phải có từ 8 đến 72 ký tự.'),
];

const profileRules = [
  body('name').trim().isLength({ min: 2, max: 120 }).withMessage('Họ tên phải có từ 2 đến 120 ký tự.'),
  body('email').trim().normalizeEmail().isEmail().withMessage('Email không hợp lệ.'),
];

const productRules = [
  body('title').trim().isLength({ min: 2, max: 180 }).withMessage('Tên sản phẩm phải có từ 2 đến 180 ký tự.'),
  body('description').optional({ nullable: true }).trim().isLength({ max: 10000 }).withMessage('Mô tả quá dài.'),
  body('price').isFloat({ min: 0 }).withMessage('Giá sản phẩm không hợp lệ.').toFloat(),
  body('category').optional({ nullable: true }).trim().isLength({ max: 100 }).withMessage('Danh mục tối đa 100 ký tự.'),
  body('sizes').optional().isArray({ max: 20 }).withMessage('Danh sách size không hợp lệ.'),
  body('sizes.*').isString().trim().isLength({ min: 1, max: 30 }).withMessage('Mỗi size phải có từ 1 đến 30 ký tự.'),
  body('colors').optional().isArray({ max: 20 }).withMessage('Danh sách màu không hợp lệ.'),
  body('colors.*').isString().trim().isLength({ min: 1, max: 30 }).withMessage('Mỗi màu phải có từ 1 đến 30 ký tự.'),
  body('thumbnail')
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage('URL hình ảnh quá dài.')
    .isURL({ require_tld: false, protocols: ['http', 'https'], require_protocol: true })
    .withMessage('URL hình ảnh không hợp lệ.'),
  body('stock').isInt({ min: 0, max: 1000000 }).withMessage('Tồn kho phải là số nguyên không âm.').toInt(),
];

const productListRules = [
  query('search').optional().trim().isLength({ max: 100 }).withMessage('Từ khóa tìm kiếm quá dài.'),
  query('category').optional().trim().isLength({ max: 100 }).withMessage('Danh mục không hợp lệ.'),
  query('sort').optional().isIn(['newest', 'price-asc', 'price-desc', 'name']).withMessage('Kiểu sắp xếp không hợp lệ.'),
  query('min_price').optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('Giá tối thiểu không hợp lệ.').toFloat(),
  query('max_price').optional({ checkFalsy: true }).isFloat({ min: 0 }).withMessage('Giá tối đa không hợp lệ.').toFloat(),
  query().custom((value, { req }) => {
    if (req.query.min_price !== undefined && req.query.max_price !== undefined
      && Number(req.query.min_price) > Number(req.query.max_price)) {
      throw new Error('Giá tối thiểu không được lớn hơn giá tối đa.');
    }
    return true;
  }),
];

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
];

const statusRules = [
  idParam,
  body('status').isIn(['pending', 'processing', 'shipping', 'done', 'cancelled']).withMessage('Trạng thái đơn hàng không hợp lệ.'),
];

const adminUserRules = [
  idParam,
  body('name').trim().isLength({ min: 2, max: 120 }).withMessage('Họ tên không hợp lệ.'),
  body('email').trim().normalizeEmail().isEmail().withMessage('Email không hợp lệ.'),
  body('role').isIn(['client', 'admin']).withMessage('Vai trò không hợp lệ.'),
];

const changePasswordRules = [
  body('current_password').notEmpty().withMessage('Vui lòng nhập mật khẩu hiện tại.'),
  body('new_password').isLength({ min: 8, max: 72 }).withMessage('Mật khẩu mới phải có từ 8 đến 72 ký tự.'),
];

const contactRules = [
  body('name').trim().isLength({ min: 2, max: 120 }).withMessage('Họ tên không hợp lệ.'),
  body('email').trim().normalizeEmail().isEmail().withMessage('Email không hợp lệ.'),
  body('phone').optional({ checkFalsy: true }).trim().matches(/^[0-9+().\s-]{8,20}$/).withMessage('Số điện thoại không hợp lệ.'),
  body('subject').trim().isLength({ min: 3, max: 160 }).withMessage('Chủ đề phải có từ 3 đến 160 ký tự.'),
  body('message').trim().isLength({ min: 10, max: 3000 }).withMessage('Nội dung phải có từ 10 đến 3.000 ký tự.'),
];

module.exports = {
  validate,
  idRules: [idParam],
  registerRules,
  loginRules,
  forgotPasswordRules,
  resetPasswordRules,
  profileRules,
  productRules,
  productListRules,
  orderRules,
  statusRules,
  adminUserRules,
  changePasswordRules,
  contactRules,
};
