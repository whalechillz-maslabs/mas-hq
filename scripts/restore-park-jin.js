const { createClient } = require('@supabase/supabase-js');

// 원격 Supabase 설정
const supabaseUrl = 'https://cgscbtxtgualkfalouwh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8';

const supabase = createClient(supabaseUrl, supabaseKey);

// 박진의 로컬 정보를 Supabase로 복원
async function restoreParkJin() {
  try {
    console.log('박진의 로컬 정보를 Supabase로 복원 중...\n');
    
    // 기존 employees 확인
    const { data: existingEmps, error: empError } = await supabase
      .from('employees')
      .select('*');
    
    if (empError) {
      console.error('employees 조회 오류:', empError);
      return;
    }
    
    console.log('현재 employees:');
    existingEmps?.forEach(emp => {
      console.log(`- ${emp.name} (${emp.employee_id}): ${emp.id}`);
    });
    
    // 기존 departments 확인
    const { data: existingDepts } = await supabase
      .from('departments')
      .select('*');
    
    // 기존 roles 확인
    const { data: existingRoles } = await supabase
      .from('roles')
      .select('*');
    
    // 기존 positions 확인
    const { data: existingPositions } = await supabase
      .from('positions')
      .select('*');
    
    // 박진만(CEO)을 박진(JIN)으로 복원
    const parkEmployee = existingEmps?.find(emp => emp.employee_id === 'MASLABS-004');
    
    if (parkEmployee) {
      console.log('\n박진만(CEO)을 박진(JIN)으로 복원 중...');
      
      // part_time role 찾기 (로컬 데이터 기준)
      const partTimeRole = existingRoles?.find(role => role.name === 'part_time');
      const partTimeRoleId = partTimeRole?.id;
      
      // 마스팀 department 찾기 (로컬 데이터 기준)
      const masDept = existingDepts?.find(dept => dept.code === 'MAS');
      const masDeptId = masDept?.id;
      
      // 사원 position 찾기 (로컬 데이터 기준)
      const staffPosition = existingPositions?.find(pos => pos.name === '사원');
      const staffPositionId = staffPosition?.id;
      
      if (partTimeRoleId && masDeptId && staffPositionId) {
        // 로컬 데이터 기준으로 박진 정보 복원
        const updateData = {
          name: '박진(JIN)',
          email: 'park.jin@maslabs.kr',
          phone: '010-9132-4337',
          password_hash: '91324337',
          hire_date: '2025-07-29',
          department_id: masDeptId,
          position_id: staffPositionId,
          role_id: partTimeRoleId,
          employment_type: 'full_time',
          hourly_rate: 12000.00,
          monthly_salary: null,
          status: 'active',
          is_active: true,
          nickname: 'JIN',
          pin_code: '1234'
        };
        
        const { error: updateError } = await supabase
          .from('employees')
          .update(updateData)
          .eq('id', parkEmployee.id);
        
        if (updateError) {
          console.error('박진 복원 오류:', updateError);
        } else {
          console.log('박진(JIN) 복원 완료');
          
          // 기존 박진만 스케줄 삭제 (8월 21-23일)
          console.log('기존 박진만 스케줄 삭제 중...');
          const { error: deleteError } = await supabase
            .from('schedules')
            .delete()
            .eq('employee_id', parkEmployee.id)
            .in('schedule_date', ['2025-08-21', '2025-08-22', '2025-08-23']);
          
          if (deleteError) {
            console.error('기존 스케줄 삭제 오류:', deleteError);
          } else {
            console.log('기존 스케줄 삭제 완료');
          }
          
          // 박진의 로컬 스케줄 추가 (8월 26일)
          console.log('박진 8월 26일 스케줄 추가 중...');
          
          const parkSchedules = [
            {
              employee_id: parkEmployee.id,
              schedule_date: '2025-08-26',
              scheduled_start: '10:00:00',
              scheduled_end: '11:00:00',
              actual_start: null,
              actual_end: null,
              break_minutes: 0,
              status: 'approved',
              employee_note: '관리자가 추가함'
            },
            {
              employee_id: parkEmployee.id,
              schedule_date: '2025-08-26',
              scheduled_start: '11:00:00',
              scheduled_end: '12:00:00',
              actual_start: null,
              actual_end: null,
              break_minutes: 0,
              status: 'approved',
              employee_note: '관리자가 추가함'
            },
            {
              employee_id: parkEmployee.id,
              schedule_date: '2025-08-26',
              scheduled_start: '12:00:00',
              scheduled_end: '13:00:00',
              actual_start: null,
              actual_end: null,
              break_minutes: 0,
              status: 'approved',
              employee_note: '관리자가 추가함'
            }
          ];
          
          for (const schedule of parkSchedules) {
            const { error: scheduleError } = await supabase
              .from('schedules')
              .insert(schedule);
            
            if (scheduleError) {
              console.error(`박진 스케줄 추가 오류 (${schedule.scheduled_start}-${schedule.scheduled_end}):`, scheduleError);
            } else {
              console.log(`박진 8월 26일 ${schedule.scheduled_start}-${schedule.scheduled_end} 스케줄 추가 완료`);
            }
          }
        }
      } else {
        console.error('필요한 role, department 또는 position을 찾을 수 없습니다.');
        console.log('partTimeRoleId:', partTimeRoleId);
        console.log('masDeptId:', masDeptId);
        console.log('staffPositionId:', staffPositionId);
      }
    } else {
      console.error('MASLABS-004 직원을 찾을 수 없습니다.');
    }
    
    console.log('\n박진(JIN) 복원 완료!');
    
  } catch (error) {
    console.error('데이터 복원 중 오류 발생:', error);
  }
}

restoreParkJin();
