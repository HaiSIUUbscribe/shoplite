const ApiError = require('../utils/ApiError');

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

exports.normalizeCode = (code) => String(code || '').trim().toUpperCase();

exports.validateAndCalculate = (voucher, email, subtotal, userId) => {
  if (!voucher) throw new ApiError(404, 'Mã voucher không tồn tại.', 'VOUCHER_NOT_FOUND');
  if (voucher.status === 'used') throw new ApiError(409, 'Mã voucher đã được sử dụng.', 'VOUCHER_USED');
  if (voucher.status !== 'active') throw new ApiError(409, 'Mã voucher hiện không khả dụng.', 'VOUCHER_INACTIVE');
  if (new Date(voucher.expires_at).getTime() <= Date.now()) {
    throw new ApiError(409, 'Mã voucher đã hết hạn.', 'VOUCHER_EXPIRED');
  }
  if (normalizeEmail(voucher.email) !== normalizeEmail(email)) {
    throw new ApiError(403, 'Mã voucher không thuộc email nhận hàng này.', 'VOUCHER_EMAIL_MISMATCH');
  }
  if (voucher.user_id && Number(voucher.user_id) !== Number(userId)) {
    throw new ApiError(403, 'Mã voucher không thuộc tài khoản này.', 'VOUCHER_ACCOUNT_MISMATCH');
  }

  const orderSubtotal = Number(subtotal);
  const minimum = Number(voucher.min_order_amount);
  if (orderSubtotal < minimum) {
    throw new ApiError(
      422,
      `Đơn hàng cần đạt tối thiểu ${minimum.toLocaleString('vi-VN')} đ để dùng voucher.`,
      'VOUCHER_MIN_ORDER'
    );
  }

  const rawDiscount = voucher.discount_type === 'fixed'
    ? Number(voucher.discount_value)
    : orderSubtotal * Number(voucher.discount_value) / 100;
  const maximum = Number(voucher.max_discount_amount || 0);
  const discountAmount = Math.min(rawDiscount, maximum > 0 ? maximum : rawDiscount, orderSubtotal);

  return {
    code: voucher.code,
    discountAmount: Math.round(discountAmount),
    discountType: voucher.discount_type,
    discountValue: Number(voucher.discount_value),
    minOrderAmount: minimum,
    maxDiscountAmount: maximum,
    expiresAt: voucher.expires_at,
  };
};
