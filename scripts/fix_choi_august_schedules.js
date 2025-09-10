const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

const choiId = 'e998a540-51bf-4380-bcb1-86fb36ec7eb8';

// 사용자가 제공한 정확한 스케줄 (점심시간 제외)
const correctSchedules = [
  { date: '2025-08-01', start: '14:30', end: '15:30', hours: 1 }, // 금
  { date: '2025-08-04', start: '13:00', end: '17:00', hours: 4 }, // 월
  { date: '2025-08-08', start: '13:00', end: '16:30', hours: 3.5 }, // 금
  { date: '2025-08-11', start: '13:00', end: '17:00', hours: 4 }, // 월
  { date: '2025-08-13', start: '10:00', end: '17:00', hours: 6 }, // 수 (점심시간 제외)
  { date: '2025-08-14', start: '15:00', end: '17:00', hours: 2 }, // 목
  { date: '2025-08-18', start: '10:00', end: '17:00', hours: 6 }, // 월 (점심시간 제외)
  { date: '2025-08-20', start: '10:00', end: '17:00', hours: 6 }, // 수 (점심시간 제외)
  { date: '2025-08-22', start: '10:00', end: '17:00', hours: 6 }  // 금 (점심시간 제외)
];

async function fixChoiAugustSchedules() {
  try {
    console.log('🔧 최형호 8월 스케줄 수정 시작...');
    
    // 기존 8월 스케줄 삭제
    console.log('🗑️ 기존 8월 스케줄 삭제 중...');
    const { error: deleteError } = await supabase
      .from('schedules')
      .delete()
      .eq('employee_id', choiId)
      .gte('schedule_date', '2025-08-01')
      .lte('schedule_date', '2025-08-31');

    if (deleteError) {
      console.error('❌ 기존 스케줄 삭제 실패:', deleteError);
      return;
    }
    console.log('✅ 기존 8월 스케줄 삭제 완료');

    // 새 스케줄 생성 (점심시간 제외)
    console.log('➕ 새 8월 스케줄 생성 중...');
    const schedulesToInsert = correctSchedules.map(schedule => ({
      employee_id: choiId,
      schedule_date: schedule.date,
      scheduled_start: schedule.start,
      scheduled_end: schedule.end,
      break_minutes: 0, // 점심시간 제외
      status: 'approved', // 자동 승인
      employee_note: `8월 근무 - ${schedule.hours}시간 (점심시간 제외)`
    }));

    const { data, error } = await supabase
      .from('schedules')
      .insert(schedulesToInsert);

    if (error) {
      console.error('❌ 스케줄 생성 실패:', error);
      return;
    }

    console.log('✅ 최형호 8월 스케줄 수정 완료!');
    console.log('📊 수정된 스케줄:');
    correctSchedules.forEach((schedule, index) => {
      console.log(`${index + 1}. ${schedule.date} (${getDayOfWeek(schedule.date)}): ${schedule.start}-${schedule.end} (${schedule.hours}시간)`);
    });
    
    const totalHours = correctSchedules.reduce((sum, schedule) => sum + schedule.hours, 0);
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

fixChoiAugustSchedules();
