const db = require('../db');

const PUBLIC_COLUMNS = 'id, name, email, role, created_at';

exports.findByEmail = async (email) => {
  const [rows] = await db.query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
  return rows[0] || null;
};

exports.findPublicById = async (id) => {
  const [rows] = await db.query(`SELECT ${PUBLIC_COLUMNS} FROM users WHERE id = ? LIMIT 1`, [id]);
  return rows[0] || null;
};

exports.findPrivateById = async (id) => {
  const [rows] = await db.query('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
};

exports.emailExists = async (email, excludeId = null) => {
  const query = excludeId
    ? 'SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1'
    : 'SELECT id FROM users WHERE email = ? LIMIT 1';
  const params = excludeId ? [email, excludeId] : [email];
  const [rows] = await db.query(query, params);
  return rows.length > 0;
};

exports.create = async ({ name, email, passwordHash, role = 'client' }) => {
  const [result] = await db.query(
    'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
    [name, email, passwordHash, role]
  );
  return result.insertId;
};

exports.updatePassword = (id, passwordHash) => (
  db.query('UPDATE users SET password = ? WHERE id = ?', [passwordHash, id])
);

exports.updateProfile = async ({ id, name, email, passwordHash }) => {
  const [result] = passwordHash
    ? await db.query('UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?', [name, email, passwordHash, id])
    : await db.query('UPDATE users SET name = ?, email = ? WHERE id = ?', [name, email, id]);
  return result.affectedRows;
};

exports.findAll = async () => {
  const [rows] = await db.query(`SELECT ${PUBLIC_COLUMNS} FROM users ORDER BY created_at DESC`);
  return rows;
};

exports.updateByAdmin = async ({ id, name, email, role }) => {
  const [result] = await db.query(
    'UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?',
    [name, email, role, id]
  );
  return result.affectedRows;
};

exports.countOrders = async (id) => {
  const [[row]] = await db.query('SELECT COUNT(*) AS total FROM orders WHERE user_id = ?', [id]);
  return Number(row.total);
};

exports.deleteById = async (id) => {
  const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);
  return result.affectedRows;
};

exports.getClientStats = async () => {
  const [[row]] = await db.query("SELECT COUNT(*) AS totalUsers FROM users WHERE role = 'client'");
  return row;
};
