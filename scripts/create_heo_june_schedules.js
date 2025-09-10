const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

const heoId = '2cc1b823-b231-4c90-8eb2-9728f21ba832';

// 6월 스케줄 데이터 (점심시간 제외)
const juneSchedules = [
  { date: '2025-06-19', start: '09:00', end: '12:00', hours: 3 }, // 목
  { date: '2025-06-23', start: '09:00', end: '12:00', hours: 3 }, // 월
  { date: '2025-06-24', start: '09:00', end: '16:00', hours: 6 }, // 화
  { date: '2025-06-25', start: '09:00', end: '15:00', hours: 5 }, // 수
  { date: '2025-06-27', start: '09:00', end: '13:00', hours: 4 }, // 금
  { date: '2025-06-30', start: '09:00', end: '16:00', hours: 6 }  // 월
];

async function createHeoJuneSchedules() {
  try {
    console.log('🗓️ 허상원 6월 스케줄 생성 시작...');
    
    // 기존 6월 스케줄 삭제
    console.log('🗑️ 기존 6월 스케줄 삭제 중...');
    const { error: deleteError } = await supabase
      .from('schedules')
      .delete()
      .eq('employee_id', heoId)
      .gte('schedule_date', '2025-06-01')
      .lte('schedule_date', '2025-06-30');

    if (deleteError) {
      console.error('❌ 기존 스케줄 삭제 실패:', deleteError);
      return;
    }
    console.log('✅ 기존 6월 스케줄 삭제 완료');

    // 새 스케줄 생성
    console.log('➕ 새 6월 스케줄 생성 중...');
    const schedulesToInsert = juneSchedules.map(schedule => ({
      employee_id: heoId,
      schedule_date: schedule.date,
      scheduled_start: schedule.start,
      scheduled_end: schedule.end,
      break_minutes: 0, // 점심시간 제외
      status: 'approved', // 자동 승인
      employee_note: `6월 근무 - ${schedule.hours}시간`
    }));

    const { data, error } = await supabase
      .from('schedules')
      .insert(schedulesToInsert);

    if (error) {
      console.error('❌ 스케줄 생성 실패:', error);
      return;
    }

    console.log('✅ 허상원 6월 스케줄 생성 완료!');
    console.log('📊 생성된 스케줄:');
    juneSchedules.forEach((schedule, index) => {
      console.log(`${index + 1}. ${schedule.date} (${getDayOfWeek(schedule.date)}): ${schedule.start}-${schedule.end} (${schedule.hours}시간)`);
    });
    
    const totalHours = juneSchedules.reduce((sum, schedule) => sum + schedule.hours, 0);
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

createHeoJuneSchedules();
