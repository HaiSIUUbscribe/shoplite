-- Run once on the existing ShopLite database.
-- This migration follows the actual type of users.id to avoid foreign-key mismatches.
USE shoplite;

SET @add_users_phone = IF(
  EXISTS(
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'phone'
  ),
  'SELECT 1',
  'ALTER TABLE users ADD COLUMN phone VARCHAR(20) NULL AFTER email'
);
PREPARE add_users_phone_stmt FROM @add_users_phone;
EXECUTE add_users_phone_stmt;
DEALLOCATE PREPARE add_users_phone_stmt;

SELECT COLUMN_TYPE INTO @users_id_type
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'id';

SET @create_notifications = CONCAT(
  'CREATE TABLE IF NOT EXISTS notifications (',
  'id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,',
  'user_id ', @users_id_type, ' NOT NULL,',
  'type VARCHAR(60) NOT NULL,',
  'title VARCHAR(255) NOT NULL,',
  'message TEXT NOT NULL,',
  'data JSON NULL,',
  'is_read TINYINT(1) NOT NULL DEFAULT 0,',
  'archived_at TIMESTAMP NULL DEFAULT NULL,',
  'created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,',
  'PRIMARY KEY (id),',
  'KEY idx_notifications_user_active (user_id, archived_at, is_read, created_at),',
  'KEY idx_notifications_archive (archived_at)',
  ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
);
PREPARE create_notifications_stmt FROM @create_notifications;
EXECUTE create_notifications_stmt;
DEALLOCATE PREPARE create_notifications_stmt;

SET @create_preferences = CONCAT(
  'CREATE TABLE IF NOT EXISTS notification_preferences (',
  'id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,',
  'user_id ', @users_id_type, ' NOT NULL,',
  'type VARCHAR(60) NOT NULL,',
  'enabled TINYINT(1) NOT NULL DEFAULT 1,',
  'email_enabled TINYINT(1) NOT NULL DEFAULT 1,',
  'PRIMARY KEY (id),',
  'UNIQUE KEY uq_notification_preferences_user_type (user_id, type),',
  'KEY idx_notification_preferences_user (user_id)',
  ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
);
PREPARE create_preferences_stmt FROM @create_preferences;
EXECUTE create_preferences_stmt;
DEALLOCATE PREPARE create_preferences_stmt;

SET @create_settings = CONCAT(
  'CREATE TABLE IF NOT EXISTS notification_settings (',
  'id TINYINT UNSIGNED NOT NULL,',
  'stock_low_threshold INT UNSIGNED NOT NULL DEFAULT 10,',
  'payment_failure_threshold INT UNSIGNED NOT NULL DEFAULT 5,',
  'payment_failure_window_minutes INT UNSIGNED NOT NULL DEFAULT 10,',
  'updated_by ', @users_id_type, ' NULL,',
  'updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,',
  'PRIMARY KEY (id)',
  ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci'
);
PREPARE create_settings_stmt FROM @create_settings;
EXECUTE create_settings_stmt;
DEALLOCATE PREPARE create_settings_stmt;

-- Upgrade an earlier notification_preferences table.
SET @add_email_enabled = IF(
  EXISTS(
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'notification_preferences'
      AND COLUMN_NAME = 'email_enabled'
  ),
  'SELECT 1',
  'ALTER TABLE notification_preferences ADD COLUMN email_enabled TINYINT(1) NOT NULL DEFAULT 1 AFTER enabled'
);
PREPARE add_email_enabled_stmt FROM @add_email_enabled;
EXECUTE add_email_enabled_stmt;
DEALLOCATE PREPARE add_email_enabled_stmt;

-- Align foreign-key columns if an older migration used INT.
SET @drop_notifications_fk = IF(
  EXISTS(
    SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'notifications'
      AND CONSTRAINT_NAME = 'fk_notif_user'
  ),
  'ALTER TABLE notifications DROP FOREIGN KEY fk_notif_user',
  'SELECT 1'
);
PREPARE drop_notifications_fk_stmt FROM @drop_notifications_fk;
EXECUTE drop_notifications_fk_stmt;
DEALLOCATE PREPARE drop_notifications_fk_stmt;

SET @drop_notifications_current_fk = IF(
  EXISTS(
    SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'notifications'
      AND CONSTRAINT_NAME = 'fk_notifications_user'
  ),
  'ALTER TABLE notifications DROP FOREIGN KEY fk_notifications_user',
  'SELECT 1'
);
PREPARE drop_notifications_current_fk_stmt FROM @drop_notifications_current_fk;
EXECUTE drop_notifications_current_fk_stmt;
DEALLOCATE PREPARE drop_notifications_current_fk_stmt;

