-- ================================================
-- 상품소싱 데이터 입력
-- Created: 2025-12-19
-- ================================================

-- 볼캡 카테고리 상품소싱 데이터
-- 1. 베이직 볼캡 (1위)
INSERT INTO product_sourcing (
    supplier_id,
    product_category_id,
    product_name,
    product_code,
    price,
    specifications,
    size_guide,
    image_path,
    recommendation_score,
    notes
) VALUES (
    (SELECT id FROM suppliers WHERE code = 'MARPPLE'),
    (SELECT id FROM product_categories WHERE code = 'ball-caps'),
    '베이직 볼캡',
    '2976',
    7000, -- 2000개 기준 최저가
    '{
        "material": "면 100%, 보통 두께",
        "fit": "캐주얼 기본핏, 면 소재라 컬러감·촉감 우수",
        "print_embroidery": "프린팅·자수 모두 균일 (리뷰 300+ 사례)",
        "care": "부분 손세탁 권장, 관리 시 형태 안정적",
        "features": ["베스트 셀러", "높은 평점", "다양한 인쇄 방식"],
        "pricing": {
            "1": 10900,
            "5": 10570,
            "20": 10360,
            "50": 9550,
            "100": 9050,
            "200": 8200,
            "500": 7600,
            "800": 7350,
            "1000": 7200,
            "2000": 7000
        },
        "marpple_url": "https://www.marpple.com/kr/product/detail?bp_id=2976",
        "rank": 1
    }'::jsonb,
    '{
        "size": "FREE (머리둘레 56~59cm)",
        "stock_status": "재고 있음"
    }'::jsonb,
    '/images/products/ball-caps/marpple/caps-2976.webp',
    10,
    '베스트 셀러, 높은 평점, 다양한 인쇄 방식 지원'
) ON CONFLICT DO NOTHING;

-- 2. 엣지 라인 베이직 볼캡 (2위)
INSERT INTO product_sourcing (
    supplier_id,
    product_category_id,
    product_name,
    product_code,
    price,
    specifications,
    size_guide,
    image_path,
    recommendation_score,
    notes
) VALUES (
    (SELECT id FROM suppliers WHERE code = 'MARPPLE'),
    (SELECT id FROM product_categories WHERE code = 'ball-caps'),
    '엣지 라인 베이직 볼캡',
    '5801',
    0, -- 가격표 없음
    '{
        "material": "면 90% + 폴리 10%, 보통·뻣뻣함",
        "fit": "챙 배색으로 포인트, 살짝 빳빳해 고급스러움",
        "print_embroidery": "자수/패치에 최적, 프린팅도 가능",
        "care": "혼방 소재라 습기에 비교적 강함",
        "features": ["고급스러운 디자인", "자수 최적"],
        "marpple_url": "https://www.marpple.com/kr/product/detail?bp_id=5801",
        "rank": 2
    }'::jsonb,
    '{
        "size": "FREE (머리둘레 56~59cm)",
        "stock_status": "재고 있음"
    }'::jsonb,
    '/images/products/ball-caps/marpple/caps-5801.webp',
    8,
    '고급스러운 디자인, 자수 최적'
) ON CONFLICT DO NOTHING;

-- 3. 베이직 야구모자 (대량형) (3위)
INSERT INTO product_sourcing (
    supplier_id,
    product_category_id,
    product_name,
    product_code,
    price,
    specifications,
    size_guide,
    image_path,
    recommendation_score,
    notes
) VALUES (
    (SELECT id FROM suppliers WHERE code = 'MARPPLE'),
    (SELECT id FROM product_categories WHERE code = 'ball-caps'),
    '베이직 야구모자 (대량형)',
    '7125',
    4800, -- 2000개 기준 최저가
    '{
        "material": "아크릴 100%, 도톰",
        "fit": "쉐입이 단단해 단체 납품용에 유리",
        "print_embroidery": "대량 자수/전사 커스텀 용이",
        "care": "아크릴이라 수분에 강하지만 통기성↓",
        "features": ["대량 주문 최적", "내구성 우수"],
        "pricing": {
            "30": 7740,
            "50": 7400,
            "100": 6700,
            "200": 6100,
            "500": 5600,
            "800": 5300,
            "1000": 5100,
            "2000": 4800
        },
        "marpple_url": "https://www.marpple.com/kr/product/detail?bp_id=7125",
        "rank": 3
    }'::jsonb,
    '{
        "size": "FREE (머리둘레 56~59cm)",
        "stock_status": "재고 있음"
    }'::jsonb,
    '/images/products/ball-caps/marpple/caps-7125.webp',
    7,
    '대량 주문 최적, 내구성 우수'
) ON CONFLICT DO NOTHING;

