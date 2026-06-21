const db = require('../db');

const PUBLIC_COLUMNS = `id, name, email, phone, date_of_birth, role, provider,
  status, locked_at, last_login_at, created_at, updated_at`;

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

exports.findAccessStateById = async (id) => {
  const [rows] = await db.query(
    'SELECT id, email, role, status FROM users WHERE id = ? LIMIT 1',
    [id]
  );
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

exports.upsertSocialUser = async ({ name, email, provider, providerId }) => {
  const [existingRows] = await db.query('SELECT id, provider FROM users WHERE email = ? LIMIT 1', [email]);
  if (existingRows.length > 0) {
    const user = existingRows[0];
    if (user.provider === 'local') {
      await db.query('UPDATE users SET provider = ?, provider_id = ? WHERE id = ?', [provider, providerId, user.id]);
    }
    return user.id;
  }

  const [result] = await db.query(
    'INSERT INTO users (name, email, password, provider, provider_id, role) VALUES (?, ?, NULL, ?, ?, ?)',
    [name, email, provider, providerId, 'client']
  );
  return result.insertId;
};

exports.updatePassword = (id, passwordHash) => (
  db.query('UPDATE users SET password = ? WHERE id = ?', [passwordHash, id])
);

exports.updateProfile = async ({ id, name, email, phone, date_of_birth }) => {
  const [result] = await db.query(
    'UPDATE users SET name = ?, email = ?, phone = ?, date_of_birth = ? WHERE id = ?',
    [name, email, phone || null, date_of_birth || null, id]
  );
  return result.affectedRows;
};

exports.findAllForAdmin = async ({ search = '', role = '', status = '', provider = '', limit = 20, offset = 0 }) => {
  const where = [];
  const params = [];
  if (search) {
    where.push('(account.name LIKE ? OR account.email LIKE ? OR CAST(account.id AS CHAR) = ?)');
    params.push(`%${search}%`, `%${search}%`, search);
  }
  if (role) {
    where.push('account.role = ?');
    params.push(role);
  }
  if (status) {
    where.push('account.status = ?');
    params.push(status);
  }
  if (provider) {
    where.push('account.provider = ?');
    params.push(provider);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const [items] = await db.query(
    `SELECT account.id, account.name, account.email, account.phone, account.role, account.provider,
      account.status, account.locked_at, account.last_login_at, account.created_at, account.updated_at,
      COALESCE(order_stats.order_count, 0) AS order_count,
      COALESCE(order_stats.total_spent, 0) AS total_spent
     FROM users AS account
     LEFT JOIN (
       SELECT user_id, COUNT(*) AS order_count,
         COALESCE(SUM(CASE WHEN status != 'cancelled' THEN total ELSE 0 END), 0) AS total_spent
       FROM orders GROUP BY user_id
     ) AS order_stats ON order_stats.user_id = account.id
     ${whereSql}
     ORDER BY account.created_at DESC, account.id DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  const [[countRow]] = await db.query(
    `SELECT COUNT(*) AS total FROM users AS account ${whereSql}`,
    params
  );
  const [[summary]] = await db.query(
    `SELECT COUNT(*) AS total,
      SUM(role = 'admin') AS admins,
      SUM(role = 'client') AS clients,
      SUM(status = 'active') AS active,
      SUM(status = 'locked') AS locked
     FROM users`
  );
  return {
    items,
    total: Number(countRow.total),
    summary: Object.fromEntries(Object.entries(summary).map(([key, value]) => [key, Number(value || 0)])),
  };
};

exports.findForAdminById = async (id) => {
  const [rows] = await db.query(
    `SELECT account.id, account.name, account.email, account.phone, account.date_of_birth,
      account.role, account.provider, account.status, account.locked_at, account.last_login_at,
      account.created_at, account.updated_at,
      COUNT(orders.id) AS order_count,
      COALESCE(SUM(CASE WHEN orders.status != 'cancelled' THEN orders.total ELSE 0 END), 0) AS total_spent
     FROM users AS account
     LEFT JOIN orders ON orders.user_id = account.id
     WHERE account.id = ?
     GROUP BY account.id, account.name, account.email, account.phone, account.date_of_birth,
       account.role, account.provider, account.status, account.locked_at, account.last_login_at,
       account.created_at, account.updated_at
     LIMIT 1`,
    [id]
  );
  return rows[0] || null;
};

exports.findAdmins = async () => {
  const [rows] = await db.query(
    `SELECT ${PUBLIC_COLUMNS} FROM users WHERE role = 'admin' AND status = 'active' ORDER BY id`
  );
  return rows;
};

exports.updateByAdmin = async ({ id, name, email, phone, role }) => {
  const [result] = await db.query(
    'UPDATE users SET name = ?, email = ?, phone = ?, role = ? WHERE id = ?',
    [name, email, phone || null, role, id]
  );
  return result.affectedRows;
};

exports.updateStatus = async (id, status) => {
  const [result] = await db.query(
    `UPDATE users SET status = ?, locked_at = IF(? = 'locked', CURRENT_TIMESTAMP, NULL)
     WHERE id = ?`,
    [status, status, id]
  );
  return result.affectedRows;
};

exports.countActiveAdmins = async () => {
  const [[row]] = await db.query(
    "SELECT COUNT(*) AS total FROM users WHERE role = 'admin' AND status = 'active'"
  );
  return Number(row.total);
};

exports.touchLastLogin = (id) => (
  db.query('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?', [id])
);

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
