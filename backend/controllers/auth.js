const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const UserModel = require('../models/UserModel');
const ApiError = require('../utils/ApiError');
const mailer = require('../utils/mailer');
const authTokens = require('../services/authTokens');
const jwt = require('jsonwebtoken');
const dispatcher = require('../services/notificationDispatcher');

function publicUser(user) {
  return {
    id: user.id || user.user_id,
    name: user.name,
    email: user.email,
    role: user.role,
    provider: user.provider,
    status: user.status,
    created_at: user.created_at,
  };
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
    dispatcher.dispatch(dispatcher.EVENTS.ACCOUNT_REGISTERED, { userId });
    return res.status(201).json({ message: 'Đăng ký thành công.', userId });
  } catch (error) {
    return next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const user = await UserModel.findByEmail(req.body.email.toLowerCase());
    if (!user) throw new ApiError(401, 'Email hoặc mật khẩu không chính xác.', 'INVALID_CREDENTIALS');
    if (user.status === 'locked') {
      throw new ApiError(403, 'Tài khoản đã bị khóa. Vui lòng liên hệ hỗ trợ.', 'ACCOUNT_LOCKED');
    }

    const isBcrypt = /^\$2[aby]\$/.test(user.password);
    const isMatch = isBcrypt
      ? await bcrypt.compare(req.body.password, user.password)
      : req.body.password === user.password;
    if (!isMatch) throw new ApiError(401, 'Email hoặc mật khẩu không chính xác.', 'INVALID_CREDENTIALS');

    if (!isBcrypt) {
      await UserModel.updatePassword(user.id, await bcrypt.hash(req.body.password, 12));
    }

    await UserModel.touchLastLogin(user.id);
    const token = await authTokens.issueSession(res, user);
    return res.json({ message: 'Đăng nhập thành công.', token, user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
};

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

exports.socialLogin = async (req, res, next) => {
  try {
    const { token, provider } = req.body;
    if (provider !== 'google') {
      throw new ApiError(400, 'Nhà cung cấp này chưa được hỗ trợ.', 'UNSUPPORTED_PROVIDER');
    }
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.email || payload.email_verified !== true) {
      throw new ApiError(401, 'Google chưa xác minh email của tài khoản.', 'GOOGLE_EMAIL_NOT_VERIFIED');
    }
    const email = payload.email.toLowerCase();
    const name = payload.name;
    const providerId = payload.sub;

    const existingUser = await UserModel.findByEmail(email);
    const userId = await UserModel.upsertSocialUser({ name, email, provider, providerId });
    const user = await UserModel.findPrivateById(userId);
    if (user.status === 'locked') {
      throw new ApiError(403, 'Tài khoản đã bị khóa. Vui lòng liên hệ hỗ trợ.', 'ACCOUNT_LOCKED');
    }

    if (!existingUser) dispatcher.dispatch(dispatcher.EVENTS.ACCOUNT_REGISTERED, { userId });

    await UserModel.touchLastLogin(user.id);
    const jwtToken = await authTokens.issueSession(res, user);
    return res.json({ message: 'Đăng nhập thành công.', token: jwtToken, user: publicUser(user) });
  } catch (error) {
    console.error('Social Login Error:', error);
    if (error instanceof ApiError) return next(error);
    return next(new ApiError(401, 'Xác thực mạng xã hội thất bại.', 'SOCIAL_AUTH_FAILED'));
  }
};

function passwordFingerprint(passwordHash) {
  return crypto.createHash('sha256').update(passwordHash || 'NO_LOCAL_PASSWORD').digest('hex').slice(0, 24);
}

exports.refresh = async (req, res, next) => {
  try {
    const session = await authTokens.rotateSession(req, res);
    if (!session) throw new ApiError(401, 'Phiên đăng nhập không còn hợp lệ.', 'INVALID_REFRESH_TOKEN');
    return res.json({ token: session.token, user: publicUser(session.user) });
  } catch (error) {
    return next(error);
  }
};

exports.logout = async (req, res, next) => {
  try {
    await authTokens.revokeSession(req, res);
    return res.json({ message: 'Đăng xuất thành công.' });
  } catch (error) {
    return next(error);
  }
};

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
    await authTokens.revokeAllForUser(user.id);
    dispatcher.dispatch(dispatcher.EVENTS.PASSWORD_CHANGED, { userId: user.id });
    return res.json({ message: 'Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.' });
  } catch (error) {
    return next(error);
  }
};
