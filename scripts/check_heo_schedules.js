const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

async function checkHeoSchedules() {
  console.log('📋 허상원의 실제 스케줄 데이터 확인 중...\n');
  
  try {
    // 허상원의 모든 스케줄 조회
    const { data: schedules, error: scheduleError } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', '2cc1b823-b231-4c90-8eb2-9728f21ba832') // 허상원 ID
      .order('schedule_date', { ascending: true });

    if (scheduleError) {
      console.error('❌ 스케줄 조회 실패:', scheduleError);
      return;
    }

    if (!schedules || schedules.length === 0) {
      console.log('⚠️ 허상원의 스케줄 데이터가 없습니다.');
      return;
    }

    console.log(`📊 허상원의 총 스케줄: ${schedules.length}개\n`);

    // 월별로 그룹화
    const monthlySchedules = {};
    schedules.forEach(schedule => {
      const date = new Date(schedule.schedule_date);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (!monthlySchedules[monthKey]) {
        monthlySchedules[monthKey] = [];
      }
      monthlySchedules[monthKey].push(schedule);
    });

    // 각 월별 스케줄 출력
    Object.keys(monthlySchedules).sort().forEach(month => {
      const monthSchedules = monthlySchedules[month];
      console.log(`📅 ${month}월 스케줄 (${monthSchedules.length}일):`);
      
      let totalHours = 0;
      monthSchedules.forEach(schedule => {
        const start = new Date(`${schedule.schedule_date} ${schedule.scheduled_start}`);
        const end = new Date(`${schedule.schedule_date} ${schedule.scheduled_end}`);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        totalHours += hours;
        
        console.log(`   ${schedule.schedule_date}: ${schedule.scheduled_start} ~ ${schedule.scheduled_end} (${hours}시간)`);
      });
      
      console.log(`   📊 ${month}월 총 근무시간: ${totalHours}시간\n`);
    });

    // 급여명세서 기간별로 실제 스케줄과 비교
    console.log('🔍 급여명세서 기간별 실제 스케줄 확인:\n');
    
    const payslipPeriods = [
      { period: '2025-06-1', startDate: '2025-06-19', endDate: '2025-06-30' },
      { period: '2025-07-1', startDate: '2025-07-02', endDate: '2025-07-11' },
      { period: '2025-07-2', startDate: '2025-07-14', endDate: '2025-07-25' },
      { period: '2025-07-3', startDate: '2025-07-28', endDate: '2025-07-30' },
      { period: '2025-08-1', startDate: '2025-08-01', endDate: '2025-08-08' },
      { period: '2025-08-2', startDate: '2025-08-11', endDate: '2025-08-29' }
    ];

    payslipPeriods.forEach(period => {
      const periodSchedules = schedules.filter(schedule => {
        const scheduleDate = new Date(schedule.schedule_date);
        const startDate = new Date(period.startDate);
        const endDate = new Date(period.endDate);
        return scheduleDate >= startDate && scheduleDate <= endDate;
      });

      let periodTotalHours = 0;
      periodSchedules.forEach(schedule => {
        const start = new Date(`${schedule.schedule_date} ${schedule.scheduled_start}`);
        const end = new Date(`${schedule.schedule_date} ${schedule.scheduled_end}`);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        periodTotalHours += hours;
      });

      console.log(`${period.period} (${period.startDate} ~ ${period.endDate}):`);
      console.log(`   📊 실제 스케줄: ${periodSchedules.length}일, ${periodTotalHours}시간`);
      
      if (periodSchedules.length > 0) {
        console.log(`   📅 스케줄 상세:`);
        periodSchedules.forEach(schedule => {
          const start = new Date(`${schedule.schedule_date} ${schedule.scheduled_start}`);
          const end = new Date(`${schedule.schedule_date} ${schedule.scheduled_end}`);
          const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          console.log(`     ${schedule.schedule_date}: ${schedule.scheduled_start} ~ ${schedule.scheduled_end} (${hours}시간)`);
        });
      }
      console.log('');
    });

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

checkHeoSchedules();
