const { body, query } = require('express-validator');
const { idParam } = require('./common');

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

const reviewRules = [
  idParam,
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Đánh giá phải từ 1 đến 5 sao.').toInt(),
  body('comment')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Nội dung đánh giá tối đa 1.000 ký tự.'),
];

module.exports = {
  productRules,
  productListRules,
  reviewRules,
};
