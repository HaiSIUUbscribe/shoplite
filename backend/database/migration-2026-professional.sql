-- Run once on the existing ShopLite database before deploying this version.
USE shoplite;

ALTER TABLE products
  ADD COLUMN stock INT UNSIGNED NOT NULL DEFAULT 0 AFTER thumbnail,
  ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE orders
  MODIFY COLUMN status ENUM('pending', 'processing', 'shipping', 'done', 'cancelled') NOT NULL DEFAULT 'pending',
  ADD COLUMN customer_name VARCHAR(120) NOT NULL DEFAULT '' AFTER status,
  ADD COLUMN customer_email VARCHAR(190) NOT NULL DEFAULT '' AFTER customer_name,
  ADD COLUMN customer_phone VARCHAR(20) NOT NULL DEFAULT '' AFTER customer_email,
  ADD COLUMN customer_address VARCHAR(500) NOT NULL DEFAULT '' AFTER customer_phone,
  ADD COLUMN payment_method ENUM('cod', 'bank_transfer') NOT NULL DEFAULT 'cod' AFTER customer_address,
  ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
