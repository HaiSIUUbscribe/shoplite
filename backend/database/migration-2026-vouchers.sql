-- Run once after migration-2026-newsletter.sql.
USE shoplite;

CREATE TABLE vouchers (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
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
  KEY idx_vouchers_status_expires (status, expires_at),
  KEY idx_vouchers_used_order (used_order_id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

ALTER TABLE orders
  ADD COLUMN subtotal DECIMAL(14, 2) UNSIGNED NOT NULL DEFAULT 0 AFTER items,
  ADD COLUMN discount_amount DECIMAL(14, 2) UNSIGNED NOT NULL DEFAULT 0 AFTER subtotal,
  ADD COLUMN voucher_code VARCHAR(32) NULL AFTER discount_amount;

UPDATE orders SET subtotal = total WHERE id > 0 AND subtotal = 0;