SET @drop_preferences_fk = IF(
  EXISTS(
    SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'notification_preferences'
      AND CONSTRAINT_NAME = 'fk_notif_pref_user'
  ),
  'ALTER TABLE notification_preferences DROP FOREIGN KEY fk_notif_pref_user',
  'SELECT 1'
);
PREPARE drop_preferences_fk_stmt FROM @drop_preferences_fk;
EXECUTE drop_preferences_fk_stmt;
DEALLOCATE PREPARE drop_preferences_fk_stmt;

SET @drop_preferences_current_fk = IF(
  EXISTS(
    SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'notification_preferences'
      AND CONSTRAINT_NAME = 'fk_notification_preferences_user'
  ),
  'ALTER TABLE notification_preferences DROP FOREIGN KEY fk_notification_preferences_user',
  'SELECT 1'
);
PREPARE drop_preferences_current_fk_stmt FROM @drop_preferences_current_fk;
EXECUTE drop_preferences_current_fk_stmt;
DEALLOCATE PREPARE drop_preferences_current_fk_stmt;

SET @drop_settings_fk = IF(
  EXISTS(
    SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'notification_settings'
      AND CONSTRAINT_NAME = 'fk_notification_settings_user'
  ),
  'ALTER TABLE notification_settings DROP FOREIGN KEY fk_notification_settings_user',
  'SELECT 1'
);
PREPARE drop_settings_fk_stmt FROM @drop_settings_fk;
EXECUTE drop_settings_fk_stmt;
DEALLOCATE PREPARE drop_settings_fk_stmt;

SET @align_notifications_user = CONCAT(
  'ALTER TABLE notifications MODIFY COLUMN user_id ', @users_id_type, ' NOT NULL'
);
PREPARE align_notifications_user_stmt FROM @align_notifications_user;
EXECUTE align_notifications_user_stmt;
DEALLOCATE PREPARE align_notifications_user_stmt;

SET @align_preferences_user = CONCAT(
  'ALTER TABLE notification_preferences MODIFY COLUMN user_id ', @users_id_type, ' NOT NULL'
);
PREPARE align_preferences_user_stmt FROM @align_preferences_user;
EXECUTE align_preferences_user_stmt;
DEALLOCATE PREPARE align_preferences_user_stmt;

SET @align_settings_user = CONCAT(
  'ALTER TABLE notification_settings MODIFY COLUMN updated_by ', @users_id_type, ' NULL'
);
PREPARE align_settings_user_stmt FROM @align_settings_user;
EXECUTE align_settings_user_stmt;
DEALLOCATE PREPARE align_settings_user_stmt;

SET @add_notifications_fk = IF(
  EXISTS(
    SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'notifications'
      AND CONSTRAINT_NAME = 'fk_notifications_user'
  ),
  'SELECT 1',
  'ALTER TABLE notifications ADD CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE'
);
PREPARE add_notifications_fk_stmt FROM @add_notifications_fk;
EXECUTE add_notifications_fk_stmt;
DEALLOCATE PREPARE add_notifications_fk_stmt;

SET @add_preferences_fk = IF(
  EXISTS(
    SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'notification_preferences'
      AND CONSTRAINT_NAME = 'fk_notification_preferences_user'
  ),
  'SELECT 1',
  'ALTER TABLE notification_preferences ADD CONSTRAINT fk_notification_preferences_user FOREIGN KEY (user_id) REFERENCES users(id) ON UPDATE CASCADE ON DELETE CASCADE'
);
PREPARE add_preferences_fk_stmt FROM @add_preferences_fk;
EXECUTE add_preferences_fk_stmt;
DEALLOCATE PREPARE add_preferences_fk_stmt;

SET @add_settings_fk = IF(
  EXISTS(
    SELECT 1 FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'notification_settings'
      AND CONSTRAINT_NAME = 'fk_notification_settings_user'
  ),
  'SELECT 1',
  'ALTER TABLE notification_settings ADD CONSTRAINT fk_notification_settings_user FOREIGN KEY (updated_by) REFERENCES users(id) ON UPDATE CASCADE ON DELETE SET NULL'
);
PREPARE add_settings_fk_stmt FROM @add_settings_fk;
EXECUTE add_settings_fk_stmt;
DEALLOCATE PREPARE add_settings_fk_stmt;

INSERT INTO notification_settings
  (id, stock_low_threshold, payment_failure_threshold, payment_failure_window_minutes)
VALUES (1, 10, 5, 10)
ON DUPLICATE KEY UPDATE id = VALUES(id);
