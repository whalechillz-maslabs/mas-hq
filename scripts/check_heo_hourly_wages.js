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

async function checkHeoHourlyWages() {
  try {
    console.log('🔍 허상원 시급 정보 확인 시작');
    
    // 1. 허상원 직원 정보 조회
    const { data: heoEmployee, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('name', '허상원')
      .single();
    
    if (employeeError) {
      console.error('❌ 허상원 직원 정보 조회 실패:', employeeError);
      return;
    }
    
    console.log('👤 허상원 직원 정보:', {
      id: heoEmployee.id,
      name: heoEmployee.name,
      employee_id: heoEmployee.employee_id
    });
    
    // 2. 허상원의 시급 정보 조회
    const { data: wages, error: wageError } = await supabase
      .from('hourly_wages')
      .select('*')
      .eq('employee_id', heoEmployee.id)
      .order('effective_start_date', { ascending: true });
    
    if (wageError) {
      console.error('❌ 시급 정보 조회 실패:', wageError);
      return;
    }
    
    console.log(`\n📊 허상원 시급 정보 총 ${wages.length}개:`);
    
    if (wages.length === 0) {
      console.log('❌ 시급 정보가 없습니다.');
      return;
    }
    
    wages.forEach((wage, index) => {
      console.log(`\n  ${index + 1}. 시급: ${wage.base_wage.toLocaleString()}원`);
      console.log(`     - 적용 시작일: ${wage.effective_start_date}`);
      console.log(`     - 적용 종료일: ${wage.effective_end_date || '없음 (현재까지)'}`);
      console.log(`     - 상태: ${wage.status || 'active'}`);
    });
    
    // 3. 9월 1일과 9월 8일에 적용되는 시급 확인
    const sep1 = new Date('2025-09-01');
    const sep8 = new Date('2025-09-08');
    
    console.log('\n📅 9월 시급 적용 확인:');
    
    const wageForSep1 = wages.find(wage => 
      new Date(wage.effective_start_date) <= sep1 &&
      (!wage.effective_end_date || new Date(wage.effective_end_date) >= sep1)
    );
    
    const wageForSep8 = wages.find(wage => 
      new Date(wage.effective_start_date) <= sep8 &&
      (!wage.effective_end_date || new Date(wage.effective_end_date) >= sep8)
    );
    
    console.log(`  - 9월 1일 적용 시급: ${wageForSep1 ? wageForSep1.base_wage.toLocaleString() + '원' : '없음'}`);
    console.log(`  - 9월 8일 적용 시급: ${wageForSep8 ? wageForSep8.base_wage.toLocaleString() + '원' : '없음'}`);
    
    if (wageForSep1 && wageForSep8 && wageForSep1.base_wage !== wageForSep8.base_wage) {
      console.log('✅ 9월 1일과 8일의 시급이 다릅니다. (정상)');
    } else if (wageForSep1 && wageForSep8 && wageForSep1.base_wage === wageForSep8.base_wage) {
      console.log('⚠️ 9월 1일과 8일의 시급이 같습니다. (문제 가능성)');
    } else {
      console.log('❌ 시급 정보가 부족합니다.');
    }
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

checkHeoHourlyWages();
