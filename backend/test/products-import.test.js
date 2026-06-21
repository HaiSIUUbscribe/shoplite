const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const ExcelJS = require('exceljs');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'shoplite-test-secret-with-at-least-32-characters';
const products = require('../controllers/products');
const orders = require('../controllers/orders');
const newsletter = require('../controllers/newsletter');
const NewsletterModel = require('../models/NewsletterModel');
const OrderModel = require('../models/OrderModel');
const TransactionModel = require('../models/TransactionModel');
const voucherService = require('../services/voucher');
const app = require('../server');

function createResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: null,
    status(code) { this.statusCode = code; return this; },
    setHeader(name, value) { this.headers[name] = value; },
    json(value) { this.body = value; return this; },
    send(value) { this.body = value; return this; },
  };
}

function failOnNext(error) {
  throw error;
}

test('creates a valid Excel product template', async () => {
  const response = createResponse();
  await products.downloadImportTemplate({}, response, failOnNext);

  assert.equal(response.statusCode, 200);
  assert.match(response.headers['Content-Type'], /spreadsheetml/);
  assert.ok(Buffer.isBuffer(response.body));

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(response.body);
  assert.equal(workbook.worksheets[0].getCell('A1').value, 'Tên sản phẩm');
  assert.equal(workbook.worksheets[0].getCell('F1').value, 'Tồn kho');
  assert.match(workbook.worksheets[0].getCell('G1').value, /Size/);
  assert.match(workbook.worksheets[0].getCell('H1').value, /Màu/);
});

test('rejects an invalid row before writing products', async () => {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Products');
  worksheet.addRow(['Tên sản phẩm', 'Giá bán', 'Tồn kho']);
  worksheet.addRow(['', 150000, 10]);
  const buffer = await workbook.xlsx.writeBuffer();
  const response = createResponse();

  await products.importProducts({ file: { buffer: Buffer.from(buffer) } }, response, failOnNext);

  assert.equal(response.statusCode, 422);
  assert.equal(response.body.errors[0].row, 2);
  assert.match(response.body.message, /Chưa có sản phẩm nào được thêm/);
});

