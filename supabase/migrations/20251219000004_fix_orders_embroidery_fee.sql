-- ================================================
-- 주문 데이터 자수비 수정
-- Created: 2025-12-19
-- ================================================

-- 베이직 볼캡 주문 자수비 수정 (100,000원)
UPDATE brand_orders
SET 
    product_price = 305400,
    embroidery_fee = 100000,
    total_amount = 405400,
    final_amount = 405400,
    order_date = '2025-11-25'
WHERE order_number = '3218372';

-- 데일리오버 버킷햇 주문 자수비 수정 (50,000원)
UPDATE brand_orders
SET 
    product_price = 206000,
    embroidery_fee = 50000,
    total_amount = 256000,
    final_amount = 256000,
    order_date = '2025-11-25'
WHERE order_number = '3219110';

-- 가죽 클러치백 주문 날짜 수정
UPDATE brand_orders
SET order_date = '2025-11-25'
WHERE order_number = '3218372-2';

-- 페어플레이 더블코튼 무지 티셔츠 주문 날짜 수정
UPDATE brand_orders
SET order_date = '2025-11-25'
WHERE order_number = '3218372-3';

-- 특양면 헤리 맨투맨 주문 번호 및 날짜 수정
UPDATE brand_orders
SET 
    order_number = '3249437',
    order_date = '2025-12-18',
    order_details = '{
        "product_name": "특양면 헤리 맨투맨 (남녀공용)",
        "colors": {
            "ivory": {
                "quantity": 10,
                "print": "앞면만"
            },
            "black": {
                "quantity": 1,
                "print": "앞뒷면"
            }
        }
    }'::jsonb
WHERE order_number = '19720688';