-- 4. 베이직 야구모자 (단품) (4위)
INSERT INTO product_sourcing (
    supplier_id,
    product_category_id,
    product_name,
    product_code,
    price,
    specifications,
    size_guide,
    image_path,
    recommendation_score,
    notes
) VALUES (
    (SELECT id FROM suppliers WHERE code = 'MARPPLE'),
    (SELECT id FROM product_categories WHERE code = 'ball-caps'),
    '베이직 야구모자 (단품)',
    '3080',
    4800, -- 2000개 기준 최저가
    '{
        "material": "아크릴 100%, 도톰",
        "fit": "무난한 핏, 컬러 다양",
        "print_embroidery": "자수 선명, 프린팅 가능 (소재 특성상 살짝 광택)",
        "care": "전문 세탁 권장, 장기 착용 시 통풍 아쉬움",
        "features": ["다양한 컬러"],
        "pricing": {
            "1": 8500,
            "5": 7990,
            "20": 7740,
            "50": 7400,
            "100": 6700,
            "200": 6100,
            "500": 5600,
            "800": 5300,
            "1000": 5100,
            "2000": 4800
        },
        "marpple_url": "https://www.marpple.com/kr/product/detail?bp_id=3080",
        "rank": 4
    }'::jsonb,
    '{
        "size": "FREE (머리둘레 56~59cm)",
        "stock_status": "재고 있음"
    }'::jsonb,
    '/images/products/ball-caps/marpple/caps-3080.webp',
    6,
    '다양한 컬러 옵션'
) ON CONFLICT DO NOTHING;

-- 5. 캐주얼 볼캡 (5위)
INSERT INTO product_sourcing (
    supplier_id,
    product_category_id,
    product_name,
    product_code,
    price,
    specifications,
    size_guide,
    image_path,
    recommendation_score,
    notes
) VALUES (
    (SELECT id FROM suppliers WHERE code = 'MARPPLE'),
    (SELECT id FROM product_categories WHERE code = 'ball-caps'),
    '캐주얼 볼캡',
    '2891',
    0, -- 가격표 없음
    '{
        "material": "면 혼방",
        "fit": "캐주얼 핏",
        "print_embroidery": "프린팅·자수 가능",
        "care": "일반 세탁 가능",
        "features": ["캐주얼 스타일"],
        "marpple_url": "https://www.marpple.com/kr/product/detail?bp_id=2891",
        "rank": 5
    }'::jsonb,
    '{
        "size": "FREE (머리둘레 56~59cm)",
        "stock_status": "재고 있음"
    }'::jsonb,
    '/images/products/ball-caps/marpple/caps-2891.webp',
    5,
    '캐주얼 스타일'
) ON CONFLICT DO NOTHING;

-- 버킷햇 카테고리 상품소싱 데이터
-- 1. 데일리오버 버킷햇
INSERT INTO product_sourcing (
    supplier_id,
    product_category_id,
    product_name,
    product_code,
    price,
    specifications,
    size_guide,
    image_path,
    recommendation_score,
    notes
) VALUES (
    (SELECT id FROM suppliers WHERE code = 'MARPPLE'),
    (SELECT id FROM product_categories WHERE code = 'bucket-hats'),
    '데일리오버 버킷햇',
    '2965',
    0, -- 가격표 없음
    '{
        "material": "면",
        "fit": "데일리 캐주얼 핏",
        "print_embroidery": "프린팅·자수 가능",
        "care": "일반 세탁 가능",
        "features": ["데일리 스타일"],
        "marpple_url": "https://www.marpple.com/kr/product/detail?bp_id=2965",
        "rank": 1
    }'::jsonb,
    '{
        "size": "FREE",
        "stock_status": "재고 있음"
    }'::jsonb,
    '/images/products/bucket-hats/marpple/bucket-2965.webp',
    8,
    '데일리 스타일 버킷햇'
) ON CONFLICT DO NOTHING;

