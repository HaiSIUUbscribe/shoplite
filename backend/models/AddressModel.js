const db = require('../db');

exports.findByUser = async (userId) => {
  const [rows] = await db.query(
    'SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at ASC',
    [userId]
  );
  return rows;
};

exports.findById = async (id, userId) => {
  const [rows] = await db.query(
    'SELECT * FROM user_addresses WHERE id = ? AND user_id = ? LIMIT 1',
    [id, userId]
  );
  return rows[0] || null;
};

exports.create = async (userId, data) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [existing] = await conn.query(
      'SELECT id FROM user_addresses WHERE user_id = ? LIMIT 1 FOR UPDATE',
      [userId]
    );
    const isDefault = Boolean(data.is_default) || existing.length === 0;
    if (isDefault) {
      await conn.query('UPDATE user_addresses SET is_default = 0 WHERE user_id = ?', [userId]);
    }
    const [result] = await conn.query(
      `INSERT INTO user_addresses (user_id, label, recipient, phone, province, district, ward, street, is_default)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, data.label || '', data.recipient, data.phone, data.province, data.district, data.ward, data.street, isDefault ? 1 : 0]
    );
    await conn.commit();
    return result.insertId;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

exports.update = async (id, userId, data) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [targets] = await conn.query(
      'SELECT id, is_default FROM user_addresses WHERE id = ? AND user_id = ? LIMIT 1 FOR UPDATE',
      [id, userId]
    );
    if (!targets.length) {
      await conn.rollback();
      return 0;
    }
    const isDefault = Boolean(data.is_default) || Boolean(targets[0].is_default);
    if (isDefault) {
      await conn.query('UPDATE user_addresses SET is_default = 0 WHERE user_id = ?', [userId]);
    }
    const [result] = await conn.query(
      `UPDATE user_addresses
         SET label=?, recipient=?, phone=?, province=?, district=?, ward=?, street=?, is_default=?
       WHERE id = ? AND user_id = ?`,
      [data.label || '', data.recipient, data.phone, data.province, data.district, data.ward, data.street, isDefault ? 1 : 0, id, userId]
    );
    await conn.commit();
    return result.affectedRows;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

exports.deleteById = async (id, userId) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query(
      'SELECT is_default FROM user_addresses WHERE id = ? AND user_id = ? LIMIT 1 FOR UPDATE',
      [id, userId]
    );
    if (!rows.length) {
      await conn.rollback();
      return 0;
    }
    const [result] = await conn.query(
      'DELETE FROM user_addresses WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    if (rows[0].is_default) {
      await conn.query(
        `UPDATE user_addresses SET is_default = 1
         WHERE user_id = ? ORDER BY created_at ASC, id ASC LIMIT 1`,
        [userId]
      );
    }
    await conn.commit();
    return result.affectedRows;
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
};

exports.setDefault = async (id, userId) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [targets] = await conn.query(
      'SELECT id FROM user_addresses WHERE id = ? AND user_id = ? LIMIT 1 FOR UPDATE',
      [id, userId]
    );
    if (!targets.length) {
      await conn.rollback();
      return 0;
    }
    await conn.query('UPDATE user_addresses SET is_default = 0 WHERE user_id = ?', [userId]);
    const [result] = await conn.query(
      'UPDATE user_addresses SET is_default = 1 WHERE id = ? AND user_id = ?',
      [id, userId]
    );
    await conn.commit();
    return result.affectedRows;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};
