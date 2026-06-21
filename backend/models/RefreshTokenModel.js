const db = require('../db');

exports.create = (userId, tokenHash, expiresAt) => (
  db.query(
    'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
    [userId, tokenHash, expiresAt]
  )
);

exports.rotate = async (currentHash, nextHash, nextExpiresAt) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [rows] = await connection.query(
      `SELECT token.id, user.id AS user_id, user.name, user.email, user.role,
        user.status, user.provider, user.created_at
       FROM refresh_tokens AS token
       JOIN users AS user ON user.id = token.user_id
       WHERE token.token_hash = ? AND token.revoked_at IS NULL
         AND token.expires_at > CURRENT_TIMESTAMP AND user.status = 'active'
       LIMIT 1 FOR UPDATE`,
      [currentHash]
    );
    const session = rows[0];
    if (!session) {
      await connection.rollback();
      return null;
    }
    await connection.query('UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE id = ?', [session.id]);
    await connection.query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
      [session.user_id, nextHash, nextExpiresAt]
    );
    await connection.commit();
    return session;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

exports.revokeByHash = (tokenHash) => (
  db.query(
    'UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE token_hash = ? AND revoked_at IS NULL',
    [tokenHash]
  )
);

exports.revokeAllForUser = (userId) => (
  db.query(
    'UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = ? AND revoked_at IS NULL',
    [userId]
  )
);

/**
 * Xoá vĩnh viễn các refresh token đã hết hạn hoặc đã bị thu hồi.
 * Dùng bởi cleanup job để tránh bảng phình to theo thời gian.
 * @returns {Promise<number>} Số dòng đã xoá
 */
exports.deleteExpired = async () => {
  const [result] = await db.query(
    'DELETE FROM refresh_tokens WHERE expires_at < NOW() OR revoked_at IS NOT NULL'
  );
  return result.affectedRows;
};
