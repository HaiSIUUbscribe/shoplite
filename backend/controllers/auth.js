const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/UserModel');
const ApiError = require('../utils/ApiError');
const mailer = require('../utils/mailer');

function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, role: user.role, created_at: user.created_at };
}

exports.register = async (req, res, next) => {
  try {
    const name = req.body.name.trim();
    const email = req.body.email.toLowerCase();
    if (await UserModel.emailExists(email)) {
      throw new ApiError(409, 'Email đã được đăng ký.', 'EMAIL_EXISTS');
    }

    const passwordHash = await bcrypt.hash(req.body.password, 12);
    const userId = await UserModel.create({ name, email, passwordHash });
    return res.status(201).json({ message: 'Đăng ký thành công.', userId });
  } catch (error) {
    return next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const user = await UserModel.findByEmail(req.body.email.toLowerCase());
    if (!user) throw new ApiError(401, 'Email hoặc mật khẩu không chính xác.', 'INVALID_CREDENTIALS');

    const isBcrypt = /^\$2[aby]\$/.test(user.password);
    const isMatch = isBcrypt
      ? await bcrypt.compare(req.body.password, user.password)
      : req.body.password === user.password;
    if (!isMatch) throw new ApiError(401, 'Email hoặc mật khẩu không chính xác.', 'INVALID_CREDENTIALS');

    if (!isBcrypt) {
      await UserModel.updatePassword(user.id, await bcrypt.hash(req.body.password, 12));
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    return res.json({ message: 'Đăng nhập thành công.', token, user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
};

function passwordFingerprint(passwordHash) {
  return crypto.createHash('sha256').update(passwordHash).digest('hex').slice(0, 24);
}

exports.forgotPassword = async (req, res, next) => {
  try {
    const user = await UserModel.findByEmail(req.body.email.toLowerCase());
    let resetUrl;
    let emailSent = false;
    if (user) {
      const token = jwt.sign(
        { id: user.id, purpose: 'password-reset', fingerprint: passwordFingerprint(user.password) },
        process.env.JWT_RESET_SECRET || process.env.JWT_SECRET,
        { expiresIn: '30m' }
      );
      const frontendUrl = String(process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:3000')
        .split(',')[0]
        .trim()
        .replace(/\/$/, '');
      resetUrl = `${frontendUrl}/reset-password?token=${encodeURIComponent(token)}`;
      try {
        emailSent = await mailer.sendPasswordReset({ to: user.email, name: user.name, resetUrl });
      } catch (mailError) {
        console.error('Password reset email failed:', mailError.message);
      }
    }

    const response = { message: 'Nếu email tồn tại, hướng dẫn đặt lại mật khẩu đã được gửi.' };
    if (process.env.NODE_ENV !== 'production' && resetUrl && !emailSent) response.resetUrl = resetUrl;
    return res.json(response);
  } catch (error) {
    return next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    let payload;
    try {
      payload = jwt.verify(req.body.token, process.env.JWT_RESET_SECRET || process.env.JWT_SECRET);
    } catch (error) {
      throw new ApiError(400, 'Liên kết đặt lại mật khẩu đã hết hạn hoặc không hợp lệ.', 'INVALID_RESET_TOKEN');
    }
    if (payload.purpose !== 'password-reset') {
      throw new ApiError(400, 'Liên kết đặt lại mật khẩu không hợp lệ.', 'INVALID_RESET_TOKEN');
    }
    const user = await UserModel.findPrivateById(payload.id);
    if (!user || payload.fingerprint !== passwordFingerprint(user.password)) {
      throw new ApiError(400, 'Liên kết đã được sử dụng hoặc không còn hiệu lực.', 'RESET_TOKEN_USED');
    }
    await UserModel.updatePassword(user.id, await bcrypt.hash(req.body.password, 12));
    return res.json({ message: 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.' });
  } catch (error) {
    return next(error);
  }
};
