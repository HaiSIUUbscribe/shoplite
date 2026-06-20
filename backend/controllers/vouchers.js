const VoucherModel = require('../models/VoucherModel');
const UserModel = require('../models/UserModel');
const voucherService = require('../services/voucher');
const mailer = require('../utils/mailer');
const ApiError = require('../utils/ApiError');

exports.claim = async (req, res, next) => {
  try {
    const user = await UserModel.findPublicById(req.user.id);
    if (!user) throw new ApiError(404, 'Không tìm thấy tài khoản.', 'USER_NOT_FOUND');

    const voucher = await VoucherModel.claimForUser(user.id, user.email);
    if (voucher.status === 'used') {
      throw new ApiError(409, 'Tài khoản đã sử dụng voucher chào mừng.', 'VOUCHER_ALREADY_USED');
    }
    if (voucher.status !== 'active' || new Date(voucher.expires_at).getTime() <= Date.now()) {
      throw new ApiError(409, 'Voucher chào mừng của tài khoản không còn hiệu lực.', 'VOUCHER_UNAVAILABLE');
    }

    let emailSent = Boolean(voucher.email_sent_at);
    if (!emailSent) {
      try {
        emailSent = await mailer.sendNewsletterVoucher({
          to: user.email,
          code: voucher.code,
          discountValue: voucher.discount_value,
          minOrderAmount: voucher.min_order_amount,
          maxDiscountAmount: voucher.max_discount_amount,
          expiresAt: voucher.expires_at,
        });
        if (emailSent) await VoucherModel.markEmailSent(voucher.id);
      } catch (mailError) {
        console.error('Voucher email failed:', mailError.message);
      }
    }

    return res.json({
      status: 'saved',
      message: emailSent ? 'Voucher đã được lưu và gửi qua email.' : 'Voucher đã được lưu vào tài khoản.',
      voucher: {
        code: voucher.code,
        discountType: voucher.discount_type,
        discountValue: Number(voucher.discount_value),
        minOrderAmount: Number(voucher.min_order_amount),
        maxDiscountAmount: Number(voucher.max_discount_amount),
        expiresAt: voucher.expires_at,
      },
    });
  } catch (error) {
    return next(error);
  }
};

exports.validate = async (req, res, next) => {
  try {
    const code = voucherService.normalizeCode(req.body.code);
    const voucher = await VoucherModel.findByCode(code);
    const result = voucherService.validateAndCalculate(voucher, req.body.email, req.body.subtotal, req.user.id);
    return res.json({ status: 'valid', message: 'Áp dụng voucher thành công.', ...result });
  } catch (error) {
    return next(error);
  }
};
