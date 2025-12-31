-- ================================================
-- 버킷햇 제품 specifications 업데이트 (가격 정보 추가)
-- Created: 2025-12-19
-- ================================================

-- 데일리오버 버킷햇의 specifications에 가격 정보 추가
UPDATE products
SET specifications = jsonb_set(
    specifications,
    '{normal_price}',
    '79000'::jsonb
)
WHERE name = '데일리오버 버킷햇' AND code = 'daily-over-bucket-hat';

UPDATE products
SET specifications = jsonb_set(
    specifications,
    '{discount_price}',
    '49000'::jsonb
)
WHERE name = '데일리오버 버킷햇' AND code = 'daily-over-bucket-hat';

UPDATE products
SET specifications = jsonb_set(
    specifications,
    '{discount_rate}',
    '38'::jsonb
)
WHERE name = '데일리오버 버킷햇' AND code = 'daily-over-bucket-hat';

