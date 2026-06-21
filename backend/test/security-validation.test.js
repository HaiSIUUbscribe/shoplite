const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'shoplite-test-secret-with-at-least-32-characters';

const app = require('../server');
const authController = require('../controllers/auth');
const contactController = require('../controllers/contact');
const UserModel = require('../models/UserModel');
const mailer = require('../utils/mailer');

function accessToken(user = { id: 7, email: 'buyer@example.com', role: 'client' }) {
  return jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '5m' });
}

async function withServer(callback) {
  const server = app.listen(0);
  try {
    await callback(server.address().port);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

function responseRecorder() {
  return {
    statusCode: 200,
    body: null,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test('rejects non-numeric cart quantities before database access', async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/cart`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ productId: 1, quantity: 'two' }),
    });
    const body = await response.json();
    assert.equal(response.status, 422);
    assert.equal(body.code, 'VALIDATION_ERROR');
    assert.equal(body.details[0].field, 'quantity');
  });
});

test('limits review rating and comment length before database access', async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/products/1/reviews`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ rating: 6, comment: 'x'.repeat(1001) }),
    });
    const body = await response.json();
    assert.equal(response.status, 422);
    assert.equal(body.code, 'VALIDATION_ERROR');
    assert.deepEqual(body.details.map((item) => item.field), ['rating', 'comment']);
  });
});

test('rejects incomplete checkout data before opening a transaction', async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ items: [] }),
    });
    const body = await response.json();
    assert.equal(response.status, 422);
    assert.equal(body.code, 'VALIDATION_ERROR');
    assert.ok(body.details.some((item) => item.field === 'items'));
    assert.ok(body.details.some((item) => item.field === 'customer_email'));
  });
});

test('rejects unsupported social providers before contacting OAuth', async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/social`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'unknown', token: 'short' }),
    });
    const body = await response.json();
    assert.equal(response.status, 422);
    assert.equal(body.code, 'VALIDATION_ERROR');
  });
});

test('rejects refresh attempts without the HttpOnly cookie', async () => {
  await withServer(async (port) => {
    const response = await fetch(`http://127.0.0.1:${port}/api/auth/refresh`, { method: 'POST' });
    const body = await response.json();
    assert.equal(response.status, 401);
    assert.equal(body.code, 'INVALID_REFRESH_TOKEN');
  });
});

test('creates a password reset link for a social account with a null password', async () => {
  const originalFindByEmail = UserModel.findByEmail;
  const originalSendPasswordReset = mailer.sendPasswordReset;
  const originalNodeEnv = process.env.NODE_ENV;
  UserModel.findByEmail = async () => ({
    id: 9,
    name: 'Social User',
    email: 'social@example.com',
    password: null,
  });
  mailer.sendPasswordReset = async () => false;
  process.env.NODE_ENV = 'test';

  try {
    const response = responseRecorder();
    await authController.forgotPassword(
      { body: { email: 'social@example.com' } },
      response,
      (error) => { throw error; }
    );
    assert.equal(response.statusCode, 200);
    assert.match(response.body.resetUrl, /reset-password\?token=/);
  } finally {
    UserModel.findByEmail = originalFindByEmail;
    mailer.sendPasswordReset = originalSendPasswordReset;
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
  }
});

test('forwards structured contact data and image attachments to the mailer', async () => {
  const originalSendContactMessage = mailer.sendContactMessage;
  let received;
  mailer.sendContactMessage = async (payload) => {
    received = payload;
    return true;
  };

  try {
    const response = responseRecorder();
    await contactController.sendMessage({
      body: {
        name: 'Buyer',
        email: 'buyer@example.com',
        phone: '0901234567',
        subject: 'order',
        order_id: 10234,
        message: 'The delivered product is damaged.',
      },
      files: [{
        originalname: 'damage photo.png',
        buffer: Buffer.from('image-content'),
        mimetype: 'image/png',
      }],
    }, response, (error) => { throw error; });

    assert.equal(response.statusCode, 202);
    assert.equal(received.subject, 'order');
    assert.equal(received.order_id, 10234);
    assert.equal(received.attachments.length, 1);
    assert.equal(received.attachments[0].contentType, 'image/png');
  } finally {
    mailer.sendContactMessage = originalSendContactMessage;
  }
});
