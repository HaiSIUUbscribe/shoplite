const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');

exports.authenticate = (req, res, next) => {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    return next(new ApiError(401, 'Vui lòng đăng nhập để tiếp tục.', 'AUTH_REQUIRED'));
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (error) {
    return next(new ApiError(401, 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ.', 'INVALID_TOKEN'));
  }
};

exports.isAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return next(new ApiError(403, 'Bạn không có quyền thực hiện thao tác này.', 'ADMIN_REQUIRED'));
  }
  return next();
};
