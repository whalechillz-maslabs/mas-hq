-- 시급 관리 테이블 생성
-- 이 스크립트는 Supabase SQL Editor에서 실행하거나 psql로 실행할 수 있습니다

-- 시급 관리 테이블
CREATE TABLE IF NOT EXISTS hourly_wages (
  id SERIAL PRIMARY KEY,
  employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
  base_wage DECIMAL(10,2) NOT NULL CHECK (base_wage > 0),
  overtime_multiplier DECIMAL(3,2) DEFAULT 1.5 CHECK (overtime_multiplier >= 1.0),
  night_shift_multiplier DECIMAL(3,2) DEFAULT 1.3 CHECK (night_shift_multiplier >= 1.0),
  holiday_multiplier DECIMAL(3,2) DEFAULT 2.0 CHECK (holiday_multiplier >= 1.0),
  effective_date DATE NOT NULL,
  end_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 제약 조건: 같은 직원의 같은 날짜에 중복 적용 방지
  UNIQUE(employee_id, effective_date),
  
  -- 제약 조건: 종료일이 시작일보다 늦어야 함
  CHECK (end_date IS NULL OR end_date >= effective_date)
);

-- 인덱스 생성 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_hourly_wages_employee_id ON hourly_wages(employee_id);
CREATE INDEX IF NOT EXISTS idx_hourly_wages_effective_date ON hourly_wages(effective_date);
CREATE INDEX IF NOT EXISTS idx_hourly_wages_date_range ON hourly_wages(employee_id, effective_date, end_date);

-- RLS (Row Level Security) 활성화
ALTER TABLE hourly_wages ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 관리자만 모든 시급 정보에 접근 가능
CREATE POLICY "관리자만 시급 정보 관리" ON hourly_wages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE employees.id = auth.uid() 
      AND employees.role = 'admin'
    )
  );

-- RLS 정책: 직원은 자신의 시급 정보만 조회 가능
CREATE POLICY "직원은 자신의 시급 정보 조회" ON hourly_wages
  FOR SELECT USING (
    employee_id = auth.uid()
  );

-- 기본 시급 데이터 삽입 (예시)
-- 실제 운영 시에는 관리자 페이지에서 설정해야 합니다
INSERT INTO hourly_wages (employee_id, base_wage, overtime_multiplier, night_shift_multiplier, holiday_multiplier, effective_date)
SELECT 
  id,
   12000, -- 기본 시급 12,000원 (실제 운영 환경에 맞게 조정)
  1.0,   -- 초과 근무 1.0배 (수당 없음 - 프랜차이즈 스타일)
  1.0,   -- 야간 근무 1.0배 (수당 없음 - 프랜차이즈 스타일)
  1.0    -- 휴일 근무 1.0배 (수당 없음 - 프랜차이즈 스타일)
FROM employees 
WHERE role = 'admin' -- 관리자만 기본값 설정
ON CONFLICT (employee_id, effective_date) DO NOTHING;

-- 테이블 정보 확인
COMMENT ON TABLE hourly_wages IS '직원별 시급 및 가중치 관리 테이블';
COMMENT ON COLUMN hourly_wages.base_wage IS '기본 시급 (원/시간)';
COMMENT ON COLUMN hourly_wages.overtime_multiplier IS '초과 근무 가중치 (배수)';
COMMENT ON COLUMN hourly_wages.night_shift_multiplier IS '야간 근무 가중치 (배수)';
COMMENT ON COLUMN hourly_wages.holiday_multiplier IS '휴일 근무 가중치 (배수)';
COMMENT ON COLUMN hourly_wages.effective_date IS '적용 시작일';
COMMENT ON COLUMN hourly_wages.end_date IS '적용 종료일 (NULL이면 현재 적용 중)';

-- 뷰 생성: 현재 적용 중인 시급 정보
CREATE OR REPLACE VIEW current_hourly_wages AS
SELECT 
  hw.id,
  hw.employee_id,
  e.name as employee_name,
  e.employee_id as employee_code,
  hw.base_wage,
  hw.overtime_multiplier,
  hw.night_shift_multiplier,
  hw.holiday_multiplier,
  hw.effective_date,
  hw.end_date,
  hw.created_at,
  hw.updated_at
FROM hourly_wages hw
JOIN employees e ON hw.employee_id = e.id
WHERE hw.end_date IS NULL OR hw.end_date >= CURRENT_DATE
ORDER BY e.name, hw.effective_date DESC;

-- 함수: 특정 날짜의 시급 정보 조회
CREATE OR REPLACE FUNCTION get_hourly_wage_for_date(
  p_employee_id UUID,
  p_date DATE
)
RETURNS TABLE (
  id INTEGER,
  employee_id UUID,
  base_wage DECIMAL,
  overtime_multiplier DECIMAL,
  night_shift_multiplier DECIMAL,
  holiday_multiplier DECIMAL,
  effective_date DATE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    hw.id,
    hw.employee_id,
    hw.base_wage,
    hw.overtime_multiplier,
    hw.night_shift_multiplier,
    hw.holiday_multiplier,
    hw.effective_date
  FROM hourly_wages hw
  WHERE hw.employee_id = p_employee_id
    AND hw.effective_date <= p_date
    AND (hw.end_date IS NULL OR hw.end_date >= p_date)
  ORDER BY hw.effective_date DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- 트리거: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_hourly_wages_updated_at
  BEFORE UPDATE ON hourly_wages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 테이블 생성 완료 메시지
SELECT '시급 관리 테이블이 성공적으로 생성되었습니다.' as message;
