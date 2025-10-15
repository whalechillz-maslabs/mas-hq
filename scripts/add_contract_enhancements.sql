-- contracts 테이블에 식대 정책 및 보험 표시 제어 컬럼 추가

-- 1. 식대 정책 관련 컬럼 추가
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS meal_policy VARCHAR(20) DEFAULT 'per_day' CHECK (meal_policy IN ('per_day', 'fixed_with_reconcile'));

ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS meal_rate INTEGER DEFAULT 7000;

ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS meal_fixed_days_per_month INTEGER DEFAULT 20;

ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS meal_settlement_carryover INTEGER DEFAULT 0;

-- 2. 보험 표시 제어 컬럼 추가 (JSONB)
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS insurance_display JSONB DEFAULT '{
  "national_pension": true,
  "health": true,
  "employment": true,
  "industrial_accident": true
}'::jsonb;

-- 3. 기존 계약서에 기본값 설정
UPDATE contracts 
SET meal_policy = 'per_day',
    meal_rate = 7000,
    meal_fixed_days_per_month = 20,
    meal_settlement_carryover = 0,
    insurance_display = '{
      "national_pension": true,
      "health": true,
      "employment": true,
      "industrial_accident": true
    }'::jsonb
WHERE meal_policy IS NULL;

-- 4. 컬럼에 대한 코멘트 추가
COMMENT ON COLUMN contracts.meal_policy IS '식대 정책: per_day(일별지급), fixed_with_reconcile(고정선지급+정산)';
COMMENT ON COLUMN contracts.meal_rate IS '식대 단가 (원/일)';
COMMENT ON COLUMN contracts.meal_fixed_days_per_month IS '월 고정 식대 지급일수';
COMMENT ON COLUMN contracts.meal_settlement_carryover IS '식대 정산 이월금 (다음달 반영)';
COMMENT ON COLUMN contracts.insurance_display IS '4대보험 표시 제어 (나이 기반 국민연금 제외 등)';
