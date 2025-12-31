-- ================================================
-- 브랜드 포트폴리오 제품 데이터 입력 (수정)
-- Created: 2025-12-19
-- ================================================

-- 제품 데이터 입력 (code가 없으므로 직접 INSERT)
-- 1. 베이직 볼캡 (MASSGOO)
INSERT INTO products (
    brand_id,
    category_id,
    name,
    description,
    base_price,
    embroidery_price,
    print_price,
    image_path,
    specifications
)
SELECT 
    (SELECT id FROM brands WHERE code = 'MASSGOO'),
    (SELECT id FROM product_categories WHERE code = 'ball-caps'),
    '베이직 볼캡',
    'MASSGOO 베이직 볼캡',
    15270,
    5000,
    0,
    '/images/products/ball-caps/photos/cap-navy-detail.png',
    '{
        "colors": ["navy", "black", "beige", "white"],
        "sizes": ["Free"],
        "material": "면",
        "normal_price": 69000,
        "discount_price": 39000,
        "discount_rate": 43
    }'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM products 
    WHERE brand_id = (SELECT id FROM brands WHERE code = 'MASSGOO')
    AND category_id = (SELECT id FROM product_categories WHERE code = 'ball-caps')
    AND name = '베이직 볼캡'
);

-- 2. 데일리오버 버킷햇 (MASSGOO)
INSERT INTO products (
    brand_id,
    category_id,
    name,
    description,
    base_price,
    embroidery_price,
    print_price,
    image_path,
    specifications
)
SELECT 
    (SELECT id FROM brands WHERE code = 'MASSGOO'),
    (SELECT id FROM product_categories WHERE code = 'bucket-hats'),
    '데일리오버 버킷햇',
    'MASSGOO 데일리오버 버킷햇',
    20600,
    5000,
    0,
    '/images/products/bucket-hats/photos/bucket-black-detail.png',
    '{
        "colors": ["black", "white"],
        "sizes": ["Free"],
        "material": "면"
    }'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM products 
    WHERE brand_id = (SELECT id FROM brands WHERE code = 'MASSGOO')
    AND category_id = (SELECT id FROM product_categories WHERE code = 'bucket-hats')
    AND name = '데일리오버 버킷햇'
);

-- 3. 가죽 클러치백 (MASSGOO)
INSERT INTO products (
    brand_id,
    category_id,
    name,
    description,
    base_price,
    embroidery_price,
    print_price,
    image_path,
    specifications
)
SELECT 
    (SELECT id FROM brands WHERE code = 'MASSGOO'),
    (SELECT id FROM product_categories WHERE code = 'pouches'),
    '가죽 클러치백',
    'MASSGOO 가죽 클러치백',
    24000,
    0,
    0,
    '/images/products/pouches/photos/pouch-1-front-detail.png',
    '{
        "colors": ["white"],
        "sizes": ["One"],
        "material": "가죽",
        "print": "앞면/뒷면"
    }'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM products 
    WHERE brand_id = (SELECT id FROM brands WHERE code = 'MASSGOO')
    AND category_id = (SELECT id FROM product_categories WHERE code = 'pouches')
    AND name = '가죽 클러치백'
);

-- 4. 페어플레이 더블코튼 무지 티셔츠 (MASSGOO)
INSERT INTO products (
    brand_id,
    category_id,
    name,
    description,
    base_price,
    embroidery_price,
    print_price,
    image_path,
    specifications
)
SELECT 
    (SELECT id FROM brands WHERE code = 'MASSGOO'),
    (SELECT id FROM product_categories WHERE code = 't-shirts'),
    '페어플레이 더블코튼 무지 티셔츠',
    'MASSGOO 페어플레이 더블코튼 무지 티셔츠',
    24900,
    0,
    0,
    '/images/products/t-shirts/photos/tee-detail.png',
    '{
        "colors": ["white"],
        "sizes": ["L"],
        "material": "더블코튼",
        "print": "앞면"
    }'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM products 
    WHERE brand_id = (SELECT id FROM brands WHERE code = 'MASSGOO')
    AND category_id = (SELECT id FROM product_categories WHERE code = 't-shirts')
    AND name = '페어플레이 더블코튼 무지 티셔츠'
);

-- 5. 특양면 헤리 맨투맨 (TOBY)
INSERT INTO products (
    brand_id,
    category_id,
    name,
    description,
    base_price,
    embroidery_price,
    print_price,
    image_path,
    specifications
)
SELECT 
    (SELECT id FROM brands WHERE code = 'TOBY'),
    (SELECT id FROM product_categories WHERE code = 'sweatshirts'),
    '특양면 헤리 맨투맨 (남녀공용)',
    'TOBY 특양면 헤리 맨투맨',
    21600,
    0,
    0,
    '/images/products/sweatshirts/marpple/sweatshirt-3165.webp',
    '{
        "colors": ["ivory", "black"],
        "sizes": ["Free"],
        "material": "특양면",
        "print": "앞면/뒷면"
    }'::jsonb
WHERE NOT EXISTS (
    SELECT 1 FROM products 
    WHERE brand_id = (SELECT id FROM brands WHERE code = 'TOBY')
    AND category_id = (SELECT id FROM product_categories WHERE code = 'sweatshirts')
    AND name = '특양면 헤리 맨투맨 (남녀공용)'
);

-- 주문에 제품 ID 연결
UPDATE brand_orders
SET product_id = (SELECT id FROM products WHERE name = '베이직 볼캡' LIMIT 1)
WHERE order_number = '3218372' AND product_id IS NULL;

UPDATE brand_orders
SET product_id = (SELECT id FROM products WHERE name = '데일리오버 버킷햇' LIMIT 1)
WHERE order_number = '3219110' AND product_id IS NULL;

UPDATE brand_orders
SET product_id = (SELECT id FROM products WHERE name = '가죽 클러치백' LIMIT 1)
WHERE order_number = '3218372-2' AND product_id IS NULL;

UPDATE brand_orders
SET product_id = (SELECT id FROM products WHERE name = '페어플레이 더블코튼 무지 티셔츠' LIMIT 1)
WHERE order_number = '3218372-3' AND product_id IS NULL;

UPDATE brand_orders
SET product_id = (SELECT id FROM products WHERE name = '특양면 헤리 맨투맨 (남녀공용)' LIMIT 1)
WHERE order_number = '3249437' AND product_id IS NULL;

