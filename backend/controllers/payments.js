const {
  IpnFailChecksum,
  IpnInvalidAmount,
  IpnOrderNotFound,
  InpOrderAlreadyConfirmed,
  IpnSuccess,
  IpnUnknownError,
} = require('vnpay');
const db = require('../db');
const OrderModel = require('../models/OrderModel');
const ProductModel = require('../models/ProductModel');
const TransactionModel = require('../models/TransactionModel');
const vnpayService = require('../services/vnpay');
const dispatcher = require('../services/notificationDispatcher');

function parseItems(items) {
  if (Array.isArray(items)) return items;
  try {
    return JSON.parse(items || '[]');
  } catch (error) {
    return [];
  }
}

function frontendUrl(path) {
  const origin = String(process.env.FRONTEND_URL || 'http://localhost:3000').replace(/\/$/, '');
  return `${origin}${path}`;
}

async function processVnpayCallback(query, source) {
  let verification;
  try {
    const client = vnpayService.getClient();
    verification = source === 'ipn' ? client.verifyIpnCall(query) : client.verifyReturnUrl(query);
  } catch (error) {
    return { outcome: 'invalid_signature', message: error.message };
  }

  if (!verification.isVerified) {
    return { outcome: 'invalid_signature', message: verification.message };
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    const transaction = await TransactionModel.findByTxnRefForUpdate(connection, verification.vnp_TxnRef);
    if (!transaction) {
      await connection.rollback();
      return { outcome: 'not_found' };
    }

    if (Number(transaction.amount) !== Number(verification.vnp_Amount)) {
      await connection.rollback();
      return { outcome: 'invalid_amount', orderId: transaction.order_id };
    }

    if (transaction.status !== 'pending') {
      await connection.commit();
      return {
        outcome: 'already_confirmed',
        orderId: transaction.order_id,
        successful: transaction.status === 'success',
      };
    }

    const successful = verification.isSuccess
      && String(verification.vnp_TransactionStatus || '00') === '00';
    await TransactionModel.updateGatewayResult(connection, transaction.id, {
      status: successful ? 'success' : 'failed',
      gatewayTransactionNo: verification.vnp_TransactionNo,
      responseCode: verification.vnp_ResponseCode,
      transactionStatus: verification.vnp_TransactionStatus,
      bankCode: verification.vnp_BankCode,
      cardType: verification.vnp_CardType,
      payDate: verification.vnp_PayDate,
      rawResponse: query,
    });

    if (successful) {
      await OrderModel.updatePaymentStatus(connection, transaction.order_id, 'paid');
    } else {
      await OrderModel.updatePaymentStatus(connection, transaction.order_id, 'failed');
      if (transaction.order_status !== 'cancelled') {
        for (const item of parseItems(transaction.items)) {
          await ProductModel.incrementStock(connection, item.product_id, item.qty);
        }
        await OrderModel.updateStatus(connection, transaction.order_id, 'cancelled');
      }
    }

    await connection.commit();
    dispatcher.dispatch(
      successful ? dispatcher.EVENTS.PAYMENT_SUCCESS : dispatcher.EVENTS.PAYMENT_FAILED,
      {
        orderId: transaction.order_id,
        userId: transaction.user_id,
        amount: Number(transaction.amount),
        reason: successful ? '' : verification.message,
        sendConfirmation: successful,
      }
    );
    return {
      outcome: successful ? 'success' : 'failed',
      successful,
      orderId: transaction.order_id,
      message: verification.message,
    };
  } catch (error) {
    if (connection) await connection.rollback();
    throw error;
  } finally {
    if (connection) connection.release();
  }
}

exports.vnpayReturn = async (req, res, next) => {
  try {
    const result = await processVnpayCallback(req.query, 'return');
    if ((result.outcome === 'success' || result.outcome === 'already_confirmed') && result.successful) {
      return res.redirect(frontendUrl(`/order-success/${result.orderId}?payment=vnpay`));
    }

    const params = new URLSearchParams({
      reason: result.outcome,
      message: result.message || 'Thanh toán VNPay không thành công.',
    });
    if (result.orderId) params.set('orderId', result.orderId);
    return res.redirect(frontendUrl(`/order-failed?${params.toString()}`));
  } catch (error) {
    return next(error);
  }
};

exports.vnpayIpn = async (req, res) => {
  try {
    const result = await processVnpayCallback(req.query, 'ipn');
    if (result.outcome === 'invalid_signature') return res.json(IpnFailChecksum);
    if (result.outcome === 'not_found') return res.json(IpnOrderNotFound);
    if (result.outcome === 'invalid_amount') return res.json(IpnInvalidAmount);
    if (result.outcome === 'already_confirmed') return res.json(InpOrderAlreadyConfirmed);
    return res.json(IpnSuccess);
  } catch (error) {
    console.error('VNPay IPN processing failed:', error);
    return res.json(IpnUnknownError);
  }
};

exports.processVnpayCallback = processVnpayCallback;
