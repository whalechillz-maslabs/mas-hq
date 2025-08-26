const { createClient } = require('@supabase/supabase-js');

// 원격 Supabase 설정
const supabaseUrl = 'https://cgscbtxtgualkfalouwh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8';

const supabase = createClient(supabaseUrl, supabaseKey);

// 로컬의 나머지 스케줄 데이터 추가
async function addRemainingSchedules() {
  try {
    console.log('로컬의 나머지 스케줄 데이터 추가 중...\n');
    
    // 기존 employees 확인
    const { data: existingEmps, error: empError } = await supabase
      .from('employees')
      .select('*');
    
    if (empError) {
      console.error('employees 조회 오류:', empError);
      return;
    }
    
    // 직원 ID 매핑
    const adminEmployee = existingEmps?.find(emp => emp.employee_id === 'MASLABS-001');
    const eunjungEmployee = existingEmps?.find(emp => emp.employee_id === 'MASLABS-002');
    const jinEmployee = existingEmps?.find(emp => emp.employee_id === 'MASLABS-004');
    
    console.log('직원 ID 매핑:');
    console.log(`- 시스템 관리자: ${adminEmployee?.id}`);
    console.log(`- 이은정(STE): ${eunjungEmployee?.id}`);
    console.log(`- 박진(JIN): ${jinEmployee?.id}`);
    
    // 로컬 데이터 기준 스케줄 추가
    const schedules = [
      // 시스템 관리자 스케줄 (8월 25-27일)
      {
        employee_id: adminEmployee?.id,
        schedule_date: '2025-08-25',
        scheduled_start: '14:00:00',
        scheduled_end: '15:00:00',
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
      {
        employee_id: adminEmployee?.id,
        schedule_date: '2025-08-27',
        scheduled_start: '14:00:00',
        scheduled_end: '15:00:00',
        break_minutes: 0,
        status: 'approved',
        employee_note: '클릭으로 추가됨'
      },
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
        schedule_date: '2025-08-26',
        scheduled_start: '13:00:00',
        scheduled_end: '14:00:00',
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
        scheduled_start: '12:00:00',
        scheduled_end: '13:00:00',
        break_minutes: 0,
        status: 'approved',
        employee_note: '클릭으로 추가됨'
      },
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
      
      // 박진 스케줄 (8월 26일) - 나머지 시간대
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
    
    console.log(`\n총 ${schedules.length}개 스케줄 추가 시작...\n`);
    
    for (const schedule of schedules) {
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
    
    console.log('\n로컬 스케줄 데이터 추가 완료!');
    
  } catch (error) {
    console.error('스케줄 추가 중 오류 발생:', error);
  }
}

addRemainingSchedules();
