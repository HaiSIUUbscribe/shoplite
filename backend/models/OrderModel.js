const db = require('../db');

exports.create = async (connection, order) => {
  const [result] = await connection.query(
    `INSERT INTO orders
      (user_id, items, subtotal, discount_amount, voucher_code, total, status, customer_name, customer_email, customer_phone, customer_address, payment_method, payment_status)
     VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?)`,
    [
      order.userId,
      JSON.stringify(order.items),
      order.subtotal,
      order.discountAmount,
      order.voucherCode,
      order.total,
      order.customerName,
      order.customerEmail,
      order.customerPhone,
      order.customerAddress,
      order.paymentMethod,
      order.paymentStatus,
    ]
  );
  return result.insertId;
};

exports.findByUserId = async (userId) => {
  const [rows] = await db.query('SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC', [userId]);
  return rows;
};

exports.findByIdAndUserId = async (id, userId) => {
  const [rows] = await db.query(
    'SELECT * FROM orders WHERE id = ? AND user_id = ? LIMIT 1',
    [id, userId]
  );
  return rows[0] || null;
};

exports.findById = async (id) => {
  const [rows] = await db.query('SELECT * FROM orders WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
};

exports.findAllWithUsers = async () => {
  const [rows] = await db.query(
    `SELECT orders.*, users.name AS user_name, users.email AS user_email
     FROM orders JOIN users ON users.id = orders.user_id ORDER BY orders.created_at DESC`
  );
  return rows;
};

exports.findByIdForUpdate = async (connection, id) => {
  const [rows] = await connection.query(
    'SELECT id, status, items, payment_method, payment_status, voucher_code FROM orders WHERE id = ? FOR UPDATE',
    [id]
  );
  return rows[0] || null;
};

exports.updateStatus = (connection, id, status) => (
  connection.query('UPDATE orders SET status = ? WHERE id = ?', [status, id])
);

exports.updatePaymentStatus = (connection, id, paymentStatus) => (
  connection.query('UPDATE orders SET payment_status = ? WHERE id = ?', [paymentStatus, id])
);

exports.claimConfirmationEmail = async (id) => {
  const [result] = await db.query(
    'UPDATE orders SET confirmation_email_sent_at = CURRENT_TIMESTAMP WHERE id = ? AND confirmation_email_sent_at IS NULL',
    [id]
  );
  return result.affectedRows === 1;
};

exports.releaseConfirmationEmailClaim = (id) => (
  db.query('UPDATE orders SET confirmation_email_sent_at = NULL WHERE id = ?', [id])
);

exports.getStats = async () => {
  const [[row]] = await db.query(
    `SELECT COUNT(*) AS totalOrders,
      COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total ELSE 0 END), 0) AS totalRevenue,
      SUM(status = 'pending') AS pendingOrders
     FROM orders`
  );
  return row;
};

exports.getMonthlyStats = async () => {
  const [rows] = await db.query(
    `SELECT DATE_FORMAT(created_at, '%Y-%m') AS month, COALESCE(SUM(total), 0) AS revenue, COUNT(*) AS orders
     FROM orders
     WHERE status != 'cancelled' AND created_at >= DATE_SUB(CURRENT_DATE, INTERVAL 11 MONTH)
     GROUP BY DATE_FORMAT(created_at, '%Y-%m') ORDER BY month`
  );
  return rows;
};
