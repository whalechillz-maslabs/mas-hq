const { createClient } = require('@supabase/supabase-js');

// Supabase 설정
const supabaseUrl = 'https://whalechillz-maslabs.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function insertCorrectAttendance() {
  try {
    console.log('🚀 정확한 출근 데이터 입력 시작...');
    
    // 1. 기존 9월 3일 허상원 데이터 삭제
    console.log('🗑️ 기존 테스트 데이터 삭제 중...');
    const { error: deleteError } = await supabase
      .from('schedules')
      .delete()
      .eq('schedule_date', '2025-09-03')
      .eq('employee_id', 'HEO');
    
    if (deleteError) {
      console.error('❌ 기존 데이터 삭제 오류:', deleteError);
      return;
    }
    
    console.log('✅ 기존 데이터 삭제 완료');
    
    // 2. 허상원의 UUID 조회
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('id')
      .eq('employee_id', 'HEO')
      .single();
    
    if (employeeError || !employee) {
      console.error('❌ 직원 조회 오류:', employeeError);
      return;
    }
    
    console.log('✅ 직원 조회 완료:', employee.id);
    
    // 3. 정시 출근/퇴근 데이터 입력
    const schedules = [
      // 09:00-12:00 (3시간)
      { start: '09:00', end: '09:30', actual_start: '2025-09-03T09:00:00+09:00', actual_end: '2025-09-03T09:30:00+09:00' },
      { start: '09:30', end: '10:00', actual_start: '2025-09-03T09:30:00+09:00', actual_end: '2025-09-03T10:00:00+09:00' },
      { start: '10:00', end: '10:30', actual_start: '2025-09-03T10:00:00+09:00', actual_end: '2025-09-03T10:30:00+09:00' },
      { start: '10:30', end: '11:00', actual_start: '2025-09-03T10:30:00+09:00', actual_end: '2025-09-03T11:00:00+09:00' },
      { start: '11:00', end: '11:30', actual_start: '2025-09-03T11:00:00+09:00', actual_end: '2025-09-03T11:30:00+09:00' },
      { start: '11:30', end: '12:00', actual_start: '2025-09-03T11:30:00+09:00', actual_end: '2025-09-03T12:00:00+09:00' },
      
      // 13:00-17:30 (4.5시간) - 점심시간 12:00-13:00 제외
      { start: '13:00', end: '13:30', actual_start: '2025-09-03T13:00:00+09:00', actual_end: '2025-09-03T13:30:00+09:00' },
      { start: '13:30', end: '14:00', actual_start: '2025-09-03T13:30:00+09:00', actual_end: '2025-09-03T14:00:00+09:00' },
      { start: '14:00', end: '14:30', actual_start: '2025-09-03T14:00:00+09:00', actual_end: '2025-09-03T14:30:00+09:00' },
      { start: '14:30', end: '15:00', actual_start: '2025-09-03T14:30:00+09:00', actual_end: '2025-09-03T15:00:00+09:00' },
      { start: '15:00', end: '15:30', actual_start: '2025-09-03T15:00:00+09:00', actual_end: '2025-09-03T15:30:00+09:00' },
      { start: '15:30', end: '16:00', actual_start: '2025-09-03T15:30:00+09:00', actual_end: '2025-09-03T16:00:00+09:00' },
      { start: '16:00', end: '16:30', actual_start: '2025-09-03T16:00:00+09:00', actual_end: '2025-09-03T16:30:00+09:00' },
      { start: '16:30', end: '17:00', actual_start: '2025-09-03T16:30:00+09:00', actual_end: '2025-09-03T17:00:00+09:00' },
      { start: '17:00', end: '17:30', actual_start: '2025-09-03T17:00:00+09:00', actual_end: '2025-09-03T17:30:00+09:00' }
    ];
    
    console.log('📝 정시 출근/퇴근 데이터 입력 중...');
    
    for (const schedule of schedules) {
      const { error: insertError } = await supabase
        .from('schedules')
        .insert({
          employee_id: employee.id,
          schedule_date: '2025-09-03',
          scheduled_start: schedule.start,
          scheduled_end: schedule.end,
          actual_start: schedule.actual_start,
          actual_end: schedule.actual_end,
          status: 'completed',
          total_hours: 0.5
        });
      
      if (insertError) {
        console.error('❌ 스케줄 입력 오류:', insertError);
        return;
      }
    }
    
    console.log('✅ 정시 출근/퇴근 데이터 입력 완료');
    
    // 4. 입력된 데이터 확인
    console.log('🔍 입력된 데이터 확인 중...');
    const { data: insertedData, error: selectError } = await supabase
      .from('schedules')
      .select(`
        schedule_date,
        scheduled_start,
        scheduled_end,
        actual_start,
        actual_end,
        total_hours,
        status,
        employee:employees!schedules_employee_id_fkey (
          name,
          employee_id
        )
      `)
      .eq('schedule_date', '2025-09-03')
      .eq('employee.employee_id', 'HEO')
      .order('scheduled_start');
    
    if (selectError) {
      console.error('❌ 데이터 조회 오류:', selectError);
      return;
    }
    
    console.log('📊 입력된 데이터:', insertedData);
    
    // 5. 총 근무 시간 계산 확인
    const totalHours = insertedData.reduce((sum, record) => sum + record.total_hours, 0);
    console.log('⏰ 총 근무 시간:', totalHours, '시간');
    console.log('📅 총 스케줄 수:', insertedData.length, '개');
    
    console.log('🎉 정확한 출근 데이터 입력 완료!');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

// 스크립트 실행
insertCorrectAttendance();
