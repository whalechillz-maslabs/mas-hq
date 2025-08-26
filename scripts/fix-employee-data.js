const { createClient } = require('@supabase/supabase-js');

// 원격 Supabase 설정
const supabaseUrl = 'https://cgscbtxtgualkfalouwh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8';

const supabase = createClient(supabaseUrl, supabaseKey);

// employee 데이터 수정 및 스케줄 추가
async function fixEmployeeData() {
  try {
    console.log('Employee 데이터 수정 및 스케줄 추가 중...\n');
    
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
    
    // 박진(JIN)을 박진만(CEO)으로 수정
    const parkJin = existingEmps?.find(emp => emp.employee_id === 'MASLABS-004');
    
    if (parkJin) {
      console.log('\n박진(JIN)을 박진만(CEO)으로 수정 중...');
      
      // admin role 찾기
      const adminRole = existingRoles?.find(role => role.name === 'admin');
      const adminRoleId = adminRole?.id;
      
      // 마스팀 department 찾기
      const masDept = existingDepts?.find(dept => dept.code === 'MAS');
      const masDeptId = masDept?.id;
      
      if (adminRoleId && masDeptId) {
        const updateData = {
          name: '박진만(CEO)',
          email: 'park.jinman@maslabs.kr',
          phone: '010-1234-5678',
          hire_date: '2025-01-01',
          department_id: masDeptId,
          role_id: adminRoleId,
          monthly_salary: 5000000,
          pin_code: '1234'
        };
        
        const { error: updateError } = await supabase
          .from('employees')
          .update(updateData)
          .eq('id', parkJin.id);
        
        if (updateError) {
          console.error('박진만 수정 오류:', updateError);
        } else {
          console.log('박진만(CEO) 수정 완료');
          
          // 박진만의 스케줄 추가 (8월 21일)
          console.log('박진만 8월 21일 스케줄 추가 중...');
          
          const parkScheduleData = {
            employee_id: parkJin.id,
            schedule_date: '2025-08-21',
            scheduled_start: '09:00:00',
            scheduled_end: '18:00:00',
            actual_start: null,
            actual_end: null,
            status: 'scheduled'
          };
          
          const { error: scheduleError } = await supabase
            .from('schedules')
            .insert(parkScheduleData);
          
          if (scheduleError) {
            console.error('박진만 스케줄 추가 오류:', scheduleError);
          } else {
            console.log('박진만 8월 21일 스케줄 추가 완료');
          }
        }
      } else {
        console.error('admin role 또는 마스팀 department를 찾을 수 없습니다.');
      }
    }
    
    // 추가 스케줄 데이터 (8월 22일, 23일)
    console.log('\n추가 스케줄 데이터 추가 중...');
    
    const additionalSchedules = [
      {
        employee_id: parkJin?.id,
        schedule_date: '2025-08-22',
        scheduled_start: '09:00:00',
        scheduled_end: '18:00:00',
        actual_start: null,
        actual_end: null,
        status: 'scheduled'
      },
      {
        employee_id: parkJin?.id,
        schedule_date: '2025-08-23',
        scheduled_start: '09:00:00',
        scheduled_end: '18:00:00',
        actual_start: null,
        actual_end: null,
        status: 'scheduled'
      }
    ];
    
    for (const schedule of additionalSchedules) {
      const { error } = await supabase
        .from('schedules')
        .insert(schedule);
      
      if (error) {
        console.error(`스케줄 추가 오류 (${schedule.schedule_date}):`, error);
      } else {
        console.log(`${schedule.schedule_date} 스케줄 추가 완료`);
      }
    }
    
    console.log('\nEmployee 데이터 수정 및 스케줄 추가 완료!');
    
  } catch (error) {
    console.error('데이터 수정 중 오류 발생:', error);
  }
}

fixEmployeeData();

