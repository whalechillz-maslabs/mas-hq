const { createClient } = require('@supabase/supabase-js');

// Supabase 설정
const supabaseUrl = 'https://cgscbtxtgualkfalouwh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8';
const supabase = createClient(supabaseUrl, supabaseKey);

async function addChoiSchedules() {
  try {
    console.log('🚀 최형호 8월 25일~29일 스케줄 추가 시작...');

    // 최형호 직원 ID 조회
    const { data: employees, error: employeeError } = await supabase
      .from('employees')
      .select('id, name, employee_id')
      .eq('name', '최형호');

    if (employeeError) {
      console.error('❌ 직원 조회 오류:', employeeError);
      return;
    }

    if (!employees || employees.length === 0) {
      console.error('❌ 최형호 직원을 찾을 수 없습니다.');
      return;
    }

    const choiEmployee = employees[0];
    console.log('✅ 최형호 직원 정보:', choiEmployee);

    // 기존 8월 25일~29일 스케줄 삭제
    const { error: deleteError } = await supabase
      .from('schedules')
      .delete()
      .eq('employee_id', choiEmployee.id)
      .gte('schedule_date', '2025-08-25')
      .lte('schedule_date', '2025-08-29');

    if (deleteError) {
      console.error('❌ 기존 스케줄 삭제 오류:', deleteError);
      return;
    }

    console.log('✅ 기존 8월 25일~29일 스케줄 삭제 완료');

    // 새로운 스케줄 데이터
    const schedules = [
      {
        date: '2025-08-25',
        day: '월',
        start: '10:00',
        end: '17:00',
        hours: 6
      },
      {
        date: '2025-08-26',
        day: '화',
        start: '10:00',
        end: '18:00',
        hours: 7
      },
      {
        date: '2025-08-27',
        day: '수',
        start: '10:00',
        end: '17:00',
        hours: 6
      },
      {
        date: '2025-08-28',
        day: '목',
        start: '10:00',
        end: '17:00',
        hours: 6
      },
      {
        date: '2025-08-29',
        day: '금',
        start: '10:00',
        end: '17:00',
        hours: 6
      }
    ];

    // 스케줄 추가
    const schedulesToInsert = schedules.map(schedule => {
      // 점심시간 제외 계산
      const breakMinutes = schedule.hours === 7 ? 60 : 60; // 7시간 근무는 1시간 점심, 6시간 근무도 1시간 점심
      
      return {
        employee_id: choiEmployee.id,
        schedule_date: schedule.date,
        scheduled_start: schedule.start,
        scheduled_end: schedule.end,
        break_minutes: breakMinutes,
        status: 'approved',
        employee_note: `8월 근무 - ${schedule.hours}시간 (점심시간 제외)`
      };
    });

    const { data: insertedSchedules, error: insertError } = await supabase
      .from('schedules')
      .insert(schedulesToInsert)
      .select();

    if (insertError) {
      console.error('❌ 스케줄 추가 오류:', insertError);
      return;
    }

    console.log('✅ 스케줄 추가 완료!');
    console.log('📋 추가된 스케줄:');
    
    insertedSchedules.forEach(schedule => {
      const start = new Date(`${schedule.schedule_date} ${schedule.scheduled_start}`);
      const end = new Date(`${schedule.schedule_date} ${schedule.scheduled_end}`);
      const totalHours = (end - start) / (1000 * 60 * 60);
      const netHours = totalHours - (schedule.break_minutes / 60);
      
      console.log(`  ${schedule.schedule_date} (${schedule.scheduled_start} - ${schedule.scheduled_end}) - ${netHours}시간 (점심 ${schedule.break_minutes}분 제외)`);
    });

    // 총 근무시간 계산
    const totalNetHours = insertedSchedules.reduce((total, schedule) => {
      const start = new Date(`${schedule.schedule_date} ${schedule.scheduled_start}`);
      const end = new Date(`${schedule.schedule_date} ${schedule.scheduled_end}`);
      const totalHours = (end - start) / (1000 * 60 * 60);
      const netHours = totalHours - (schedule.break_minutes / 60);
      return total + netHours;
    }, 0);

    console.log(`\n📊 총 근무시간: ${totalNetHours}시간 (점심시간 제외)`);

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

addChoiSchedules();
