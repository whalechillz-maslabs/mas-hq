-- ================================================
-- 베이직 볼캡 base_price 수정 (20,270원 → 15,270원)
-- Created: 2025-12-19
-- ================================================

-- 베이직 볼캡 base_price 수정 (code가 NULL일 수 있으므로 name만으로 매칭)
UPDATE products
SET base_price = 15270
WHERE name = '베이직 볼캡' 
  AND (code = 'basic-cap' OR code IS NULL)
  AND category_id = (SELECT id FROM product_categories WHERE code = 'ball-caps');

-- code가 NULL인 경우 업데이트
UPDATE products
SET code = 'basic-cap'
WHERE name = '베이직 볼캡' 
  AND code IS NULL
  AND category_id = (SELECT id FROM product_categories WHERE code = 'ball-caps');

-- 확인 쿼리 (주석 처리)
-- SELECT name, code, base_price, embroidery_price, (base_price + embroidery_price) as total_cost
-- FROM products
-- WHERE name = '베이직 볼캡';
-- 예상 결과: base_price = 15270, embroidery_price = 5000, total_cost = 20270
