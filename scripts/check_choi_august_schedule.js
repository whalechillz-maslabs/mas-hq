const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cgscbtxtgualkfalouwh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkChoiAugustSchedule() {
  try {
    console.log('최형호 8월 스케줄 확인 중...');
    
    // 최형호 직원 ID 찾기
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, name, employee_id')
      .eq('name', '최형호');
    
    if (empError) {
      console.error('직원 조회 오류:', empError);
      return;
    }
    
    if (!employees || employees.length === 0) {
      console.error('최형호 직원을 찾을 수 없습니다.');
      return;
    }
    
    const choiEmployee = employees[0];
    console.log(`최형호 직원 ID: ${choiEmployee.id} (${choiEmployee.employee_id})`);
    
    // 8월 스케줄 조회
    const { data: schedules, error: scheduleError } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', choiEmployee.id)
      .gte('schedule_date', '2025-08-01')
      .lte('schedule_date', '2025-08-31')
      .order('schedule_date', { ascending: true });
    
    if (scheduleError) {
      console.error('스케줄 조회 오류:', scheduleError);
      return;
    }
    
    console.log(`\n8월 총 스케줄 수: ${schedules.length}개`);
    
    // 일별 근무 시간 계산
    const dailyHours = {};
    let totalHours = 0;
    
    schedules.forEach(schedule => {
      const date = schedule.schedule_date;
      const startTime = schedule.scheduled_start;
      const endTime = schedule.scheduled_end;
      
      if (!dailyHours[date]) {
        dailyHours[date] = 0;
      }
      
      // 시간 계산 (간단한 예시)
      const start = new Date(`2025-08-01 ${startTime}`);
      const end = new Date(`2025-08-01 ${endTime}`);
      const hours = (end - start) / (1000 * 60 * 60);
      
      dailyHours[date] += hours;
      totalHours += hours;
    });
    
    console.log('\n=== 일별 근무 시간 ===');
    Object.keys(dailyHours).sort().forEach(date => {
      console.log(`${date}: ${dailyHours[date].toFixed(1)}시간`);
    });
    
    console.log(`\n=== 8월 총 근무 시간: ${totalHours.toFixed(1)}시간 ===`);
    
    // 시급별 계산
    const hourlyWage1 = 13000; // 8월 1일~7일
    const hourlyWage2 = 12000; // 8월 8일~29일
    
    let totalWage = 0;
    
    Object.keys(dailyHours).forEach(date => {
      const day = parseInt(date.split('-')[2]);
      const hours = dailyHours[date];
      const wage = day <= 7 ? hourlyWage1 : hourlyWage2;
      const dayWage = hours * wage;
      totalWage += dayWage;
      
      console.log(`${date}: ${hours.toFixed(1)}시간 × ${wage.toLocaleString()}원 = ${dayWage.toLocaleString()}원`);
    });
    
    console.log(`\n=== 8월 총 급여: ${totalWage.toLocaleString()}원 ===`);
    
  } catch (error) {
    console.error('오류 발생:', error);
  }
}

checkChoiAugustSchedule();
