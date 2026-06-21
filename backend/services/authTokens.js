const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const RefreshTokenModel = require('../models/RefreshTokenModel');

const REFRESH_COOKIE = 'shoplite_refresh_token';
const refreshDays = Math.max(1, Number(process.env.REFRESH_TOKEN_DAYS || 30));

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function expiresAt() {
  return new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000);
}

function cookieOptions() {
  const production = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: production,
    sameSite: production ? 'none' : 'lax',
    path: '/api/auth',
    maxAge: refreshDays * 24 * 60 * 60 * 1000,
  };
}

exports.createAccessToken = (user) => jwt.sign(
  { id: user.id || user.user_id, email: user.email, role: user.role, status: user.status },
  process.env.JWT_SECRET,
  { expiresIn: process.env.ACCESS_TOKEN_TTL || '15m' }
);

exports.issueSession = async (res, user) => {
  const refreshToken = crypto.randomBytes(64).toString('hex');
  await RefreshTokenModel.create(user.id || user.user_id, hashToken(refreshToken), expiresAt());
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions());
  return exports.createAccessToken(user);
};

exports.rotateSession = async (req, res) => {
  const current = req.cookies?.[REFRESH_COOKIE];
  if (!current) return null;
  const next = crypto.randomBytes(64).toString('hex');
  const user = await RefreshTokenModel.rotate(hashToken(current), hashToken(next), expiresAt());
  if (!user) return null;
  res.cookie(REFRESH_COOKIE, next, cookieOptions());
  return { user, token: exports.createAccessToken(user) };
};

exports.revokeSession = async (req, res) => {
  const current = req.cookies?.[REFRESH_COOKIE];
  if (current) await RefreshTokenModel.revokeByHash(hashToken(current));
  const clearOptions = cookieOptions();
  delete clearOptions.maxAge;
  res.clearCookie(REFRESH_COOKIE, clearOptions);
};

exports.revokeAllForUser = RefreshTokenModel.revokeAllForUser;
