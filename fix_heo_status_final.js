const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://cgscbtxtgualkfalouwh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixHeoStatusFinal() {
  console.log('🔧 허상원 상태 최종 수정 중...');
  
  const today = '2025-09-15';
  const heoEmployeeId = '2cc1b823-b231-4c90-8eb2-9728f21ba832'; // 허상원의 실제 UUID

  // 1. schedules 테이블에서 허상원의 상태를 completed로 변경
  console.log('📊 schedules 테이블 상태 수정 중...');
  const { error: scheduleError } = await supabase
    .from('schedules')
    .update({ status: 'completed' })
    .eq('employee_id', heoEmployeeId)
    .eq('schedule_date', today);
  
  if (scheduleError) {
    console.error('❌ schedules 테이블 상태 수정 실패:', scheduleError);
  } else {
    console.log('✅ schedules 테이블 상태 수정 완료 (break → completed)');
  }

  // 2. attendance 테이블에서도 상태 확인 및 수정
  console.log('📊 attendance 테이블 상태 확인 중...');
  const { data: attendanceData, error: attendanceError } = await supabase
    .from('attendance')
    .select('*')
    .eq('employee_id', heoEmployeeId)
    .eq('date', today);
  
  if (attendanceError) {
    console.error('❌ attendance 테이블 조회 실패:', attendanceError);
  } else if (attendanceData && attendanceData.length > 0) {
    console.log(`📊 attendance 테이블에서 ${attendanceData.length}개 기록 발견`);
    attendanceData.forEach((record, index) => {
      console.log(`  ${index + 1}. 상태: ${record.status}, 출근: ${record.check_in_time}, 퇴근: ${record.check_out_time}`);
    });
  } else {
    console.log('📊 attendance 테이블에 기록이 없습니다.');
  }

  console.log('\n✅ 허상원 상태 최종 수정 완료!');
}

fixHeoStatusFinal().catch(console.error);
