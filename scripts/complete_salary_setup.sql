-- ========================================
-- 급여 조회 시스템 완전 설정 SQL
-- 실행일: 2025-01-27
-- 설명: 급여 조회 기능을 위한 모든 테이블과 데이터 생성
-- ========================================

-- 1. salaries 테이블 생성
CREATE TABLE IF NOT EXISTS salaries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  base_salary DECIMAL(12,2) NOT NULL DEFAULT 0,
  overtime_pay DECIMAL(12,2) DEFAULT 0,
  bonus DECIMAL(12,2) DEFAULT 0,
  deductions DECIMAL(12,2) DEFAULT 0,
  net_amount DECIMAL(12,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'paid',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. contracts 테이블 생성
CREATE TABLE IF NOT EXISTS contracts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  document_type VARCHAR(50) NOT NULL,
  document_name VARCHAR(255) NOT NULL,
  contract_date DATE,
  file_path TEXT,
  is_confidential BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_salaries_employee_id ON salaries(employee_id);
CREATE INDEX IF NOT EXISTS idx_salaries_payment_date ON salaries(payment_date);
CREATE INDEX IF NOT EXISTS idx_salaries_period ON salaries(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_contracts_employee_id ON contracts(employee_id);
CREATE INDEX IF NOT EXISTS idx_contracts_document_type ON contracts(document_type);

-- 4. 샘플 급여 데이터 삽입
-- 김탁수 (MASLABS-001) - 대표이사
INSERT INTO salaries (employee_id, payment_date, period_start, period_end, base_salary, overtime_pay, bonus, deductions, net_amount, status)
SELECT 
  e.id,
  '2025-01-25'::DATE,
  '2025-01-01'::DATE,
  '2025-01-31'::DATE,
  5000000,  -- 기본급 500만원
  500000,   -- 연장수당 50만원
  300000,   -- 인센티브 30만원
  165000,   -- 공제액 (3.3% 원천징수)
  5635000,  -- 실수령액
  'paid'
FROM employees e 
WHERE e.employee_id = 'MASLABS-001'
LIMIT 1;

-- 이은정 (MASLABS-002) - 부장
INSERT INTO salaries (employee_id, payment_date, period_start, period_end, base_salary, overtime_pay, bonus, deductions, net_amount, status)
SELECT 
  e.id,
  '2025-01-25'::DATE,
  '2025-01-01'::DATE,
  '2025-01-31'::DATE,
  3000000,  -- 기본급 300만원
  300000,   -- 연장수당 30만원
  200000,   -- 인센티브 20만원
  99000,    -- 공제액 (3.3% 원천징수)
  3410000,  -- 실수령액
  'paid'
FROM employees e 
WHERE e.employee_id = 'MASLABS-002'
LIMIT 1;

-- 허상원 (MASLABS-003) - 사원
INSERT INTO salaries (employee_id, payment_date, period_start, period_end, base_salary, overtime_pay, bonus, deductions, net_amount, status)
SELECT 
  e.id,
  '2025-01-25'::DATE,
  '2025-01-01'::DATE,
  '2025-01-31'::DATE,
  2500000,  -- 기본급 250만원
  250000,   -- 연장수당 25만원
  150000,   -- 인센티브 15만원
  82500,    -- 공제액 (3.3% 원천징수)
  2825000,  -- 실수령액
  'paid'
FROM employees e 
WHERE e.employee_id = 'MASLABS-003'
LIMIT 1;

-- 최형호 (MASLABS-004) - 과장 (마스팀)
INSERT INTO salaries (employee_id, payment_date, period_start, period_end, base_salary, overtime_pay, bonus, deductions, net_amount, status)
SELECT 
  e.id,
  '2025-01-25'::DATE,
  '2025-01-01'::DATE,
  '2025-01-31'::DATE,
  4000000,  -- 기본급 400만원
  400000,   -- 연장수당 40만원
  250000,   -- 인센티브 25만원
  132000,   -- 공제액 (3.3% 원천징수)
  4530000,  -- 실수령액
  'paid'
FROM employees e 
WHERE e.employee_id = 'MASLABS-004'
LIMIT 1;

-- 나수진 (MASLABS-005) - 과장 (싱싱팀)
INSERT INTO salaries (employee_id, payment_date, period_start, period_end, base_salary, overtime_pay, bonus, deductions, net_amount, status)
SELECT 
  e.id,
  '2025-01-25'::DATE,
  '2025-01-01'::DATE,
  '2025-01-31'::DATE,
  4000000,  -- 기본급 400만원
  400000,   -- 연장수당 40만원
  250000,   -- 인센티브 25만원
  132000,   -- 공제액 (3.3% 원천징수)
  4530000,  -- 실수령액
  'paid'
FROM employees e 
WHERE e.employee_id = 'MASLABS-005'
LIMIT 1;

-- 하상희 (MASLABS-006) - 파트타임 (시급제)
INSERT INTO salaries (employee_id, payment_date, period_start, period_end, base_salary, overtime_pay, bonus, deductions, net_amount, status)
SELECT 
  e.id,
  '2025-01-25'::DATE,
  '2025-01-01'::DATE,
  '2025-01-31'::DATE,
  1920000,  -- 기본급 (12000원/시간 × 160시간)
  240000,   -- 연장수당 (12000원/시간 × 20시간)
  100000,   -- 인센티브 10만원
  63360,    -- 공제액 (3.3% 원천징수)
  2256640,  -- 실수령액
  'paid'
FROM employees e 
WHERE e.employee_id = 'MASLABS-006'
LIMIT 1;

-- 5. 샘플 계약서 데이터 삽입
INSERT INTO contracts (employee_id, document_type, document_name, contract_date, file_path, is_confidential)
SELECT 
  e.id,
  'employment_contract',
  '근로계약서',
  '2025-08-19'::DATE,
  '/contracts/employment_contract_' || e.employee_id || '.pdf',
  true
FROM employees e 
WHERE e.employee_id IN ('MASLABS-001', 'MASLABS-002', 'MASLABS-003', 'MASLABS-004', 'MASLABS-005', 'MASLABS-006');

-- 6. 완료 메시지
SELECT '급여 조회 시스템 설정 완료!' as message,
       'salaries 테이블: 6개 직원의 1월 급여 데이터' as salaries_info,
       'contracts 테이블: 6개 근로계약서 데이터' as contracts_info;
