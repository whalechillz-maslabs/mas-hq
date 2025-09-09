const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

async function createHourlyWagesUpdated() {
  console.log('=== hourly_wages 테이블 생성 (업데이트된 최형호 ID) ===');
  
  try {
    // 1. 최형호의 현재 ID 확인
    console.log('\n1. 최형호의 현재 ID 확인 중...');
    const { data: choiEmployee, error: choiError } = await supabase
      .from('employees')
      .select('id, name, employee_id')
      .eq('name', '최형호')
      .single();
    
    if (choiError) {
      console.log('❌ 최형호 정보 확인 실패:', choiError);
      return;
    }
    
    console.log('✅ 최형호 정보 확인:', {
      id: choiEmployee.id,
      name: choiEmployee.name,
      employee_id: choiEmployee.employee_id
    });
    
    // 2. 테이블 생성 SQL
    const createTableSQL = `
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
    `;
    
    // 3. 인덱스 생성 SQL
    const createIndexSQL = `
      CREATE INDEX IF NOT EXISTS idx_hourly_wages_employee_id ON public.hourly_wages(employee_id);
      CREATE INDEX IF NOT EXISTS idx_hourly_wages_effective_dates ON public.hourly_wages(effective_start_date, effective_end_date);
      CREATE INDEX IF NOT EXISTS idx_hourly_wages_status ON public.hourly_wages(status);
    `;
    
    // 4. RLS 설정 SQL
    const rlsSQL = `
      ALTER TABLE public.hourly_wages ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY "hourly_wages_read_policy" ON public.hourly_wages
        FOR SELECT USING (true);
      
      CREATE POLICY "hourly_wages_write_policy" ON public.hourly_wages
        FOR ALL USING (auth.role() = 'authenticated');
    `;
    
    // 5. 최형호 시급 데이터 입력 SQL (올바른 ID 사용)
    const insertDataSQL = `
      INSERT INTO public.hourly_wages (employee_id, base_wage, effective_start_date, effective_end_date, status) VALUES
      ('${choiEmployee.id}', 13000, '2025-08-01', '2025-08-04', 'active'),
      ('${choiEmployee.id}', 12000, '2025-08-08', '2025-08-29', 'active');
    `;
    
    // 6. 최형호 월급 정보 수정 SQL (9월 1일부터 월급제로 전환)
    const updateEmployeeSQL = `
      UPDATE public.employees SET 
        monthly_salary = 1680000,
        hourly_rate = null,
        employment_type = 'full_time'
      WHERE id = '${choiEmployee.id}';
    `;
    
    // 7. SQL 출력
    console.log('\n📋 Supabase SQL Editor에서 실행할 SQL:');
    console.log('='.repeat(60));
    console.log('-- 1. 테이블 생성');
    console.log(createTableSQL);
    console.log('\n-- 2. 인덱스 생성');
    console.log(createIndexSQL);
    console.log('\n-- 3. RLS 설정');
    console.log(rlsSQL);
    console.log('\n-- 4. 최형호 시급 데이터 입력');
    console.log(insertDataSQL);
    console.log('\n-- 5. 최형호 월급 정보 수정 (9월 1일부터)');
    console.log(updateEmployeeSQL);
    console.log('='.repeat(60));
    
    console.log('\n✅ 모든 SQL이 준비되었습니다!');
    console.log('\n📝 다음 단계:');
    console.log('1. Supabase Dashboard → SQL Editor로 이동');
    console.log('2. 위의 SQL들을 순서대로 실행');
    console.log('3. 실행 완료 후 확인 스크립트 실행');
    
    // 8. 확인 스크립트 생성
    const verifySQL = `
      -- hourly_wages 테이블 확인
      SELECT 
        hw.id,
        e.name as employee_name,
        e.employee_id,
        hw.base_wage,
        hw.effective_start_date,
        hw.effective_end_date,
        hw.status
      FROM public.hourly_wages hw
      JOIN public.employees e ON hw.employee_id = e.id
      WHERE e.name = '최형호'
      ORDER BY hw.effective_start_date;
      
      -- 최형호 직원 정보 확인
      SELECT 
        name,
        employee_id,
        employment_type,
        hourly_rate,
        monthly_salary
      FROM public.employees
      WHERE name = '최형호';
    `;
    
    console.log('\n📋 확인용 SQL:');
    console.log('='.repeat(60));
    console.log(verifySQL);
    console.log('='.repeat(60));
    
  } catch (error) {
    console.error('❌ 실행 중 오류 발생:', error);
  }
}

// 스크립트가 직접 실행될 때만 실행
if (require.main === module) {
  createHourlyWagesUpdated().catch(console.error);
}

module.exports = { createHourlyWagesUpdated };
