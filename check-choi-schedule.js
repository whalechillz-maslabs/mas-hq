const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkwNjczNiwiZXhwIjoyMDcwNDgyNzM2fQ.EKXlFrz2tLsAa-B4h-OGct2O1zODSMGuGp8nMZta4go'
);

async function checkChoiSchedule() {
  console.log('=== 최형호 8월 스케줄 확인 ===');
  
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
  
  console.log('직원:', employee.name, employee.id);
  
  // 8월 스케줄 조회
  const { data: schedules } = await supabase
    .from('schedules')
    .select('schedule_date, total_hours')
    .eq('employee_id', employee.id)
    .gte('schedule_date', '2025-08-01')
    .lte('schedule_date', '2025-08-31')
    .order('schedule_date');
    
  console.log('8월 스케줄:', schedules?.length || 0, '건');
  
  // 주별로 그룹화
  const weeklyData = {};
  schedules?.forEach(schedule => {
    const date = new Date(schedule.schedule_date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay()); // 일요일을 주의 시작으로
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = { hours: 0, days: 0, dates: [] };
    }
    weeklyData[weekKey].hours += schedule.total_hours;
    weeklyData[weekKey].days += 1;
    weeklyData[weekKey].dates.push(schedule.schedule_date);
  });
  
  console.log('\n=== 주별 근무 분석 ===');
  Object.entries(weeklyData).forEach(([weekKey, data]) => {
    const weekStart = new Date(weekKey);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    console.log(`${weekStart.toLocaleDateString()} ~ ${weekEnd.toLocaleDateString()}`);
    console.log(`  근무일: ${data.days}일, 근무시간: ${data.hours}시간`);
    console.log(`  근무일자: ${data.dates.join(', ')}`);
    console.log(`  주휴수당 대상: ${data.days >= 5 ? '✅' : '❌'}`);
    console.log('');
  });
  
  // 현재 급여명세서 확인
  const { data: payslip } = await supabase
    .from('payslips')
    .select('*')
    .eq('employee_id', employee.id)
    .eq('period', '2025-08')
    .single();
    
  if (payslip) {
    console.log('=== 현재 급여명세서 ===');
    console.log('주휴수당:', payslip.weekly_holiday_pay, '원');
    console.log('기본급:', payslip.base_salary, '원');
    console.log('식대:', payslip.meal_allowance, '원');
  }
}

checkChoiSchedule().catch(console.error);
