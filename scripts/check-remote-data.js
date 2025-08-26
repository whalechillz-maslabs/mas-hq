const { createClient } = require('@supabase/supabase-js');

// 원격 Supabase 설정
const supabaseUrl = 'https://cgscbtxtgualkfalouwh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8';

const supabase = createClient(supabaseUrl, supabaseKey);

// 원격 데이터 확인
async function checkRemoteData() {
  try {
    console.log('원격 Supabase 데이터 상태 확인 중...\n');
    
    // departments 확인
    console.log('=== departments 테이블 ===');
    const { data: depts, error: deptError } = await supabase
      .from('departments')
      .select('*');
    
    if (deptError) {
      console.error('departments 조회 오류:', deptError);
    } else {
      console.log(`총 ${depts?.length || 0}개 부서:`);
      depts?.forEach(dept => {
        console.log(`- ${dept.name} (${dept.code}): ${dept.description}`);
      });
    }
    
    console.log('\n=== roles 테이블 ===');
    const { data: roles, error: roleError } = await supabase
      .from('roles')
      .select('*');
    
    if (roleError) {
      console.error('roles 조회 오류:', roleError);
    } else {
      console.log(`총 ${roles?.length || 0}개 역할:`);
      roles?.forEach(role => {
        console.log(`- ${role.name}: ${role.description}`);
      });
    }
    
    console.log('\n=== employees 테이블 ===');
    const { data: emps, error: empError } = await supabase
      .from('employees')
      .select('*');
    
    if (empError) {
      console.error('employees 조회 오류:', empError);
    } else {
      console.log(`총 ${emps?.length || 0}명 직원:`);
      emps?.forEach(emp => {
        console.log(`- ${emp.name} (${emp.employee_id}): ${emp.email}`);
      });
    }
    
    console.log('\n=== schedules 테이블 ===');
    const { data: schedules, error: scheduleError } = await supabase
      .from('schedules')
      .select('*');
    
    if (scheduleError) {
      console.error('schedules 조회 오류:', scheduleError);
    } else {
      console.log(`총 ${schedules?.length || 0}개 스케줄:`);
      schedules?.forEach(schedule => {
        console.log(`- ${schedule.schedule_date} ${schedule.scheduled_start}-${schedule.scheduled_end} (직원: ${schedule.employee_id})`);
      });
    }
    
    console.log('\n=== positions 테이블 ===');
    const { data: positions, error: posError } = await supabase
      .from('positions')
      .select('*');
    
    if (posError) {
      console.error('positions 조회 오류:', posError);
    } else {
      console.log(`총 ${positions?.length || 0}개 직책:`);
      positions?.forEach(pos => {
        console.log(`- ${pos.name}: ${pos.description}`);
      });
    }
    
    console.log('\n=== operation_types 테이블 ===');
    const { data: opTypes, error: opError } = await supabase
      .from('operation_types')
      .select('*');
    
    if (opError) {
      console.error('operation_types 조회 오류:', opError);
    } else {
      console.log(`총 ${opTypes?.length || 0}개 업무 유형:`);
      opTypes?.forEach(op => {
        console.log(`- ${op.name}: ${op.description}`);
      });
    }

  } catch (error) {
    console.error('데이터 확인 중 오류 발생:', error);
  }
}

checkRemoteData();

