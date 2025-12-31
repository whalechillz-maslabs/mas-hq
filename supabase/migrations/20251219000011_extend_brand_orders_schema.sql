-- ================================================
-- 브랜드 주문 테이블 스키마 확장
-- Created: 2025-12-19
-- ================================================

-- 주문 테이블에 마플 연동 관련 필드 추가
ALTER TABLE brand_orders 
ADD COLUMN IF NOT EXISTS tracking_number TEXT,
ADD COLUMN IF NOT EXISTS marpple_synced_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS delivery_completed_at TIMESTAMPTZ;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_orders_tracking_number ON brand_orders(tracking_number);
CREATE INDEX IF NOT EXISTS idx_orders_synced_at ON brand_orders(marpple_synced_at);

