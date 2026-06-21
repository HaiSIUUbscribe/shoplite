-- Run once on an existing ShopLite database.
-- This replaces the old backend/migrate-reviews.js script.
USE shoplite;

CREATE TABLE IF NOT EXISTS cart_items (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  product_id BIGINT UNSIGNED NOT NULL,
  quantity INT UNSIGNED NOT NULL DEFAULT 1,
  size VARCHAR(50) NULL,
  color VARCHAR(50) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS product_reviews (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id BIGINT UNSIGNED NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  rating TINYINT UNSIGNED NOT NULL,
  comment TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Foreign-key names vary between old installations, so discover and remove
-- them before aligning child-column types with users.id and products.id.
DROP PROCEDURE IF EXISTS drop_table_foreign_keys;
DELIMITER $$
CREATE PROCEDURE drop_table_foreign_keys(IN target_table VARCHAR(64))
BEGIN
  DECLARE finished INT DEFAULT 0;
  DECLARE constraint_name_value VARCHAR(64);
  DECLARE constraint_cursor CURSOR FOR
    SELECT CONSTRAINT_NAME
    FROM information_schema.REFERENTIAL_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = target_table;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET finished = 1;

  OPEN constraint_cursor;
  read_loop: LOOP
    FETCH constraint_cursor INTO constraint_name_value;
    IF finished = 1 THEN
      LEAVE read_loop;
    END IF;
    SET @drop_fk_sql = CONCAT(
      'ALTER TABLE `', REPLACE(target_table, '`', '``'),
      '` DROP FOREIGN KEY `', REPLACE(constraint_name_value, '`', '``'), '`'
    );
    PREPARE drop_fk_statement FROM @drop_fk_sql;
    EXECUTE drop_fk_statement;
    DEALLOCATE PREPARE drop_fk_statement;
  END LOOP;
  CLOSE constraint_cursor;
END$$
DELIMITER ;

CALL drop_table_foreign_keys('cart_items');
CALL drop_table_foreign_keys('product_reviews');
DROP PROCEDURE drop_table_foreign_keys;

SELECT COLUMN_TYPE INTO @users_id_type
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'id';

SELECT COLUMN_TYPE INTO @products_id_type
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products' AND COLUMN_NAME = 'id';

SET @alter_cart_types = CONCAT(
  'ALTER TABLE cart_items ',
  'MODIFY COLUMN id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, ',
  'MODIFY COLUMN user_id ', @users_id_type, ' NOT NULL, ',
  'MODIFY COLUMN product_id ', @products_id_type, ' NOT NULL, ',
  'MODIFY COLUMN quantity INT UNSIGNED NOT NULL DEFAULT 1'
);
PREPARE alter_cart_statement FROM @alter_cart_types;
EXECUTE alter_cart_statement;
DEALLOCATE PREPARE alter_cart_statement;

SET @alter_review_types = CONCAT(
  'ALTER TABLE product_reviews ',
  'MODIFY COLUMN id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT, ',
  'MODIFY COLUMN user_id ', @users_id_type, ' NOT NULL, ',
  'MODIFY COLUMN product_id ', @products_id_type, ' NOT NULL, ',
  'MODIFY COLUMN rating TINYINT UNSIGNED NOT NULL'
);
PREPARE alter_review_statement FROM @alter_review_types;
EXECUTE alter_review_statement;
DEALLOCATE PREPARE alter_review_statement;

DELETE cart
FROM cart_items AS cart
LEFT JOIN users AS user_account ON user_account.id = cart.user_id
LEFT JOIN products AS product ON product.id = cart.product_id
WHERE user_account.id IS NULL OR product.id IS NULL;

UPDATE cart_items SET quantity = 1 WHERE quantity < 1;

DELETE review
FROM product_reviews AS review
LEFT JOIN users AS user_account ON user_account.id = review.user_id
LEFT JOIN products AS product ON product.id = review.product_id
WHERE user_account.id IS NULL
   OR product.id IS NULL
   OR review.rating NOT BETWEEN 1 AND 5;

-- Keep the newest review if an old database allowed several reviews from the
-- same account for one product.
DELETE older
FROM product_reviews AS older
JOIN product_reviews AS newer
  ON newer.user_id = older.user_id
 AND newer.product_id = older.product_id
 AND newer.id > older.id;

SET @add_review_unique = IF(
  EXISTS(
    SELECT 1 FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'product_reviews'
      AND INDEX_NAME = 'uq_product_reviews_user_product'
  ),
  'SELECT 1',
  'ALTER TABLE product_reviews ADD UNIQUE KEY uq_product_reviews_user_product (user_id, product_id)'
);
PREPARE review_unique_statement FROM @add_review_unique;
EXECUTE review_unique_statement;
DEALLOCATE PREPARE review_unique_statement;

SET @add_review_rating_check = IF(
  EXISTS(
    SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = 'product_reviews'
      AND CONSTRAINT_NAME = 'chk_product_reviews_rating'
  ),
  'SELECT 1',
  'ALTER TABLE product_reviews ADD CONSTRAINT chk_product_reviews_rating CHECK (rating BETWEEN 1 AND 5)'
);
PREPARE review_check_statement FROM @add_review_rating_check;
EXECUTE review_check_statement;
DEALLOCATE PREPARE review_check_statement;

ALTER TABLE cart_items
  ADD CONSTRAINT fk_cart_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_cart_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE product_reviews
  ADD CONSTRAINT fk_product_reviews_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  ADD CONSTRAINT fk_product_reviews_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;
