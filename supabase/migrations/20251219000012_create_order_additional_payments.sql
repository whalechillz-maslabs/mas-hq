-- ================================================
-- 주문 추가 결제 테이블 생성
-- Created: 2025-12-19
-- ================================================

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

-- 인덱스 추가
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


