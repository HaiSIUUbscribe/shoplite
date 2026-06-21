const db = require('../db');

exports.add = async (userId, productId) => {
  const [result] = await db.query(
    'INSERT IGNORE INTO favorites (user_id, product_id) VALUES (?, ?)',
    [userId, productId]
  );
  return result.affectedRows > 0;
};

exports.remove = async (userId, productId) => {
  const [result] = await db.query(
    'DELETE FROM favorites WHERE user_id = ? AND product_id = ?',
    [userId, productId]
  );
  return result.affectedRows > 0;
};

exports.findAllByUser = async (userId) => {
  const [rows] = await db.query(
    `SELECT p.* 
     FROM products p 
     JOIN favorites f ON p.id = f.product_id 
     WHERE f.user_id = ? 
     ORDER BY f.created_at DESC`,
    [userId]
  );
  return rows;
};

exports.getIdsByUser = async (userId) => {
  const [rows] = await db.query(
    'SELECT product_id FROM favorites WHERE user_id = ?',
    [userId]
  );
  return rows.map((r) => r.product_id);
};
