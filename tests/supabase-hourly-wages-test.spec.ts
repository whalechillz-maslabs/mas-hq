import { test, expect } from '@playwright/test';

test.describe('Supabase Hourly Wages Setup', () => {
  test('최형호 시급 등록 및 월급 변경', async ({ page }) => {
    // 1. Supabase 대시보드 로그인
    await page.goto('https://supabase.com/dashboard');
    
    // 로그인 과정 (실제 로그인 정보 필요)
    await page.waitForTimeout(3000);
    
    // 2. 프로젝트 선택
    await page.goto('https://supabase.com/dashboard/project/cgscbtxtgualkfalouwh');
    
    // 3. SQL Editor로 이동
    await page.click('text=SQL Editor');
    await page.waitForTimeout(2000);
    
    // 4. hourly_wages 테이블 생성
    const createTableSQL = `
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

-- RLS 설정
ALTER TABLE public.hourly_wages ENABLE ROW LEVEL SECURITY;

-- 정책 생성
CREATE POLICY "hourly_wages_read_policy" ON public.hourly_wages
  FOR SELECT USING (true);

CREATE POLICY "hourly_wages_write_policy" ON public.hourly_wages
  FOR ALL USING (auth.role() = 'authenticated');
    `;
    
    // SQL 입력
    await page.fill('textarea[placeholder*="SQL"]', createTableSQL);
    await page.click('button:has-text("Run")');
    await page.waitForTimeout(3000);
    
    // 5. 최형호 시급 데이터 입력
    const insertWageSQL = `
-- 최형호 시급 데이터 입력
INSERT INTO public.hourly_wages (employee_id, base_wage, effective_start_date, effective_end_date, status) VALUES
('d3a63a82-8027-4d2e-b251-c4ea09cf5786', 13000, '2025-08-01', '2025-08-04', 'active'),
('d3a63a82-8027-4d2e-b251-c4ea09cf5786', 12000, '2025-08-08', '2025-08-29', 'active');
    `;
    
    await page.fill('textarea[placeholder*="SQL"]', insertWageSQL);
    await page.click('button:has-text("Run")');
    await page.waitForTimeout(3000);
    
    // 6. 최형호 월급 정보 수정
    const updateEmployeeSQL = `
-- 최형호 월급 정보 수정
UPDATE public.employees SET 
  monthly_salary = 1680000,
  hourly_rate = null
WHERE name = '최형호';
    `;
    
    await page.fill('textarea[placeholder*="SQL"]', updateEmployeeSQL);
    await page.click('button:has-text("Run")');
    await page.waitForTimeout(3000);
    
    // 7. 결과 확인
    const checkResultSQL = `
-- 결과 확인
SELECT 
  e.name,
  e.employment_type,
  e.monthly_salary,
  e.hourly_rate,
  hw.base_wage,
  hw.effective_start_date,
  hw.effective_end_date
FROM public.employees e
LEFT JOIN public.hourly_wages hw ON e.id = hw.employee_id
WHERE e.name = '최형호'
ORDER BY hw.effective_start_date;
    `;
    
    await page.fill('textarea[placeholder*="SQL"]', checkResultSQL);
    await page.click('button:has-text("Run")');
    await page.waitForTimeout(3000);
    
    // 결과 스크린샷
    await page.screenshot({ path: 'tests/screenshots/supabase-hourly-wages-result.png' });
  });
});
