-- Run once after the previous ShopLite migrations.
USE shoplite;

ALTER TABLE products
  ADD COLUMN sizes JSON NULL AFTER category,
  ADD COLUMN colors JSON NULL AFTER sizes;

-- Sensible starter options for existing fashion products. Admins can edit them later.
UPDATE products
SET sizes = JSON_ARRAY('36', '37', '38', '39', '40', '41', '42')
WHERE LOWER(title) LIKE '%giày%' OR LOWER(title) LIKE '%dép%';

UPDATE products
SET sizes = JSON_ARRAY('Freesize')
WHERE sizes IS NULL AND (LOWER(title) LIKE '%vớ%' OR LOWER(title) LIKE '%tất%');

UPDATE products
SET sizes = JSON_ARRAY('S', 'M', 'L', 'XL')
WHERE sizes IS NULL AND LOWER(category) LIKE '%thời trang%';

UPDATE products
SET colors = JSON_ARRAY('Đen', 'Trắng', 'Xám', 'Xanh navy')
WHERE LOWER(category) LIKE '%thời trang%'
   OR LOWER(title) LIKE '%giày%'
   OR LOWER(title) LIKE '%dép%';
