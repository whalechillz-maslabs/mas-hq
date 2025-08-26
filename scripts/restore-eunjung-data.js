const { createClient } = require('@supabase/supabase-js');

// 원격 Supabase 설정
const supabaseUrl = 'https://cgscbtxtgualkfalouwh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8';

const supabase = createClient(supabaseUrl, supabaseKey);

// 이은정의 로컬 정보를 Supabase로 복원
async function restoreEunjungData() {
  try {
    console.log('이은정의 로컬 정보를 Supabase로 복원 중...\n');
    
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
    
    // 이은정 찾기
    const eunjungEmployee = existingEmps?.find(emp => emp.employee_id === 'MASLABS-002');
    
    if (eunjungEmployee) {
      console.log('\n이은정 정보 복원 중...');
      
      // manager role 찾기 (로컬 데이터 기준)
      const managerRole = existingRoles?.find(role => role.name === 'manager');
      const managerRoleId = managerRole?.id;
      
      // 경영지원팀 department 찾기 (로컬 데이터 기준)
      const mgmtDept = existingDepts?.find(dept => dept.code === 'MGMT');
      const mgmtDeptId = mgmtDept?.id;
      
      // 차장 position 찾기 (로컬 데이터 기준)
      const deputyPosition = existingPositions?.find(pos => pos.name === '차장');
      const deputyPositionId = deputyPosition?.id;
      
      if (managerRoleId && mgmtDeptId && deputyPositionId) {
        // 로컬 데이터 기준으로 이은정 정보 복원
        const updateData = {
          name: '이은정(STE)',
          email: 'lee.eunjung@maslabs.kr',
          phone: '010-3243-3099',
          password_hash: '32433099',
          hire_date: '2025-01-01',
          department_id: mgmtDeptId,
          position_id: deputyPositionId,
          role_id: managerRoleId,
          employment_type: 'full_time',
          hourly_rate: null,
          monthly_salary: null,
          status: 'active',
          is_active: true,
          nickname: null,
          pin_code: '1234'
        };
        
        const { error: updateError } = await supabase
          .from('employees')
          .update(updateData)
          .eq('id', eunjungEmployee.id);
        
        if (updateError) {
          console.error('이은정 복원 오류:', updateError);
        } else {
          console.log('이은정 복원 완료');
          
          // 이은정의 로컬 스케줄 추가
          console.log('이은정 스케줄 추가 중...');
          
          const eunjungSchedules = [
            // 8월 25일 스케줄
            {
              employee_id: eunjungEmployee.id,
              schedule_date: '2025-08-25',
              scheduled_start: '10:00:00',
              scheduled_end: '11:00:00',
              break_minutes: 0,
              status: 'approved',
              employee_note: '관리자가 추가함'
            },
            {
              employee_id: eunjungEmployee.id,
              schedule_date: '2025-08-25',
              scheduled_start: '11:00:00',
              scheduled_end: '12:00:00',
              break_minutes: 0,
              status: 'approved',
              employee_note: '관리자가 추가함'
            },
            {
              employee_id: eunjungEmployee.id,
              schedule_date: '2025-08-25',
              scheduled_start: '12:00:00',
              scheduled_end: '13:00:00',
              break_minutes: 0,
              status: 'approved',
              employee_note: '관리자가 추가함'
            }
          ];
          
          for (const schedule of eunjungSchedules) {
            const { error: scheduleError } = await supabase
              .from('schedules')
              .insert(schedule);
            
            if (scheduleError) {
              if (scheduleError.code === '23505') { // 중복 키 오류
                console.log(`중복 스케줄 건너뜀: ${schedule.schedule_date} ${schedule.scheduled_start}-${schedule.scheduled_end}`);
              } else {
                console.error(`스케줄 추가 오류 (${schedule.schedule_date} ${schedule.scheduled_start}-${schedule.scheduled_end}):`, scheduleError.message);
              }
            } else {
              console.log(`스케줄 추가 완료: ${schedule.schedule_date} ${schedule.scheduled_start}-${schedule.scheduled_end}`);
            }
          }
        }
      } else {
        console.error('필요한 role, department 또는 position을 찾을 수 없습니다.');
        console.log('managerRoleId:', managerRoleId);
        console.log('mgmtDeptId:', mgmtDeptId);
        console.log('deputyPositionId:', deputyPositionId);
      }
    } else {
      console.error('MASLABS-002 직원을 찾을 수 없습니다.');
    }
    
    console.log('\n이은정 복원 완료!');
    
  } catch (error) {
    console.error('데이터 복원 중 오류 발생:', error);
  }
}

restoreEunjungData();
