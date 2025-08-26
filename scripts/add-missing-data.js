const { createClient } = require('@supabase/supabase-js');

// 원격 Supabase 설정
const supabaseUrl = 'https://cgscbtxtgualkfalouwh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8';

const supabase = createClient(supabaseUrl, supabaseKey);

// 누락된 데이터 추가
async function addMissingData() {
  try {
    console.log('누락된 데이터 추가 중...\n');
    
    // 기존 departments 확인
    const { data: existingDepts } = await supabase
      .from('departments')
      .select('*');
    
    // 기존 employees 확인
    const { data: existingEmps } = await supabase
      .from('employees')
      .select('*');
    
    // 기존 roles 확인
    const { data: existingRoles } = await supabase
      .from('roles')
      .select('*');
    
    // 1. 마스팀과 싱싱팀 추가 (departments)
    const missingDepts = [
      {
        id: 'b01ab0e6-66ee-4a8d-818e-1e167effb597',
        name: '마스팀',
        code: 'MAS',
        description: '마스팀 운영'
      },
      {
        id: 'b0bff302-f3c9-4086-b814-db8a2f871b11',
        name: '싱싱팀',
        code: 'SING',
        description: '싱싱팀 운영'
      }
    ];
    
    for (const dept of missingDepts) {
      const exists = existingDepts?.some(d => d.code === dept.code);
      if (!exists) {
        console.log(`${dept.name} 부서 추가 중...`);
        const { error } = await supabase
          .from('departments')
          .insert(dept);
        
        if (error) {
          console.error(`${dept.name} 추가 오류:`, error);
        } else {
          console.log(`${dept.name} 추가 완료`);
        }
      } else {
        console.log(`${dept.name} 이미 존재함`);
      }
    }
    
    // 2. 박진만(CEO) 추가 (employees)
    const parkJinmanExists = existingEmps?.some(emp => emp.employee_id === 'MASLABS-001');
    
    if (!parkJinmanExists) {
      console.log('박진만(CEO) 추가 중...');
      
      // admin role 찾기
      const adminRole = existingRoles?.find(role => role.name === 'admin');
      const adminRoleId = adminRole?.id;
      
      // 마스팀 department 찾기
      const masDept = existingDepts?.find(dept => dept.code === 'MAS');
      const masDeptId = masDept?.id;
      
      if (adminRoleId && masDeptId) {
        const parkJinmanData = {
          id: '1e7e6331-3821-4e56-90d5-f9c958de99e3',
          employee_id: 'MASLABS-001',
          email: 'park.jinman@maslabs.kr',
          name: '박진만(CEO)',
          phone: '010-1234-5678',
          hire_date: '2025-01-01',
          department_id: masDeptId,
          role_id: adminRoleId,
          position_id: null,
          monthly_salary: 5000000,
          employment_type: 'full_time',
          status: 'active',
          pin_code: '1234'
        };
        
        const { error } = await supabase
          .from('employees')
          .insert(parkJinmanData);
        
        if (error) {
          console.error('박진만 추가 오류:', error);
        } else {
          console.log('박진만(CEO) 추가 완료');
        }
      } else {
        console.error('admin role 또는 마스팀 department를 찾을 수 없습니다.');
      }
    } else {
      console.log('박진만(CEO) 이미 존재함');
    }
    
    // 3. 추가 스케줄 데이터 추가
    console.log('추가 스케줄 데이터 확인 중...');
    
    // 박진만의 스케줄 추가 (8월 21일)
    const parkJinmanId = '1e7e6331-3821-4e56-90d5-f9c958de99e3';
    const parkScheduleData = {
      employee_id: parkJinmanId,
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
    
    console.log('\n누락된 데이터 추가 완료!');
    
  } catch (error) {
    console.error('데이터 추가 중 오류 발생:', error);
  }
}

addMissingData();

