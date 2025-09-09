const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

async function improveScheduleSystem() {
  console.log('🔧 스케줄 시스템 개선 방안 구현...');
  
  try {
    // 최형호 직원 정보 조회
    const { data: choiEmployee, error: empError } = await supabase
      .from('employees')
      .select('id, name, employee_id')
      .eq('name', '최형호')
      .single();
    
    if (empError) {
      console.log('❌ 최형호 직원 정보 조회 실패:', empError.message);
      return;
    }
    
    console.log('✅ 최형호 직원 정보:', choiEmployee.name, choiEmployee.employee_id);
    
    // 1. 현재 8월 13일 스케줄 확인 (2개로 분리된 상태)
    console.log('\n1. 현재 8월 13일 스케줄 확인...');
    const { data: currentSchedules, error: currentError } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', choiEmployee.id)
      .eq('schedule_date', '2025-08-13')
      .order('scheduled_start', { ascending: true });
    
    if (currentError) {
      console.log('❌ 현재 스케줄 조회 실패:', currentError.message);
      return;
    }
    
    console.log('✅ 현재 8월 13일 스케줄:', currentSchedules.length + '개');
    currentSchedules.forEach((schedule, index) => {
      console.log(`  ${index + 1}. ${schedule.scheduled_start} - ${schedule.scheduled_end} (${schedule.employee_note})`);
    });
    
    // 2. 기존 분리된 스케줄 삭제
    console.log('\n2. 기존 분리된 스케줄 삭제...');
    for (const schedule of currentSchedules) {
      const { error: deleteError } = await supabase
        .from('schedules')
        .delete()
        .eq('id', schedule.id);
      
      if (deleteError) {
        console.log('❌ 스케줄 삭제 실패:', deleteError.message);
      } else {
        console.log('✅ 스케줄 삭제 성공:', schedule.scheduled_start + '-' + schedule.scheduled_end);
      }
    }
    
    // 3. 새로운 단일 스케줄 생성 (9시-5시, 점심시간 제외 로직)
    console.log('\n3. 새로운 단일 스케줄 생성...');
    const newSchedule = {
      employee_id: choiEmployee.id,
      schedule_date: '2025-08-13',
      scheduled_start: '09:00:00',
      scheduled_end: '17:00:00',
      break_minutes: 60, // 점심시간 1시간
      total_hours: 7.0, // 실제 근무시간 (8시간 - 1시간 점심)
      status: 'pending',
      employee_note: '9시-5시 근무 (점심시간 12시-1시 자동 제외)',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('📝 생성할 스케줄 데이터:');
    console.log('  - 시간:', newSchedule.scheduled_start + ' - ' + newSchedule.scheduled_end);
    console.log('  - 점심시간:', newSchedule.break_minutes + '분');
    console.log('  - 실제 근무시간:', newSchedule.total_hours + '시간');
    console.log('  - 메모:', newSchedule.employee_note);
    
    const { data: createdSchedule, error: createError } = await supabase
      .from('schedules')
      .insert([newSchedule])
      .select();
    
    if (createError) {
      console.log('❌ 스케줄 생성 실패:', createError.message);
      return;
    }
    
    console.log('✅ 새로운 단일 스케줄 생성 성공!');
    console.log('📋 생성된 스케줄:', createdSchedule[0].id);
    
    // 4. 점심시간 제외 계산 함수 테스트
    console.log('\n4. 점심시간 제외 계산 함수 테스트...');
    
    function calculateWorkHoursExcludingLunch(startTime, endTime, breakMinutes = 60) {
      const start = new Date(`2000-01-01T${startTime}`);
      const end = new Date(`2000-01-01T${endTime}`);
      
      // 전체 시간 계산
      const totalHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      
      // 점심시간 제외
      const actualWorkHours = totalHours - (breakMinutes / 60);
      
      return {
        totalHours: totalHours,
        breakHours: breakMinutes / 60,
        actualWorkHours: actualWorkHours,
        hasLunchBreak: breakMinutes > 0
      };
    }
    
    const calculation = calculateWorkHoursExcludingLunch('09:00:00', '17:00:00', 60);
    console.log('📊 계산 결과:');
    console.log('  - 전체 시간:', calculation.totalHours + '시간');
    console.log('  - 점심시간:', calculation.breakHours + '시간');
    console.log('  - 실제 근무시간:', calculation.actualWorkHours + '시간');
    console.log('  - 점심시간 제외:', calculation.hasLunchBreak ? '예' : '아니오');
    
    // 5. 부분 삭제 시나리오 테스트
    console.log('\n5. 부분 삭제 시나리오 테스트...');
    console.log('💡 부분 삭제 시나리오:');
    console.log('  - 오전만 삭제: scheduled_start를 13:00으로 변경');
    console.log('  - 오후만 삭제: scheduled_end를 12:00으로 변경');
    console.log('  - 특정 시간 삭제: 해당 시간대만 수정');
    console.log('  - 점심시간 변경: break_minutes 값 수정');
    
    // 6. 최종 확인
    console.log('\n6. 최종 확인...');
    const { data: finalSchedule, error: finalError } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', choiEmployee.id)
      .eq('schedule_date', '2025-08-13');
    
    if (finalError) {
      console.log('❌ 최종 확인 실패:', finalError.message);
    } else {
      console.log('✅ 최종 확인 성공:', finalSchedule.length + '개 스케줄');
      
      if (finalSchedule.length === 1) {
        const schedule = finalSchedule[0];
        console.log('\n📊 개선된 스케줄 구조:');
        console.log('  - ID:', schedule.id);
        console.log('  - 시간:', schedule.scheduled_start + ' - ' + schedule.scheduled_end);
        console.log('  - 점심시간:', schedule.break_minutes + '분');
        console.log('  - 실제 근무시간:', schedule.total_hours + '시간');
        console.log('  - 상태:', schedule.status);
        console.log('  - 메모:', schedule.employee_note);
        
        console.log('\n🎉 스케줄 시스템 개선 완료!');
        console.log('💡 이제 1개 데이터로 관리하며 부분 삭제가 가능합니다');
      }
    }
    
  } catch (error) {
    console.error('❌ 개선 중 오류:', error);
  }
}

// 스크립트가 직접 실행될 때만 실행
if (require.main === module) {
  improveScheduleSystem().catch(console.error);
}

module.exports = { improveScheduleSystem };
