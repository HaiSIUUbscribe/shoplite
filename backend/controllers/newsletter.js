const NewsletterModel = require('../models/NewsletterModel');
const mailer = require('../utils/mailer');
const ApiError = require('../utils/ApiError');

exports.subscribe = async (req, res, next) => {
  try {
    const result = await NewsletterModel.subscribe(req.body.email);

    if (result.status === 'duplicate') {
      return res.status(200).json({
        status: 'duplicate',
        message: 'Email này đã nhận voucher đăng ký trước đó.',
      });
    }

    const sent = await mailer.sendNewsletterVoucher({
      to: req.body.email,
      code: result.voucher.code,
      discountValue: result.voucher.discount_value,
      minOrderAmount: result.voucher.min_order_amount,
      maxDiscountAmount: result.voucher.max_discount_amount,
      expiresAt: result.voucher.expires_at,
    });
    if (!sent) {
      throw new ApiError(503, 'Chưa thể gửi email voucher. Vui lòng thử lại sau.', 'MAIL_NOT_CONFIGURED');
    }
    await NewsletterModel.markVoucherEmailSent(result.voucher.id);

    return res.status(201).json({
      status: 'success',
      message: 'Cảm ơn bạn đã đăng ký! Mã voucher đã được gửi qua email.',
    });
  } catch (error) {
    return next(error);
  }
};
