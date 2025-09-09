const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

async function createChoiSeptemberSchedule() {
  console.log('🔍 최형호 9월 1일 스케줄 생성 중...');
  
  try {
    const targetDate = '2025-09-01';
    console.log('📅 대상 날짜:', targetDate);
    
    // 1. 최형호 직원 정보 조회
    console.log('\n1. 최형호 직원 정보 조회...');
    const { data: choiEmployee, error: empError } = await supabase
      .from('employees')
      .select('id, name, employee_id, employment_type')
      .eq('name', '최형호')
      .single();
    
    if (empError) {
      console.log('❌ 최형호 직원 정보 조회 실패:', empError.message);
      return;
    }
    
    console.log('✅ 최형호 직원 정보:');
    console.log('  - ID:', choiEmployee.id);
    console.log('  - 이름:', choiEmployee.name);
    console.log('  - 직원ID:', choiEmployee.employee_id);
    console.log('  - 고용형태:', choiEmployee.employment_type);
    
    // 2. 기존 9월 1일 스케줄 확인
    console.log('\n2. 기존 9월 1일 스케줄 확인...');
    const { data: existingSchedules, error: existingError } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', choiEmployee.id)
      .eq('schedule_date', targetDate);
    
    if (existingError) {
      console.log('❌ 기존 스케줄 조회 실패:', existingError.message);
      return;
    }
    
    console.log('✅ 기존 9월 1일 스케줄:', existingSchedules.length + '개');
    
    if (existingSchedules.length > 0) {
      console.log('⚠️ 이미 9월 1일 스케줄이 있습니다');
      existingSchedules.forEach((schedule, index) => {
        console.log(`  스케줄 ${index + 1}:`);
        console.log('    - ID:', schedule.id);
        console.log('    - 시작시간:', schedule.scheduled_start);
        console.log('    - 종료시간:', schedule.scheduled_end);
        console.log('    - 상태:', schedule.status);
      });
      
      // 기존 스케줄 삭제 여부 확인
      console.log('\n💡 기존 스케줄을 삭제하고 새로 생성하시겠습니까?');
      console.log('   (자동으로 삭제하고 새로 생성합니다)');
      
      // 기존 스케줄 삭제
      for (const schedule of existingSchedules) {
        const { error: deleteError } = await supabase
          .from('schedules')
          .delete()
          .eq('id', schedule.id);
        
        if (deleteError) {
          console.log('❌ 기존 스케줄 삭제 실패:', deleteError.message);
        } else {
          console.log('✅ 기존 스케줄 삭제 성공:', schedule.id);
        }
      }
    }
    
    // 3. 9월 1일 스케줄 생성 (9시-12시, 1시-5시, 점심시간 12시-1시)
    console.log('\n3. 9월 1일 스케줄 생성 중...');
    
    const schedules = [
      {
        employee_id: choiEmployee.id,
        schedule_date: targetDate,
        scheduled_start: '09:00:00',
        scheduled_end: '12:00:00',
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        employee_id: choiEmployee.id,
        schedule_date: targetDate,
        scheduled_start: '12:00:00',
        scheduled_end: '13:00:00',
        status: 'lunch_break',
        employee_note: '점심시간',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        employee_id: choiEmployee.id,
        schedule_date: targetDate,
        scheduled_start: '13:00:00',
        scheduled_end: '17:00:00',
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    console.log('📝 생성할 스케줄 데이터:');
    schedules.forEach((schedule, index) => {
      console.log(`  스케줄 ${index + 1}: ${schedule.scheduled_start} - ${schedule.scheduled_end} (${schedule.status})`);
    });
    
    // 스케줄 일괄 생성
    const { data: newSchedules, error: createError } = await supabase
      .from('schedules')
      .insert(schedules)
      .select();
    
    if (createError) {
      console.log('❌ 스케줄 생성 실패:', createError.message);
      return;
    }
    
    console.log('✅ 9월 1일 스케줄 생성 성공!');
    console.log('📋 생성된 스케줄:');
    newSchedules.forEach((schedule, index) => {
      console.log(`  스케줄 ${index + 1}:`);
      console.log('    - ID:', schedule.id);
      console.log('    - 날짜:', schedule.schedule_date);
      console.log('    - 시작시간:', schedule.scheduled_start);
      console.log('    - 종료시간:', schedule.scheduled_end);
      console.log('    - 상태:', schedule.status);
      console.log('    - 메모:', schedule.employee_note || '없음');
    });
    
    // 4. 생성 확인
    console.log('\n4. 생성 확인...');
    const { data: verifySchedules, error: verifyError } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', choiEmployee.id)
      .eq('schedule_date', targetDate)
      .order('scheduled_start', { ascending: true });
    
    if (verifyError) {
      console.log('❌ 생성 확인 실패:', verifyError.message);
    } else {
      console.log('✅ 생성 확인 성공:', verifySchedules.length + '개 스케줄');
      
      // 총 근무 시간 계산
      const workSchedules = verifySchedules.filter(s => s.status === 'pending');
      const totalWorkHours = workSchedules.reduce((total, schedule) => {
        const start = new Date(`2000-01-01T${schedule.scheduled_start}`);
        const end = new Date(`2000-01-01T${schedule.scheduled_end}`);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        return total + hours;
      }, 0);
      
      console.log('\n📊 스케줄 요약:');
      console.log('  - 총 스케줄 수:', verifySchedules.length + '개');
      console.log('  - 근무 스케줄:', workSchedules.length + '개');
      console.log('  - 점심 스케줄:', verifySchedules.filter(s => s.status === 'lunch_break').length + '개');
      console.log('  - 총 근무 시간:', totalWorkHours + '시간');
      console.log('  - 점심 시간:', '1시간');
    }
    
    console.log('\n🎉 최형호 9월 1일 스케줄 생성 완료!');
    console.log('💡 이제 출근 체크가 가능합니다');
    
  } catch (error) {
    console.error('❌ 스케줄 생성 중 오류:', error);
  }
}

// 스크립트가 직접 실행될 때만 실행
if (require.main === module) {
  createChoiSeptemberSchedule().catch(console.error);
}

module.exports = { createChoiSeptemberSchedule };
