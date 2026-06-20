const crypto = require('crypto');
const db = require('../db');

function createVoucherCode() {
  return `SL-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
}

exports.subscribe = async (email) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query(
      `INSERT INTO newsletter_subscribers (email, status)
       VALUES (?, 'active')
       ON DUPLICATE KEY UPDATE
         subscribed_at = IF(status = 'unsubscribed', CURRENT_TIMESTAMP, subscribed_at),
         unsubscribed_at = NULL,
         status = 'active'`,
      [email]
    );

    const [voucherRows] = await connection.query(
      'SELECT * FROM vouchers WHERE email = ? LIMIT 1 FOR UPDATE',
      [email]
    );
    let voucher = voucherRows[0];

    if (!voucher) {
      const code = createVoucherCode();
      const [result] = await connection.query(
        `INSERT INTO vouchers
          (user_id, code, email, discount_type, discount_value, min_order_amount, max_discount_amount, expires_at)
         VALUES ((SELECT id FROM users WHERE email = ? LIMIT 1), ?, ?, 'percent', 10, 500000, 100000, DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 30 DAY))`,
        [email, code, email]
      );
      const [createdRows] = await connection.query('SELECT * FROM vouchers WHERE id = ?', [result.insertId]);
      [voucher] = createdRows;
    }

    await connection.commit();
    return {
      status: voucher.email_sent_at ? 'duplicate' : 'success',
      voucher,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

exports.markVoucherEmailSent = (voucherId) => (
  db.query(
    'UPDATE vouchers SET email_sent_at = CURRENT_TIMESTAMP WHERE id = ? AND email_sent_at IS NULL',
    [voucherId]
  )
);
