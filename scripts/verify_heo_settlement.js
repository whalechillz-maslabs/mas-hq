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

async function verifyHeoSettlement() {
  try {
    console.log('🔍 허상원 정산 정확성 검증 시작');
    
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
    
    // 2. 허상원 8월 스케줄 데이터 조회
    const { data: schedules, error: scheduleError } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', heoEmployee.id)
      .gte('schedule_date', '2025-08-01')
      .lte('schedule_date', '2025-08-31')
      .order('schedule_date', { ascending: true });
    
    if (scheduleError) {
      console.error('❌ 허상원 스케줄 조회 실패:', scheduleError);
      return;
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
    
    console.log('📊 검증 데이터:');
    console.log('  - 총 스케줄 수:', schedules.length);
    console.log('  - 시급 버전 수:', wages.length);
    
    // 4. 정산 계산 검증
    let totalHours = 0;
    let totalAmount = 0;
    const dailyBreakdown = {};
    
    schedules.forEach(schedule => {
      const scheduleDate = new Date(schedule.schedule_date);
      const currentWage = wages.find(wage => 
        new Date(wage.effective_start_date) <= scheduleDate &&
        (!wage.effective_end_date || new Date(wage.effective_end_date) >= scheduleDate)
      );
      
      if (currentWage) {
        const dailyAmount = schedule.total_hours * currentWage.base_wage;
        totalHours += schedule.total_hours;
        totalAmount += dailyAmount;
        
        // 일별 집계
        if (!dailyBreakdown[schedule.schedule_date]) {
          dailyBreakdown[schedule.schedule_date] = {
            hours: 0,
            amount: 0,
            hourlyRate: currentWage.base_wage
          };
        }
        dailyBreakdown[schedule.schedule_date].hours += schedule.total_hours;
        dailyBreakdown[schedule.schedule_date].amount += dailyAmount;
      }
    });
    
    console.log('📅 일별 집계:');
    Object.keys(dailyBreakdown).sort().forEach(date => {
      const day = dailyBreakdown[date];
      console.log(`  ${date}: ${day.hours}시간 × ${day.hourlyRate.toLocaleString()}원 = ${day.amount.toLocaleString()}원`);
    });
    
    console.log('💵 정산 검증 결과:');
    console.log(`  - 총 근무시간: ${totalHours}시간`);
    console.log(`  - 총 금액: ${totalAmount.toLocaleString()}원`);
    console.log(`  - 평균 시급: ${(totalAmount / totalHours).toLocaleString()}원/시간`);
    
    // 5. 기존 정산 데이터와 비교
    const { data: existingPayslips, error: payslipError } = await supabase
      .from('payslips')
      .select('*')
      .eq('employee_id', heoEmployee.id)
      .order('created_at', { ascending: false });
    
    if (payslipError) {
      console.log('⚠️ 기존 정산 데이터 조회 실패 (무시):', payslipError.message);
    } else {
      console.log('📋 기존 정산 데이터:');
      existingPayslips.forEach((payslip, index) => {
        console.log(`  ${index + 1}. ${payslip.period}: ${payslip.net_salary?.toLocaleString()}원 (${payslip.created_at})`);
      });
    }
    
    // 6. 검증 결과
    console.log('✅ 검증 완료:');
    console.log(`  - 계산된 총 금액: ${totalAmount.toLocaleString()}원`);
    console.log(`  - 계산된 총 시간: ${totalHours}시간`);
    console.log(`  - 시급 적용: 13,000원/시간 (8월 11일부터)`);
    
    // 7. 정확성 체크
    const expectedHourlyRate = 13000;
    const calculatedHourlyRate = totalAmount / totalHours;
    const rateDifference = Math.abs(calculatedHourlyRate - expectedHourlyRate);
    
    if (rateDifference < 0.01) {
      console.log('✅ 시급 계산 정확성 검증 통과');
    } else {
      console.log('⚠️ 시급 계산에 차이가 있습니다:');
      console.log(`  - 예상 시급: ${expectedHourlyRate.toLocaleString()}원`);
      console.log(`  - 계산된 시급: ${calculatedHourlyRate.toLocaleString()}원`);
      console.log(`  - 차이: ${rateDifference.toLocaleString()}원`);
    }
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

verifyHeoSettlement();
