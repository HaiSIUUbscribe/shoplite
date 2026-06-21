const NotificationModel = require('../models/NotificationModel');
const NotificationSettingsModel = require('../models/NotificationSettingsModel');
const TransactionModel = require('../models/TransactionModel');
const UserModel = require('../models/UserModel');
const mailer = require('../utils/mailer');
const sms = require('./sms');
const { sendOrderConfirmationOnce } = require('./orderNotification');

const EVENTS = Object.freeze({
  ACCOUNT_REGISTERED: 'account_registered',
  PASSWORD_CHANGED: 'password_changed',
  ORDER_CREATED: 'order_created',
  ORDER_STATUS: 'order_status',
  ORDER_CANCEL_REQUESTED: 'order_cancel_requested',
  RETURN_REQUESTED: 'return_requested',
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILED: 'payment_failed',
  PAYMENT_REFUNDED: 'payment_refunded',
  STOCK_CHANGED: 'stock_changed',
});

const STATUS_LABELS = Object.freeze({
  pending: 'Chờ xác nhận',
  processing: 'Đang chuẩn bị',
  shipping: 'Đang giao hàng',
  done: 'Đã giao thành công',
  cancelled: 'Đã huỷ',
});

function frontendUrl(path) {
  const origin = String(process.env.FRONTEND_URL || process.env.CLIENT_URL || 'http://localhost:3000')
    .split(',')[0]
    .trim()
    .replace(/\/$/, '');
  return `${origin}${path}`;
}

function reportChannelErrors(results, type, userId) {
  results.forEach((result) => {
    if (result.status === 'rejected') {
      console.error(`[notifications] ${type} delivery failed for user ${userId}:`, result.reason?.message);
    }
  });
}

async function deliver(user, payload, { email = true, smsMessage = '' } = {}) {
  if (!user?.id) return;
  const preference = await NotificationModel.getPreference(user.id, payload.type);
  const jobs = [];

  if (Number(preference.enabled) !== 0) {
    jobs.push(NotificationModel.create(user.id, payload, { skipPreference: true }));
  }
  if (email && Number(preference.email_enabled) !== 0 && user.email) {
    jobs.push(mailer.sendNotification({
      to: user.email,
      name: user.name,
      title: payload.title,
      message: payload.message,
      actionUrl: payload.actionUrl,
    }));
  }
  if (smsMessage && user.phone) jobs.push(sms.send({ to: user.phone, message: smsMessage }));

  const results = await Promise.allSettled(jobs);
  reportChannelErrors(results, payload.type, user.id);
}

async function deliverToUser(userId, payload, options, expectedRole = null) {
  const user = await UserModel.findPublicById(userId);
  if (user && (!expectedRole || user.role === expectedRole)) await deliver(user, payload, options);
}

const deliverToClient = (userId, payload, options) => (
  deliverToUser(userId, payload, options, 'client')
);

async function deliverToAdmins(payload, options = {}) {
  const admins = await UserModel.findAdmins();
  await Promise.all(admins.map((admin) => deliver(admin, payload, {
    ...options,
    smsMessage: typeof options.smsMessage === 'function'
      ? options.smsMessage(admin)
      : options.smsMessage,
  })));
}

async function dispatchOrderCreated(ctx) {
  const clientPayload = {
    type: 'order_created',
    title: `Đã tiếp nhận đơn hàng #${ctx.orderId}`,
    message: 'Đơn hàng của bạn đang chờ xác nhận và sẽ sớm được xử lý.',
    data: { order_id: ctx.orderId, total: ctx.total },
    actionUrl: frontendUrl(`/orders/${ctx.orderId}`),
  };
  await deliverToClient(ctx.userId, clientPayload, { email: false });
  const clientPreference = await NotificationModel.getPreference(ctx.userId, 'order_created');
  if (ctx.sendConfirmation && Number(clientPreference.email_enabled) !== 0) {
    await sendOrderConfirmationOnce(ctx.orderId);
  }

  await deliverToAdmins({
    type: 'order_created',
    title: 'Đơn hàng mới cần xử lý',
    message: `${ctx.customerName || 'Khách hàng'} vừa đặt đơn #${ctx.orderId}.`,
    data: { order_id: ctx.orderId, total: ctx.total },
    actionUrl: frontendUrl('/admin/orders'),
  });
}

async function dispatchOrderStatus(ctx) {
  const label = STATUS_LABELS[ctx.status] || ctx.status;
  const messages = {
    done: 'Đơn hàng đã được giao thành công. Cảm ơn bạn đã mua sắm tại ShopLite.',
    cancelled: 'Đơn hàng đã bị huỷ. Vui lòng liên hệ hỗ trợ nếu bạn cần thêm thông tin.',
  };
  await deliverToClient(ctx.userId, {
    type: 'order_status',
    title: `Đơn hàng #${ctx.orderId}: ${label}`,
    message: messages[ctx.status] || `Trạng thái đơn hàng đã chuyển sang ${label}.`,
    data: { order_id: ctx.orderId, status: ctx.status },
    actionUrl: frontendUrl(`/orders/${ctx.orderId}`),
  });
}

