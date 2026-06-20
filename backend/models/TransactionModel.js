const db = require('../db');

exports.create = async (connection, { orderId, provider, txnRef, amount }) => {
  const [result] = await connection.query(
    `INSERT INTO transactions (order_id, provider, txn_ref, amount, status)
     VALUES (?, ?, ?, ?, 'pending')`,
    [orderId, provider, txnRef, amount]
  );
  return result.insertId;
};

exports.findByTxnRefForUpdate = async (connection, txnRef) => {
  const [rows] = await connection.query(
    `SELECT transactions.*,
      orders.status AS order_status,
      orders.payment_status,
      orders.items,
      orders.customer_name,
      orders.customer_email,
      orders.customer_phone,
      orders.customer_address,
      orders.payment_method,
      orders.created_at AS order_created_at
     FROM transactions
     JOIN orders ON orders.id = transactions.order_id
     WHERE transactions.txn_ref = ?
     LIMIT 1 FOR UPDATE`,
    [txnRef]
  );
  return rows[0] || null;
};

exports.updateGatewayResult = (connection, id, result) => connection.query(
  `UPDATE transactions SET
    status = ?, gateway_transaction_no = ?, response_code = ?, transaction_status = ?,
    bank_code = ?, card_type = ?, pay_date = ?, raw_response = ?
   WHERE id = ?`,
  [
    result.status,
    result.gatewayTransactionNo || null,
    result.responseCode || null,
    result.transactionStatus || null,
    result.bankCode || null,
    result.cardType || null,
    result.payDate || null,
    JSON.stringify(result.rawResponse || {}),
    id,
  ]
);

exports.findLatestByOrderId = async (orderId) => {
  const [rows] = await db.query(
    `SELECT id, order_id, provider, txn_ref, amount, status, gateway_transaction_no,
      response_code, transaction_status, bank_code, card_type, pay_date, created_at, updated_at
     FROM transactions WHERE order_id = ? ORDER BY id DESC LIMIT 1`,
    [orderId]
  );
  return rows[0] || null;
};
