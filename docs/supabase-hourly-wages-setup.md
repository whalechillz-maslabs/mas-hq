# Supabase 대시보드 수동 입력 가이드

## 1. hourly_wages 테이블 생성

### SQL Editor에서 실행할 SQL:

```sql
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
```

## 2. 최형호 시급 데이터 입력

```sql
-- 최형호 시급 데이터 입력
INSERT INTO public.hourly_wages (employee_id, base_wage, effective_start_date, effective_end_date, status) VALUES
('d3a63a82-8027-4d2e-b251-c4ea09cf5786', 13000, '2025-08-01', '2025-08-04', 'active'),
('d3a63a82-8027-4d2e-b251-c4ea09cf5786', 12000, '2025-08-08', '2025-08-29', 'active');
```

## 3. 최형호 월급 정보 수정

```sql
-- 최형호 월급 정보 수정
UPDATE public.employees SET 
  monthly_salary = 1680000,
  hourly_rate = null
WHERE name = '최형호';
```

## 4. 결과 확인

```sql
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
```

## 5. 예상 결과

```
name    | employment_type | monthly_salary | hourly_rate | base_wage | effective_start_date | effective_end_date
--------|-----------------|----------------|-------------|-----------|---------------------|------------------
최형호  | full_time      | 1680000        | null        | 13000     | 2025-08-01          | 2025-08-04
최형호  | full_time      | 1680000        | null        | 12000     | 2025-08-08          | 2025-08-29
```

## 6. 단계별 실행 방법

1. **Supabase 대시보드 접속**: https://supabase.com/dashboard
2. **프로젝트 선택**: cgscbtxtgualkfalouwh
3. **SQL Editor 이동**: 왼쪽 메뉴에서 "SQL Editor" 클릭
4. **SQL 실행**: 위의 SQL을 순서대로 복사하여 실행
5. **결과 확인**: 마지막 SELECT 쿼리로 결과 확인

## 7. 주의사항

- 각 SQL을 개별적으로 실행해야 합니다
- 테이블 생성 후 인덱스와 정책을 순서대로 생성하세요
- 데이터 입력 전에 테이블이 정상적으로 생성되었는지 확인하세요
- 결과 확인 쿼리로 데이터가 올바르게 입력되었는지 검증하세요
