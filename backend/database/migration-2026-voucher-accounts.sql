-- Run once after migration-2026-vouchers.sql.
USE shoplite;

SELECT COLUMN_TYPE INTO @users_id_type
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'id';

SELECT COLUMN_TYPE INTO @voucher_user_id_type
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vouchers' AND COLUMN_NAME = 'user_id';

SET @add_voucher_user_id = IF(
  @voucher_user_id_type IS NULL,
  CONCAT('ALTER TABLE vouchers ADD COLUMN user_id ', @users_id_type, ' NULL AFTER id'),
  IF(
    @voucher_user_id_type = @users_id_type,
    'SELECT 1',
    CONCAT('ALTER TABLE vouchers MODIFY COLUMN user_id ', @users_id_type, ' NULL')
  )
);
PREPARE voucher_user_id_statement FROM @add_voucher_user_id;
EXECUTE voucher_user_id_statement;
DEALLOCATE PREPARE voucher_user_id_statement;

UPDATE vouchers AS voucher
JOIN users AS user_account
  ON user_account.email COLLATE utf8mb4_unicode_ci = voucher.email COLLATE utf8mb4_unicode_ci
SET voucher.user_id = user_account.id
WHERE voucher.user_id IS NULL
  AND voucher.id > 0;

SET @add_voucher_user_unique = IF(
  EXISTS(
    SELECT 1 FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'vouchers'
      AND INDEX_NAME = 'uq_vouchers_user'
  ),
  'SELECT 1',
  'ALTER TABLE vouchers ADD UNIQUE KEY uq_vouchers_user (user_id)'
);
PREPARE voucher_unique_statement FROM @add_voucher_user_unique;
EXECUTE voucher_unique_statement;
DEALLOCATE PREPARE voucher_unique_statement;

SET @add_voucher_user_fk = IF(
  EXISTS(
    SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'vouchers'
      AND CONSTRAINT_NAME = 'fk_vouchers_user'
  ),
  'SELECT 1',
  'ALTER TABLE vouchers ADD CONSTRAINT fk_vouchers_user FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL'
);
PREPARE voucher_fk_statement FROM @add_voucher_user_fk;
EXECUTE voucher_fk_statement;
DEALLOCATE PREPARE voucher_fk_statement;
