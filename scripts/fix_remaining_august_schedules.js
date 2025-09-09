const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

async function fixRemainingAugustSchedules() {
  console.log('🔧 최형호 8월 나머지 스케줄 수정 중...');
  
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
    
    // 수정이 필요한 날짜들
    const problemDates = ['2025-08-13', '2025-08-18', '2025-08-20', '2025-08-22'];
    
    for (const date of problemDates) {
      console.log(`\n🔧 ${date} 스케줄 수정 중...`);
      
      // 1. 기존 스케줄 삭제
      const { data: existingSchedules, error: existingError } = await supabase
        .from('schedules')
        .select('*')
        .eq('employee_id', choiEmployee.id)
        .eq('schedule_date', date);
      
      if (existingError) {
        console.log(`❌ ${date} 기존 스케줄 조회 실패:`, existingError.message);
        continue;
      }
      
      console.log(`✅ ${date} 기존 스케줄:`, existingSchedules.length + '개');
      
      // 기존 스케줄 삭제
      for (const schedule of existingSchedules) {
        const { error: deleteError } = await supabase
          .from('schedules')
          .delete()
          .eq('id', schedule.id);
        
        if (deleteError) {
          console.log(`❌ ${date} 기존 스케줄 삭제 실패:`, deleteError.message);
        } else {
          console.log(`✅ ${date} 기존 스케줄 삭제 성공:`, schedule.scheduled_start + '-' + schedule.scheduled_end);
        }
      }
      
      // 2. 새로운 스케줄 생성 (점심시간 제외)
      const newSchedules = [
        {
          employee_id: choiEmployee.id,
          schedule_date: date,
          scheduled_start: '10:00:00',
          scheduled_end: '12:00:00',
          status: 'pending',
          employee_note: '오전 근무 (점심시간 제외)',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          employee_id: choiEmployee.id,
          schedule_date: date,
          scheduled_start: '13:00:00',
          scheduled_end: '17:00:00',
          status: 'pending',
          employee_note: '오후 근무 (점심시간 제외)',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      console.log(`📝 ${date} 생성할 스케줄 데이터:`, newSchedules.length + '개');
      
      // 스케줄 생성
      const { data: createdSchedules, error: createError } = await supabase
        .from('schedules')
        .insert(newSchedules)
        .select();
      
      if (createError) {
        console.log(`❌ ${date} 스케줄 생성 실패:`, createError.message);
      } else {
        console.log(`✅ ${date} 스케줄 생성 성공:`, createdSchedules.length + '개');
        createdSchedules.forEach((schedule, index) => {
          console.log(`  ${index + 1}. ${schedule.scheduled_start} - ${schedule.scheduled_end} (${schedule.employee_note})`);
        });
      }
    }
    
    // 3. 전체 확인
    console.log('\n3. 전체 확인...');
    const { data: verifySchedules, error: verifyError } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', choiEmployee.id)
      .gte('schedule_date', '2025-08-01')
      .lte('schedule_date', '2025-08-31')
      .order('schedule_date', { ascending: true });
    
    if (verifyError) {
      console.log('❌ 전체 확인 실패:', verifyError.message);
    } else {
      console.log('✅ 전체 확인 성공:', verifySchedules.length + '개 스케줄');
      
      // 점심시간 겹침 재확인
      let totalLunchOverlap = 0;
      let stillNeedsFix = [];
      
      verifySchedules.forEach(schedule => {
        const start = new Date(`2000-01-01T${schedule.scheduled_start}`);
        const end = new Date(`2000-01-01T${schedule.scheduled_end}`);
        const lunchStart = new Date('2000-01-01T12:00:00');
        const lunchEnd = new Date('2000-01-01T13:00:00');
        
        const overlapStart = new Date(Math.max(start.getTime(), lunchStart.getTime()));
        const overlapEnd = new Date(Math.min(end.getTime(), lunchEnd.getTime()));
        
        if (overlapStart < overlapEnd) {
          const overlapHours = (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60);
          totalLunchOverlap += overlapHours;
          stillNeedsFix.push(schedule);
        }
      });
      
      if (stillNeedsFix.length === 0) {
        console.log('🎉 모든 8월 스케줄에서 점심시간이 올바르게 제외되었습니다!');
        
        // 총 근무 시간 계산
        const totalWorkHours = verifySchedules.reduce((total, schedule) => {
          const start = new Date(`2000-01-01T${schedule.scheduled_start}`);
          const end = new Date(`2000-01-01T${schedule.scheduled_end}`);
          const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          return total + hours;
        }, 0);
        
        console.log('\n📊 8월 전체 스케줄 요약:');
        console.log('  - 총 스케줄 수:', verifySchedules.length + '개');
        console.log('  - 총 근무 시간:', totalWorkHours + '시간 (점심시간 제외)');
        console.log('  - 점심시간:', '12:00-13:00 (모든 날짜에서 제외)');
      } else {
        console.log('❌ 아직 수정이 필요한 스케줄이 있습니다:', stillNeedsFix.length + '개');
        stillNeedsFix.forEach(schedule => {
          console.log(`  - ${schedule.schedule_date} ${schedule.scheduled_start}-${schedule.scheduled_end}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ 수정 중 오류:', error);
  }
}

// 스크립트가 직접 실행될 때만 실행
if (require.main === module) {
  fixRemainingAugustSchedules().catch(console.error);
}

module.exports = { fixRemainingAugustSchedules };
