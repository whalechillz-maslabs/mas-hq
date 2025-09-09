const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

async function createHourlyWagesTable() {
  console.log('=== hourly_wages 테이블 생성 시작 ===');
  
  try {
    // 1. 테이블 존재 여부 확인
    console.log('\n1. 테이블 존재 여부 확인 중...');
    const { data: existingTable, error: checkError } = await supabase
      .from('hourly_wages')
      .select('id')
      .limit(1);
    
    if (checkError && checkError.code === 'PGRST205') {
      console.log('✅ hourly_wages 테이블이 존재하지 않음 - 생성 진행');
    } else if (checkError) {
      console.log('❌ 테이블 확인 실패:', checkError);
      return;
    } else {
      console.log('⚠️  hourly_wages 테이블이 이미 존재함');
      return;
    }
    
    // 2. 테이블 생성 (SQL 직접 실행)
    console.log('\n2. hourly_wages 테이블 생성 중...');
    
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
    
    // Supabase의 SQL Editor를 통해 실행할 수 있도록 SQL 출력
    console.log('\n📋 Supabase SQL Editor에서 실행할 SQL:');
    console.log('='.repeat(50));
    console.log(createTableSQL);
    console.log('='.repeat(50));
    
    // 3. 인덱스 생성 SQL
    const createIndexSQL = `
      CREATE INDEX IF NOT EXISTS idx_hourly_wages_employee_id ON public.hourly_wages(employee_id);
      CREATE INDEX IF NOT EXISTS idx_hourly_wages_effective_dates ON public.hourly_wages(effective_start_date, effective_end_date);
      CREATE INDEX IF NOT EXISTS idx_hourly_wages_status ON public.hourly_wages(status);
    `;
    
    console.log('\n📋 인덱스 생성 SQL:');
    console.log('='.repeat(50));
    console.log(createIndexSQL);
    console.log('='.repeat(50));
    
    // 4. RLS 설정 SQL
    const rlsSQL = `
      ALTER TABLE public.hourly_wages ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY "hourly_wages_read_policy" ON public.hourly_wages
        FOR SELECT USING (true);
      
      CREATE POLICY "hourly_wages_write_policy" ON public.hourly_wages
        FOR ALL USING (auth.role() = 'authenticated');
    `;
    
    console.log('\n📋 RLS 설정 SQL:');
    console.log('='.repeat(50));
    console.log(rlsSQL);
    console.log('='.repeat(50));
    
    // 5. 최형호 시급 데이터 입력 SQL
    const insertDataSQL = `
      INSERT INTO public.hourly_wages (employee_id, base_wage, effective_start_date, effective_end_date, status) VALUES
      ('d3a63a82-8027-4d2e-b251-c4ea09cf5786', 13000, '2025-08-01', '2025-08-04', 'active'),
      ('d3a63a82-8027-4d2e-b251-c4ea09cf5786', 12000, '2025-08-08', '2025-08-29', 'active');
    `;
    
    console.log('\n📋 최형호 시급 데이터 입력 SQL:');
    console.log('='.repeat(50));
    console.log(insertDataSQL);
    console.log('='.repeat(50));
    
    // 6. 최형호 월급 정보 수정 SQL
    const updateEmployeeSQL = `
      UPDATE public.employees SET 
        monthly_salary = 1680000,
        hourly_rate = null
      WHERE name = '최형호';
    `;
    
    console.log('\n📋 최형호 월급 정보 수정 SQL:');
    console.log('='.repeat(50));
    console.log(updateEmployeeSQL);
    console.log('='.repeat(50));
    
    console.log('\n✅ 모든 SQL이 준비되었습니다!');
    console.log('\n📝 다음 단계:');
    console.log('1. Supabase Dashboard → SQL Editor로 이동');
    console.log('2. 위의 SQL들을 순서대로 실행');
    console.log('3. 실행 완료 후 이 스크립트를 다시 실행하여 확인');
    
  } catch (error) {
    console.error('❌ 실행 중 오류 발생:', error);
  }
}

// 스크립트가 직접 실행될 때만 실행
if (require.main === module) {
  createHourlyWagesTable().catch(console.error);
}

module.exports = { createHourlyWagesTable };
