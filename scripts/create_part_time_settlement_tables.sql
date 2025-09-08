-- 파트타임 정산용 데이터베이스 테이블 생성

-- 1. 일자별 근무 기록 테이블
CREATE TABLE IF NOT EXISTS daily_work_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  work_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  total_hours DECIMAL(4,2) NOT NULL,
  hourly_rate INTEGER NOT NULL,
  daily_wage INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(employee_id, work_date)
);

-- 2. 주간 정산 테이블
CREATE TABLE IF NOT EXISTS weekly_settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  total_days INTEGER NOT NULL DEFAULT 0,
  total_hours DECIMAL(5,2) NOT NULL DEFAULT 0,
  total_wage INTEGER NOT NULL DEFAULT 0,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(employee_id, week_start)
);

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_daily_work_records_employee_date 
ON daily_work_records(employee_id, work_date);

CREATE INDEX IF NOT EXISTS idx_weekly_settlements_employee_week 
ON weekly_settlements(employee_id, week_start);

-- 4. 트리거 함수 생성 (updated_at 자동 업데이트)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. 트리거 생성
DROP TRIGGER IF EXISTS update_daily_work_records_updated_at ON daily_work_records;
CREATE TRIGGER update_daily_work_records_updated_at
    BEFORE UPDATE ON daily_work_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_weekly_settlements_updated_at ON weekly_settlements;
CREATE TRIGGER update_weekly_settlements_updated_at
    BEFORE UPDATE ON weekly_settlements
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. 샘플 데이터 삽입 (하상희 파트타임 직원용)
INSERT INTO daily_work_records (
  employee_id, 
  work_date, 
  start_time, 
  end_time, 
  total_hours, 
  hourly_rate, 
  daily_wage, 
  status
) VALUES (
  (SELECT id FROM employees WHERE employee_id = 'MASLABS-006'),
  '2025-09-01',
  '11:00:00',
  '16:00:00',
  5.0,
  12000,
  60000,
  'approved'
), (
  (SELECT id FROM employees WHERE employee_id = 'MASLABS-006'),
  '2025-09-03',
  '11:00:00',
  '16:00:00',
  5.0,
  12000,
  60000,
  'approved'
), (
  (SELECT id FROM employees WHERE employee_id = 'MASLABS-006'),
  '2025-09-05',
  '11:00:00',
  '16:00:00',
  5.0,
  12000,
  60000,
  'approved'
), (
  (SELECT id FROM employees WHERE employee_id = 'MASLABS-006'),
  '2025-09-10',
  '11:00:00',
  '16:00:00',
  5.0,
  12000,
  60000,
  'approved'
), (
  (SELECT id FROM employees WHERE employee_id = 'MASLABS-006'),
  '2025-09-12',
  '11:00:00',
  '16:00:00',
  5.0,
  12000,
  60000,
  'approved'
);

-- 7. 주간 정산 샘플 데이터
INSERT INTO weekly_settlements (
  employee_id,
  week_start,
  week_end,
  total_days,
  total_hours,
  total_wage,
  status
) VALUES (
  (SELECT id FROM employees WHERE employee_id = 'MASLABS-006'),
  '2025-09-01',
  '2025-09-07',
  3,
  15.0,
  180000,
  'approved'
), (
  (SELECT id FROM employees WHERE employee_id = 'MASLABS-006'),
  '2025-09-08',
  '2025-09-14',
  2,
  10.0,
  120000,
  'approved'
);

-- 8. 뷰 생성 (파트타임 직원 정산 현황)
CREATE OR REPLACE VIEW part_time_settlement_summary AS
SELECT 
  e.id as employee_id,
  e.name,
  e.employee_id as employee_code,
  e.department,
  e.hourly_rate,
  COUNT(dwr.id) as total_work_days,
  COALESCE(SUM(dwr.total_hours), 0) as total_hours,
  COALESCE(SUM(dwr.daily_wage), 0) as total_wage,
  COUNT(ws.id) as total_weekly_settlements
FROM employees e
LEFT JOIN daily_work_records dwr ON e.id = dwr.employee_id
LEFT JOIN weekly_settlements ws ON e.id = ws.employee_id
WHERE e.employment_type = 'part_time'
GROUP BY e.id, e.name, e.employee_id, e.department, e.hourly_rate;

-- 9. 함수 생성 (주간 정산 자동 계산)
CREATE OR REPLACE FUNCTION calculate_weekly_settlement(
  p_employee_id UUID,
  p_week_start DATE
)
RETURNS TABLE (
  total_days INTEGER,
  total_hours DECIMAL(5,2),
  total_wage INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_days,
    COALESCE(SUM(dwr.total_hours), 0) as total_hours,
    COALESCE(SUM(dwr.daily_wage), 0)::INTEGER as total_wage
  FROM daily_work_records dwr
  WHERE dwr.employee_id = p_employee_id
    AND dwr.work_date >= p_week_start
    AND dwr.work_date < p_week_start + INTERVAL '7 days'
    AND dwr.status = 'approved';
END;
$$ LANGUAGE plpgsql;

-- 10. 권한 설정
GRANT SELECT, INSERT, UPDATE, DELETE ON daily_work_records TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON weekly_settlements TO authenticated;
GRANT SELECT ON part_time_settlement_summary TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_weekly_settlement TO authenticated;
