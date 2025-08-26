const { createClient } = require('@supabase/supabase-js');

// 원격 Supabase 설정
const supabaseUrl = 'https://cgscbtxtgualkfalouwh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8';

const supabase = createClient(supabaseUrl, supabaseKey);

// 스케줄 제약 조건 문제 해결
async function fixScheduleConstraints() {
  try {
    console.log('스케줄 제약 조건 문제 해결 중...\n');
    
    // 현재 스케줄 데이터 확인
    const { data: schedules, error: scheduleError } = await supabase
      .from('schedules')
      .select('*')
      .order('schedule_date', { ascending: true });
    
    if (scheduleError) {
      console.error('스케줄 조회 오류:', scheduleError);
      return;
    }
    
    console.log('현재 스케줄 데이터:');
    schedules?.forEach(schedule => {
      console.log(`- ${schedule.schedule_date} ${schedule.scheduled_start}-${schedule.scheduled_end} (직원: ${schedule.employee_id})`);
    });
    
    // 중복 스케줄 확인
    const duplicateSchedules = [];
    const scheduleMap = new Map();
    
    schedules?.forEach(schedule => {
      const key = `${schedule.employee_id}-${schedule.schedule_date}`;
      if (scheduleMap.has(key)) {
        duplicateSchedules.push(schedule);
      } else {
        scheduleMap.set(key, schedule);
      }
    });
    
    if (duplicateSchedules.length > 0) {
      console.log(`\n중복 스케줄 발견: ${duplicateSchedules.length}개`);
      duplicateSchedules.forEach(schedule => {
        console.log(`- ${schedule.schedule_date} ${schedule.scheduled_start}-${schedule.scheduled_end} (직원: ${schedule.employee_id})`);
      });
      
      // 중복 스케줄 삭제
      console.log('\n중복 스케줄 삭제 중...');
      for (const schedule of duplicateSchedules) {
        const { error: deleteError } = await supabase
          .from('schedules')
          .delete()
          .eq('id', schedule.id);
        
        if (deleteError) {
          console.error(`스케줄 삭제 오류 (${schedule.id}):`, deleteError);
        } else {
          console.log(`스케줄 삭제 완료: ${schedule.schedule_date} ${schedule.scheduled_start}-${schedule.scheduled_end}`);
        }
      }
    } else {
      console.log('\n중복 스케줄이 없습니다.');
    }
    
    // 올바른 스케줄 데이터 추가 (로컬 데이터 기준)
    console.log('\n올바른 스케줄 데이터 추가 중...');
    
    // 기존 employees 확인
    const { data: employees } = await supabase
      .from('employees')
      .select('*');
    
    const adminEmployee = employees?.find(emp => emp.employee_id === 'MASLABS-001');
    const eunjungEmployee = employees?.find(emp => emp.employee_id === 'MASLABS-002');
    const jinEmployee = employees?.find(emp => emp.employee_id === 'MASLABS-004');
    
    // 로컬 데이터 기준 스케줄 추가
    const correctSchedules = [
      // 시스템 관리자 스케줄 (8월 25일)
      {
        employee_id: adminEmployee?.id,
        schedule_date: '2025-08-25',
        scheduled_start: '13:00:00',
        scheduled_end: '14:00:00',
        break_minutes: 0,
        status: 'approved',
        employee_note: '클릭으로 추가됨'
      },
      {
        employee_id: adminEmployee?.id,
        schedule_date: '2025-08-25',
        scheduled_start: '14:00:00',
        scheduled_end: '15:00:00',
        break_minutes: 0,
        status: 'approved',
        employee_note: '클릭으로 추가됨'
      },
      
      // 시스템 관리자 스케줄 (8월 26일)
      {
        employee_id: adminEmployee?.id,
        schedule_date: '2025-08-26',
        scheduled_start: '12:00:00',
        scheduled_end: '13:00:00',
        break_minutes: 0,
        status: 'approved',
        employee_note: '클릭으로 추가됨'
      },
      {
        employee_id: adminEmployee?.id,
        schedule_date: '2025-08-26',
        scheduled_start: '13:00:00',
        scheduled_end: '14:00:00',
        break_minutes: 0,
        status: 'approved',
        employee_note: '클릭으로 추가됨'
      },
      {
        employee_id: adminEmployee?.id,
        schedule_date: '2025-08-26',
        scheduled_start: '14:00:00',
        scheduled_end: '15:00:00',
        break_minutes: 0,
        status: 'approved',
        employee_note: '클릭으로 추가됨'
      },
      
      // 시스템 관리자 스케줄 (8월 27일)
      {
        employee_id: adminEmployee?.id,
        schedule_date: '2025-08-27',
        scheduled_start: '10:00:00',
        scheduled_end: '11:00:00',
        break_minutes: 0,
        status: 'approved',
        employee_note: '관리자가 추가함'
      },
      {
        employee_id: adminEmployee?.id,
        schedule_date: '2025-08-27',
        scheduled_start: '11:00:00',
        scheduled_end: '12:00:00',
        break_minutes: 0,
        status: 'approved',
        employee_note: '관리자가 추가함'
      },
      {
        employee_id: adminEmployee?.id,
        schedule_date: '2025-08-27',
        scheduled_start: '12:00:00',
        scheduled_end: '13:00:00',
        break_minutes: 0,
        status: 'approved',
        employee_note: '클릭으로 추가됨'
      },
      {
        employee_id: adminEmployee?.id,
        schedule_date: '2025-08-27',
        scheduled_start: '13:00:00',
        scheduled_end: '14:00:00',
        break_minutes: 0,
        status: 'approved',
        employee_note: '클릭으로 추가됨'
      },
      {
        employee_id: adminEmployee?.id,
        schedule_date: '2025-08-27',
        scheduled_start: '14:00:00',
        scheduled_end: '15:00:00',
        break_minutes: 0,
        status: 'approved',
        employee_note: '클릭으로 추가됨'
      },
      
      // 이은정 스케줄 (8월 25일)
      {
        employee_id: eunjungEmployee?.id,
        schedule_date: '2025-08-25',
        scheduled_start: '10:00:00',
        scheduled_end: '11:00:00',
        break_minutes: 0,
        status: 'approved',
        employee_note: '관리자가 추가함'
      },
      {
        employee_id: eunjungEmployee?.id,
        schedule_date: '2025-08-25',
        scheduled_start: '11:00:00',
        scheduled_end: '12:00:00',
        break_minutes: 0,
        status: 'approved',
        employee_note: '관리자가 추가함'
      },
      {
        employee_id: eunjungEmployee?.id,
        schedule_date: '2025-08-25',
        scheduled_start: '12:00:00',
        scheduled_end: '13:00:00',
        break_minutes: 0,
        status: 'approved',
        employee_note: '관리자가 추가함'
      },
      
      // 박진 스케줄 (8월 26일)
      {
        employee_id: jinEmployee?.id,
        schedule_date: '2025-08-26',
        scheduled_start: '10:00:00',
        scheduled_end: '11:00:00',
        break_minutes: 0,
        status: 'approved',
        employee_note: '관리자가 추가함'
      },
      {
        employee_id: jinEmployee?.id,
        schedule_date: '2025-08-26',
        scheduled_start: '11:00:00',
        scheduled_end: '12:00:00',
        break_minutes: 0,
        status: 'approved',
        employee_note: '관리자가 추가함'
      },
      {
        employee_id: jinEmployee?.id,
        schedule_date: '2025-08-26',
        scheduled_start: '12:00:00',
        scheduled_end: '13:00:00',
        break_minutes: 0,
        status: 'approved',
        employee_note: '관리자가 추가함'
      }
    ];
    
    for (const schedule of correctSchedules) {
      if (!schedule.employee_id) {
        console.log('직원 ID가 없어서 스케줄을 건너뜀');
        continue;
      }
      
      const { error } = await supabase
        .from('schedules')
        .insert(schedule);
      
      if (error) {
        if (error.code === '23505') { // 중복 키 오류
          console.log(`중복 스케줄 건너뜀: ${schedule.schedule_date} ${schedule.scheduled_start}-${schedule.scheduled_end}`);
        } else {
          console.error(`스케줄 추가 오류 (${schedule.schedule_date} ${schedule.scheduled_start}-${schedule.scheduled_end}):`, error.message);
        }
      } else {
        console.log(`스케줄 추가 완료: ${schedule.schedule_date} ${schedule.scheduled_start}-${schedule.scheduled_end}`);
      }
    }
    
    console.log('\n스케줄 제약 조건 문제 해결 완료!');
    
  } catch (error) {
    console.error('스케줄 수정 중 오류 발생:', error);
  }
}

fixScheduleConstraints();
