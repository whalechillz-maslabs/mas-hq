const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

const heoId = '2cc1b823-b231-4c90-8eb2-9728f21ba832';

async function verifyHeoAllSchedules() {
  try {
    console.log('🔍 허상원 전체 스케줄 확인 중...');
    
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', heoId)
      .gte('schedule_date', '2025-06-01')
      .lte('schedule_date', '2025-09-30')
      .order('schedule_date', { ascending: true });

    if (error) {
      console.error('❌ 에러:', error);
      return;
    }

    if (!data || data.length === 0) {
      console.log('❌ 스케줄을 찾을 수 없습니다.');
      return;
    }

    console.log('✅ 허상원 전체 스케줄 확인 완료!');
    console.log(`📊 총 스케줄 수: ${data.length}개`);
    
    // 월별로 그룹화
    const monthlyData = {};
    let totalHours = 0;

    data.forEach(schedule => {
      const month = schedule.schedule_date.substring(0, 7); // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = [];
      }
      monthlyData[month].push(schedule);
      
      // 근무시간 계산
      const start = new Date(`${schedule.schedule_date} ${schedule.scheduled_start}`);
      const end = new Date(`${schedule.schedule_date} ${schedule.scheduled_end}`);
      const hours = (end - start) / (1000 * 60 * 60);
      totalHours += hours;
    });

    // 월별 출력
    Object.keys(monthlyData).sort().forEach(month => {
      const schedules = monthlyData[month];
      const monthHours = schedules.reduce((sum, schedule) => {
        const start = new Date(`${schedule.schedule_date} ${schedule.scheduled_start}`);
        const end = new Date(`${schedule.schedule_date} ${schedule.scheduled_end}`);
        return sum + (end - start) / (1000 * 60 * 60);
      }, 0);
      
      console.log(`\n📅 ${month} (${schedules.length}일, ${monthHours}시간):`);
      schedules.forEach(schedule => {
        const dayOfWeek = getDayOfWeek(schedule.schedule_date);
        const start = new Date(`${schedule.schedule_date} ${schedule.scheduled_start}`);
        const end = new Date(`${schedule.schedule_date} ${schedule.scheduled_end}`);
        const hours = (end - start) / (1000 * 60 * 60);
        console.log(`  - ${schedule.schedule_date} (${dayOfWeek}): ${schedule.scheduled_start}-${schedule.scheduled_end} (${hours}시간) [${schedule.status}]`);
      });
    });

    console.log(`\n📈 총 근무시간: ${totalHours}시간`);
    console.log(`📈 평균 일 근무시간: ${(totalHours / data.length).toFixed(1)}시간`);

  } catch (error) {
    console.error('❌ 스크립트 실행 오류:', error);
  }
}

function getDayOfWeek(dateString) {
  const date = new Date(dateString);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return days[date.getDay()];
}

verifyHeoAllSchedules();
