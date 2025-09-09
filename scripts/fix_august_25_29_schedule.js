const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

async function fixAugust25to29Schedule() {
  console.log('🔧 최형호 8월 25일~29일 스케줄 수정 중...');
  
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
    
    // 1. 기존 8월 25일~29일 스케줄 삭제
    console.log('\n1. 기존 8월 25일~29일 스케줄 삭제 중...');
    const { data: existingSchedules, error: existingError } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', choiEmployee.id)
      .gte('schedule_date', '2025-08-25')
      .lte('schedule_date', '2025-08-29');
    
    if (existingError) {
      console.log('❌ 기존 스케줄 조회 실패:', existingError.message);
      return;
    }
    
    console.log('✅ 기존 8월 25일~29일 스케줄:', existingSchedules.length + '개');
    
    // 기존 스케줄 삭제
    for (const schedule of existingSchedules) {
      const { error: deleteError } = await supabase
        .from('schedules')
        .delete()
        .eq('id', schedule.id);
      
      if (deleteError) {
        console.log('❌ 기존 스케줄 삭제 실패:', deleteError.message);
      } else {
        console.log('✅ 기존 스케줄 삭제 성공:', schedule.schedule_date + ' ' + schedule.scheduled_start + '-' + schedule.scheduled_end);
      }
    }
    
    // 2. 새로운 8월 25일~29일 스케줄 생성 (점심시간 제외)
    console.log('\n2. 새로운 8월 25일~29일 스케줄 생성 중...');
    
    const newSchedules = [
      // 8월 25일 (월)
      {
        employee_id: choiEmployee.id,
        schedule_date: '2025-08-25',
        scheduled_start: '10:00:00',
        scheduled_end: '12:00:00',
        status: 'pending',
        employee_note: '오전 근무 (점심시간 제외)',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        employee_id: choiEmployee.id,
        schedule_date: '2025-08-25',
        scheduled_start: '13:00:00',
        scheduled_end: '17:00:00',
        status: 'pending',
        employee_note: '오후 근무 (점심시간 제외)',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      // 8월 26일 (화)
      {
        employee_id: choiEmployee.id,
        schedule_date: '2025-08-26',
        scheduled_start: '10:00:00',
        scheduled_end: '12:00:00',
        status: 'pending',
        employee_note: '오전 근무 (점심시간 제외)',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        employee_id: choiEmployee.id,
        schedule_date: '2025-08-26',
        scheduled_start: '13:00:00',
        scheduled_end: '18:00:00',
        status: 'pending',
        employee_note: '오후 근무 (점심시간 제외)',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      // 8월 27일 (수)
      {
        employee_id: choiEmployee.id,
        schedule_date: '2025-08-27',
        scheduled_start: '10:00:00',
        scheduled_end: '12:00:00',
        status: 'pending',
        employee_note: '오전 근무 (점심시간 제외)',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        employee_id: choiEmployee.id,
        schedule_date: '2025-08-27',
        scheduled_start: '13:00:00',
        scheduled_end: '17:00:00',
        status: 'pending',
        employee_note: '오후 근무 (점심시간 제외)',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      // 8월 28일 (목)
      {
        employee_id: choiEmployee.id,
        schedule_date: '2025-08-28',
        scheduled_start: '10:00:00',
        scheduled_end: '12:00:00',
        status: 'pending',
        employee_note: '오전 근무 (점심시간 제외)',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        employee_id: choiEmployee.id,
        schedule_date: '2025-08-28',
        scheduled_start: '13:00:00',
        scheduled_end: '17:00:00',
        status: 'pending',
        employee_note: '오후 근무 (점심시간 제외)',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      // 8월 29일 (금)
      {
        employee_id: choiEmployee.id,
        schedule_date: '2025-08-29',
        scheduled_start: '10:00:00',
        scheduled_end: '12:00:00',
        status: 'pending',
        employee_note: '오전 근무 (점심시간 제외)',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        employee_id: choiEmployee.id,
        schedule_date: '2025-08-29',
        scheduled_start: '13:00:00',
        scheduled_end: '17:00:00',
        status: 'pending',
        employee_note: '오후 근무 (점심시간 제외)',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    console.log('📝 생성할 스케줄 데이터:', newSchedules.length + '개');
    
    // 스케줄 일괄 생성
    const { data: createdSchedules, error: createError } = await supabase
      .from('schedules')
      .insert(newSchedules)
      .select();
    
    if (createError) {
      console.log('❌ 스케줄 생성 실패:', createError.message);
      return;
    }
    
    console.log('✅ 새로운 8월 25일~29일 스케줄 생성 성공!');
    console.log('📋 생성된 스케줄:', createdSchedules.length + '개');
    
    // 3. 생성 확인
    console.log('\n3. 생성 확인...');
    const { data: verifySchedules, error: verifyError } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', choiEmployee.id)
      .gte('schedule_date', '2025-08-25')
      .lte('schedule_date', '2025-08-29')
      .order('schedule_date', { ascending: true });
    
    if (verifyError) {
      console.log('❌ 생성 확인 실패:', verifyError.message);
    } else {
      console.log('✅ 생성 확인 성공:', verifySchedules.length + '개 스케줄');
      
      // 날짜별로 그룹화하여 표시
      const schedulesByDate = {};
      verifySchedules.forEach(schedule => {
        if (!schedulesByDate[schedule.schedule_date]) {
          schedulesByDate[schedule.schedule_date] = [];
        }
        schedulesByDate[schedule.schedule_date].push(schedule);
      });
      
      console.log('\n📊 수정된 8월 25일~29일 스케줄:');
      const dates = ['2025-08-25', '2025-08-26', '2025-08-27', '2025-08-28', '2025-08-29'];
      
      dates.forEach(date => {
        const daySchedules = schedulesByDate[date] || [];
        console.log(`\n📅 ${date}:`);
        
        if (daySchedules.length === 0) {
          console.log('  - 스케줄 없음');
        } else {
          daySchedules.forEach((schedule, index) => {
            console.log(`  ${index + 1}. ${schedule.scheduled_start} - ${schedule.scheduled_end} (${schedule.employee_note})`);
          });
        }
      });
      
      // 총 근무 시간 계산
      const totalWorkHours = verifySchedules.reduce((total, schedule) => {
        const start = new Date(`2000-01-01T${schedule.scheduled_start}`);
        const end = new Date(`2000-01-01T${schedule.scheduled_end}`);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        return total + hours;
      }, 0);
      
      console.log('\n📊 스케줄 요약:');
      console.log('  - 총 스케줄 수:', verifySchedules.length + '개');
      console.log('  - 총 근무 시간:', totalWorkHours + '시간 (점심시간 제외)');
      console.log('  - 평균 근무 시간:', (totalWorkHours / 5).toFixed(1) + '시간/일');
      console.log('  - 점심시간:', '12:00-13:00 (자동 제외)');
    }
    
    console.log('\n🎉 최형호 8월 25일~29일 스케줄 수정 완료!');
    console.log('💡 이제 12시-1시 점심시간이 올바르게 제외되었습니다');
    
  } catch (error) {
    console.error('❌ 수정 중 오류:', error);
  }
}

// 스크립트가 직접 실행될 때만 실행
if (require.main === module) {
  fixAugust25to29Schedule().catch(console.error);
}

module.exports = { fixAugust25to29Schedule };
