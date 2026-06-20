CREATE DATABASE IF NOT EXISTS shoplite
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE shoplite;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('client', 'admin') NOT NULL DEFAULT 'client',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS products (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  title VARCHAR(180) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(14, 2) UNSIGNED NOT NULL,
  category VARCHAR(100) NOT NULL DEFAULT '',
  sizes JSON NULL,
  colors JSON NULL,
  thumbnail VARCHAR(1000) NOT NULL DEFAULT '',
  stock INT UNSIGNED NOT NULL DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_products_category (category),
  KEY idx_products_title (title)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS orders (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  items JSON NOT NULL,
  subtotal DECIMAL(14, 2) UNSIGNED NOT NULL,
  discount_amount DECIMAL(14, 2) UNSIGNED NOT NULL DEFAULT 0,
  voucher_code VARCHAR(32) NULL,
  total DECIMAL(14, 2) UNSIGNED NOT NULL,
  status ENUM('pending', 'processing', 'shipping', 'done', 'cancelled') NOT NULL DEFAULT 'pending',
  customer_name VARCHAR(120) NOT NULL,
  customer_email VARCHAR(190) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_address VARCHAR(500) NOT NULL,
  payment_method ENUM('cod', 'bank_transfer', 'vnpay') NOT NULL DEFAULT 'cod',
  payment_status ENUM('unpaid', 'pending', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'unpaid',
  confirmation_email_sent_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_orders_user_created (user_id, created_at),
  KEY idx_orders_status (status),
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS transactions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_id BIGINT UNSIGNED NOT NULL,
  provider ENUM('vnpay') NOT NULL,
  txn_ref VARCHAR(100) NOT NULL,
  amount DECIMAL(14, 2) UNSIGNED NOT NULL,
  status ENUM('pending', 'success', 'failed', 'cancelled', 'refunded') NOT NULL DEFAULT 'pending',
  gateway_transaction_no VARCHAR(100) NULL,
  response_code VARCHAR(10) NULL,
  transaction_status VARCHAR(10) NULL,
  bank_code VARCHAR(30) NULL,
  card_type VARCHAR(30) NULL,
  pay_date VARCHAR(14) NULL,
  raw_response JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_transactions_txn_ref (txn_ref),
  KEY idx_transactions_order (order_id),
  KEY idx_transactions_status (status),
  CONSTRAINT fk_transactions_order FOREIGN KEY (order_id) REFERENCES orders(id)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(190) NOT NULL,
  status ENUM('active', 'unsubscribed') NOT NULL DEFAULT 'active',
  subscribed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  unsubscribed_at TIMESTAMP NULL DEFAULT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_newsletter_email (email),
  KEY idx_newsletter_status (status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS vouchers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NULL,
  code VARCHAR(32) NOT NULL,
  email VARCHAR(190) NOT NULL,
  discount_type ENUM('percent', 'fixed') NOT NULL DEFAULT 'percent',
  discount_value DECIMAL(10, 2) UNSIGNED NOT NULL DEFAULT 10,
  min_order_amount DECIMAL(14, 2) UNSIGNED NOT NULL DEFAULT 500000,
  max_discount_amount DECIMAL(14, 2) UNSIGNED NOT NULL DEFAULT 100000,
  status ENUM('active', 'used', 'expired', 'disabled') NOT NULL DEFAULT 'active',
  expires_at TIMESTAMP NOT NULL,
  email_sent_at TIMESTAMP NULL DEFAULT NULL,
  used_at TIMESTAMP NULL DEFAULT NULL,
  used_order_id BIGINT UNSIGNED NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_vouchers_code (code),
  UNIQUE KEY uq_vouchers_email (email),
  UNIQUE KEY uq_vouchers_user (user_id),
  KEY idx_vouchers_status_expires (status, expires_at),
  KEY idx_vouchers_used_order (used_order_id),
  CONSTRAINT fk_vouchers_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE SET NULL
) ENGINE=InnoDB;
