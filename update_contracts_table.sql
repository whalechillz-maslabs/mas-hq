-- contracts 테이블에 급여 변동 이력과 수습기간 설정 컬럼 추가

-- 1. 급여 변동 이력 컬럼 추가 (JSONB)
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS salary_history JSONB;

-- 2. 수습기간 설정 컬럼 추가 (JSONB)
ALTER TABLE contracts 
ADD COLUMN IF NOT EXISTS probation_period JSONB;

-- 3. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_contracts_salary_history 
ON contracts USING GIN (salary_history);

CREATE INDEX IF NOT EXISTS idx_contracts_probation_period 
ON contracts USING GIN (probation_period);

-- 4. RLS 정책 업데이트 (기존 정책이 있다면)
-- 기존 RLS 정책은 그대로 유지하고, 새로운 컬럼들도 동일한 권한으로 접근 가능

-- 5. 샘플 데이터 (테스트용)
-- 최형호의 시급 변동 이력 예시
UPDATE contracts 
SET salary_history = '[
  {
    "effective_date": "2025-08-01",
    "salary": 13000,
    "reason": "초기 시급",
    "notes": "입사 시 적용된 시급"
  },
  {
    "effective_date": "2025-09-01", 
    "salary": 12000,
    "reason": "성과 개선",
    "notes": "업무 숙련도 향상에 따른 조정"
  }
]'::jsonb
WHERE employee_id = (SELECT id FROM employees WHERE name = '최형호' LIMIT 1)
AND contract_type = 'part_time';

-- 수습기간 설정 예시
UPDATE contracts 
SET probation_period = '{
  "start_date": "2025-08-01",
  "end_date": "2025-10-31", 
  "minimum_wage": true
}'::jsonb
WHERE employee_id = (SELECT id FROM employees WHERE name = '최형호' LIMIT 1)
AND contract_type = 'part_time';

-- 6. 댓글 추가
COMMENT ON COLUMN contracts.salary_history IS '급여 변동 이력 (JSONB) - effective_date, salary, reason, notes';
COMMENT ON COLUMN contracts.probation_period IS '수습기간 설정 (JSONB) - start_date, end_date, minimum_wage';

-- 7. 완료 메시지
SELECT 'Contracts table updated successfully with salary_history and probation_period columns' as result;
