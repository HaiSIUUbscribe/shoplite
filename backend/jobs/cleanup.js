const RefreshTokenModel = require('../models/RefreshTokenModel');
const NotificationModel = require('../models/NotificationModel');
const MysqlRateLimitStore = require('../middlewares/rateLimitStore');

// Dùng một instance store để gọi resetAll() trên bảng rate_limit_hits
const rateLimitStore = new MysqlRateLimitStore(0);

/**
 * Chạy một tác vụ cleanup và log kết quả.
 * Bắt lỗi cục bộ để một job thất bại không ảnh hưởng job còn lại.
 *
 * @param {string} name - Tên job hiển thị trong log
 * @param {() => Promise<number>} fn - Hàm trả về số dòng đã xử lý
 */
async function runJob(name, fn) {
  try {
    const count = await fn();
    if (count > 0) console.log(`[cleanup] ${name}: removed ${count} row(s).`);
  } catch (error) {
    console.error(`[cleanup] ${name} failed:`, error.message);
  }
}

/** Chạy toàn bộ tác vụ dọn dẹp một lần */
async function runAll() {
  await Promise.all([
    runJob('expired refresh_tokens', () => RefreshTokenModel.deleteExpired()),
    runJob('expired rate_limit_hits', () => rateLimitStore.resetAll()),
    runJob('archive old notifications', () => NotificationModel.archiveOld()),
  ]);
}

/** Khởi động cleanup job chạy định kỳ theo intervalMs */
function start(intervalMs = 60 * 60 * 1000) {
  // Chạy ngay lần đầu khi server khởi động
  runAll();
  // Sau đó chạy định kỳ
  setInterval(runAll, intervalMs);
  console.log(`[cleanup] Job started — interval: ${intervalMs / 1000}s`);
}

module.exports = { start, runAll };
