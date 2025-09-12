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

async function checkHeoSchedule() {
  try {
    console.log('🔍 허상원 스케줄 및 정산 데이터 확인 시작');
    
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
    
    console.log('👤 허상원 직원 정보:', heoEmployee);
    
    // 2. 허상원 스케줄 데이터 조회 (모든 컬럼 확인)
    const { data: schedules, error: scheduleError } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', heoEmployee.id)
      .limit(5);
    
    if (scheduleError) {
      console.error('❌ 허상원 스케줄 조회 실패:', scheduleError);
      return;
    }
    
    console.log('📅 허상원 스케줄 데이터:');
    if (schedules.length > 0) {
      console.log('  실제 컬럼들:', Object.keys(schedules[0]));
      schedules.forEach((schedule, index) => {
        console.log(`  ${index + 1}.`, schedule);
      });
    } else {
      console.log('  스케줄 데이터가 없습니다.');
    }
    
    // 3. 허상원 시급 데이터 조회
    const { data: wages, error: wageError } = await supabase
      .from('hourly_wages')
      .select('*')
      .eq('employee_id', heoEmployee.id)
      .order('effective_start_date', { ascending: false });
    
    if (wageError) {
      console.error('❌ 허상원 시급 데이터 조회 실패:', wageError);
      return;
    }
    
    console.log('💰 허상원 시급 데이터:');
    wages.forEach((wage, index) => {
      console.log(`  ${index + 1}. ${wage.effective_start_date}부터: ${wage.base_wage}원/시간`);
      console.log(`     - 초과근무: ${wage.overtime_multiplier}배`);
      console.log(`     - 야간근무: ${wage.night_multiplier}배`);
      console.log(`     - 휴일근무: ${wage.holiday_multiplier}배`);
    });
    
    // 4. 8월 스케줄로 정산 계산 테스트
    const augustSchedules = schedules.filter(schedule => 
      schedule.schedule_date.startsWith('2025-08')
    );
    
    console.log('📊 8월 스케줄 정산 계산:');
    let totalHours = 0;
    let totalAmount = 0;
    
    augustSchedules.forEach(schedule => {
      const scheduleDate = new Date(schedule.schedule_date);
      const currentWage = wages.find(wage => 
        new Date(wage.effective_start_date) <= scheduleDate &&
        (!wage.effective_end_date || new Date(wage.effective_end_date) >= scheduleDate)
      );
      
      if (currentWage) {
        const dailyAmount = schedule.total_hours * currentWage.base_wage;
        totalHours += schedule.total_hours;
        totalAmount += dailyAmount;
        
        console.log(`  ${schedule.schedule_date}: ${schedule.total_hours}시간 × ${currentWage.base_wage}원 = ${dailyAmount.toLocaleString()}원`);
        console.log(`    - 시간: ${schedule.scheduled_start} ~ ${schedule.scheduled_end}`);
        console.log(`    - 노트: ${schedule.employee_note}`);
      }
    });
    
    console.log('💵 정산 요약:');
    console.log(`  - 총 근무시간: ${totalHours}시간`);
    console.log(`  - 총 금액: ${totalAmount.toLocaleString()}원`);
    
    // 5. 기존 정산 데이터 확인
    const { data: settlements, error: settlementError } = await supabase
      .from('payslips')
      .select('*')
      .eq('employee_id', heoEmployee.id)
      .order('created_at', { ascending: false });
    
    if (settlementError) {
      console.log('⚠️ 정산 데이터 조회 실패 (무시):', settlementError.message);
    } else {
      console.log('📋 기존 정산 데이터:');
      settlements.forEach((settlement, index) => {
        console.log(`  ${index + 1}. ${settlement.period}: ${settlement.net_salary?.toLocaleString()}원 (${settlement.created_at})`);
      });
    }
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

checkHeoSchedule();