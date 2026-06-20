const db = require('../db');
const ProductModel = require('../models/ProductModel');
const OrderModel = require('../models/OrderModel');
const TransactionModel = require('../models/TransactionModel');
const VoucherModel = require('../models/VoucherModel');
const ApiError = require('../utils/ApiError');
const vnpayService = require('../services/vnpay');
const voucherService = require('../services/voucher');
const { sendOrderConfirmationOnce } = require('../services/orderNotification');

function parseOrderItems(items) {
  if (Array.isArray(items)) return items;
  try {
    return JSON.parse(items || '[]');
  } catch (error) {
    return [];
  }
}

function normalizeOrders(orders) {
  return orders.map((order) => ({ ...order, items: parseOrderItems(order.items) }));
}

exports.createOrder = async (req, res, next) => {
  let connection;
  try {
    const requestedLines = new Map();
    const quantities = new Map();
    for (const item of req.body.items) {
      const productId = Number(item.product_id);
      const size = item.size || null;
      const color = item.color || null;
      const lineKey = `${productId}:${size || ''}:${color || ''}`;
      const existingLine = requestedLines.get(lineKey);
      requestedLines.set(lineKey, {
        product_id: productId,
        qty: (existingLine?.qty || 0) + Number(item.qty),
        size,
        color,
      });
      quantities.set(productId, (quantities.get(productId) || 0) + Number(item.qty));
    }

    connection = await db.getConnection();
    await connection.beginTransaction();
    const ids = [...quantities.keys()];
    const products = await ProductModel.findByIdsForUpdate(connection, ids);
    if (products.length !== ids.length) {
      throw new ApiError(400, 'Một sản phẩm trong giỏ không còn tồn tại.', 'PRODUCT_NOT_FOUND');
    }

    const productById = new Map(products.map((product) => [Number(product.id), product]));
    for (const [productId, qty] of quantities) {
      const product = productById.get(productId);
      if (Number(product.stock) < qty) {
        throw new ApiError(409, `Sản phẩm "${product.title}" chỉ còn ${product.stock} trong kho.`, 'INSUFFICIENT_STOCK');
      }
    }

    let subtotal = 0;
    const orderItems = [...requestedLines.values()].map((line) => {
      const product = productById.get(line.product_id);
      const sizes = parseOrderItems(product.sizes);
      const colors = parseOrderItems(product.colors);
      if ((sizes.length && !sizes.includes(line.size)) || (!sizes.length && line.size)) {
        throw new ApiError(422, `Size đã chọn cho "${product.title}" không hợp lệ.`, 'INVALID_PRODUCT_SIZE');
      }
      if ((colors.length && !colors.includes(line.color)) || (!colors.length && line.color)) {
        throw new ApiError(422, `Màu đã chọn cho "${product.title}" không hợp lệ.`, 'INVALID_PRODUCT_COLOR');
      }
      const price = Number(product.price);
      subtotal += price * line.qty;
      return {
        product_id: product.id,
        title: product.title,
        price,
        qty: line.qty,
        size: line.size,
        color: line.color,
        thumbnail: product.thumbnail,
      };
    });

    let voucher = null;
    let voucherResult = null;
    if (req.body.voucher_code) {
      const voucherCode = voucherService.normalizeCode(req.body.voucher_code);
      voucher = await VoucherModel.findByCodeForUpdate(connection, voucherCode);
      voucherResult = voucherService.validateAndCalculate(voucher, req.body.customer_email, subtotal, req.user.id);
    }
    const discountAmount = voucherResult?.discountAmount || 0;
    const total = subtotal - discountAmount;

    for (const [productId, qty] of quantities) {
      await ProductModel.decrementStock(connection, productId, qty);
    }

    const paymentMethod = req.body.payment_method || 'cod';
    const paymentStatus = paymentMethod === 'cod' ? 'unpaid' : 'pending';
    const orderId = await OrderModel.create(connection, {
      userId: req.user.id,
      items: orderItems,
      subtotal,
      discountAmount,
      voucherCode: voucherResult?.code || null,
      total,
      customerName: req.body.customer_name,
      customerEmail: req.body.customer_email,
      customerPhone: req.body.customer_phone,
      customerAddress: req.body.customer_address,
      paymentMethod,
      paymentStatus,
    });

    if (voucher) {
      const claimed = await VoucherModel.markUsed(connection, voucher.id, orderId);
      if (!claimed) throw new ApiError(409, 'Mã voucher vừa được sử dụng ở đơn hàng khác.', 'VOUCHER_USED');
    }

    let paymentUrl = null;
    if (paymentMethod === 'vnpay') {
      const txnRef = vnpayService.createTxnRef(orderId);
      await TransactionModel.create(connection, {
        orderId,
        provider: 'vnpay',
        txnRef,
        amount: total,
      });
      paymentUrl = vnpayService.buildPaymentUrl({
        amount: total,
        orderId,
        txnRef,
        ipAddress: vnpayService.getClientIp(req),
      });
    }

    await connection.commit();
    if (paymentMethod !== 'vnpay') await sendOrderConfirmationOnce(orderId);
    return res.status(201).json({
      message: paymentUrl ? 'Đã tạo phiên thanh toán VNPay.' : 'Đặt hàng thành công.',
      orderId,
      subtotal,
      discountAmount,
      voucherCode: voucherResult?.code || null,
      total,
      paymentUrl,
    });
  } catch (error) {
    if (connection) await connection.rollback();
    return next(error);
  } finally {
    if (connection) connection.release();
  }
};

