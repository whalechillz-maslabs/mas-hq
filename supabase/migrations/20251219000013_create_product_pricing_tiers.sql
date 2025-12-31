-- ================================================
-- 제품 수량별 가격 티어 테이블 생성
-- Created: 2025-12-19
-- ================================================

CREATE TABLE IF NOT EXISTS product_pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  product_price_per_unit INTEGER NOT NULL, -- 상품가/개
  embroidery_price_per_unit INTEGER DEFAULT 0, -- 자수비/개 (제품별로 다를 수 있음)
  cost_per_unit INTEGER NOT NULL, -- 원가/개 (계산값)
  margin_rate DECIMAL(5,2) NOT NULL, -- 마진율 (%)
  is_current BOOLEAN DEFAULT false, -- 현재 수량인지 여부
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, quantity)
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_product_pricing_tiers_product_id ON product_pricing_tiers(product_id);
CREATE INDEX IF NOT EXISTS idx_product_pricing_tiers_quantity ON product_pricing_tiers(quantity);

-- 베이직 볼캡 수량별 가격 티어 데이터 삽입
INSERT INTO product_pricing_tiers (product_id, quantity, product_price_per_unit, embroidery_price_per_unit, cost_per_unit, margin_rate, is_current)
SELECT 
  p.id,
  tier.quantity,
  tier.product_price_per_unit,
  tier.embroidery_price_per_unit,
  tier.cost_per_unit,
  tier.margin_rate,
  tier.is_current
FROM products p
CROSS JOIN (
  VALUES
    (20, 15270, 5000, 20270, 48.0, true),
    (50, 13500, 5000, 18500, 53.0, false),
    (100, 12000, 5000, 17000, 56.0, false)
) AS tier(quantity, product_price_per_unit, embroidery_price_per_unit, cost_per_unit, margin_rate, is_current)
WHERE p.name = '베이직 볼캡' AND p.code = 'basic-cap'
ON CONFLICT (product_id, quantity) DO NOTHING;
