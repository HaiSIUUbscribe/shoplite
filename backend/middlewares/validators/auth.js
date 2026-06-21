const { body } = require('express-validator');

const registerRules = [
  body('name').trim().isLength({ min: 2, max: 120 }).withMessage('Họ tên phải có từ 2 đến 120 ký tự.'),
  body('email').trim().normalizeEmail().isEmail().withMessage('Email không hợp lệ.'),
  body('password').isLength({ min: 8, max: 72 }).withMessage('Mật khẩu phải có từ 8 đến 72 ký tự.'),
];

const loginRules = [
  body('email').trim().normalizeEmail().isEmail().withMessage('Email không hợp lệ.'),
  body('password').notEmpty().withMessage('Vui lòng nhập mật khẩu.'),
];

const socialLoginRules = [
  body('provider').isIn(['google']).withMessage('Nhà cung cấp đăng nhập không được hỗ trợ.'),
  body('token').isString().isLength({ min: 20, max: 5000 }).withMessage('Token đăng nhập không hợp lệ.'),
];

const forgotPasswordRules = [
  body('email').trim().normalizeEmail().isEmail().withMessage('Email không hợp lệ.'),
];

const resetPasswordRules = [
  body('token').notEmpty().withMessage('Thiếu mã đặt lại mật khẩu.'),
  body('password').isLength({ min: 8, max: 72 }).withMessage('Mật khẩu phải có từ 8 đến 72 ký tự.'),
];

const changePasswordRules = [
  body('current_password').notEmpty().withMessage('Vui lòng nhập mật khẩu hiện tại.'),
  body('new_password').isLength({ min: 8, max: 72 }).withMessage('Mật khẩu mới phải có từ 8 đến 72 ký tự.'),
];

module.exports = {
  registerRules,
  loginRules,
  socialLoginRules,
  forgotPasswordRules,
  resetPasswordRules,
  changePasswordRules,
};