exports.getMyOrders = async (req, res, next) => {
  try {
    return res.json(normalizeOrders(await OrderModel.findByUserId(req.user.id)));
  } catch (error) {
    return next(error);
  }
};

exports.getAllOrders = async (req, res, next) => {
  try {
    return res.json(normalizeOrders(await OrderModel.findAllWithUsers()));
  } catch (error) {
    return next(error);
  }
};

exports.getOrderById = async (req, res, next) => {
  try {
    const order = req.user.role === 'admin'
      ? await OrderModel.findById(req.params.id)
      : await OrderModel.findByIdAndUserId(req.params.id, req.user.id);
    if (!order) throw new ApiError(404, 'Không tìm thấy đơn hàng.', 'ORDER_NOT_FOUND');
    const transaction = await TransactionModel.findLatestByOrderId(order.id);
    return res.json({ ...order, items: parseOrderItems(order.items), transaction });
  } catch (error) {
    return next(error);
  }
};

exports.updateStatus = async (req, res, next) => {
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    const order = await OrderModel.findByIdForUpdate(connection, req.params.id);
    if (!order) throw new ApiError(404, 'Không tìm thấy đơn hàng.', 'ORDER_NOT_FOUND');
    if (order.status === 'cancelled' && req.body.status !== 'cancelled') {
      throw new ApiError(409, 'Không thể mở lại đơn hàng đã hủy.', 'INVALID_STATUS_TRANSITION');
    }
    if (order.status === 'done' && req.body.status !== 'done') {
      throw new ApiError(409, 'Không thể thay đổi đơn hàng đã hoàn tất.', 'INVALID_STATUS_TRANSITION');
    }
    if (req.body.status === 'cancelled' && order.payment_method === 'vnpay') {
      throw new ApiError(409, 'Đơn VNPay phải được hoàn tiền trước khi huỷ.', 'VNPAY_REFUND_REQUIRED');
    }

    if (req.body.status === 'cancelled' && order.status !== 'cancelled') {
      for (const item of parseOrderItems(order.items)) {
        await ProductModel.incrementStock(connection, item.product_id, item.qty);
      }
      if (order.voucher_code) await VoucherModel.releaseByOrderId(connection, order.id);
    }
    await OrderModel.updateStatus(connection, req.params.id, req.body.status);
    if (req.body.status === 'done' && order.payment_status !== 'paid') {
      await OrderModel.updatePaymentStatus(connection, req.params.id, 'paid');
    }
    await connection.commit();
    return res.json({ message: 'Đã cập nhật trạng thái đơn hàng.' });
  } catch (error) {
    if (connection) await connection.rollback();
    return next(error);
  } finally {
    if (connection) connection.release();
  }
};
