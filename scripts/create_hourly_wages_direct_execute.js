const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

async function createHourlyWagesDirectExecute() {
  console.log('=== hourly_wages 테이블 직접 생성 및 데이터 입력 ===');
  
  try {
    // 1. 최형호 정보 확인
    console.log('\n1. 최형호 정보 확인 중...');
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
    
    // 2. 테이블 생성 시도 (RPC 함수 사용)
    console.log('\n2. hourly_wages 테이블 생성 시도 중...');
    
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
    
    // exec_sql 함수가 있는지 확인
    const { data: execResult, error: execError } = await supabase.rpc('exec_sql', { 
      sql: createTableSQL 
    });
    
    if (execError) {
      console.log('❌ exec_sql 함수를 사용한 테이블 생성 실패:', execError);
      console.log('📝 Supabase Dashboard에서 직접 실행해야 합니다.');
      
      // 3. 대안: 기존 테이블에 데이터 삽입 시도
      console.log('\n3. 기존 테이블에 데이터 삽입 시도 중...');
      
      try {
        // hourly_wages 테이블이 이미 존재하는지 확인
        const { data: testData, error: testError } = await supabase
          .from('hourly_wages')
          .select('id')
          .limit(1);
        
        if (testError && testError.code === 'PGRST205') {
          console.log('❌ hourly_wages 테이블이 존재하지 않습니다.');
          console.log('📝 Supabase Dashboard → SQL Editor에서 다음 SQL을 실행해주세요:');
          console.log('\n' + '='.repeat(60));
          console.log(createTableSQL);
          console.log('='.repeat(60));
          return;
        }
        
        // 테이블이 존재하면 데이터 삽입 시도
        console.log('✅ hourly_wages 테이블이 존재합니다. 데이터 삽입 시도 중...');
        
        const wageData = [
          {
            employee_id: choiEmployee.id,
            base_wage: 13000,
            effective_start_date: '2025-08-01',
            effective_end_date: '2025-08-04',
            status: 'active'
          },
          {
            employee_id: choiEmployee.id,
            base_wage: 12000,
            effective_start_date: '2025-08-08',
            effective_end_date: '2025-08-29',
            status: 'active'
          }
        ];
        
        const { data: insertData, error: insertError } = await supabase
          .from('hourly_wages')
          .insert(wageData);
        
        if (insertError) {
          console.log('❌ 시급 데이터 삽입 실패:', insertError);
        } else {
          console.log('✅ 시급 데이터 삽입 완료');
        }
        
        // 최형호 직원 정보 수정
        const { error: updateError } = await supabase
          .from('employees')
          .update({
            monthly_salary: 1680000,
            hourly_rate: null,
            employment_type: 'full_time'
          })
          .eq('id', choiEmployee.id);
        
        if (updateError) {
          console.log('❌ 최형호 직원 정보 수정 실패:', updateError);
        } else {
          console.log('✅ 최형호 직원 정보 수정 완료 (월급제로 전환)');
        }
        
      } catch (error) {
        console.log('❌ 데이터 삽입 시도 중 오류:', error);
      }
      
    } else {
      console.log('✅ 테이블 생성 성공');
      
      // 인덱스 생성
      const indexSQL = `
        CREATE INDEX IF NOT EXISTS idx_hourly_wages_employee_id ON public.hourly_wages(employee_id);
        CREATE INDEX IF NOT EXISTS idx_hourly_wages_effective_dates ON public.hourly_wages(effective_start_date, effective_end_date);
        CREATE INDEX IF NOT EXISTS idx_hourly_wages_status ON public.hourly_wages(status);
      `;
      
      const { error: indexError } = await supabase.rpc('exec_sql', { 
        sql: indexSQL 
      });
      
      if (indexError) {
        console.log('❌ 인덱스 생성 실패:', indexError);
      } else {
        console.log('✅ 인덱스 생성 완료');
      }
      
      // RLS 설정
      const rlsSQL = `
        ALTER TABLE public.hourly_wages ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "hourly_wages_read_policy" ON public.hourly_wages FOR SELECT USING (true);
        CREATE POLICY "hourly_wages_write_policy" ON public.hourly_wages FOR ALL USING (auth.role() = 'authenticated');
      `;
      
      const { error: rlsError } = await supabase.rpc('exec_sql', { 
        sql: rlsSQL 
      });
      
      if (rlsError) {
        console.log('❌ RLS 설정 실패:', rlsError);
      } else {
        console.log('✅ RLS 설정 완료');
      }
    }
    
    // 4. 최종 확인
    console.log('\n4. 최종 확인 중...');
    const { data: finalWages, error: finalError } = await supabase
      .from('hourly_wages')
      .select(`
        id,
        base_wage,
        effective_start_date,
        effective_end_date,
        status,
        employees!inner(name, employee_id)
      `)
      .eq('employees.name', '최형호');
    
    if (finalError) {
      console.log('❌ 최종 확인 실패:', finalError);
    } else {
      console.log('✅ 최종 확인 완료:');
      if (finalWages.length > 0) {
        finalWages.forEach((wage, index) => {
          console.log(`  ${index + 1}. ${wage.effective_start_date} - ${wage.effective_end_date}: ${wage.base_wage.toLocaleString()}원`);
        });
      } else {
        console.log('  시급 데이터가 없습니다.');
      }
    }
    
  } catch (error) {
    console.error('❌ 실행 중 오류 발생:', error);
  }
}

// 스크립트가 직접 실행될 때만 실행
if (require.main === module) {
  createHourlyWagesDirectExecute().catch(console.error);
}

module.exports = { createHourlyWagesDirectExecute };
