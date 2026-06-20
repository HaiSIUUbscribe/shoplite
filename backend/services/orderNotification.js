const OrderModel = require('../models/OrderModel');
const mailer = require('../utils/mailer');

function parseItems(items) {
  if (Array.isArray(items)) return items;
  try {
    return JSON.parse(items || '[]');
  } catch (error) {
    return [];
  }
}

exports.sendOrderConfirmationOnce = async (orderId) => {
  const claimed = await OrderModel.claimConfirmationEmail(orderId);
  if (!claimed) return false;

  try {
    const order = await OrderModel.findById(orderId);
    if (!order) throw new Error(`Order ${orderId} not found while sending confirmation email`);
    const sent = await mailer.sendOrderConfirmation({ ...order, items: parseItems(order.items) });
    if (!sent) await OrderModel.releaseConfirmationEmailClaim(orderId);
    return sent;
  } catch (error) {
    await OrderModel.releaseConfirmationEmailClaim(orderId);
    console.error(`Could not send confirmation email for order ${orderId}:`, error.message);
    return false;
  }
};
