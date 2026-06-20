const test = require('node:test');
const assert = require('node:assert/strict');
const ExcelJS = require('exceljs');
const products = require('../controllers/products');
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
    const response = await fetch(`http://127.0.0.1:${port}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'A', email: 'invalid', subject: '', message: 'short' }),
    });
    const body = await response.json();
    assert.equal(response.status, 422);
    assert.equal(body.code, 'VALIDATION_ERROR');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
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
