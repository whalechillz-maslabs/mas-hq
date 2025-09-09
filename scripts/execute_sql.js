const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

async function executeSQL() {
  console.log('=== Supabase SQL 실행 ===');
  
  try {
    // 1. hourly_wages 테이블 생성
    console.log('\n1. hourly_wages 테이블 생성 중...');
    
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
    
    const { data: createResult, error: createError } = await supabase.rpc('exec_sql', { 
      sql: createTableSQL 
    });
    
    if (createError) {
      console.log('❌ 테이블 생성 실패:', createError);
      return;
    }
    
    console.log('✅ hourly_wages 테이블 생성 완료');
    
    // 2. 인덱스 생성
    console.log('\n2. 인덱스 생성 중...');
    
    const createIndexSQL = `
      CREATE INDEX IF NOT EXISTS idx_hourly_wages_employee_id ON public.hourly_wages(employee_id);
      CREATE INDEX IF NOT EXISTS idx_hourly_wages_effective_dates ON public.hourly_wages(effective_start_date, effective_end_date);
      CREATE INDEX IF NOT EXISTS idx_hourly_wages_status ON public.hourly_wages(status);
    `;
    
    const { error: indexError } = await supabase.rpc('exec_sql', { 
      sql: createIndexSQL 
    });
    
    if (indexError) {
      console.log('❌ 인덱스 생성 실패:', indexError);
    } else {
      console.log('✅ 인덱스 생성 완료');
    }
    
    // 3. RLS 설정
    console.log('\n3. RLS 설정 중...');
    
    const rlsSQL = `
      ALTER TABLE public.hourly_wages ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY "hourly_wages_read_policy" ON public.hourly_wages
        FOR SELECT USING (true);
      
      CREATE POLICY "hourly_wages_write_policy" ON public.hourly_wages
        FOR ALL USING (auth.role() = 'authenticated');
    `;
    
    const { error: rlsError } = await supabase.rpc('exec_sql', { 
      sql: rlsSQL 
    });
    
    if (rlsError) {
      console.log('❌ RLS 설정 실패:', rlsError);
    } else {
      console.log('✅ RLS 설정 완료');
    }
    
    // 4. 최형호 시급 데이터 입력
    console.log('\n4. 최형호 시급 데이터 입력 중...');
    
    const insertWageSQL = `
      INSERT INTO public.hourly_wages (employee_id, base_wage, effective_start_date, effective_end_date, status) VALUES
      ('d3a63a82-8027-4d2e-b251-c4ea09cf5786', 13000, '2025-08-01', '2025-08-04', 'active'),
      ('d3a63a82-8027-4d2e-b251-c4ea09cf5786', 12000, '2025-08-08', '2025-08-29', 'active');
    `;
    
    const { data: insertResult, error: insertError } = await supabase.rpc('exec_sql', { 
      sql: insertWageSQL 
    });
    
    if (insertError) {
      console.log('❌ 시급 데이터 입력 실패:', insertError);
    } else {
      console.log('✅ 시급 데이터 입력 완료');
    }
    
    // 5. 최형호 월급 정보 수정
    console.log('\n5. 최형호 월급 정보 수정 중...');
    
    const updateEmployeeSQL = `
      UPDATE public.employees SET 
        monthly_salary = 1680000,
        hourly_rate = null
      WHERE name = '최형호';
    `;
    
    const { data: updateResult, error: updateError } = await supabase.rpc('exec_sql', { 
      sql: updateEmployeeSQL 
    });
    
    if (updateError) {
      console.log('❌ 월급 정보 수정 실패:', updateError);
    } else {
      console.log('✅ 월급 정보 수정 완료');
    }
    
    // 6. 결과 확인
    console.log('\n6. 결과 확인 중...');
    
    const { data: checkResult, error: checkError } = await supabase
      .from('hourly_wages')
      .select(`
        id,
        employee_id,
        base_wage,
        effective_start_date,
        effective_end_date,
        status,
        employees!inner(name, employee_id, monthly_salary, hourly_rate)
      `)
      .eq('employee_id', 'd3a63a82-8027-4d2e-b251-c4ea09cf5786');
    
    if (checkError) {
      console.log('❌ 결과 확인 실패:', checkError);
    } else {
      console.log('✅ 결과 확인 완료:');
      checkResult.forEach((wage, index) => {
        console.log(`  ${index + 1}. ${wage.effective_start_date} - ${wage.effective_end_date}: ${wage.base_wage.toLocaleString()}원`);
      });
      
      if (checkResult.length > 0) {
        const employee = checkResult[0].employees;
        console.log(`  직원: ${employee.name} (${employee.employee_id})`);
        console.log(`  월급: ${employee.monthly_salary?.toLocaleString() || 'null'}원`);
        console.log(`  시급: ${employee.hourly_rate?.toLocaleString() || 'null'}원`);
      }
    }
    
    console.log('\n=== SQL 실행 완료 ===');
    
  } catch (error) {
    console.error('❌ 실행 중 오류 발생:', error);
  }
}

executeSQL().catch(console.error);
