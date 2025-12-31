-- ================================================
-- 주문 데이터에 제품 ID 연결
-- Created: 2025-12-19
-- ================================================

-- 베이직 볼캡 주문에 제품 ID 연결
UPDATE brand_orders
SET product_id = (SELECT id FROM products WHERE code = 'basic-cap')
WHERE order_number = '3218372';

-- 데일리오버 버킷햇 주문에 제품 ID 연결
UPDATE brand_orders
SET product_id = (SELECT id FROM products WHERE code = 'daily-over-bucket-hat')
WHERE order_number = '3219110';

-- 가죽 클러치백 주문에 제품 ID 연결
UPDATE brand_orders
SET product_id = (SELECT id FROM products WHERE code = 'leather-pouch')
WHERE order_number = '3218372-2';

-- 페어플레이 더블코튼 무지 티셔츠 주문에 제품 ID 연결
UPDATE brand_orders
SET product_id = (SELECT id FROM products WHERE code = 'fairplay-double-cotton-tee')
WHERE order_number = '3218372-3';

-- 특양면 헤리 맨투맨 주문에 제품 ID 연결
UPDATE brand_orders
SET product_id = (SELECT id FROM products WHERE code = 'heavyweight-harry-sweatshirt')
WHERE order_number = '3249437';

