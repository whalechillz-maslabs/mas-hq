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

async function fixHeoWagePeriods() {
  try {
    console.log('🔧 허상원 시급 기간 수정 시작');
    
    // 허상원 직원 정보
    const { data: heoEmployee } = await supabase
      .from('employees')
      .select('*')
      .eq('name', '허상원')
      .single();
    
    // 현재 시급 정보 조회
    const { data: wages } = await supabase
      .from('hourly_wages')
      .select('*')
      .eq('employee_id', heoEmployee.id)
      .order('effective_start_date');
    
    console.log('\n📊 수정 전 시급 정보:');
    wages.forEach((wage, index) => {
      console.log(`  ${index + 1}. ${wage.base_wage}원 (${wage.effective_start_date} ~ ${wage.effective_end_date || '현재'})`);
    });
    
    // 12,000원 시급의 종료일을 2025-06-22로 설정
    const { error: updateError } = await supabase
      .from('hourly_wages')
      .update({ 
        effective_end_date: '2025-06-22',
        updated_at: new Date().toISOString()
      })
      .eq('employee_id', heoEmployee.id)
      .eq('base_wage', 12000);
    
    if (updateError) {
      console.error('❌ 시급 기간 수정 실패:', updateError);
      return;
    }
    
    console.log('✅ 12,000원 시급 종료일을 2025-06-22로 설정 완료');
    
    // 수정된 시급 정보 조회
    const { data: updatedWages } = await supabase
      .from('hourly_wages')
      .select('*')
      .eq('employee_id', heoEmployee.id)
      .order('effective_start_date');
    
    console.log('\n📊 수정 후 시급 정보:');
    updatedWages.forEach((wage, index) => {
      console.log(`  ${index + 1}. ${wage.base_wage}원 (${wage.effective_start_date} ~ ${wage.effective_end_date || '현재'})`);
    });
    
    // 9월 시급 적용 테스트
    console.log('\n📅 9월 시급 적용 테스트:');
    const testDates = ['2025-09-01', '2025-09-08', '2025-09-15'];
    testDates.forEach(date => {
      const scheduleDate = new Date(date);
      
      const applicableWages = updatedWages.filter(wage => 
        new Date(wage.effective_start_date) <= scheduleDate &&
        (!wage.effective_end_date || new Date(wage.effective_end_date) >= scheduleDate)
      );
      
      const applicableWage = applicableWages.length > 0 
        ? applicableWages.reduce((latest, current) => 
            new Date(current.effective_start_date) > new Date(latest.effective_start_date) ? current : latest
          )
        : updatedWages[0];
      
      console.log(`  ${date}: ${applicableWage.base_wage}원`);
    });
    
  } catch (error) {
    console.error('❌ 오류:', error);
  }
}

fixHeoWagePeriods();
