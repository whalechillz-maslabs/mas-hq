const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

async function verifyChoiAugustHours() {
  try {
    console.log('=== 최형호 8월 근무시간 정확한 검증 ===');
    
    // 사용자가 제공한 정확한 근무시간 데이터
    const correctSchedule = [
      { date: '2025-08-01', start: '14:30', end: '15:30', hours: 1 },
      { date: '2025-08-04', start: '13:00', end: '17:00', hours: 4 },
      { date: '2025-08-08', start: '13:00', end: '16:30', hours: 3.5 },
      { date: '2025-08-11', start: '13:00', end: '17:00', hours: 4 },
      { date: '2025-08-13', start: '10:00', end: '17:00', hours: 6 },
      { date: '2025-08-14', start: '15:00', end: '17:00', hours: 2 },
      { date: '2025-08-18', start: '10:00', end: '17:00', hours: 6 },
      { date: '2025-08-20', start: '10:00', end: '17:00', hours: 6 },
      { date: '2025-08-22', start: '10:00', end: '17:00', hours: 6 },
      { date: '2025-08-25', start: '10:00', end: '17:00', hours: 6 },
      { date: '2025-08-26', start: '10:00', end: '18:00', hours: 7 },
      { date: '2025-08-27', start: '10:00', end: '17:00', hours: 6 },
      { date: '2025-08-28', start: '10:00', end: '17:00', hours: 6 },
      { date: '2025-08-29', start: '10:00', end: '17:00', hours: 6 }
    ];
    
    // 1. 최형호 정보 확인
    const { data: choiEmployee, error: empError } = await supabase
      .from('employees')
      .select('id, name, employee_id')
      .eq('name', '최형호')
      .single();
    
    if (empError) {
      console.error('직원 조회 오류:', empError);
      return;
    }
    
    console.log(`직원: ${choiEmployee.name} (${choiEmployee.employee_id})`);
    
    // 2. 데이터베이스의 실제 스케줄 조회
    const { data: dbSchedules, error: scheduleError } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', choiEmployee.id)
      .gte('schedule_date', '2025-08-01')
      .lte('schedule_date', '2025-08-31')
      .eq('status', 'approved')
      .order('schedule_date', { ascending: true });
    
    if (scheduleError) {
      console.error('스케줄 조회 오류:', scheduleError);
      return;
    }
    
    console.log(`\n데이터베이스 스케줄 수: ${dbSchedules.length}개`);
    
    // 3. 데이터베이스 스케줄을 일별로 그룹화
    const dbDailyHours = {};
    dbSchedules.forEach(schedule => {
      const date = schedule.schedule_date;
      const startTime = schedule.scheduled_start;
      const endTime = schedule.scheduled_end;
      
      if (!dbDailyHours[date]) {
        dbDailyHours[date] = [];
      }
      
      dbDailyHours[date].push({
        start: startTime,
        end: endTime,
        id: schedule.id
      });
    });
    
    // 4. 비교 및 검증
    console.log('\n=== 📊 근무시간 비교 검증 ===');
    console.log('날짜\t\t정확한 시간\tDB 시간\t\t차이\t상태');
    console.log('─'.repeat(80));
    
    let totalCorrectHours = 0;
    let totalDbHours = 0;
    let discrepancies = [];
    
    correctSchedule.forEach(correct => {
      const date = correct.date;
      const correctHours = correct.hours;
      const dbSchedulesForDate = dbDailyHours[date] || [];
      
      // DB에서 해당 날짜의 총 근무시간 계산
      let dbHours = 0;
      dbSchedulesForDate.forEach(schedule => {
        const start = new Date(`2025-08-01 ${schedule.start}`);
        const end = new Date(`2025-08-01 ${schedule.end}`);
        const hours = (end - start) / (1000 * 60 * 60);
        dbHours += hours;
      });
      
      const difference = Math.abs(correctHours - dbHours);
      const status = difference < 0.1 ? '✅' : '❌';
      
      console.log(`${date}\t${correctHours}시간\t\t${dbHours.toFixed(1)}시간\t\t${difference.toFixed(1)}\t${status}`);
      
      totalCorrectHours += correctHours;
      totalDbHours += dbHours;
      
      if (difference >= 0.1) {
        discrepancies.push({
          date,
          correct: correctHours,
          db: dbHours,
          difference
        });
      }
    });
    
    console.log('─'.repeat(80));
    console.log(`총합\t\t${totalCorrectHours}시간\t\t${totalDbHours.toFixed(1)}시간\t\t${Math.abs(totalCorrectHours - totalDbHours).toFixed(1)}`);
    
    // 5. 시급별 급여 계산 (정확한 시간 기준)
    console.log('\n=== 💰 정확한 급여 계산 ===');
    const hourlyWage1 = 13000; // 8월 1일~7일
    const hourlyWage2 = 12000; // 8월 8일~31일
    
    let totalWage = 0;
    
    correctSchedule.forEach(work => {
      const day = parseInt(work.date.split('-')[2]);
      const hours = work.hours;
      const wage = day <= 7 ? hourlyWage1 : hourlyWage2;
      const dayWage = hours * wage;
      totalWage += dayWage;
      
      console.log(`${work.date}: ${hours}시간 × ${wage.toLocaleString()}원 = ${dayWage.toLocaleString()}원`);
    });
    
    console.log(`\n=== 📋 최종 급여명세서 ===`);
    console.log(`총 근무시간: ${totalCorrectHours}시간`);
    console.log(`총 급여: ${totalWage.toLocaleString()}원`);
    console.log(`세금 (3.3%): ${Math.floor(totalWage * 0.033).toLocaleString()}원`);
    console.log(`실수령액: ${(totalWage - Math.floor(totalWage * 0.033)).toLocaleString()}원`);
    
    // 6. 불일치 사항 보고
    if (discrepancies.length > 0) {
      console.log('\n=== ⚠️ 불일치 사항 ===');
      discrepancies.forEach(discrepancy => {
        console.log(`${discrepancy.date}: 정확한 시간 ${discrepancy.correct}시간, DB 시간 ${discrepancy.db.toFixed(1)}시간 (차이: ${discrepancy.difference.toFixed(1)}시간)`);
      });
    } else {
      console.log('\n✅ 모든 근무시간이 정확합니다!');
    }
    
  } catch (error) {
    console.error('오류 발생:', error);
  }
}

verifyChoiAugustHours();
