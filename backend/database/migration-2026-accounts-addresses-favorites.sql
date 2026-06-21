-- Run once on an existing ShopLite database.
USE shoplite;

SET @add_user_phone = IF(
  EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'phone'),
  'SELECT 1',
  'ALTER TABLE users ADD COLUMN phone VARCHAR(20) NULL AFTER email'
);
PREPARE add_user_phone_stmt FROM @add_user_phone;
EXECUTE add_user_phone_stmt;
DEALLOCATE PREPARE add_user_phone_stmt;

SET @add_user_date_of_birth = IF(
  EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'date_of_birth'),
  'SELECT 1',
  'ALTER TABLE users ADD COLUMN date_of_birth DATE NULL AFTER phone'
);
PREPARE add_user_date_of_birth_stmt FROM @add_user_date_of_birth;
EXECUTE add_user_date_of_birth_stmt;
DEALLOCATE PREPARE add_user_date_of_birth_stmt;

ALTER TABLE users MODIFY COLUMN password VARCHAR(255) NULL;

SET @add_user_provider = IF(
  EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'provider'),
  'SELECT 1',
  'ALTER TABLE users ADD COLUMN provider ENUM(''local'', ''google'', ''facebook'') NOT NULL DEFAULT ''local'' AFTER password'
);
PREPARE add_user_provider_stmt FROM @add_user_provider;
EXECUTE add_user_provider_stmt;
DEALLOCATE PREPARE add_user_provider_stmt;

SET @add_user_provider_id = IF(
  EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'provider_id'),
  'SELECT 1',
  'ALTER TABLE users ADD COLUMN provider_id VARCHAR(255) NULL AFTER provider'
);
PREPARE add_user_provider_id_stmt FROM @add_user_provider_id;
EXECUTE add_user_provider_id_stmt;
DEALLOCATE PREPARE add_user_provider_id_stmt;

SET @add_user_status = IF(
  EXISTS(
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'status'
  ),
  'SELECT 1',
  'ALTER TABLE users ADD COLUMN status ENUM(''active'', ''locked'') NOT NULL DEFAULT ''active'' AFTER role'
);
PREPARE add_user_status_stmt FROM @add_user_status;
EXECUTE add_user_status_stmt;
DEALLOCATE PREPARE add_user_status_stmt;

SET @add_locked_at = IF(
  EXISTS(
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'locked_at'
  ),
  'SELECT 1',
  'ALTER TABLE users ADD COLUMN locked_at TIMESTAMP NULL DEFAULT NULL AFTER status'
);
PREPARE add_locked_at_stmt FROM @add_locked_at;
EXECUTE add_locked_at_stmt;
DEALLOCATE PREPARE add_locked_at_stmt;

SET @add_last_login_at = IF(
  EXISTS(
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'last_login_at'
  ),
  'SELECT 1',
  'ALTER TABLE users ADD COLUMN last_login_at TIMESTAMP NULL DEFAULT NULL AFTER locked_at'
);
PREPARE add_last_login_at_stmt FROM @add_last_login_at;
EXECUTE add_last_login_at_stmt;
DEALLOCATE PREPARE add_last_login_at_stmt;

SET @add_users_updated_at = IF(
  EXISTS(SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'updated_at'),
  'SELECT 1',
  'ALTER TABLE users ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at'
);
PREPARE add_users_updated_at_stmt FROM @add_users_updated_at;
EXECUTE add_users_updated_at_stmt;
DEALLOCATE PREPARE add_users_updated_at_stmt;

UPDATE users SET status = 'active' WHERE status IS NULL OR status NOT IN ('active', 'locked');
ALTER TABLE users MODIFY COLUMN status ENUM('active', 'locked') NOT NULL DEFAULT 'active';

SET @add_users_role_status_index = IF(
  EXISTS(
    SELECT 1 FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND INDEX_NAME = 'idx_users_role_status'
  ),
  'SELECT 1',
  'ALTER TABLE users ADD KEY idx_users_role_status (role, status)'
);
PREPARE add_users_role_status_index_stmt FROM @add_users_role_status_index;
EXECUTE add_users_role_status_index_stmt;
DEALLOCATE PREPARE add_users_role_status_index_stmt;

SELECT COLUMN_TYPE INTO @users_id_type
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'id';

SELECT COLUMN_TYPE INTO @products_id_type
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'id';

SET @create_addresses = CONCAT(
  'CREATE TABLE IF NOT EXISTS user_addresses (',
  'id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,',
  'user_id ', @users_id_type, ' NOT NULL,',
  'label VARCHAR(60) NOT NULL DEFAULT '''',',
  'recipient VARCHAR(120) NOT NULL,',
  'phone VARCHAR(20) NOT NULL DEFAULT '''',',
  'province VARCHAR(100) NOT NULL,',
  'district VARCHAR(100) NOT NULL,',
  'ward VARCHAR(100) NOT NULL,',
  'street VARCHAR(300) NOT NULL,',
  'is_default TINYINT(1) NOT NULL DEFAULT 0,',
  'created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,',
  'updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,',
  'PRIMARY KEY (id),',
  'KEY idx_user_addresses_user_default (user_id, is_default),',
  'CONSTRAINT fk_user_addresses_user FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE',
  ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
);
PREPARE create_addresses_stmt FROM @create_addresses;
EXECUTE create_addresses_stmt;
DEALLOCATE PREPARE create_addresses_stmt;

SET @create_favorites = CONCAT(
  'CREATE TABLE IF NOT EXISTS favorites (',
  'user_id ', @users_id_type, ' NOT NULL,',
  'product_id ', @products_id_type, ' NOT NULL,',
  'created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,',
  'PRIMARY KEY (user_id, product_id),',
  'KEY idx_favorites_product (product_id),',
  'CONSTRAINT fk_favorites_user FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE,',
  'CONSTRAINT fk_favorites_product FOREIGN KEY (product_id) REFERENCES products(id) ON UPDATE CASCADE ON DELETE CASCADE',
  ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
);
PREPARE create_favorites_stmt FROM @create_favorites;
EXECUTE create_favorites_stmt;
DEALLOCATE PREPARE create_favorites_stmt;
