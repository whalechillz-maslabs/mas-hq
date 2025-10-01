const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjczNiwiZXhwIjoyMDcwNDgyNzM2fQ.EKXlFrz2tLsAa-B4h-OGct2O1zODSMGuGp8nMZta4go'
);

async function regeneratePayslipWithDailyDetails() {
  console.log('=== 최형호 8월 급여명세서 daily_details 포함하여 재생성 ===');
  
  // 최형호 직원 정보 조회
  const { data: employee } = await supabase
    .from('employees')
    .select('*')
    .eq('name', '최형호')
    .single();
    
  if (!employee) {
    console.log('최형호 직원을 찾을 수 없습니다.');
    return;
  }
  
  console.log('직원 정보:', employee.name, employee.employee_id);
  
  // 기존 8월 급여명세서 삭제
  const { error: deleteError } = await supabase
    .from('payslips')
    .delete()
    .eq('employee_id', employee.id)
    .eq('period', '2025-08');
    
  if (deleteError) {
    console.log('기존 급여명세서 삭제 오류:', deleteError);
    return;
  }
  
  console.log('기존 8월 급여명세서 삭제 완료');
  
  // 8월 스케줄 조회
  const { data: schedules } = await supabase
    .from('schedules')
    .select('*')
    .eq('employee_id', employee.id)
    .gte('schedule_date', '2025-08-01')
    .lte('schedule_date', '2025-08-31')
    .order('schedule_date');
    
  console.log('8월 스케줄 건수:', schedules?.length || 0);
  
  // 시급 정보 조회
  const { data: wages } = await supabase
    .from('hourly_wages')
    .select('*')
    .eq('employee_id', employee.id)
    .order('effective_start_date');
    
  console.log('시급 정보 건수:', wages?.length || 0);
  
  if (!schedules || schedules.length === 0) {
    console.log('8월 스케줄이 없습니다.');
    return;
  }
  
  // 일별 근무시간 계산
  const dailyHours = {};
  schedules.forEach(schedule => {
    const date = schedule.schedule_date;
    dailyHours[date] = (dailyHours[date] || 0) + (schedule.total_hours || 0);
  });
  
  console.log('일별 근무시간:', dailyHours);
  
  // 식대 계산 (3시간 이상 근무한 날)
  const mealAllowanceDays = Object.values(dailyHours).filter(hours => hours >= 3).length;
  const mealAllowance = mealAllowanceDays * 7000;
  
  console.log('식대 대상일수:', mealAllowanceDays);
  console.log('식대 금액:', mealAllowance);
  
  // 총 근무시간 및 총 임금 계산
  let totalHours = 0;
  let totalWage = 0;
  
  Object.entries(dailyHours).forEach(([date, hours]) => {
    totalHours += hours;
    
    // 해당 날짜에 적용되는 시급 찾기
    const applicableWage = wages?.find(wage => {
      const startDate = new Date(wage.effective_start_date);
      const endDate = wage.effective_end_date ? new Date(wage.effective_end_date) : new Date('2099-12-31');
      const scheduleDate = new Date(date);
      return scheduleDate >= startDate && scheduleDate <= endDate;
    });
    
    if (applicableWage) {
      totalWage += hours * applicableWage.base_wage;
    } else {
      // 시급 정보가 없으면 기본 시급 사용
      totalWage += hours * 12000;
    }
  });
  
  console.log('총 근무시간:', totalHours);
  console.log('총 임금:', totalWage);
  
  // 주휴수당 계산 (주별로 5일 이상 근무한 주)
  const weeklyData = {};
  
  Object.keys(dailyHours).forEach(date => {
    const dateObj = new Date(date);
    const weekStart = new Date(dateObj);
    weekStart.setDate(dateObj.getDate() - dateObj.getDay()); // 일요일을 주의 시작으로
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = { hours: 0, days: 0, dates: [] };
    }
    weeklyData[weekKey].hours += dailyHours[date];
    
    // 고유한 날짜만 카운트
    if (!weeklyData[weekKey].dates.includes(date)) {
      weeklyData[weekKey].dates.push(date);
      weeklyData[weekKey].days += 1;
    }
  });
  
  let weeklyHolidayPay = 0;
  let weeklyHolidayCalculation = '';
  
  // 최신 시급
  const latestHourlyRate = wages && wages.length > 0 ? wages[wages.length - 1].base_wage : 12000;
  
  Object.entries(weeklyData).forEach(([weekKey, data]) => {
    if (data.days >= 5) {
      // 해당 주의 평균 일일 임금 계산
      const averageDailyHours = data.hours / data.days;
      const weeklyHolidayAmount = Math.round(averageDailyHours * latestHourlyRate);
      weeklyHolidayPay += weeklyHolidayAmount;
      
      const weekNumber = Object.keys(weeklyData).indexOf(weekKey) + 1;
      weeklyHolidayCalculation += `${weekNumber}주차: ${data.hours}시간 (${data.days}일 근무) → 평균 ${averageDailyHours.toFixed(1)}시간/일 × ${latestHourlyRate.toLocaleString()}원 = ${weeklyHolidayAmount.toLocaleString()}원\n`;
    }
  });
  
  console.log('주휴수당:', weeklyHolidayPay);
  console.log('주휴수당 산출식:', weeklyHolidayCalculation);
  
  // 총 지급액 계산
  const totalEarnings = totalWage + weeklyHolidayPay + mealAllowance;
  
  // 세금 계산 (3.3% 사업소득세 - 식대는 비과세)
  const taxableAmount = totalWage + weeklyHolidayPay;
  const taxAmount = Math.round(taxableAmount * 0.033);
  const netSalary = totalEarnings - taxAmount;
  
  console.log('총 지급액:', totalEarnings);
  console.log('세금:', taxAmount);
  console.log('실수령액:', netSalary);
  
  // 일별 상세 내역 생성
  const dailyDetails = Object.entries(dailyHours).map(([date, hours]) => {
    // 해당 날짜에 적용되는 시급 찾기
    const applicableWage = wages?.find(wage => {
      const startDate = new Date(wage.effective_start_date);
      const endDate = wage.effective_end_date ? new Date(wage.effective_end_date) : new Date('2099-12-31');
      const scheduleDate = new Date(date);
      return scheduleDate >= startDate && scheduleDate <= endDate;
    });
    
    const hourlyRate = applicableWage ? applicableWage.base_wage : 12000;
    const dailyWage = hours * hourlyRate;
    
    return {
      date,
      hours,
      daily_wage: dailyWage,
      hourly_rate: hourlyRate
    };
  });
  
  console.log('일별 상세 내역:', dailyDetails);
  
  // 급여명세서 생성
  const payslip = {
    employee_id: employee.id,
    period: '2025-08',
    employment_type: 'part_time',
    base_salary: totalWage,
    overtime_pay: 0,
    weekly_holiday_pay: weeklyHolidayPay,
    incentive: 0,
    point_bonus: 0,
    meal_allowance: mealAllowance,
    total_earnings: totalEarnings,
    tax_amount: taxAmount,
    net_salary: netSalary,
    status: 'issued',
    total_hours: totalHours,
    hourly_rate: latestHourlyRate,
    daily_details: dailyDetails
  };
  
  console.log('생성할 급여명세서:', payslip);
  
  // 데이터베이스에 저장
  const { data: newPayslip, error: insertError } = await supabase
    .from('payslips')
    .insert([payslip])
    .select()
    .single();
    
  if (insertError) {
    console.log('급여명세서 저장 오류:', insertError);
    return;
  }
  
  console.log('✅ 최형호 8월 급여명세서 재생성 완료!');
  console.log('ID:', newPayslip.id);
  console.log('주휴수당:', newPayslip.weekly_holiday_pay);
  console.log('식대:', newPayslip.meal_allowance);
  console.log('총 지급액:', newPayslip.total_earnings);
  console.log('총 근무시간:', newPayslip.total_hours);
  console.log('시급:', newPayslip.hourly_rate);
  console.log('일별 상세 내역 건수:', newPayslip.daily_details?.length || 0);
}

regeneratePayslipWithDailyDetails().catch(console.error);
