const { body, query } = require('express-validator');
const { idParam } = require('./common');

const profileRules = [
  body('name').trim().isLength({ min: 2, max: 120 }).withMessage('Họ tên phải có từ 2 đến 120 ký tự.'),
  body('email').trim().normalizeEmail().isEmail().withMessage('Email không hợp lệ.'),
];

const adminUserRules = [
  idParam,
  body('name').trim().isLength({ min: 2, max: 120 }).withMessage('Họ tên không hợp lệ.'),
  body('email').trim().normalizeEmail().isEmail().withMessage('Email không hợp lệ.'),
  body('phone')
    .optional({ nullable: true, checkFalsy: true })
    .trim()
    .matches(/^(\+84|0)\d{9,10}$/)
    .withMessage('Số điện thoại không hợp lệ.'),
  body('role').isIn(['client', 'admin']).withMessage('Vai trò không hợp lệ.'),
];

const adminUserStatusRules = [
  idParam,
  body('status').isIn(['active', 'locked']).withMessage('Trạng thái tài khoản không hợp lệ.'),
];

const adminUserListRules = [
  query('search').optional().trim().isLength({ max: 120 }).withMessage('Từ khóa tìm kiếm quá dài.'),
  query('role').optional({ checkFalsy: true }).isIn(['client', 'admin']).withMessage('Vai trò không hợp lệ.'),
  query('status').optional({ checkFalsy: true }).isIn(['active', 'locked']).withMessage('Trạng thái không hợp lệ.'),
  query('provider').optional({ checkFalsy: true }).isIn(['local', 'google', 'facebook']).withMessage('Nguồn tài khoản không hợp lệ.'),
  query('page').optional().isInt({ min: 1 }).withMessage('Trang không hợp lệ.').toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Số tài khoản mỗi trang không hợp lệ.').toInt(),
];

module.exports = {
  profileRules,
  adminUserRules,
  adminUserStatusRules,
  adminUserListRules,
};
