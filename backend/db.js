const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_POOL_SIZE || 10),
  queueLimit: 0,
  charset: 'utf8mb4',
  ssl: process.env.DB_SSL === 'false' ? undefined : { rejectUnauthorized: false },
  decimalNumbers: true,
  connectTimeout: Number(process.env.DB_CONNECT_TIMEOUT_MS || 20000),
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

module.exports = pool;
