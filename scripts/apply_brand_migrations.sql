-- ================================================
-- 브랜드 포트폴리오 마이그레이션 적용 스크립트
-- Created: 2025-12-19
-- Supabase Dashboard SQL Editor에서 실행하세요
-- ================================================

-- 1. 브랜드 주문 테이블 스키마 확장
-- 주문 테이블에 마플 연동 관련 필드 추가
ALTER TABLE brand_orders 
ADD COLUMN IF NOT EXISTS tracking_number TEXT,
ADD COLUMN IF NOT EXISTS marpple_synced_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS delivery_completed_at TIMESTAMPTZ;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_orders_tracking_number ON brand_orders(tracking_number);
CREATE INDEX IF NOT EXISTS idx_orders_synced_at ON brand_orders(marpple_synced_at);

-- 2. 주문 추가 결제 테이블 생성
CREATE TABLE IF NOT EXISTS order_additional_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES brand_orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  payment_type TEXT NOT NULL, -- 'embroidery', 'custom', 'shipping', 'other'
  payment_amount INTEGER NOT NULL, -- 결제 금액
  payment_date TIMESTAMPTZ,
  marpple_order_number TEXT, -- 마플에서 별도 결제한 주문번호
  description TEXT, -- 결제 설명
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 추가 (IF NOT EXISTS로 이미 존재하는 경우 무시)
CREATE INDEX IF NOT EXISTS idx_order_additional_payments_order_id ON order_additional_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_order_additional_payments_product_id ON order_additional_payments(product_id);
CREATE INDEX IF NOT EXISTS idx_order_additional_payments_payment_type ON order_additional_payments(payment_type);

-- 베이직 볼캡 자수비 별도 결제 데이터 삽입 예시
INSERT INTO order_additional_payments (
  order_id, 
  product_id, 
  payment_type, 
  payment_amount, 
  payment_date,
  marpple_order_number,
  description
)
SELECT 
  bo.id,
  p.id,
  'embroidery',
  100000, -- 자수비 100,000원
  '2025-11-25 17:37:00'::TIMESTAMPTZ,
  '3218372', -- 마플 주문번호
  '자수 5,000원 × 20개(볼캡 4종) 추가 비용'
FROM brand_orders bo
JOIN products p ON p.name = '베이직 볼캡'
WHERE bo.order_number = '3218372'
  AND NOT EXISTS (
    SELECT 1 FROM order_additional_payments 
    WHERE order_id = bo.id AND payment_type = 'embroidery'
  );

-- 3. 제품 수량별 가격 티어 테이블 생성
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

-- RLS 정책 설정 (모든 테이블 언리스트릭티드)
ALTER TABLE order_additional_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_pricing_tiers ENABLE ROW LEVEL SECURITY;

-- order_additional_payments RLS 정책
DROP POLICY IF EXISTS "Allow all operations on order_additional_payments" ON order_additional_payments;
CREATE POLICY "Allow all operations on order_additional_payments" ON order_additional_payments
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- product_pricing_tiers RLS 정책
DROP POLICY IF EXISTS "Allow all operations on product_pricing_tiers" ON product_pricing_tiers;
CREATE POLICY "Allow all operations on product_pricing_tiers" ON product_pricing_tiers
  FOR ALL
  USING (true)
  WITH CHECK (true);

