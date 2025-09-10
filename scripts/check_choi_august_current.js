const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

const choiId = 'e998a540-51bf-4380-bcb1-86fb36ec7eb8';

async function checkChoiAugustCurrent() {
  try {
    console.log('🔍 최형호 8월 현재 스케줄 확인 중...');
    
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', choiId)
      .gte('schedule_date', '2025-08-01')
      .lte('schedule_date', '2025-08-31')
      .order('schedule_date', { ascending: true });

    if (error) {
      console.error('❌ 에러:', error);
      return;
    }

    if (!data || data.length === 0) {
      console.log('❌ 8월 스케줄을 찾을 수 없습니다.');
      return;
    }

    console.log('✅ 최형호 8월 현재 스케줄:');
    console.log(`📊 총 스케줄 수: ${data.length}개`);
    
    let totalHours = 0;
    data.forEach(schedule => {
      const start = new Date(`${schedule.schedule_date} ${schedule.scheduled_start}`);
      const end = new Date(`${schedule.schedule_date} ${schedule.scheduled_end}`);
      const hours = (end - start) / (1000 * 60 * 60);
      totalHours += hours;
      
      const dayOfWeek = getDayOfWeek(schedule.schedule_date);
      console.log(`- ${schedule.schedule_date} (${dayOfWeek}): ${schedule.scheduled_start}-${schedule.scheduled_end} (${hours}시간) [${schedule.status}]`);
    });

    console.log(`📈 총 근무시간: ${totalHours}시간`);

  } catch (error) {
    console.error('❌ 스크립트 실행 오류:', error);
  }
}

function getDayOfWeek(dateString) {
  const date = new Date(dateString);
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return days[date.getDay()];
}

checkChoiAugustCurrent();
