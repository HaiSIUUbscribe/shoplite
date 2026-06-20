const crypto = require('crypto');
const db = require('../db');

function createCode() {
  return `SL-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
}

exports.claimForUser = async (userId, email) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query(
      `SELECT * FROM vouchers
       WHERE user_id = ? OR (user_id IS NULL AND email = ?)
       ORDER BY user_id IS NOT NULL DESC
       LIMIT 1 FOR UPDATE`,
      [userId, email]
    );
    let voucher = rows[0];

    if (voucher) {
      if (!voucher.user_id) {
        await connection.query('UPDATE vouchers SET user_id = ? WHERE id = ?', [userId, voucher.id]);
        voucher = { ...voucher, user_id: userId };
      }
      await connection.commit();
      return voucher;
    }

    const [result] = await connection.query(
      `INSERT INTO vouchers
        (user_id, code, email, discount_type, discount_value, min_order_amount, max_discount_amount, expires_at)
       VALUES (?, ?, ?, 'percent', 10, 500000, 100000, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 30 DAY))`,
      [userId, createCode(), email]
    );
    const [createdRows] = await connection.query('SELECT * FROM vouchers WHERE id = ?', [result.insertId]);
    [voucher] = createdRows;
    await connection.commit();
    return voucher;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

exports.findByCode = async (code) => {
  const [rows] = await db.query('SELECT * FROM vouchers WHERE code = ? LIMIT 1', [code]);
  return rows[0] || null;
};

exports.findByCodeForUpdate = async (connection, code) => {
  const [rows] = await connection.query(
    'SELECT * FROM vouchers WHERE code = ? LIMIT 1 FOR UPDATE',
    [code]
  );
  return rows[0] || null;
};

exports.markUsed = async (connection, id, orderId) => {
  const [result] = await connection.query(
    `UPDATE vouchers
     SET status = 'used', used_at = CURRENT_TIMESTAMP, used_order_id = ?
     WHERE id = ? AND status = 'active'`,
    [orderId, id]
  );
  return result.affectedRows;
};

exports.releaseByOrderId = (connection, orderId) => (
  connection.query(
    `UPDATE vouchers
     SET status = 'active', used_at = NULL, used_order_id = NULL
     WHERE used_order_id = ? AND status = 'used'`,
    [orderId]
  )
);

exports.markEmailSent = (id) => (
  db.query('UPDATE vouchers SET email_sent_at = CURRENT_TIMESTAMP WHERE id = ? AND email_sent_at IS NULL', [id])
);
