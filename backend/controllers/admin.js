const ProductModel = require('../models/ProductModel');
const OrderModel = require('../models/OrderModel');
const UserModel = require('../models/UserModel');
const ApiError = require('../utils/ApiError');

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
    return res.json(await UserModel.findAll());
  } catch (error) {
    return next(error);
  }
};

exports.updateUser = async (req, res, next) => {
  try {
    if (Number(req.params.id) === Number(req.user.id) && req.body.role !== 'admin') {
      throw new ApiError(409, 'Bạn không thể tự thu hồi quyền quản trị của mình.', 'SELF_ROLE_CHANGE');
    }
    if (await UserModel.emailExists(req.body.email, req.params.id)) {
      throw new ApiError(409, 'Email đang được sử dụng.', 'EMAIL_EXISTS');
    }
    const affectedRows = await UserModel.updateByAdmin({
      id: req.params.id,
      name: req.body.name,
      email: req.body.email,
      role: req.body.role,
    });
    if (!affectedRows) throw new ApiError(404, 'Không tìm thấy người dùng.', 'USER_NOT_FOUND');
    return res.json({ message: 'Đã cập nhật người dùng.' });
  } catch (error) {
    return next(error);
  }
};

exports.deleteUser = async (req, res, next) => {
  try {
    if (Number(req.params.id) === Number(req.user.id)) {
      throw new ApiError(409, 'Bạn không thể xóa tài khoản đang đăng nhập.', 'SELF_DELETE');
    }
    if (await UserModel.countOrders(req.params.id)) {
      throw new ApiError(409, 'Không thể xóa người dùng đã có đơn hàng. Hãy giữ lại để bảo toàn lịch sử.', 'USER_HAS_ORDERS');
    }
    if (!(await UserModel.deleteById(req.params.id))) {
      throw new ApiError(404, 'Không tìm thấy người dùng.', 'USER_NOT_FOUND');
    }
    return res.json({ message: 'Đã xóa người dùng.' });
  } catch (error) {
    return next(error);
  }
};
