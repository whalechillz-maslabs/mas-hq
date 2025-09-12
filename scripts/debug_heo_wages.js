const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// .env.local 파일에서 환경 변수 읽기
const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '');
  }
});

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function debugHeoWages() {
  try {
    console.log('🔍 허상원 시급 디버깅 시작');
    
    // 허상원 직원 정보
    const { data: heoEmployee } = await supabase
      .from('employees')
      .select('*')
      .eq('name', '허상원')
      .single();
    
    // 시급 정보 조회
    const { data: wages } = await supabase
      .from('hourly_wages')
      .select('*')
      .eq('employee_id', heoEmployee.id)
      .order('effective_start_date');
    
    console.log('\n📊 시급 정보:');
    wages.forEach((wage, index) => {
      console.log(`  ${index + 1}. ${wage.base_wage}원 (${wage.effective_start_date} ~ ${wage.effective_end_date || '현재'})`);
    });
    
    // 9월 특정 날짜들 테스트
    const testDates = ['2025-09-01', '2025-09-04', '2025-09-05', '2025-09-08', '2025-09-12'];
    
    console.log('\n📅 9월 시급 적용 테스트:');
    testDates.forEach(date => {
      const scheduleDate = new Date(date);
      
      const applicableWages = wages.filter(wage => 
        new Date(wage.effective_start_date) <= scheduleDate &&
        (!wage.effective_end_date || new Date(wage.effective_end_date) >= scheduleDate)
      );
      
      const applicableWage = applicableWages.length > 0 
        ? applicableWages.reduce((latest, current) => 
            new Date(current.effective_start_date) > new Date(latest.effective_start_date) ? current : latest
          )
        : wages[0];
      
      console.log(`  ${date}: ${applicableWage.base_wage}원 (${applicableWage.effective_start_date} 시작)`);
    });
    
  } catch (error) {
    console.error('❌ 오류:', error);
  }
}

debugHeoWages();
