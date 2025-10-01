const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjczNiwiZXhwIjoyMDcwNDgyNzM2fQ.EKXlFrz2tLsAa-B4h-OGct2O1zODSMGuGp8nMZta4go'
);

async function testWeeklyHolidayFix() {
  console.log('=== 수정된 주휴수당 계산 로직 테스트 ===');
  
  // 최형호 직원 ID 조회
  const { data: employee } = await supabase
    .from('employees')
    .select('id, name')
    .eq('name', '최형호')
    .single();
    
  if (!employee) {
    console.log('최형호 직원을 찾을 수 없습니다.');
    return;
  }
  
  // 8월 스케줄 조회
  const { data: schedules } = await supabase
    .from('schedules')
    .select('schedule_date, total_hours')
    .eq('employee_id', employee.id)
    .gte('schedule_date', '2025-08-01')
    .lte('schedule_date', '2025-08-31')
    .order('schedule_date');
    
  // 일별 근무시간 계산 (기존 로직)
  const dailyHours = {};
  schedules?.forEach(schedule => {
    const date = schedule.schedule_date;
    dailyHours[date] = (dailyHours[date] || 0) + schedule.total_hours;
  });
  
  console.log('일별 근무시간:', dailyHours);
  
  // 수정된 주별 계산 로직
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
    
    // 고유한 날짜만 카운트 (중복 방지)
    if (!weeklyData[weekKey].dates.includes(date)) {
      weeklyData[weekKey].dates.push(date);
      weeklyData[weekKey].days += 1;
    }
  });
  
  console.log('\n=== 수정된 주별 근무 분석 ===');
  let totalWeeklyHolidayPay = 0;
  const hourlyRate = 12000; // 최형호의 시급
  
  Object.entries(weeklyData).forEach(([weekKey, data]) => {
    const weekStart = new Date(weekKey);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    console.log(`${weekStart.toLocaleDateString()} ~ ${weekEnd.toLocaleDateString()}`);
    console.log(`  근무일: ${data.days}일, 근무시간: ${data.hours}시간`);
    console.log(`  근무일자: ${data.dates.join(', ')}`);
    
    const isEligible = data.days >= 5;
    console.log(`  주휴수당 대상: ${isEligible ? '✅' : '❌'}`);
    
    if (isEligible) {
      const weeklyHolidayAmount = 7 * hourlyRate; // 7시간 × 시급
      totalWeeklyHolidayPay += weeklyHolidayAmount;
      console.log(`  주휴수당: ${weeklyHolidayAmount.toLocaleString()}원`);
    }
    console.log('');
  });
  
  console.log(`총 주휴수당: ${totalWeeklyHolidayPay.toLocaleString()}원`);
  
  // 현재 급여명세서와 비교
  const { data: payslip } = await supabase
    .from('payslips')
    .select('weekly_holiday_pay')
    .eq('employee_id', employee.id)
    .eq('period', '2025-08')
    .single();
    
  if (payslip) {
    console.log(`현재 DB 주휴수당: ${payslip.weekly_holiday_pay.toLocaleString()}원`);
    console.log(`차이: ${(totalWeeklyHolidayPay - payslip.weekly_holiday_pay).toLocaleString()}원`);
  }
}

testWeeklyHolidayFix().catch(console.error);
