-- hourly_wages 테이블 생성
CREATE TABLE IF NOT EXISTS public.hourly_wages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  base_wage INTEGER NOT NULL,
  overtime_multiplier DECIMAL(3,2) DEFAULT 1.0,
  night_multiplier DECIMAL(3,2) DEFAULT 1.0,
  holiday_multiplier DECIMAL(3,2) DEFAULT 1.0,
  effective_start_date DATE NOT NULL,
  effective_end_date DATE,
  status VARCHAR(20) DEFAULT 'active' NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_hourly_wages_employee_id ON public.hourly_wages(employee_id);
CREATE INDEX IF NOT EXISTS idx_hourly_wages_effective_dates ON public.hourly_wages(effective_start_date, effective_end_date);
CREATE INDEX IF NOT EXISTS idx_hourly_wages_status ON public.hourly_wages(status);

-- RLS (Row Level Security) 설정
ALTER TABLE public.hourly_wages ENABLE ROW LEVEL SECURITY;

-- 정책 생성 (모든 사용자가 읽기 가능, 인증된 사용자만 쓰기 가능)
CREATE POLICY "hourly_wages_read_policy" ON public.hourly_wages
  FOR SELECT USING (true);

CREATE POLICY "hourly_wages_write_policy" ON public.hourly_wages
  FOR ALL USING (auth.role() = 'authenticated');

-- 업데이트 시간 자동 갱신을 위한 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_hourly_wages_updated_at 
  BEFORE UPDATE ON public.hourly_wages 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
