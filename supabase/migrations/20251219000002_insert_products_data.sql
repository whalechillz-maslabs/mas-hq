-- ================================================
-- 브랜드 포트폴리오 제품 데이터 입력
-- Created: 2025-12-19
-- ================================================

-- 제품 데이터 입력
-- 1. 베이직 볼캡 (MASSGOO)
INSERT INTO products (
    brand_id,
    category_id,
    name,
    code,
    description,
    base_price,
    embroidery_price,
    print_price,
    image_path,
    specifications
) VALUES (
    (SELECT id FROM brands WHERE code = 'MASSGOO'),
    (SELECT id FROM product_categories WHERE code = 'ball-caps'),
    '베이직 볼캡',
    'basic-cap',
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
) ON CONFLICT DO NOTHING;

-- 2. 데일리오버 버킷햇 (MASSGOO)
INSERT INTO products (
    brand_id,
    category_id,
    name,
    code,
    description,
    base_price,
    embroidery_price,
    print_price,
    image_path,
    specifications
) VALUES (
    (SELECT id FROM brands WHERE code = 'MASSGOO'),
    (SELECT id FROM product_categories WHERE code = 'bucket-hats'),
    '데일리오버 버킷햇',
    'daily-over-bucket-hat',
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
) ON CONFLICT DO NOTHING;

-- 3. 가죽 클러치백 (MASSGOO)
INSERT INTO products (
    brand_id,
    category_id,
    name,
    code,
    description,
    base_price,
    embroidery_price,
    print_price,
    image_path,
    specifications
) VALUES (
    (SELECT id FROM brands WHERE code = 'MASSGOO'),
    (SELECT id FROM product_categories WHERE code = 'pouches'),
    '가죽 클러치백',
    'leather-pouch',
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
) ON CONFLICT DO NOTHING;

-- 4. 페어플레이 더블코튼 무지 티셔츠 (MASSGOO)
INSERT INTO products (
    brand_id,
    category_id,
    name,
    code,
    description,
    base_price,
    embroidery_price,
    print_price,
    image_path,
    specifications
) VALUES (
    (SELECT id FROM brands WHERE code = 'MASSGOO'),
    (SELECT id FROM product_categories WHERE code = 't-shirts'),
    '페어플레이 더블코튼 무지 티셔츠',
    'fairplay-double-cotton-tee',
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
) ON CONFLICT DO NOTHING;

-- 5. 특양면 헤리 맨투맨 (TOBY)
INSERT INTO products (
    brand_id,
    category_id,
    name,
    code,
    description,
    base_price,
    embroidery_price,
    print_price,
    image_path,
    specifications
) VALUES (
    (SELECT id FROM brands WHERE code = 'TOBY'),
    (SELECT id FROM product_categories WHERE code = 'sweatshirts'),
    '특양면 헤리 맨투맨 (남녀공용)',
    'heavyweight-harry-sweatshirt',
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
) ON CONFLICT DO NOTHING;

