require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const db = require('./db');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const contactRoutes = require('./routes/contact');
const newsletterRoutes = require('./routes/newsletter');
const voucherRoutes = require('./routes/vouchers');
const paymentRoutes = require('./routes/payments');
const cartRoutes = require('./routes/cart');
const addressRoutes = require('./routes/addresses');
const notificationRoutes = require('./routes/notifications');
const favoriteRoutes = require('./routes/favorites');
const locationRoutes = require('./routes/locations');
const { uploadRoot } = require('./middlewares/upload');
const { notFound, errorHandler } = require('./middlewares/errorHandler');
const ApiError = require('./utils/ApiError');
const { apiLimiter } = require('./middlewares/rateLimit');
const sanitize = require('./middlewares/sanitize');
const cleanupJob = require('./jobs/cleanup');

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

const requiredEnv = ['DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET'];
if (IS_PRODUCTION) requiredEnv.push('CLIENT_URL');

const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length) {
  const message = `[server] Missing required environment variables: ${missingEnv.join(', ')}`;
  if (IS_PRODUCTION) {
    console.error(message);
    process.exit(1);
  } else {
    console.warn(message);
  }
}

const allowedOrigins = String(process.env.CLIENT_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
  credentials: true,
  origin(origin, callback) {
    // Không có origin = same-origin request (curl, server-to-server) → luôn cho qua
    if (!origin) return callback(null, true);
    // Development không cấu hình CLIENT_URL → cho phép mọi browser origin
    if (!IS_PRODUCTION && !allowedOrigins.length) return callback(null, true);
    // Production hoặc đã cấu hình danh sách → kiểm tra chặt chẽ
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new ApiError(403, 'Nguồn truy cập không được CORS cho phép.', 'CORS_DENIED'));
  },
}));
app.use(cookieParser());
app.use(express.json({ limit: '200kb' }));
app.use(sanitize);
app.use('/api', apiLimiter);
app.use('/uploads', express.static(path.resolve(uploadRoot), {
  dotfiles: 'deny',
  index: false,
  maxAge: process.env.NODE_ENV === 'production' ? '7d' : 0,
}));

app.get('/', (req, res) => res.json({ name: 'ShopLite API', status: 'running' }));
app.get('/api/health', async (req, res) => {
  try {
    await db.query('SELECT 1');
    return res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    return res.status(503).json({ status: 'error', database: 'unavailable' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/vouchers', voucherRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/locations', locationRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = Number(process.env.PORT || 3600);
if (require.main === module) {
  app.listen(PORT, () => {
    let mailTransport = 'not configured';
    if (process.env.RESEND_API_KEY) mailTransport = 'resend';
    else if (process.env.SMTP_HOST) mailTransport = 'smtp';
    console.log(`ShopLite API listening on port ${PORT}`);
    console.log(`[server] Mail transport: ${mailTransport}`);
    cleanupJob.start();
  });
}

module.exports = app;
