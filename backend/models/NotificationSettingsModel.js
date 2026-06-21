const db = require('../db');

const DEFAULTS = Object.freeze({
  stock_low_threshold: 10,
  payment_failure_threshold: 5,
  payment_failure_window_minutes: 10,
});

exports.get = async () => {
  const [rows] = await db.query(
    `SELECT stock_low_threshold, payment_failure_threshold, payment_failure_window_minutes
       FROM notification_settings WHERE id = 1 LIMIT 1`
  );
  return rows[0] || { ...DEFAULTS };
};

exports.update = async (settings, updatedBy) => {
  await db.query(
    `INSERT INTO notification_settings
      (id, stock_low_threshold, payment_failure_threshold, payment_failure_window_minutes, updated_by)
     VALUES (1, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       stock_low_threshold = VALUES(stock_low_threshold),
       payment_failure_threshold = VALUES(payment_failure_threshold),
       payment_failure_window_minutes = VALUES(payment_failure_window_minutes),
       updated_by = VALUES(updated_by)`,
    [
      settings.stock_low_threshold,
      settings.payment_failure_threshold,
      settings.payment_failure_window_minutes,
      updatedBy,
    ]
  );
  return exports.get();
};

exports.DEFAULTS = DEFAULTS;
