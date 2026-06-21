const crypto = require('crypto');
const db = require('../db');

class MysqlRateLimitStore {
  /** @param {number} windowMs - Kích thước cửa sổ tính bằng milliseconds */
  constructor(windowMs, namespace = 'default') {
    this.windowMs = windowMs;
    this.namespace = namespace;
  }

  /** Tạo khoá SHA-256 để tránh lưu IP thô vào DB */
  #hashKey(key) {
    return crypto
      .createHash('sha256')
      .update(`${this.namespace}:${key}`)
      .digest('hex');
  }

  /**
   * @returns {{ totalHits: number, resetTime: Date }}
   */
  async increment(key) {
    const keyHash = this.#hashKey(key);
    const windowSeconds = Math.ceil(this.windowMs / 1000);

    const [result] = await db.query(
      `INSERT INTO rate_limit_hits (key_hash, hit_count, reset_at)
         VALUES (?, 1, DATE_ADD(NOW(), INTERVAL ? SECOND))
       ON DUPLICATE KEY UPDATE
         hit_count = IF(reset_at <= NOW(), 1,        hit_count + 1),
         reset_at  = IF(reset_at <= NOW(),
                       DATE_ADD(NOW(), INTERVAL ? SECOND),
                       reset_at)`,
      [keyHash, windowSeconds, windowSeconds]
    );

    // Sau khi upsert, đọc lại giá trị thực tế từ DB
    const [[row]] = await db.query(
      'SELECT hit_count, reset_at FROM rate_limit_hits WHERE key_hash = ?',
      [keyHash]
    );

    return {
      totalHits: row?.hit_count ?? 1,
      resetTime: row?.reset_at ? new Date(row.reset_at) : new Date(Date.now() + this.windowMs),
    };
  }

  /** Đặt lại bộ đếm cho key (dùng khi skipSuccessfulRequests = true) */
  async decrement(key) {
    const keyHash = this.#hashKey(key);
    await db.query(
      'UPDATE rate_limit_hits SET hit_count = GREATEST(0, hit_count - 1) WHERE key_hash = ? AND reset_at > NOW()',
      [keyHash]
    );
  }

  /** Xoá toàn bộ bộ đếm đã hết hạn (được gọi bởi cleanup job) */
  async resetAll() {
    await db.query('DELETE FROM rate_limit_hits WHERE reset_at <= NOW()');
  }

  /** Xoá bộ đếm của một key cụ thể */
  async resetKey(key) {
    const keyHash = this.#hashKey(key);
    await db.query('DELETE FROM rate_limit_hits WHERE key_hash = ?', [keyHash]);
  }
}

module.exports = MysqlRateLimitStore;
