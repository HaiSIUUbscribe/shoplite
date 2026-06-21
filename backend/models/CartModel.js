const db = require('../db');

exports.findByUserId = async (userId) => {
  const [rows] = await db.query(
    `SELECT c.id, c.product_id, c.quantity AS qty, c.size, c.color,
      p.title, p.price, p.thumbnail, p.stock
     FROM cart_items AS c
     JOIN products AS p ON p.id = c.product_id
     WHERE c.user_id = ?
     ORDER BY c.created_at DESC`,
    [userId]
  );
  return rows;
};

exports.upsertItem = async ({ userId, productId, quantity, size, color, stock }) => {
  const safeSize = size || '';
  const safeColor = color || '';
  const [result] = await db.query(
    `INSERT INTO cart_items (user_id, product_id, quantity, size, color) 
     VALUES (?, ?, ?, ?, ?) 
     ON DUPLICATE KEY UPDATE quantity = IF(quantity + VALUES(quantity) <= ?, quantity + VALUES(quantity), quantity)`,
    [userId, productId, quantity, safeSize, safeColor, stock]
  );
  return result;
};

exports.findByIdAndUserId = async (id, userId) => {
  const [rows] = await db.query(
    `SELECT c.id, c.quantity, p.stock
     FROM cart_items AS c
     JOIN products AS p ON p.id = c.product_id
     WHERE c.id = ? AND c.user_id = ? LIMIT 1`,
    [id, userId]
  );
  return rows[0] || null;
};

exports.updateQuantity = async (id, userId, quantity) => {
  const [result] = await db.query(
    'UPDATE cart_items SET quantity = ? WHERE id = ? AND user_id = ?',
    [quantity, id, userId]
  );
  return result.affectedRows;
};

exports.deleteById = async (id, userId) => {
  const [result] = await db.query('DELETE FROM cart_items WHERE id = ? AND user_id = ?', [id, userId]);
  return result.affectedRows;
};

exports.clearByUserId = (userId) => db.query('DELETE FROM cart_items WHERE user_id = ?', [userId]);
