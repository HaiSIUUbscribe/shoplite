const db = require('../db');

const ARCHIVE_DAYS = 30;

function parseData(value) {
  if (!value || typeof value === 'object') return value || null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

exports.getPreference = async (userId, type) => {
  const [rows] = await db.query(
    'SELECT enabled, email_enabled FROM notification_preferences WHERE user_id = ? AND type = ? LIMIT 1',
    [userId, type]
  );
  return rows[0] || { enabled: 1, email_enabled: 1 };
};

/** Tạo thông báo mới. Trả về insertId hoặc null nếu user đã tắt type này. */
exports.create = async (userId, { type, title, message, data = null }, { skipPreference = false } = {}) => {
  if (!skipPreference && (await exports.getPreference(userId, type)).enabled === 0) return null;

  const [result] = await db.query(
    'INSERT INTO notifications (user_id, type, title, message, data) VALUES (?, ?, ?, ?, ?)',
    [userId, type, title, message, data ? JSON.stringify(data) : null]
  );
  return result.insertId;
};

/** Danh sách thông báo chưa lưu trữ của user, mới nhất lên đầu. */
exports.findByUser = async (userId, { limit = 30, offset = 0 } = {}) => {
  const [rows] = await db.query(
    `SELECT id, type, title, message, data, is_read, created_at
       FROM notifications
      WHERE user_id = ? AND archived_at IS NULL
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );
  return rows.map((r) => ({ ...r, data: parseData(r.data) }));
};

/** Số thông báo chưa đọc (không tính đã lưu trữ). */
exports.countUnread = async (userId) => {
  const [[row]] = await db.query(
    'SELECT COUNT(*) AS cnt FROM notifications WHERE user_id = ? AND is_read = 0 AND archived_at IS NULL',
    [userId]
  );
  return Number(row.cnt);
};

/** Đánh dấu một thông báo là đã đọc. */
exports.markRead = async (id, userId) => {
  const [result] = await db.query(
    'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
    [id, userId]
  );
  return result.affectedRows;
};

/** Đánh dấu tất cả thông báo của user là đã đọc. */
exports.markAllRead = async (userId) => {
  const [result] = await db.query(
    'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND archived_at IS NULL',
    [userId]
  );
  return result.affectedRows;
};

/** Xoá một thông báo. */
exports.deleteOne = async (id, userId) => {
  const [result] = await db.query(
    'DELETE FROM notifications WHERE id = ? AND user_id = ?',
    [id, userId]
  );
  return result.affectedRows;
};

/** Lưu trữ các thông báo cũ hơn ARCHIVE_DAYS ngày. */
exports.archiveOld = async () => {
  const [result] = await db.query(
    `UPDATE notifications
        SET archived_at = NOW()
      WHERE archived_at IS NULL
        AND created_at < DATE_SUB(NOW(), INTERVAL ? DAY)`,
    [ARCHIVE_DAYS]
  );
  return result.affectedRows;
};

/** Lấy tùy chọn kênh nhận cho từng loại thông báo. */
exports.getPreferences = async (userId) => {
  const [rows] = await db.query(
    'SELECT type, enabled, email_enabled FROM notification_preferences WHERE user_id = ?',
    [userId]
  );
  return rows;
};

/** Upsert nhiều tùy chọn kênh nhận cùng lúc. */
exports.setPreferences = async (userId, data) => {
  if (!data.length) return;
  const values = data.map((p) => [userId, p.type, p.enabled ? 1 : 0, p.email_enabled ? 1 : 0]);
  await db.query(
    `INSERT INTO notification_preferences (user_id, type, enabled, email_enabled) VALUES ?
     ON DUPLICATE KEY UPDATE enabled = VALUES(enabled), email_enabled = VALUES(email_enabled)`,
    [values]
  );
};
