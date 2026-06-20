-- Run once after migration-2026-professional.sql.
USE shoplite;

ALTER TABLE orders
  MODIFY COLUMN payment_method ENUM('cod', 'bank_transfer', 'vnpay') NOT NULL DEFAULT 'cod',
  ADD COLUMN payment_status ENUM('unpaid', 'pending', 'paid', 'failed', 'refunded') NOT NULL DEFAULT 'unpaid' AFTER payment_method,
  ADD COLUMN confirmation_email_sent_at TIMESTAMP NULL DEFAULT NULL AFTER payment_status;

CREATE TABLE transactions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  -- Existing ShopLite installations use INT for orders.id.
  order_id INT NOT NULL,
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
