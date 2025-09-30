const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// 나수진 급여 설정
const NA_MANAGER_CONFIG = {
  employeeName: '나수진',
  baseDailyWage: 100000,      // 기본 일당
  fuelAllowance: 200000,      // 주유대
  mealAllowanceRate: 7000,    // 식대/일
  workDaysPerWeek: 2,         // 주 2회 (4월~9월)
  workDaysPerWeekNew: 3,      // 주 3회 (10월~)
  changeDate: '2025-10-01'    // 변경일
};

async function autoGenerateNaManagerPayslips() {
  console.log('🤖 나수진 자동 급여 명세서 생성 시스템 시작...');
  
  try {
    // 1. 나수진 직원 정보 조회
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, name, employee_id, user_meta')
      .eq('name', NA_MANAGER_CONFIG.employeeName);
      
    if (empError || !employees || employees.length === 0) {
      console.log('❌ 나수진 직원을 찾을 수 없습니다.');
      return;
    }
    
    const naManager = employees[0];
    console.log('✅ 나수진 직원 정보:', naManager.name, naManager.employee_id);
    
    // 2. 현재 날짜 기준으로 처리할 월 계산
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    // 지난 달부터 현재 달까지 처리
    const monthsToProcess = [];
    for (let i = 1; i <= currentMonth; i++) {
      monthsToProcess.push({
        year: currentYear,
        month: i,
        period: `${currentYear}-${i.toString().padStart(2, '0')}`
      });
    }
    
    console.log(`📅 처리할 월: ${monthsToProcess.length}개월`);
    
    // 3. 각 월별로 급여 명세서 생성
    for (const monthInfo of monthsToProcess) {
      console.log(`\n📋 ${monthInfo.period} 급여 명세서 처리 중...`);
      
      // 기존 급여 명세서 확인
      const { data: existingPayslip, error: checkError } = await supabase
        .from('payslips')
        .select('*')
        .eq('employee_id', naManager.id)
        .eq('period', monthInfo.period)
        .single();
        
      if (checkError && checkError.code !== 'PGRST116') {
        console.error(`❌ ${monthInfo.period} 급여 명세서 확인 실패:`, checkError);
        continue;
      }
      
      if (existingPayslip) {
        console.log(`⏭️ ${monthInfo.period} 급여 명세서가 이미 존재합니다. (상태: ${existingPayslip.status})`);
        continue;
      }
      
      // 해당 월의 스케줄 조회
      const startDate = `${monthInfo.year}-${monthInfo.month.toString().padStart(2, '0')}-01`;
      const endDate = new Date(monthInfo.year, monthInfo.month, 0).toISOString().split('T')[0];
      
      const { data: schedules, error: scheduleError } = await supabase
        .from('schedules')
        .select('*')
        .eq('employee_id', naManager.id)
        .gte('schedule_date', startDate)
        .lte('schedule_date', endDate)
        .eq('status', 'completed')
        .order('schedule_date');
        
      if (scheduleError) {
        console.error(`❌ ${monthInfo.period} 스케줄 조회 실패:`, scheduleError);
        continue;
      }
      
      if (!schedules || schedules.length === 0) {
        console.log(`⚠️ ${monthInfo.period} 완료된 스케줄이 없습니다.`);
        continue;
      }
      
      // 급여 계산
      const workDays = schedules.length;
      const isNewSystem = monthInfo.month >= 10; // 10월부터 주 3회
      
      // 기본급 계산
      const baseSalary = isNewSystem ? 1200000 : 800000; // 10월부터 120만원
      const mealAllowance = workDays * NA_MANAGER_CONFIG.mealAllowanceRate;
      
      // 추가 근무 계산 (특정 날짜별 추가 근무)
      let additionalWork = 0;
      if (monthInfo.month === 7) {
        // 7월 7일, 21일 추가 근무
        const additionalDates = ['2025-07-07', '2025-07-21'];
        additionalWork = additionalDates.length * 100000; // 10만원씩
      } else if (monthInfo.month === 9) {
        // 9월 26일 추가 근무
        const additionalDates = ['2025-09-26'];
        additionalWork = additionalDates.length * 100000; // 10만원씩
      }
      
      const totalEarnings = baseSalary + NA_MANAGER_CONFIG.fuelAllowance + additionalWork + mealAllowance;
      const taxAmount = Math.round(totalEarnings * 0.033);
      const netSalary = totalEarnings - taxAmount;
      
      // 일별 상세 내역 생성
      const dailyDetails = schedules.map(schedule => ({
        date: schedule.schedule_date,
        type: 'regular',
        amount: Math.round(baseSalary / workDays),
        meal_allowance: NA_MANAGER_CONFIG.mealAllowanceRate,
        note: `${monthInfo.month}월 정규근무`
      }));
      
      // 급여 명세서 생성
      const payslip = {
        employee_id: naManager.id,
        period: monthInfo.period,
        employment_type: 'part_time',
        base_salary: baseSalary,
        overtime_pay: additionalWork,  // 추가 근무 (주휴수당 아님)
        incentive: NA_MANAGER_CONFIG.fuelAllowance,  // 주유대
        point_bonus: 0,
        meal_allowance: mealAllowance,
        total_earnings: totalEarnings,
        tax_amount: taxAmount,
        net_salary: netSalary,
        status: 'generated',
        total_hours: workDays * 6,
        hourly_rate: Math.round(baseSalary / (workDays * 6)),
        daily_details: dailyDetails,
        issued_at: new Date().toISOString(),
        paid_at: null
      };
      
      // 급여 명세서 저장
      const { error: insertError } = await supabase
        .from('payslips')
        .insert([payslip]);
        
      if (insertError) {
        console.error(`❌ ${monthInfo.period} 급여 명세서 생성 실패:`, insertError);
        continue;
      }
      
      console.log(`✅ ${monthInfo.period} 급여 명세서 생성 완료`);
      console.log(`   💰 기본근무: ${baseSalary.toLocaleString()}원`);
      console.log(`   ⛽ 주유대: ${NA_MANAGER_CONFIG.fuelAllowance.toLocaleString()}원`);
      console.log(`   🍽️ 식대: ${mealAllowance.toLocaleString()}원`);
      console.log(`   💵 총 지급액: ${totalEarnings.toLocaleString()}원`);
      console.log(`   💰 실수령액: ${netSalary.toLocaleString()}원`);
      console.log(`   📅 근무일수: ${workDays}일`);
    }
    
    console.log('\n🎉 나수진 자동 급여 명세서 생성 완료!');
    
  } catch (error) {
    console.error('자동 급여 명세서 생성 중 오류:', error);
  }
}

// 스크립트 실행
autoGenerateNaManagerPayslips().catch(console.error);
