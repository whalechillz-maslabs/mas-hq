-- ================================================
-- 모든 제품 specifications 업데이트 (가격 정보 추가)
-- Created: 2025-12-19
-- ================================================

-- 1. 가죽 클러치백 가격 정보 추가
UPDATE products
SET specifications = jsonb_set(
    jsonb_set(
        jsonb_set(
            specifications,
            '{normal_price}',
            '89000'::jsonb
        ),
        '{discount_price}',
        '59000'::jsonb
    ),
    '{discount_rate}',
    '34'::jsonb
)
WHERE name = '가죽 클러치백' AND code = 'leather-pouch';

-- 2. 페어플레이 더블코튼 무지 티셔츠 가격 정보 추가
UPDATE products
SET specifications = jsonb_set(
    jsonb_set(
        jsonb_set(
            specifications,
            '{normal_price}',
            '79000'::jsonb
        ),
        '{discount_price}',
        '49000'::jsonb
    ),
    '{discount_rate}',
    '38'::jsonb
)
WHERE name = '페어플레이 더블코튼 무지 티셔츠' AND code = 'fairplay-double-cotton-tee';

-- 3. 특양면 헤리 맨투맨 가격 정보 추가
UPDATE products
SET specifications = jsonb_set(
    jsonb_set(
        jsonb_set(
            specifications,
            '{normal_price}',
            '89000'::jsonb
        ),
        '{discount_price}',
        '59000'::jsonb
    ),
    '{discount_rate}',
    '34'::jsonb
)
WHERE name = '특양면 헤리 맨투맨 (남녀공용)' AND code = 'heavyweight-harry-sweatshirt';

