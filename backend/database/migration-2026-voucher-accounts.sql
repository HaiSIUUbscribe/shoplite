-- Run once after migration-2026-vouchers.sql.
USE shoplite;

ALTER TABLE vouchers
  ADD COLUMN user_id BIGINT UNSIGNED NULL AFTER id;

UPDATE vouchers AS voucher
JOIN users AS user_account ON user_account.email = voucher.email
SET voucher.user_id = user_account.id
WHERE voucher.user_id IS NULL;

ALTER TABLE vouchers
  ADD UNIQUE KEY uq_vouchers_user (user_id),
  ADD CONSTRAINT fk_vouchers_user FOREIGN KEY (user_id) REFERENCES users(id)
    ON UPDATE CASCADE ON DELETE SET NULL;
