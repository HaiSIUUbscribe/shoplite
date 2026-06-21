const bcrypt = require('bcryptjs');
const UserModel = require('../models/UserModel');
const ApiError = require('../utils/ApiError');
const authTokens = require('../services/authTokens');
const dispatcher = require('../services/notificationDispatcher');

exports.getProfile = async (req, res, next) => {
  try {
    const user = await UserModel.findPublicById(req.user.id);
    if (!user) throw new ApiError(404, 'Không tìm thấy người dùng.', 'USER_NOT_FOUND');
    return res.json({ user });
  } catch (error) {
    return next(error);
  }
};

exports.updateProfile = async (req, res, next) => {
  try {
    const name = req.body.name.trim();
    const email = req.body.email.toLowerCase();
    const phone = req.body.phone ? String(req.body.phone).trim() : null;
    const date_of_birth = req.body.date_of_birth || null;

    if (await UserModel.emailExists(email, req.user.id)) {
      throw new ApiError(409, 'Email đang được tài khoản khác sử dụng.', 'EMAIL_EXISTS');
    }

    const affectedRows = await UserModel.updateProfile({ id: req.user.id, name, email, phone, date_of_birth });
    if (!affectedRows) throw new ApiError(404, 'Không tìm thấy người dùng.', 'USER_NOT_FOUND');

    const user = await UserModel.findPublicById(req.user.id);
    return res.json({ message: 'Cập nhật tài khoản thành công.', user });
  } catch (error) {
    return next(error);
  }
};

exports.changePassword = async (req, res, next) => {
  try {
    const user = await UserModel.findPrivateById(req.user.id);
    if (!user) throw new ApiError(404, 'Không tìm thấy người dùng.', 'USER_NOT_FOUND');
    if (!user.password) {
      throw new ApiError(
        409,
        'Tài khoản mạng xã hội chưa có mật khẩu. Hãy dùng chức năng quên mật khẩu để tạo mật khẩu.',
        'LOCAL_PASSWORD_NOT_SET'
      );
    }
    const valid = await bcrypt.compare(req.body.current_password, user.password);
    if (!valid) throw new ApiError(400, 'Mật khẩu hiện tại không chính xác.', 'INVALID_CURRENT_PASSWORD');
    if (req.body.current_password === req.body.new_password) {
      throw new ApiError(400, 'Mật khẩu mới phải khác mật khẩu hiện tại.', 'PASSWORD_UNCHANGED');
    }
    await UserModel.updatePassword(user.id, await bcrypt.hash(req.body.new_password, 12));
    await authTokens.revokeAllForUser(user.id);
    dispatcher.dispatch(dispatcher.EVENTS.PASSWORD_CHANGED, { userId: user.id });
    return res.json({ message: 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.', reauthenticate: true });
  } catch (error) {
    return next(error);
  }
};
