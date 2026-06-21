const ProductModel = require('../models/ProductModel');
const OrderModel = require('../models/OrderModel');
const UserModel = require('../models/UserModel');
const ApiError = require('../utils/ApiError');
const authTokens = require('../services/authTokens');

exports.getDashboardStats = async (req, res, next) => {
  try {
    const [productStats, orderStats, userStats, monthlyStats] = await Promise.all([
      ProductModel.getStats(),
      OrderModel.getStats(),
      UserModel.getClientStats(),
      OrderModel.getMonthlyStats(),
    ]);
    return res.json({ ...productStats, ...orderStats, ...userStats, monthlyStats });
  } catch (error) {
    return next(error);
  }
};

exports.getAllUsers = async (req, res, next) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const result = await UserModel.findAllForAdmin({
      search: req.query.search || '',
      role: req.query.role || '',
      status: req.query.status || '',
      provider: req.query.provider || '',
      limit,
      offset: (page - 1) * limit,
    });
    return res.json({ ...result, page, limit, pages: Math.max(1, Math.ceil(result.total / limit)) });
  } catch (error) {
    return next(error);
  }
};

exports.getUserById = async (req, res, next) => {
  try {
    const user = await UserModel.findForAdminById(req.params.id);
    if (!user) throw new ApiError(404, 'Không tìm thấy người dùng.', 'USER_NOT_FOUND');
    return res.json({ user });
  } catch (error) {
    return next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    const target = await UserModel.findPrivateById(req.params.id);
    if (!target) throw new ApiError(404, 'Không tìm thấy người dùng.', 'USER_NOT_FOUND');
    if (Number(req.params.id) === Number(req.user.id) && req.body.role !== 'admin') {
      throw new ApiError(409, 'Bạn không thể tự thu hồi quyền quản trị của mình.', 'SELF_ROLE_CHANGE');
    }
    if (target.role === 'admin' && target.status === 'active' && req.body.role !== 'admin'
      && await UserModel.countActiveAdmins() <= 1) {
      throw new ApiError(409, 'Hệ thống phải luôn còn ít nhất một quản trị viên hoạt động.', 'LAST_ADMIN_REQUIRED');
    }
    if (await UserModel.emailExists(req.body.email, req.params.id)) {
      throw new ApiError(409, 'Email đang được sử dụng.', 'EMAIL_EXISTS');
    }
    const affectedRows = await UserModel.updateByAdmin({
      id: req.params.id,
      name: req.body.name,
      email: req.body.email,
      phone: req.body.phone,
      role: req.body.role,
    });
    if (!affectedRows) throw new ApiError(404, 'Không tìm thấy người dùng.', 'USER_NOT_FOUND');
    if (target.role !== req.body.role) await authTokens.revokeAllForUser(target.id);
    return res.json({
      message: 'Đã cập nhật người dùng.',
      user: await UserModel.findForAdminById(target.id),
    });
  } catch (error) {
    return next(error);
  }
};

exports.updateUserStatus = async (req, res, next) => {
  try {
    const target = await UserModel.findPrivateById(req.params.id);
    if (!target) throw new ApiError(404, 'Không tìm thấy người dùng.', 'USER_NOT_FOUND');
    if (Number(target.id) === Number(req.user.id) && req.body.status === 'locked') {
      throw new ApiError(409, 'Bạn không thể tự khóa tài khoản đang đăng nhập.', 'SELF_LOCK');
    }
    if (target.role === 'admin' && target.status === 'active' && req.body.status === 'locked'
      && await UserModel.countActiveAdmins() <= 1) {
      throw new ApiError(409, 'Hệ thống phải luôn còn ít nhất một quản trị viên hoạt động.', 'LAST_ADMIN_REQUIRED');
    }
    await UserModel.updateStatus(target.id, req.body.status);
    if (req.body.status === 'locked') await authTokens.revokeAllForUser(target.id);
    return res.json({
      message: req.body.status === 'locked' ? 'Đã khóa tài khoản.' : 'Đã mở khóa tài khoản.',
      user: await UserModel.findForAdminById(target.id),
    });
  } catch (error) {
    return next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    if (Number(req.params.id) === Number(req.user.id)) {
      throw new ApiError(409, 'Bạn không thể xóa tài khoản đang đăng nhập.', 'SELF_DELETE');
    }
    const target = await UserModel.findPrivateById(req.params.id);
    if (!target) throw new ApiError(404, 'Không tìm thấy người dùng.', 'USER_NOT_FOUND');
    if (target.role === 'admin' && target.status === 'active'
      && await UserModel.countActiveAdmins() <= 1) {
      throw new ApiError(409, 'Hệ thống phải luôn còn ít nhất một quản trị viên hoạt động.', 'LAST_ADMIN_REQUIRED');
    }
    if (await UserModel.countOrders(req.params.id)) {
      throw new ApiError(409, 'Không thể xóa người dùng đã có đơn hàng. Hãy giữ lại để bảo toàn lịch sử.', 'USER_HAS_ORDERS');
    }
    await authTokens.revokeAllForUser(target.id);
    await UserModel.deleteById(target.id);
    return res.json({ message: 'Đã xóa người dùng.' });
  } catch (error) {
    return next(error);
  }
};