-- 클러치백 카테고리 상품소싱 데이터
-- 1. 가죽 클러치백
INSERT INTO product_sourcing (
    supplier_id,
    product_category_id,
    product_name,
    product_code,
    price,
    specifications,
    size_guide,
    image_path,
    recommendation_score,
    notes
) VALUES (
    (SELECT id FROM suppliers WHERE code = 'MARPPLE'),
    (SELECT id FROM product_categories WHERE code = 'pouches'),
    '가죽 클러치백',
    '4934',
    0, -- 가격표 없음
    '{
        "material": "가죽",
        "fit": "원 사이즈",
        "print_embroidery": "인쇄 가능 (앞면/뒷면)",
        "care": "가죽 관리 필요",
        "features": ["가죽 소재", "인쇄 가능"],
        "marpple_url": "https://www.marpple.com/kr/product/detail?bp_id=4934",
        "rank": 1
    }'::jsonb,
    '{
        "size": "One",
        "stock_status": "재고 있음"
    }'::jsonb,
    '/images/products/pouches/marpple/pouch-4934.webp',
    7,
    '가죽 소재 클러치백'
) ON CONFLICT DO NOTHING;

-- 티셔츠 카테고리 상품소싱 데이터
-- 1. 페어플레이 더블코튼 무지 티셔츠
INSERT INTO product_sourcing (
    supplier_id,
    product_category_id,
    product_name,
    product_code,
    price,
    specifications,
    size_guide,
    image_path,
    recommendation_score,
    notes
) VALUES (
    (SELECT id FROM suppliers WHERE code = 'MARPPLE'),
    (SELECT id FROM product_categories WHERE code = 't-shirts'),
    '페어플레이 더블코튼 무지 티셔츠',
    '4669',
    0, -- 가격표 없음
    '{
        "material": "면",
        "fit": "기본 핏",
        "print_embroidery": "인쇄 가능 (앞면)",
        "care": "일반 세탁 가능",
        "features": ["더블코튼", "무지"],
        "marpple_url": "https://www.marpple.com/kr/product/detail?bp_id=4669",
        "rank": 1
    }'::jsonb,
    '{
        "sizes": ["S", "M", "L", "XL"],
        "stock_status": "재고 있음"
    }'::jsonb,
    '/images/products/t-shirts/marpple/tee-4669.webp',
    7,
    '더블코튼 무지 티셔츠'
) ON CONFLICT DO NOTHING;

-- 맨투맨 카테고리 상품소싱 데이터
-- 1. 특양면 헤리 맨투맨
INSERT INTO product_sourcing (
    supplier_id,
    product_category_id,
    product_name,
    product_code,
    price,
    specifications,
    size_guide,
    image_path,
    recommendation_score,
    notes
) VALUES (
    (SELECT id FROM suppliers WHERE code = 'MARPPLE'),
    (SELECT id FROM product_categories WHERE code = 'sweatshirts'),
    '특양면 헤리 맨투맨',
    '3165',
    0, -- 가격표 없음
    '{
        "material": "특양면",
        "fit": "기본 핏",
        "print_embroidery": "인쇄 가능 (앞면/뒷면)",
        "care": "일반 세탁 가능",
        "features": ["특양면", "인쇄 가능"],
        "marpple_url": "https://www.marpple.com/kr/product/detail?bp_id=3165",
        "rank": 1
    }'::jsonb,
    '{
        "sizes": ["S", "M", "L", "XL"],
        "stock_status": "재고 있음"
    }'::jsonb,
    '/images/products/sweatshirts/marpple/sweatshirt-3165.webp',
    8,
    '특양면 헤리 맨투맨'
) ON CONFLICT DO NOTHING;

