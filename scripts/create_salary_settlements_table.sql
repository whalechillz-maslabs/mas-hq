-- 정산 관리 테이블 생성
CREATE TABLE IF NOT EXISTS salary_settlements (
  id SERIAL PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_hours DECIMAL(5,2) NOT NULL,
  hourly_rate INTEGER NOT NULL,
  total_amount INTEGER NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'cancelled')),
  payment_date DATE,
  settlement_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_salary_settlements_employee_id ON salary_settlements(employee_id);
CREATE INDEX IF NOT EXISTS idx_salary_settlements_period ON salary_settlements(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_salary_settlements_payment_status ON salary_settlements(payment_status);
CREATE INDEX IF NOT EXISTS idx_salary_settlements_settlement_date ON salary_settlements(settlement_date);

-- 업데이트 트리거
CREATE OR REPLACE FUNCTION update_salary_settlements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_salary_settlements_updated_at
  BEFORE UPDATE ON salary_settlements
  FOR EACH ROW
  EXECUTE FUNCTION update_salary_settlements_updated_at();

-- 정산 내역 조회 뷰
CREATE OR REPLACE VIEW salary_settlement_summary AS
SELECT 
  s.id,
  e.name as employee_name,
  e.employee_id as employee_code,
  s.period_start,
  s.period_end,
  s.total_hours,
  s.hourly_rate,
  s.total_amount,
  s.payment_status,
  s.payment_date,
  s.settlement_date,
  s.notes,
  s.created_at,
  s.updated_at
FROM salary_settlements s
JOIN employees e ON s.employee_id = e.id
ORDER BY s.settlement_date DESC, e.name;

-- 월별 정산 통계 뷰
CREATE OR REPLACE VIEW monthly_settlement_stats AS
SELECT 
  DATE_TRUNC('month', period_start) as month,
  COUNT(*) as settlement_count,
  SUM(total_hours) as total_hours,
  SUM(total_amount) as total_amount,
  AVG(total_hours) as avg_hours_per_settlement,
  AVG(total_amount) as avg_amount_per_settlement
FROM salary_settlements
WHERE payment_status = 'paid'
GROUP BY DATE_TRUNC('month', period_start)
ORDER BY month DESC;

-- 직원별 정산 통계 뷰
CREATE OR REPLACE VIEW employee_settlement_stats AS
SELECT 
  e.name as employee_name,
  e.employee_id as employee_code,
  COUNT(s.id) as total_settlements,
  SUM(s.total_hours) as total_hours,
  SUM(s.total_amount) as total_amount,
  AVG(s.total_hours) as avg_hours_per_settlement,
  AVG(s.total_amount) as avg_amount_per_settlement,
  MAX(s.settlement_date) as last_settlement_date
FROM employees e
LEFT JOIN salary_settlements s ON e.id = s.employee_id
WHERE e.employment_type = 'part_time'
GROUP BY e.id, e.name, e.employee_id
ORDER BY total_amount DESC;

-- 정산 중복 방지 제약조건
CREATE UNIQUE INDEX IF NOT EXISTS idx_salary_settlements_unique_period 
ON salary_settlements(employee_id, period_start, period_end);

-- 코멘트 추가
COMMENT ON TABLE salary_settlements IS '알바 직원 정산 관리 테이블';
COMMENT ON COLUMN salary_settlements.employee_id IS '직원 ID';
COMMENT ON COLUMN salary_settlements.period_start IS '정산 기간 시작일';
COMMENT ON COLUMN salary_settlements.period_end IS '정산 기간 종료일';
COMMENT ON COLUMN salary_settlements.total_hours IS '총 근무시간';
COMMENT ON COLUMN salary_settlements.hourly_rate IS '시급';
COMMENT ON COLUMN salary_settlements.total_amount IS '총 지급액';
COMMENT ON COLUMN salary_settlements.payment_status IS '지급 상태 (pending/paid/cancelled)';
COMMENT ON COLUMN salary_settlements.payment_date IS '실제 지급일';
COMMENT ON COLUMN salary_settlements.settlement_date IS '정산서 작성일';
