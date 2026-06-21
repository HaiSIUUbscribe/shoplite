const { rateLimit } = require('express-rate-limit');
const MysqlRateLimitStore = require('./rateLimitStore');

const isProduction = process.env.NODE_ENV === 'production';

function envLimit(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isInteger(value) && value > 0 ? value : fallback;
}

function buildResponse(message) {
  return { message, code: 'RATE_LIMITED' };
}

/**
 * Tạo một express-rate-limit instance với MySQL store.
 * Store được tạo riêng cho từng limiter để các window/counter
 * không bị chia sẻ nhầm giữa các endpoint.
 */
function createLimiter({
  namespace,
  windowMs,
  limit,
  message,
  skipSuccessfulRequests = false,
  skip,
}) {
  return rateLimit({
    windowMs,
    limit,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    skipSuccessfulRequests,
    skip,
    store: new MysqlRateLimitStore(windowMs, namespace),
    message: buildResponse(message),
  });
}

exports.apiLimiter = createLimiter({
  namespace: 'api-v2',
  windowMs: 15 * 60 * 1000,
  limit: envLimit('API_RATE_LIMIT', isProduction ? 600 : 5000),
  skip: () => !isProduction,
  message: 'Bạn gửi quá nhiều yêu cầu. Vui lòng thử lại sau.',
});

exports.loginLimiter = createLimiter({
  namespace: 'auth-login',
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  message: 'Đăng nhập sai quá nhiều lần. Vui lòng thử lại sau 15 phút.',
});

exports.sensitiveAuthLimiter = createLimiter({
  namespace: 'auth-sensitive',
  windowMs: 60 * 60 * 1000,
  limit: 5,
  message: 'Bạn gửi quá nhiều yêu cầu xác thực. Vui lòng thử lại sau.',
});

exports.contactLimiter = createLimiter({
  namespace: 'contact',
  windowMs: 60 * 60 * 1000,
  limit: envLimit('CONTACT_RATE_LIMIT', isProduction ? 10 : 100),
  message: 'Bạn đã gửi quá nhiều yêu cầu hỗ trợ. Vui lòng thử lại sau.',
});
