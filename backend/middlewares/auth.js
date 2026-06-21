const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const UserModel = require('../models/UserModel');

exports.authenticate = async (req, res, next) => {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    return next(new ApiError(401, 'Vui lòng đăng nhập để tiếp tục.', 'AUTH_REQUIRED'));
  }

  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return next(new ApiError(401, 'Phiên đăng nhập đã hết hạn hoặc không hợp lệ.', 'INVALID_TOKEN'));
  }

  try {
    const user = await UserModel.findAccessStateById(payload.id);
    if (!user) {
      return next(new ApiError(401, 'Tài khoản không còn tồn tại.', 'ACCOUNT_NOT_FOUND'));
    }
    if (user.status === 'locked') {
      return next(new ApiError(403, 'Tài khoản đã bị khóa. Vui lòng liên hệ hỗ trợ.', 'ACCOUNT_LOCKED'));
    }
    req.user = { id: user.id, email: user.email, role: user.role };
    return next();
  } catch (error) {
    return next(error);
  }
};

exports.isAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return next(new ApiError(403, 'Bạn không có quyền thực hiện thao tác này.', 'ADMIN_REQUIRED'));
  }
  return next();
};
