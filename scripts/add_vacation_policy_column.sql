-- contracts 테이블에 vacation_policy 컬럼 추가

-- vacation_policy 컬럼 추가 (JSONB 타입)
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS vacation_policy JSONB DEFAULT '{
  "substitute_holidays": false,
  "sick_leave_deducts_annual": true,
  "family_events_days": 3
}'::jsonb;

-- 기존 계약서에 기본값 설정
UPDATE contracts 
SET vacation_policy = '{
  "substitute_holidays": false,
  "sick_leave_deducts_annual": true,
  "family_events_days": 3
}'::jsonb
WHERE vacation_policy IS NULL;

-- 컬럼에 대한 코멘트 추가
COMMENT ON COLUMN contracts.vacation_policy IS '휴가 관련 조항: 대체 공휴일 휴무 없음, 병가 연차 차감, 가족 경조사 휴가 일수';