test('returns structured validation errors before controller execution', async () => {
  const server = app.listen(0);
  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'A', email: 'invalid', password: '123' }),
    });
    const body = await response.json();
    assert.equal(response.status, 422);
    assert.equal(body.code, 'VALIDATION_ERROR');
    assert.ok(body.details.length >= 3);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('protects the user profile route with the global error format', async () => {
  const server = app.listen(0);
  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/users/profile`);
    const body = await response.json();
    assert.equal(response.status, 401);
    assert.equal(body.code, 'AUTH_REQUIRED');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('always scopes the customer order detail endpoint to the order owner', async () => {
  const originalFindByIdAndUserId = OrderModel.findByIdAndUserId;
  const originalFindById = OrderModel.findById;
  const originalFindLatest = TransactionModel.findLatestByOrderId;
  let ownerLookup;
  let unrestrictedLookupCalled = false;
  OrderModel.findByIdAndUserId = async (id, userId) => {
    ownerLookup = { id, userId };
    return { id: Number(id), user_id: Number(userId), items: '[]' };
  };
  OrderModel.findById = async () => {
    unrestrictedLookupCalled = true;
    return null;
  };
  TransactionModel.findLatestByOrderId = async () => null;

  try {
    const response = createResponse();
    await orders.getOrderById(
      { params: { id: '8' }, user: { id: 42, role: 'admin' } },
      response,
      failOnNext
    );
    assert.deepEqual(ownerLookup, { id: '8', userId: 42 });
    assert.equal(unrestrictedLookupCalled, false);
    assert.equal(response.body.user_id, 42);
  } finally {
    OrderModel.findByIdAndUserId = originalFindByIdAndUserId;
    OrderModel.findById = originalFindById;
    TransactionModel.findLatestByOrderId = originalFindLatest;
  }
});

test('rejects invalid password reset tokens safely', async () => {
  const server = app.listen(0);
  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: 'not-a-token', password: 'new-password-123' }),
    });
    const body = await response.json();
    assert.equal(response.status, 400);
    assert.equal(body.code, 'INVALID_RESET_TOKEN');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('validates contact messages before attempting email delivery', async () => {
  const server = app.listen(0);
  try {
    const { port } = server.address();
    const token = jwt.sign({ id: 1, email: 'buyer@example.com', role: 'client' }, process.env.JWT_SECRET);
    const response = await fetch(`http://127.0.0.1:${port}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: 'A', email: 'invalid', subject: '', message: 'short' }),
    });
    const body = await response.json();
    assert.equal(response.status, 422);
    assert.equal(body.code, 'VALIDATION_ERROR');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('requires authentication before accepting contact requests', async () => {
  const server = app.listen(0);
  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Guest user',
        email: 'guest@example.com',
        subject: 'other',
        message: 'I need help with an order.',
      }),
    });
    const body = await response.json();
    assert.equal(response.status, 401);
    assert.equal(body.code, 'AUTH_REQUIRED');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('validates newsletter emails before accessing the database', async () => {
  const server = app.listen(0);
  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/newsletter/subscribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'invalid-email' }),
    });
    const body = await response.json();
    assert.equal(response.status, 422);
    assert.equal(body.code, 'VALIDATION_ERROR');
    assert.equal(body.details[0].field, 'email');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('returns a gentle response for an existing newsletter subscriber', async () => {
  const originalSubscribe = NewsletterModel.subscribe;
  NewsletterModel.subscribe = async () => ({ status: 'duplicate' });
  try {
    const response = createResponse();
    await newsletter.subscribe({ body: { email: 'reader@example.com' } }, response, failOnNext);
    assert.equal(response.statusCode, 200);
    assert.equal(response.body.status, 'duplicate');
    assert.match(response.body.message, /đã nhận voucher/);
  } finally {
    NewsletterModel.subscribe = originalSubscribe;
  }
});

test('calculates a newsletter voucher discount with a maximum cap', () => {
  const voucher = {
    code: 'SL-TEST123',
    email: 'reader@example.com',
    status: 'active',
    discount_type: 'percent',
    discount_value: 10,
    min_order_amount: 500000,
    max_discount_amount: 100000,
    expires_at: new Date(Date.now() + 86400000),
  };
  const result = voucherService.validateAndCalculate(voucher, 'reader@example.com', 1500000);
  assert.equal(result.discountAmount, 100000);
});

test('rejects a voucher used with a different email', () => {
  const voucher = {
    code: 'SL-TEST123',
    email: 'owner@example.com',
    status: 'active',
    discount_type: 'percent',
    discount_value: 10,
    min_order_amount: 500000,
    max_discount_amount: 100000,
    expires_at: new Date(Date.now() + 86400000),
  };
  assert.throws(
    () => voucherService.validateAndCalculate(voucher, 'other@example.com', 600000),
    (error) => error.code === 'VOUCHER_EMAIL_MISMATCH'
  );
});

test('rejects an unsigned VNPay IPN callback', async () => {
  const previousTmnCode = process.env.VNPAY_TMN_CODE;
  const previousSecret = process.env.VNPAY_SECURE_SECRET;
  process.env.VNPAY_TMN_CODE = 'TESTCODE';
  process.env.VNPAY_SECURE_SECRET = 'test-secret';
  const server = app.listen(0);
  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/payments/vnpay/ipn?vnp_TxnRef=SL1&vnp_Amount=100000&vnp_ResponseCode=00&vnp_OrderInfo=test`);
    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(body.RspCode, '97');
  } finally {
    if (previousTmnCode === undefined) delete process.env.VNPAY_TMN_CODE;
    else process.env.VNPAY_TMN_CODE = previousTmnCode;
    if (previousSecret === undefined) delete process.env.VNPAY_SECURE_SECRET;
    else process.env.VNPAY_SECURE_SECRET = previousSecret;
    await new Promise((resolve) => server.close(resolve));
  }
});
