const NotificationModel = require('../models/NotificationModel');
const NotificationSettingsModel = require('../models/NotificationSettingsModel');
const ApiError = require('../utils/ApiError');
const { CLIENT_TYPES, ADMIN_TYPES } = require('../middlewares/validators/notification');

/** GET /api/notifications — danh sách thông báo chưa lưu trữ */
exports.list = async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 30, 100);
    const offset = Number(req.query.offset) || 0;
    const items = await NotificationModel.findByUser(req.user.id, { limit, offset });
    const unread = await NotificationModel.countUnread(req.user.id);
    return res.json({ items, unread });
  } catch (error) {
    return next(error);
  }
};

/** GET /api/notifications/count — chỉ lấy số unread (dùng cho bell icon) */
exports.count = async (req, res, next) => {
  try {
    const unread = await NotificationModel.countUnread(req.user.id);
    return res.json({ unread });
  } catch (error) {
    return next(error);
  }
};

/** PATCH /api/notifications/:id/read — đánh dấu 1 thông báo đã đọc */
exports.markRead = async (req, res, next) => {
  try {
    const rows = await NotificationModel.markRead(req.params.id, req.user.id);
    if (!rows) throw new ApiError(404, 'Không tìm thấy thông báo.', 'NOTIFICATION_NOT_FOUND');
    return res.json({ message: 'Đã đánh dấu đã đọc.' });
  } catch (error) {
    return next(error);
  }
};

/** PATCH /api/notifications/read-all — đánh dấu tất cả đã đọc */
exports.markAllRead = async (req, res, next) => {
  try {
    await NotificationModel.markAllRead(req.user.id);
    return res.json({ message: 'Đã đánh dấu tất cả đã đọc.' });
  } catch (error) {
    return next(error);
  }
};

/** DELETE /api/notifications/:id — xoá 1 thông báo */
exports.deleteOne = async (req, res, next) => {
  try {
    const rows = await NotificationModel.deleteOne(req.params.id, req.user.id);
    if (!rows) throw new ApiError(404, 'Không tìm thấy thông báo.', 'NOTIFICATION_NOT_FOUND');
    return res.json({ message: 'Đã xoá thông báo.' });
  } catch (error) {
    return next(error);
  }
};

/** GET /api/notifications/preferences */
exports.getPreferences = async (req, res, next) => {
  try {
    const prefs = await NotificationModel.getPreferences(req.user.id);
    const types = req.user.role === 'admin' ? ADMIN_TYPES : CLIENT_TYPES;
    return res.json({ types, preferences: prefs.filter((pref) => types.includes(pref.type)) });
  } catch (error) {
    return next(error);
  }
};

/** PUT /api/notifications/preferences */
exports.setPreferences = async (req, res, next) => {
  try {
    const types = req.user.role === 'admin' ? ADMIN_TYPES : CLIENT_TYPES;
    const data = req.body;
    if (data.some((preference) => !types.includes(preference.type))) {
      throw new ApiError(403, 'Bạn không thể thay đổi loại thông báo này.', 'NOTIFICATION_TYPE_FORBIDDEN');
    }
    await NotificationModel.setPreferences(req.user.id, data);
    return res.json({ message: 'Đã cập nhật cài đặt thông báo.' });
  } catch (error) {
    return next(error);
  }
};

exports.getSettings = async (req, res, next) => {
  try {
    return res.json(await NotificationSettingsModel.get());
  } catch (error) {
    return next(error);
  }
};

exports.setSettings = async (req, res, next) => {
  try {
    const settings = await NotificationSettingsModel.update(req.body, req.user.id);
    return res.json({ message: 'Đã cập nhật ngưỡng cảnh báo.', settings });
  } catch (error) {
    return next(error);
  }
};
