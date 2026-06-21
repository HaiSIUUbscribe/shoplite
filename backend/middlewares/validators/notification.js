const { body, query } = require('express-validator');

const CLIENT_TYPES = [
  'account_registered', 'password_changed', 'order_created', 'order_status',
  'payment_success', 'payment_failed', 'payment_refunded',
];
const ADMIN_TYPES = [
  'order_created', 'order_cancel_requested', 'return_requested',
  'payment_failed', 'stock_low', 'stock_out',
];
const ALLOWED_TYPES = [...new Set([...CLIENT_TYPES, ...ADMIN_TYPES])];

const notificationListRules = [
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Giới hạn không hợp lệ.').toInt(),
  query('offset').optional().isInt({ min: 0 }).withMessage('Vị trí bắt đầu không hợp lệ.').toInt(),
];

const notificationPreferenceRules = [
  body().isArray({ min: 1, max: ALLOWED_TYPES.length }).withMessage('Danh sách cài đặt không hợp lệ.'),
  body('*.type').isIn(ALLOWED_TYPES).withMessage('Loại thông báo không hợp lệ.'),
  body('*.enabled').isBoolean().withMessage('Cài đặt thông báo trong ứng dụng không hợp lệ.').toBoolean(),
  body('*.email_enabled').isBoolean().withMessage('Cài đặt email không hợp lệ.').toBoolean(),
];

const notificationSettingsRules = [
  body('stock_low_threshold').isInt({ min: 1, max: 100000 }).withMessage('Ngưỡng tồn kho phải từ 1 đến 100.000.').toInt(),
  body('payment_failure_threshold').isInt({ min: 2, max: 100 }).withMessage('Ngưỡng lỗi thanh toán phải từ 2 đến 100.').toInt(),
  body('payment_failure_window_minutes').isInt({ min: 1, max: 1440 }).withMessage('Khoảng theo dõi lỗi phải từ 1 đến 1.440 phút.').toInt(),
];

module.exports = {
  CLIENT_TYPES,
  ADMIN_TYPES,
  notificationListRules,
  notificationPreferenceRules,
  notificationSettingsRules,
};
