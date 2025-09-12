const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// .env.local 파일에서 환경 변수 읽기
const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    // 따옴표와 개행 문자 제거
    envVars[key.trim()] = value.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '');
  }
});

// 환경 변수에서 Supabase 설정 가져오기
const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkHourlyWagesSchema() {
  try {
    console.log('🔍 hourly_wages 테이블 스키마 확인 시작');
    
    // 1. 테이블 구조 확인 (SQL 쿼리로)
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('get_table_columns', { table_name: 'hourly_wages' });
    
    if (tableError) {
      console.log('⚠️ 테이블 구조 조회 실패 (무시):', tableError.message);
    } else {
      console.log('📊 테이블 구조:', tableInfo);
    }
    
    // 2. 기존 데이터 조회 (모든 컬럼 확인)
    const { data: existingWages, error: selectError } = await supabase
      .from('hourly_wages')
      .select('*')
      .limit(1);
    
    if (selectError) {
      console.error('❌ 기존 데이터 조회 실패:', selectError);
    } else {
      console.log('📋 기존 hourly_wages 데이터 (모든 컬럼):');
      if (existingWages.length > 0) {
        const firstWage = existingWages[0];
        console.log('  실제 컬럼들:', Object.keys(firstWage));
        console.log('  첫 번째 데이터:', firstWage);
      }
    }
    
    // 3. 직원 목록 조회
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('id, name, employee_id')
      .limit(10);
    
    if (employeesError) {
      console.error('❌ 직원 목록 조회 실패:', employeesError);
    } else {
      console.log('👥 직원 목록:');
      employees.forEach((emp, index) => {
        console.log(`  ${index + 1}. ${emp.name} (${emp.employee_id}) - ID: ${emp.id}`);
      });
    }
    
    // 4. 테스트 데이터 삽입 시도
    if (employees && employees.length > 0) {
      const testEmployee = employees.find(emp => emp.name.includes('허상원') || emp.name.includes('상원'));
      
      if (testEmployee) {
        console.log('🧪 허상원 테스트 데이터 삽입 시도');
        
        const testWage = {
          employee_id: testEmployee.id,
          base_wage: 13000,
          overtime_multiplier: 1.5,
          night_multiplier: 1.3,
          holiday_multiplier: 2.0,
          effective_start_date: '2025-01-30',
          status: 'active'
        };
        
        console.log('📝 삽입할 테스트 데이터:', testWage);
        
        const { data: insertedData, error: insertError } = await supabase
          .from('hourly_wages')
          .insert([testWage])
          .select();
        
        if (insertError) {
          console.error('❌ 테스트 데이터 삽입 실패:', insertError);
        } else {
          console.log('✅ 테스트 데이터 삽입 성공:', insertedData);
        }
      } else {
        console.log('⚠️ 허상원 직원을 찾을 수 없음');
      }
    }
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

checkHourlyWagesSchema();