async function dispatchPaymentFailed(ctx) {
  const payload = {
    type: 'payment_failed',
    title: `Thanh toán đơn #${ctx.orderId} thất bại`,
    message: ctx.reason || 'Giao dịch không thành công. Vui lòng kiểm tra và thử lại.',
    data: { order_id: ctx.orderId },
    actionUrl: frontendUrl(`/orders/${ctx.orderId}`),
  };
  await deliverToClient(ctx.userId, payload);
  await deliverToAdmins({
    ...payload,
    title: 'Lỗi thanh toán cần kiểm tra',
    message: `Thanh toán của đơn #${ctx.orderId} thất bại. Cần kiểm tra và hỗ trợ khách hàng.`,
    actionUrl: frontendUrl('/admin/orders'),
  });

  const settings = await NotificationSettingsModel.get();
  const failures = await TransactionModel.countRecentFailures(settings.payment_failure_window_minutes);
  if (failures === Number(settings.payment_failure_threshold)) {
    await deliverToAdmins({
      type: 'payment_failed',
      title: 'Cảnh báo lỗi thanh toán hàng loạt',
      message: `${failures} giao dịch thất bại trong ${settings.payment_failure_window_minutes} phút gần đây.`,
      data: { failures, window_minutes: settings.payment_failure_window_minutes },
      actionUrl: frontendUrl('/admin/orders'),
    }, {
      email: false,
      smsMessage: `[ShopLite] Khẩn: ${failures} thanh toán thất bại trong ${settings.payment_failure_window_minutes} phút.`,
    });
  }
}

async function dispatchStockChanged(ctx) {
  const currentStock = Number(ctx.stock);
  const previousStock = ctx.previousStock === null || ctx.previousStock === undefined
    ? Number.POSITIVE_INFINITY
    : Number(ctx.previousStock);
  const settings = await NotificationSettingsModel.get();
  const threshold = Number(settings.stock_low_threshold);

  if (currentStock === 0 && previousStock > 0) {
    await deliverToAdmins({
      type: 'stock_out',
      title: `Hết hàng: ${ctx.productTitle}`,
      message: `Sản phẩm "${ctx.productTitle}" đã hết hàng và cần được bổ sung.`,
      data: { product_id: ctx.productId, stock: 0 },
      actionUrl: frontendUrl('/admin/products'),
    }, {
      smsMessage: `[ShopLite] Khẩn: sản phẩm "${ctx.productTitle}" (ID ${ctx.productId}) đã hết hàng.`,
    });
    return;
  }

  if (currentStock > 0 && currentStock < threshold && previousStock >= threshold) {
    await deliverToAdmins({
      type: 'stock_low',
      title: `Tồn kho thấp: ${ctx.productTitle}`,
      message: `Sản phẩm "${ctx.productTitle}" chỉ còn ${currentStock}; ngưỡng cảnh báo hiện tại là dưới ${threshold}.`,
      data: { product_id: ctx.productId, stock: currentStock, threshold },
      actionUrl: frontendUrl('/admin/products'),
    });
  }
}

async function handle(event, ctx) {
  switch (event) {
    case EVENTS.ACCOUNT_REGISTERED:
      return deliverToClient(ctx.userId, {
        type: 'account_registered',
        title: 'Chào mừng bạn đến với ShopLite',
        message: 'Tài khoản của bạn đã được tạo thành công.',
        data: {},
        actionUrl: frontendUrl('/profile'),
      });
    case EVENTS.PASSWORD_CHANGED:
      return deliverToClient(ctx.userId, {
        type: 'password_changed',
        title: 'Mật khẩu đã được thay đổi',
        message: 'Nếu không thực hiện thay đổi này, hãy liên hệ hỗ trợ ngay.',
        data: {},
        actionUrl: frontendUrl('/profile/security'),
      });
    case EVENTS.ORDER_CREATED:
      return dispatchOrderCreated(ctx);
    case EVENTS.ORDER_STATUS:
      return dispatchOrderStatus(ctx);
    case EVENTS.ORDER_CANCEL_REQUESTED:
    case EVENTS.RETURN_REQUESTED:
      return deliverToAdmins({
        type: event,
        title: event === EVENTS.RETURN_REQUESTED ? 'Yêu cầu đổi trả mới' : 'Yêu cầu huỷ đơn mới',
        message: `Khách hàng gửi yêu cầu cho đơn #${ctx.orderId}.`,
        data: { order_id: ctx.orderId, reason: ctx.reason || '' },
        actionUrl: frontendUrl('/admin/orders'),
      });
    case EVENTS.PAYMENT_SUCCESS:
      await deliverToClient(ctx.userId, {
        type: 'payment_success',
        title: `Thanh toán đơn #${ctx.orderId} thành công`,
        message: 'Giao dịch đã được xác nhận và đơn hàng sẽ tiếp tục được xử lý.',
        data: { order_id: ctx.orderId, amount: ctx.amount },
        actionUrl: frontendUrl(`/orders/${ctx.orderId}`),
      }, { email: !ctx.sendConfirmation });
      if (ctx.sendConfirmation
        && Number((await NotificationModel.getPreference(ctx.userId, 'payment_success')).email_enabled) !== 0) {
        return sendOrderConfirmationOnce(ctx.orderId);
      }
      return undefined;
    case EVENTS.PAYMENT_FAILED:
      return dispatchPaymentFailed(ctx);
    case EVENTS.PAYMENT_REFUNDED:
      return deliverToClient(ctx.userId, {
        type: 'payment_refunded',
        title: `Đã hoàn tiền đơn #${ctx.orderId}`,
        message: 'Khoản hoàn tiền đã được ghi nhận. Thời gian nhận tiền phụ thuộc vào ngân hàng.',
        data: { order_id: ctx.orderId, amount: ctx.amount },
        actionUrl: frontendUrl(`/orders/${ctx.orderId}`),
      });
    case EVENTS.STOCK_CHANGED:
      return dispatchStockChanged(ctx);
    default:
      console.warn(`[notifications] Unknown event: ${event}`);
      return undefined;
  }
}

async function dispatch(event, ctx = {}) {
  try {
    return await handle(event, ctx);
  } catch (error) {
    console.error(`[notifications] Event ${event} failed:`, error.message);
    return undefined;
  }
}

module.exports = { EVENTS, dispatch };
