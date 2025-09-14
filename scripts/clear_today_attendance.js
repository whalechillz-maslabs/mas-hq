const { createClient } = require('@supabase/supabase-js');

// Supabase 설정
const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

async function clearTodayAttendance() {
  console.log('🧹 오늘 출근 데이터 삭제 시작...\n');

  try {
    const today = new Date().toISOString().split('T')[0];
    console.log(`📅 오늘 날짜: ${today}`);

    // 1. 오늘 attendance 데이터 조회
    console.log('\n1️⃣ 오늘 attendance 데이터 조회...');
    const { data: todayAttendance, error: selectError } = await supabase
      .from('attendance')
      .select('*')
      .eq('date', today);

    if (selectError) {
      console.log('❌ 오늘 attendance 데이터 조회 실패:', selectError.message);
      return;
    }

    console.log(`📊 오늘 attendance 데이터: ${todayAttendance.length}개`);
    if (todayAttendance.length > 0) {
      todayAttendance.forEach((record, index) => {
        console.log(`   ${index + 1}. 직원ID: ${record.employee_id}, 출근: ${record.check_in_time}, 퇴근: ${record.check_out_time || '미퇴근'}`);
      });
    } else {
      console.log('   📝 오늘 출근 데이터가 없습니다.');
      return;
    }

    // 2. 오늘 attendance 데이터 삭제
    console.log('\n2️⃣ 오늘 attendance 데이터 삭제...');
    const { error: deleteError } = await supabase
      .from('attendance')
      .delete()
      .eq('date', today);

    if (deleteError) {
      console.log('❌ 오늘 attendance 데이터 삭제 실패:', deleteError.message);
      return;
    }

    console.log('✅ 오늘 attendance 데이터 삭제 완료');

    // 3. 삭제 확인
    console.log('\n3️⃣ 삭제 확인...');
    const { data: afterDelete, error: afterDeleteError } = await supabase
      .from('attendance')
      .select('*')
      .eq('date', today);

    if (afterDeleteError) {
      console.log('❌ 삭제 후 확인 실패:', afterDeleteError.message);
    } else {
      console.log(`✅ 삭제 후 오늘 attendance 데이터: ${afterDelete.length}개`);
    }

  } catch (error) {
    console.error('❌ 오늘 출근 데이터 삭제 중 오류:', error);
  }
}

// 스크립트 실행
clearTodayAttendance();
