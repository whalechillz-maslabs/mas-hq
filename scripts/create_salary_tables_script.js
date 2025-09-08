const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function createSalaryTables() {
  console.log('=== 급여 관련 테이블 생성 시작 ===');
  
  try {
    // 1. salaries 테이블 생성
    console.log('\n1. salaries 테이블 생성 중...');
    const { error: salaryError } = await supabase
      .from('salaries')
      .select('*')
      .limit(1);
    
    if (salaryError && salaryError.message.includes('Could not find the table')) {
      console.log('salaries 테이블이 없습니다. 생성이 필요합니다.');
      console.log('Supabase 대시보드에서 다음 SQL을 실행해주세요:');
      console.log('\n=== salaries 테이블 생성 SQL ===');
      console.log(`
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

CREATE INDEX IF NOT EXISTS idx_salaries_employee_id ON salaries(employee_id);
CREATE INDEX IF NOT EXISTS idx_salaries_payment_date ON salaries(payment_date);
CREATE INDEX IF NOT EXISTS idx_salaries_period ON salaries(period_start, period_end);
      `);
    } else {
      console.log('✅ salaries 테이블이 이미 존재합니다.');
    }
    
    // 2. contracts 테이블 생성
    console.log('\n2. contracts 테이블 생성 중...');
    const { error: contractError } = await supabase
      .from('contracts')
      .select('*')
      .limit(1);
    
    if (contractError && contractError.message.includes('Could not find the table')) {
      console.log('contracts 테이블이 없습니다. 생성이 필요합니다.');
      console.log('\n=== contracts 테이블 생성 SQL ===');
      console.log(`
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

CREATE INDEX IF NOT EXISTS idx_contracts_employee_id ON contracts(employee_id);
CREATE INDEX IF NOT EXISTS idx_contracts_document_type ON contracts(document_type);
      `);
    } else {
      console.log('✅ contracts 테이블이 이미 존재합니다.');
    }
    
    // 3. 샘플 데이터 삽입 SQL
    console.log('\n3. 샘플 데이터 삽입 SQL ===');
    console.log(`
-- 김탁수 (MASLABS-001) 급여 데이터
INSERT INTO salaries (employee_id, payment_date, period_start, period_end, base_salary, overtime_pay, bonus, deductions, net_amount, status)
SELECT 
  e.id,
  '2025-01-25'::DATE,
  '2025-01-01'::DATE,
  '2025-01-31'::DATE,
  5000000,
  500000,
  300000,
  165000,
  5635000,
  'paid'
FROM employees e 
WHERE e.employee_id = 'MASLABS-001'
LIMIT 1;

-- 이은정 (MASLABS-002) 급여 데이터
INSERT INTO salaries (employee_id, payment_date, period_start, period_end, base_salary, overtime_pay, bonus, deductions, net_amount, status)
SELECT 
  e.id,
  '2025-01-25'::DATE,
  '2025-01-01'::DATE,
  '2025-01-31'::DATE,
  3000000,
  300000,
  200000,
  99000,
  3410000,
  'paid'
FROM employees e 
WHERE e.employee_id = 'MASLABS-002'
LIMIT 1;

-- 허상원 (MASLABS-003) 급여 데이터
INSERT INTO salaries (employee_id, payment_date, period_start, period_end, base_salary, overtime_pay, bonus, deductions, net_amount, status)
SELECT 
  e.id,
  '2025-01-25'::DATE,
  '2025-01-01'::DATE,
  '2025-01-31'::DATE,
  2500000,
  250000,
  150000,
  82500,
  2825000,
  'paid'
FROM employees e 
WHERE e.employee_id = 'MASLABS-003'
LIMIT 1;

-- 최형호 (MASLABS-004) 급여 데이터
INSERT INTO salaries (employee_id, payment_date, period_start, period_end, base_salary, overtime_pay, bonus, deductions, net_amount, status)
SELECT 
  e.id,
  '2025-01-25'::DATE,
  '2025-01-01'::DATE,
  '2025-01-31'::DATE,
  4000000,
  400000,
  250000,
  132000,
  4530000,
  'paid'
FROM employees e 
WHERE e.employee_id = 'MASLABS-004'
LIMIT 1;

-- 나수진 (MASLABS-005) 급여 데이터
INSERT INTO salaries (employee_id, payment_date, period_start, period_end, base_salary, overtime_pay, bonus, deductions, net_amount, status)
SELECT 
  e.id,
  '2025-01-25'::DATE,
  '2025-01-01'::DATE,
  '2025-01-31'::DATE,
  4000000,
  400000,
  250000,
  132000,
  4530000,
  'paid'
FROM employees e 
WHERE e.employee_id = 'MASLABS-005'
LIMIT 1;

-- 하상희 (MASLABS-006) 급여 데이터 (시급제)
INSERT INTO salaries (employee_id, payment_date, period_start, period_end, base_salary, overtime_pay, bonus, deductions, net_amount, status)
SELECT 
  e.id,
  '2025-01-25'::DATE,
  '2025-01-01'::DATE,
  '2025-01-31'::DATE,
  1920000, -- 12000원/시간 × 160시간
  240000,  -- 12000원/시간 × 20시간 (연장근무)
  100000,
  63360,   -- 3.3% 원천징수
  2256640,
  'paid'
FROM employees e 
WHERE e.employee_id = 'MASLABS-006'
LIMIT 1;

-- 샘플 계약서 데이터 삽입
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
    `);
    
    console.log('\n=== 실행 완료 ===');
    console.log('위의 SQL을 Supabase 대시보드에서 실행하시면 급여 조회 기능이 정상 작동합니다.');
    
  } catch (error) {
    console.error('테이블 생성 실패:', error);
  }
}

createSalaryTables().catch(console.error);

