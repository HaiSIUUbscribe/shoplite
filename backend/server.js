require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
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
const { uploadRoot } = require('./middlewares/upload');
const { notFound, errorHandler } = require('./middlewares/errorHandler');
const ApiError = require('./utils/ApiError');

const requiredEnv = ['DB_HOST', 'DB_USER', 'DB_NAME', 'JWT_SECRET'];
const missingEnv = requiredEnv.filter((key) => !process.env[key]);
if (missingEnv.length) console.warn(`Missing environment variables: ${missingEnv.join(', ')}`);

const allowedOrigins = String(process.env.CLIENT_URL || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
app.use(cors({
  origin(origin, callback) {
    if (!origin || !allowedOrigins.length || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new ApiError(403, 'Nguồn truy cập không được CORS cho phép.', 'CORS_DENIED'));
  },
}));
app.use(express.json({ limit: '200kb' }));
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

app.use(notFound);
app.use(errorHandler);

const PORT = Number(process.env.PORT || 3600);
if (require.main === module) {
  app.listen(PORT, () => console.log(`ShopLite API listening on port ${PORT}`));
}

module.exports = app;
