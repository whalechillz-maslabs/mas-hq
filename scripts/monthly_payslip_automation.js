const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// 월별 자동 급여 명세서 생성 시스템
async function monthlyPayslipAutomation() {
  console.log('📅 월별 자동 급여 명세서 생성 시스템 시작...');
  
  try {
    // 1. 현재 날짜 기준으로 지난 달 급여 명세서 생성
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const year = lastMonth.getFullYear();
    const month = lastMonth.getMonth() + 1;
    const period = `${year}-${month.toString().padStart(2, '0')}`;
    
    console.log(`📋 처리 대상: ${year}년 ${month}월 (${period})`);
    
    // 2. 모든 직원 조회
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, name, employee_id, employment_type, user_meta')
      .eq('status', 'active');
      
    if (empError) {
      console.error('직원 목록 조회 실패:', empError);
      return;
    }
    
    console.log(`👥 처리할 직원: ${employees?.length || 0}명`);
    
    // 3. 각 직원별로 급여 명세서 생성
    for (const employee of employees || []) {
      console.log(`\n👤 ${employee.name} (${employee.employee_id}) 처리 중...`);
      
      // 기존 급여 명세서 확인
      const { data: existingPayslip, error: checkError } = await supabase
        .from('payslips')
        .select('*')
        .eq('employee_id', employee.id)
        .eq('period', period)
        .single();
        
      if (checkError && checkError.code !== 'PGRST116') {
        console.error(`❌ ${employee.name} 급여 명세서 확인 실패:`, checkError);
        continue;
      }
      
      if (existingPayslip) {
        console.log(`⏭️ ${employee.name} ${period} 급여 명세서가 이미 존재합니다. (상태: ${existingPayslip.status})`);
        continue;
      }
      
      // 급여 명세서 생성 로직
      if (employee.employment_type === 'part_time') {
        await generatePartTimePayslip(employee, year, month, period);
      } else if (employee.employment_type === 'full_time') {
        await generateFullTimePayslip(employee, year, month, period);
      }
    }
    
    console.log('\n🎉 월별 자동 급여 명세서 생성 완료!');
    
  } catch (error) {
    console.error('월별 자동 급여 명세서 생성 중 오류:', error);
  }
}

// 시간제 직원 급여 명세서 생성
async function generatePartTimePayslip(employee, year, month, period) {
  try {
    // 해당 월의 완료된 스케줄 조회
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    
    const { data: schedules, error: scheduleError } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', employee.id)
      .gte('schedule_date', startDate)
      .lte('schedule_date', endDate)
      .eq('status', 'completed')
      .order('schedule_date');
      
    if (scheduleError) {
      console.error(`❌ ${employee.name} 스케줄 조회 실패:`, scheduleError);
      return;
    }
    
    if (!schedules || schedules.length === 0) {
      console.log(`⚠️ ${employee.name} ${period} 완료된 스케줄이 없습니다.`);
      return;
    }
    
    // 나수진 특별 처리
    if (employee.name === '나수진') {
      await generateNaManagerPayslip(employee, year, month, period, schedules);
      return;
    }
    
    // 일반 시간제 직원 처리
    await generateGeneralPartTimePayslip(employee, year, month, period, schedules);
    
  } catch (error) {
    console.error(`${employee.name} 시간제 급여 명세서 생성 실패:`, error);
  }
}

// 나수진 특별 급여 명세서 생성
async function generateNaManagerPayslip(employee, year, month, period, schedules) {
  const workDays = schedules.length;
  const isNewSystem = month >= 10; // 10월부터 주 3회
  const baseSalary = isNewSystem ? 1200000 : 800000;
  const fuelAllowance = 200000;
  const mealAllowance = workDays * 7000;
  
  const totalEarnings = baseSalary + fuelAllowance + mealAllowance;
  const taxAmount = Math.round(totalEarnings * 0.033);
  const netSalary = totalEarnings - taxAmount;
  
  const dailyDetails = schedules.map(schedule => ({
    date: schedule.schedule_date,
    type: 'regular',
    amount: Math.round(baseSalary / workDays),
    meal_allowance: 7000,
    note: `${month}월 정규근무`
  }));
  
  const payslip = {
    employee_id: employee.id,
    period: period,
    employment_type: 'part_time',
    base_salary: baseSalary,
    overtime_pay: 0,
    incentive: fuelAllowance,
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
  
  const { error: insertError } = await supabase
    .from('payslips')
    .insert([payslip]);
    
  if (insertError) {
    console.error(`❌ ${employee.name} 급여 명세서 생성 실패:`, insertError);
    return;
  }
  
  console.log(`✅ ${employee.name} ${period} 급여 명세서 생성 완료`);
  console.log(`   💰 총 지급액: ${totalEarnings.toLocaleString()}원`);
  console.log(`   💰 실수령액: ${netSalary.toLocaleString()}원`);
}

// 일반 시간제 직원 급여 명세서 생성
async function generateGeneralPartTimePayslip(employee, year, month, period, schedules) {
  // 기본 시급 (user_meta에서 가져오거나 기본값 사용)
  const hourlyRate = employee.user_meta?.hourly_rate || 12000;
  
  let totalHours = 0;
  let totalWage = 0;
  const dailyDetails = [];
  
  schedules.forEach(schedule => {
    const start = new Date(`${schedule.schedule_date} ${schedule.scheduled_start}`);
    const end = new Date(`${schedule.schedule_date} ${schedule.scheduled_end}`);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const dailyWage = hours * hourlyRate;
    
    totalHours += hours;
    totalWage += dailyWage;
    
    dailyDetails.push({
      date: schedule.schedule_date,
      hours: hours,
      hourly_rate: hourlyRate,
      daily_wage: dailyWage
    });
  });
  
  const taxAmount = Math.round(totalWage * 0.033);
  const netSalary = totalWage - taxAmount;
  
  const payslip = {
    employee_id: employee.id,
    period: period,
    employment_type: 'part_time',
    base_salary: totalWage,
    overtime_pay: 0,
    incentive: 0,
    point_bonus: 0,
    meal_allowance: 0,
    total_earnings: totalWage,
    tax_amount: taxAmount,
    net_salary: netSalary,
    status: 'generated',
    total_hours: totalHours,
    hourly_rate: hourlyRate,
    daily_details: dailyDetails,
    issued_at: new Date().toISOString(),
    paid_at: null
  };
  
  const { error: insertError } = await supabase
    .from('payslips')
    .insert([payslip]);
    
  if (insertError) {
    console.error(`❌ ${employee.name} 급여 명세서 생성 실패:`, insertError);
    return;
  }
  
  console.log(`✅ ${employee.name} ${period} 급여 명세서 생성 완료`);
  console.log(`   💰 총 지급액: ${totalWage.toLocaleString()}원`);
  console.log(`   💰 실수령액: ${netSalary.toLocaleString()}원`);
}

// 정규직 직원 급여 명세서 생성
async function generateFullTimePayslip(employee, year, month, period) {
  // 정규직 급여 명세서 생성 로직
  console.log(`📋 ${employee.name} 정규직 급여 명세서 생성 (구현 예정)`);
}

// 스크립트 실행
monthlyPayslipAutomation().catch(console.error);
