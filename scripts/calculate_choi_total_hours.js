const { createClient } = require('@supabase/supabase-js');

// Supabase 설정
const supabaseUrl = 'https://cgscbtxtgualkfalouwh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8';
const supabase = createClient(supabaseUrl, supabaseKey);

async function calculateTotalHours() {
  try {
    console.log('📊 최형호 8월 총 근무시간 계산 중...');

    // 최형호 직원 ID 조회
    const { data: employees, error: employeeError } = await supabase
      .from('employees')
      .select('id, name, employee_id')
      .eq('name', '최형호');

    if (employeeError) {
      console.error('❌ 직원 조회 오류:', employeeError);
      return;
    }

    const choiEmployee = employees[0];

    // 8월 전체 스케줄 조회
    const { data: schedules, error: scheduleError } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', choiEmployee.id)
      .gte('schedule_date', '2025-08-01')
      .lte('schedule_date', '2025-08-31')
      .order('schedule_date', { ascending: true });

    if (scheduleError) {
      console.error('❌ 스케줄 조회 오류:', scheduleError);
      return;
    }

    // 일별 근무시간 계산
    const dailyHours = {};
    let totalHours = 0;

    schedules.forEach(schedule => {
      const date = schedule.schedule_date;
      const start = new Date(`${date} ${schedule.scheduled_start}`);
      const end = new Date(`${date} ${schedule.scheduled_end}`);
      const hours = (end - start) / (1000 * 60 * 60);
      
      if (!dailyHours[date]) {
        dailyHours[date] = 0;
      }
      dailyHours[date] += hours;
      totalHours += hours;
    });

    console.log('\n📋 일별 근무시간:');
    console.log('=' .repeat(50));

    Object.keys(dailyHours).sort().forEach(date => {
      const dayOfWeek = new Date(date).toLocaleDateString('ko-KR', { weekday: 'short' });
      console.log(`${date} (${dayOfWeek}): ${dailyHours[date]}시간`);
    });

    console.log('=' .repeat(50));
    console.log(`📊 총 근무시간: ${totalHours}시간`);
    console.log(`📊 총 근무일수: ${Object.keys(dailyHours).length}일`);
    console.log(`📊 평균 일일 근무시간: ${(totalHours / Object.keys(dailyHours).length).toFixed(1)}시간`);

    // 시급별 계산
    const hourlyWage1 = 13000; // 8월 1일~7일
    const hourlyWage2 = 12000; // 8월 8일~31일
    
    let totalWage = 0;
    let wage1Hours = 0;
    let wage2Hours = 0;

    Object.keys(dailyHours).forEach(date => {
      const day = parseInt(date.split('-')[2]);
      const hours = dailyHours[date];
      
      if (day <= 7) {
        totalWage += hours * hourlyWage1;
        wage1Hours += hours;
      } else {
        totalWage += hours * hourlyWage2;
        wage2Hours += hours;
      }
    });

    console.log('\n💰 급여 계산:');
    console.log('=' .repeat(50));
    console.log(`8월 1일~7일: ${wage1Hours}시간 × ${hourlyWage1.toLocaleString()}원 = ${(wage1Hours * hourlyWage1).toLocaleString()}원`);
    console.log(`8월 8일~31일: ${wage2Hours}시간 × ${hourlyWage2.toLocaleString()}원 = ${(wage2Hours * hourlyWage2).toLocaleString()}원`);
    console.log(`총 급여: ${totalWage.toLocaleString()}원`);
    
    const taxAmount = Math.round(totalWage * 0.033);
    const netSalary = totalWage - taxAmount;
    console.log(`세금 (3.3%): -${taxAmount.toLocaleString()}원`);
    console.log(`실수령액: ${netSalary.toLocaleString()}원`);

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

calculateTotalHours();
