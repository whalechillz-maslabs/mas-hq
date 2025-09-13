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

async function testWageQuery() {
  try {
    console.log('🔍 시급 쿼리 테스트 시작');
    
    // 허상원 직원 정보
    const { data: heoEmployee } = await supabase
      .from('employees')
      .select('*')
      .eq('name', '허상원')
      .single();
    
    console.log('👤 허상원 ID:', heoEmployee.id);
    
    // 실제 코드와 동일한 쿼리 실행
    const { data: wages, error: wageError } = await supabase
      .from('hourly_wages')
      .select('*')
      .eq('employee_id', heoEmployee.id)
      .order('effective_start_date');
    
    if (wageError) {
      console.error('❌ 시급 조회 실패:', wageError);
      return;
    }
    
    console.log('\n📊 조회된 시급 정보:');
    wages.forEach((wage, index) => {
      console.log(`  ${index + 1}. ${wage.base_wage}원 (${wage.effective_start_date} ~ ${wage.effective_end_date || '현재'})`);
    });
    
    // 9월 8일 테스트
    const testDate = '2025-09-08';
    const scheduleDate = new Date(testDate);
    
    console.log(`\n📅 ${testDate} 시급 적용 테스트:`);
    
    const applicableWages = wages.filter(wage => {
      const startDate = new Date(wage.effective_start_date);
      const endDate = wage.effective_end_date ? new Date(wage.effective_end_date) : null;
      
      console.log(`  - ${wage.base_wage}원: 시작일 ${startDate.toISOString().split('T')[0]}, 종료일 ${endDate ? endDate.toISOString().split('T')[0] : '없음'}`);
      console.log(`    조건1 (시작일 <= ${testDate}): ${startDate <= scheduleDate}`);
      console.log(`    조건2 (종료일 >= ${testDate} 또는 없음): ${!endDate || endDate >= scheduleDate}`);
      console.log(`    결과: ${startDate <= scheduleDate && (!endDate || endDate >= scheduleDate)}`);
      
      return startDate <= scheduleDate && (!endDate || endDate >= scheduleDate);
    });
    
    console.log(`\n✅ 적용 가능한 시급: ${applicableWages.length}개`);
    
    if (applicableWages.length > 0) {
      const applicableWage = applicableWages.reduce((latest, current) => 
        new Date(current.effective_start_date) > new Date(latest.effective_start_date) ? current : latest
      );
      
      console.log(`🎯 선택된 시급: ${applicableWage.base_wage}원 (${applicableWage.effective_start_date} 시작)`);
    }
    
  } catch (error) {
    console.error('❌ 오류:', error);
  }
}

testWageQuery();
