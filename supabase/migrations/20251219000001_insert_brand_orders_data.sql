-- ================================================
-- 브랜드 포트폴리오 초기 주문 데이터 입력
-- Created: 2025-12-19
-- ================================================

-- 완료된 주문 데이터 입력
-- 1. 베이직 볼캡 (MASSGOO) - 20개, 상품가 305,400원, 자수비 100,000원, 합계 405,400원
INSERT INTO brand_orders (
    order_number,
    brand_id,
    order_date,
    delivery_date,
    status,
    quantity,
    product_price,
    embroidery_fee,
    total_amount,
    final_amount,
    order_details
) VALUES (
    '3218372',
    (SELECT id FROM brands WHERE code = 'MASSGOO'),
    '2025-11-25',
    '2025-12-06',
    'completed',
    20,
    305400,
    100000,
    405400,
    405400,
    '{
        "product_name": "베이직 볼캡",
        "colors": {
            "navy": 5,
            "black": 5,
            "beige": 5,
            "white": 5
        },
        "embroidery": "MASSGOO × MUZIIK"
    }'::jsonb
) ON CONFLICT (order_number) DO UPDATE SET
    product_price = 305400,
    embroidery_fee = 100000,
    total_amount = 405400,
    final_amount = 405400,
    order_date = '2025-11-25';

-- 2. 데일리오버 버킷햇 (MASSGOO) - 10개, 상품가 206,000원, 자수비 50,000원, 합계 256,000원
INSERT INTO brand_orders (
    order_number,
    brand_id,
    order_date,
    delivery_date,
    status,
    quantity,
    product_price,
    embroidery_fee,
    total_amount,
    final_amount,
    order_details
) VALUES (
    '3219110',
    (SELECT id FROM brands WHERE code = 'MASSGOO'),
    '2025-11-25',
    '2025-12-04',
    'completed',
    10,
    206000,
    50000,
    256000,
    256000,
    '{
        "product_name": "데일리오버 버킷햇",
        "colors": {
            "black": 5,
            "white": 5
        },
        "embroidery": "MASSGOO × MUZIIK"
    }'::jsonb
) ON CONFLICT (order_number) DO UPDATE SET
    product_price = 206000,
    embroidery_fee = 50000,
    total_amount = 256000,
    final_amount = 256000,
    order_date = '2025-11-25';

-- 3. 가죽 클러치백 (MASSGOO) - 4개, 96,000원
INSERT INTO brand_orders (
    order_number,
    brand_id,
    order_date,
    delivery_date,
    status,
    quantity,
    product_price,
    embroidery_fee,
    total_amount,
    final_amount,
    order_details
) VALUES (
    '3218372-2',
    (SELECT id FROM brands WHERE code = 'MASSGOO'),
    '2025-11-25',
    '2025-12-06',
    'completed',
    4,
    96000,
    0,
    96000,
    96000,
    '{
        "product_name": "가죽 클러치백",
        "color": "white",
        "size": "One",
        "print": "앞면/뒷면"
    }'::jsonb
) ON CONFLICT (order_number) DO UPDATE SET
    order_date = '2025-11-25';

-- 4. 페어플레이 더블코튼 무지 티셔츠 (MASSGOO) - 2개, 49,800원
INSERT INTO brand_orders (
    order_number,
    brand_id,
    order_date,
    delivery_date,
    status,
    quantity,
    product_price,
    embroidery_fee,
    total_amount,
    final_amount,
    order_details
) VALUES (
    '3218372-3',
    (SELECT id FROM brands WHERE code = 'MASSGOO'),
    '2025-11-25',
    '2025-12-06',
    'completed',
    2,
    49800,
    0,
    49800,
    49800,
    '{
        "product_name": "페어플레이 더블코튼 무지 티셔츠",
        "color": "white",
        "size": "L",
        "print": "앞면"
    }'::jsonb
) ON CONFLICT (order_number) DO UPDATE SET
    order_date = '2025-11-25';

-- 진행 중인 주문
-- 5. 특양면 헤리 맨투맨 (TOBY) - 11개, 237,580원
INSERT INTO brand_orders (
    order_number,
    brand_id,
    order_date,
    status,
    quantity,
    product_price,
    embroidery_fee,
    total_amount,
    final_amount,
    order_details
) VALUES (
    '3249437',
    (SELECT id FROM brands WHERE code = 'TOBY'),
    '2025-12-18',
    'preparing',
    11,
    237580,
    0,
    237580,
    237580,
    '{
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
) ON CONFLICT (order_number) DO UPDATE SET
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
    }'::jsonb;

