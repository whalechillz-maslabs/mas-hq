const { createClient } = require('@supabase/supabase-js');

// 로컬 Supabase 설정
const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

// 로컬 데이터 확인
async function checkLocalData() {
  try {
    console.log('로컬 데이터베이스 상태 확인 중...\n');
    
    // 1. 직원 데이터 확인
    console.log('=== 직원 데이터 ===');
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('*');
    
    if (empError) {
      console.error('직원 데이터 조회 오류:', empError);
    } else {
      console.log(`총 ${employees?.length || 0}명 직원:`);
      employees?.forEach(emp => {
        console.log(`- ${emp.name} (${emp.employee_id}): ${emp.phone} / ${emp.password_hash}`);
      });
    }
    
    // 2. 부서 데이터 확인
    console.log('\n=== 부서 데이터 ===');
    const { data: departments, error: deptError } = await supabase
      .from('departments')
      .select('*');
    
    if (deptError) {
      console.error('부서 데이터 조회 오류:', deptError);
    } else {
      console.log(`총 ${departments?.length || 0}개 부서:`);
      departments?.forEach(dept => {
        console.log(`- ${dept.name} (${dept.code}): ${dept.description}`);
      });
    }
    
    // 3. 역할 데이터 확인
    console.log('\n=== 역할 데이터 ===');
    const { data: roles, error: roleError } = await supabase
      .from('roles')
      .select('*');
    
    if (roleError) {
      console.error('역할 데이터 조회 오류:', roleError);
    } else {
      console.log(`총 ${roles?.length || 0}개 역할:`);
      roles?.forEach(role => {
        console.log(`- ${role.name}: ${role.description}`);
      });
    }
    
    // 4. 스케줄 데이터 확인
    console.log('\n=== 스케줄 데이터 ===');
    const { data: schedules, error: scheduleError } = await supabase
      .from('schedules')
      .select('*');
    
    if (scheduleError) {
      console.error('스케줄 데이터 조회 오류:', scheduleError);
    } else {
      console.log(`총 ${schedules?.length || 0}개 스케줄:`);
      schedules?.forEach(schedule => {
        console.log(`- ${schedule.schedule_date} ${schedule.scheduled_start}-${schedule.scheduled_end} (직원: ${schedule.employee_id})`);
      });
    }
    
    // 5. 시스템 관리자 계정 상세 확인
    console.log('\n=== 시스템 관리자 계정 상세 ===');
    const adminEmployee = employees?.find(emp => emp.employee_id === 'MASLABS-001');
    if (adminEmployee) {
      console.log('시스템 관리자 정보:');
      console.log(`- ID: ${adminEmployee.id}`);
      console.log(`- 직원번호: ${adminEmployee.employee_id}`);
      console.log(`- 이름: ${adminEmployee.name}`);
      console.log(`- 전화번호: ${adminEmployee.phone}`);
      console.log(`- 비밀번호 해시: ${adminEmployee.password_hash}`);
      console.log(`- 이메일: ${adminEmployee.email}`);
      console.log(`- 상태: ${adminEmployee.status}`);
      console.log(`- 활성화: ${adminEmployee.is_active}`);
    } else {
      console.log('❌ 시스템 관리자 계정을 찾을 수 없습니다.');
    }
    
    console.log('\n로컬 데이터베이스 상태 확인 완료!');
    
  } catch (error) {
    console.error('데이터 확인 중 오류 발생:', error);
  }
}

checkLocalData();
