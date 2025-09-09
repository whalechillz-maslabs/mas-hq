const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

async function restoreChoiHyungHo() {
  console.log('=== 최형호 데이터 복구 시작 ===');
  
  try {
    // 1. 최형호 직원 정보 확인 및 수정
    console.log('\n1. 최형호 직원 정보 확인 중...');
    const { data: choiEmployee, error: choiError } = await supabase
      .from('employees')
      .select('*')
      .eq('name', '최형호')
      .single();
    
    if (choiError) {
      console.log('❌ 최형호 직원 정보 확인 실패:', choiError);
      return;
    }
    
    console.log('현재 최형호 정보:', {
      name: choiEmployee.name,
      employee_id: choiEmployee.employee_id,
      employment_type: choiEmployee.employment_type,
      hourly_rate: choiEmployee.hourly_rate,
      monthly_salary: choiEmployee.monthly_salary
    });
    
    // 2. 최형호 정보 수정 (파트타임, 시급 12000원)
    console.log('\n2. 최형호 정보 수정 중...');
    const { error: updateError } = await supabase
      .from('employees')
      .update({
        employment_type: 'part_time',
        hourly_rate: 12000,
        monthly_salary: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', choiEmployee.id);
    
    if (updateError) {
      console.log('❌ 최형호 정보 수정 실패:', updateError);
      return;
    }
    
    console.log('✅ 최형호 정보 수정 완료 (파트타임, 시급 12,000원)');
    
    // 3. 최형호 8월 스케줄 생성
    console.log('\n3. 최형호 8월 스케줄 생성 중...');
    
    const augustSchedules = [
      // 8월 1일 (금) 14:30-15:30 (1시간)
      {
        employee_id: choiEmployee.id,
        date: '2025-08-01',
        start_time: '14:30',
        end_time: '15:30',
        work_hours: 1.0,
        is_workday: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      // 8월 4일 (월) 9:00-12:00, 13:00-17:00 (7시간)
      {
        employee_id: choiEmployee.id,
        date: '2025-08-04',
        start_time: '09:00',
        end_time: '12:00',
        work_hours: 3.0,
        is_workday: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        employee_id: choiEmployee.id,
        date: '2025-08-04',
        start_time: '13:00',
        end_time: '17:00',
        work_hours: 4.0,
        is_workday: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      // 8월 6일 (수) 9:00-12:00, 13:00-16:00 (6시간)
      {
        employee_id: choiEmployee.id,
        date: '2025-08-06',
        start_time: '09:00',
        end_time: '12:00',
        work_hours: 3.0,
        is_workday: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        employee_id: choiEmployee.id,
        date: '2025-08-06',
        start_time: '13:00',
        end_time: '16:00',
        work_hours: 3.0,
        is_workday: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      // 8월 7일 (목) 9:00-12:00, 13:00-17:00 (7시간)
      {
        employee_id: choiEmployee.id,
        date: '2025-08-07',
        start_time: '09:00',
        end_time: '12:00',
        work_hours: 3.0,
        is_workday: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        employee_id: choiEmployee.id,
        date: '2025-08-07',
        start_time: '13:00',
        end_time: '17:00',
        work_hours: 4.0,
        is_workday: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      // 8월 8일 (금) 9:00-12:00, 13:00-16:30 (6.5시간)
      {
        employee_id: choiEmployee.id,
        date: '2025-08-08',
        start_time: '09:00',
        end_time: '12:00',
        work_hours: 3.0,
        is_workday: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        employee_id: choiEmployee.id,
        date: '2025-08-08',
        start_time: '13:00',
        end_time: '16:30',
        work_hours: 3.5,
        is_workday: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    // 스케줄 삽입
    const { error: scheduleError } = await supabase
      .from('schedules')
      .insert(augustSchedules);
    
    if (scheduleError) {
      console.log('❌ 최형호 8월 스케줄 생성 실패:', scheduleError);
    } else {
      console.log(`✅ 최형호 8월 스케줄 ${augustSchedules.length}개 생성 완료`);
    }
    
    // 4. 최형호 9월 스케줄 생성 (월-금 9:00-12:00, 13:00-17:00)
    console.log('\n4. 최형호 9월 스케줄 생성 중...');
    
    const septemberSchedules = [];
    const septemberDates = [
      '2025-09-01', '2025-09-02', '2025-09-03', '2025-09-04', '2025-09-05',
      '2025-09-08', '2025-09-09', '2025-09-10', '2025-09-11', '2025-09-12',
      '2025-09-15', '2025-09-16', '2025-09-17', '2025-09-18', '2025-09-19',
      '2025-09-22', '2025-09-23', '2025-09-24', '2025-09-25', '2025-09-26',
      '2025-09-29', '2025-09-30'
    ];
    
    for (const date of septemberDates) {
      // 오전 근무 (9:00-12:00, 3시간)
      septemberSchedules.push({
        employee_id: choiEmployee.id,
        date: date,
        start_time: '09:00',
        end_time: '12:00',
        work_hours: 3.0,
        is_workday: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      
      // 오후 근무 (13:00-17:00, 4시간)
      septemberSchedules.push({
        employee_id: choiEmployee.id,
        date: date,
        start_time: '13:00',
        end_time: '17:00',
        work_hours: 4.0,
        is_workday: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    // 9월 스케줄 삽입
    const { error: septScheduleError } = await supabase
      .from('schedules')
      .insert(septemberSchedules);
    
    if (septScheduleError) {
      console.log('❌ 최형호 9월 스케줄 생성 실패:', septScheduleError);
    } else {
      console.log(`✅ 최형호 9월 스케줄 ${septemberSchedules.length}개 생성 완료`);
    }
    
    // 5. 최형호 총 근무시간 계산
    console.log('\n5. 최형호 총 근무시간 계산 중...');
    
    const { data: allSchedules, error: totalError } = await supabase
      .from('schedules')
      .select('work_hours')
      .eq('employee_id', choiEmployee.id);
    
    if (totalError) {
      console.log('❌ 총 근무시간 계산 실패:', totalError);
    } else {
      const totalHours = allSchedules.reduce((sum, schedule) => sum + schedule.work_hours, 0);
      console.log(`✅ 최형호 총 근무시간: ${totalHours}시간`);
    }
    
    // 6. 최종 확인
    console.log('\n6. 최형호 최종 정보 확인 중...');
    const { data: finalChoi, error: finalError } = await supabase
      .from('employees')
      .select('name, employee_id, employment_type, hourly_rate, monthly_salary')
      .eq('name', '최형호')
      .single();
    
    if (finalError) {
      console.log('❌ 최종 정보 확인 실패:', finalError);
    } else {
      console.log('\n=== 최형호 최종 정보 ===');
      console.log(`이름: ${finalChoi.name}`);
      console.log(`직원 ID: ${finalChoi.employee_id}`);
      console.log(`고용 형태: ${finalChoi.employment_type}`);
      console.log(`시급: ${finalChoi.hourly_rate?.toLocaleString() || '미설정'}원`);
      console.log(`월급: ${finalChoi.monthly_salary?.toLocaleString() || '미설정'}원`);
    }
    
    console.log('\n=== 최형호 데이터 복구 완료 ===');
    
  } catch (error) {
    console.error('❌ 실행 중 오류 발생:', error);
  }
}

// 스크립트가 직접 실행될 때만 실행
if (require.main === module) {
  restoreChoiHyungHo().catch(console.error);
}

module.exports = { restoreChoiHyungHo };
