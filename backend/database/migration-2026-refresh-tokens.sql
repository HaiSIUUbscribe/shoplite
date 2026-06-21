-- Run once on an existing ShopLite database.
USE shoplite;

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  token_hash CHAR(64) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_refresh_tokens_hash (token_hash),
  KEY idx_refresh_tokens_user_active (user_id, revoked_at, expires_at)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;

SELECT COLUMN_TYPE INTO @users_id_type
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'id';

SELECT COLUMN_TYPE INTO @refresh_user_id_type
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'refresh_tokens' AND COLUMN_NAME = 'user_id';

SET @align_refresh_user_id = IF(
  @refresh_user_id_type = @users_id_type,
  'SELECT 1',
  CONCAT('ALTER TABLE refresh_tokens MODIFY COLUMN user_id ', @users_id_type, ' NOT NULL')
);
PREPARE align_refresh_statement FROM @align_refresh_user_id;
EXECUTE align_refresh_statement;
DEALLOCATE PREPARE align_refresh_statement;

SET @add_refresh_fk = IF(
  EXISTS(
    SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'refresh_tokens'
      AND CONSTRAINT_NAME = 'fk_refresh_tokens_user'
  ),
  'SELECT 1',
  'ALTER TABLE refresh_tokens ADD CONSTRAINT fk_refresh_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE'
);
PREPARE add_refresh_fk_statement FROM @add_refresh_fk;
EXECUTE add_refresh_fk_statement;
DEALLOCATE PREPARE add_refresh_fk_statement;
