const db = require('../db');

exports.findByProductId = async (productId) => {
  const [rows] = await db.query(
    `SELECT review.id, review.rating, review.comment, review.created_at, user.name AS user_name
     FROM product_reviews AS review
     JOIN users AS user ON user.id = review.user_id
     WHERE review.product_id = ?
     ORDER BY review.created_at DESC`,
    [productId]
  );
  return rows;
};

exports.getStats = async (productId) => {
  const [[row]] = await db.query(
    'SELECT COALESCE(AVG(rating), 0) AS average, COUNT(*) AS count FROM product_reviews WHERE product_id = ?',
    [productId]
  );
  return row;
};

exports.hasCompletedPurchase = async (userId, productId) => {
  const [rows] = await db.query(
    `SELECT id FROM orders
     WHERE user_id = ? AND status = 'done'
       AND JSON_CONTAINS(items, JSON_OBJECT('product_id', CAST(? AS UNSIGNED)), '$')
     LIMIT 1`,
    [userId, productId]
  );
  return rows.length > 0;
};

exports.findByUserAndProduct = async (userId, productId) => {
  const [rows] = await db.query(
    'SELECT id FROM product_reviews WHERE user_id = ? AND product_id = ? LIMIT 1',
    [userId, productId]
  );
  return rows[0] || null;
};

exports.create = async ({ productId, userId, rating, comment }) => {
  const [result] = await db.query(
    'INSERT INTO product_reviews (product_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
    [productId, userId, rating, comment || null]
  );
  return result.insertId;
};

exports.getReviewedProductIdsByUser = async (userId) => {
  const [rows] = await db.query(
    'SELECT product_id FROM product_reviews WHERE user_id = ?',
    [userId]
  );
  return rows.map((r) => r.product_id);
};
