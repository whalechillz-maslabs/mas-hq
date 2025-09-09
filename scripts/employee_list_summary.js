const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

async function getEmployeeListSummary() {
  console.log('=== MASLABS 직원 리스트 (입사일 순) ===\n');
  
  try {
    // 직원 정보 조회 (입사일 순으로 정렬)
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select(`
        name,
        employee_id,
        email,
        phone,
        employment_type,
        monthly_salary,
        hourly_rate,
        hire_date,
        departments!inner(name),
        positions!inner(name)
      `)
      .order('hire_date', { ascending: true });
    
    if (employeesError) {
      console.log('❌ 직원 정보 조회 실패:', employeesError);
      return;
    }
    
    // 입사일 순으로 정렬된 직원 리스트 출력
    employees.forEach((emp, index) => {
      const hireDate = new Date(emp.hire_date);
      const formattedHireDate = hireDate.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).replace(/\./g, '-').replace(/\s/g, '');
      
      const salaryInfo = emp.employment_type === 'full_time' 
        ? `월급: ${emp.monthly_salary?.toLocaleString() || '미설정'}원`
        : `시급: ${emp.hourly_rate?.toLocaleString() || '미설정'}원/시간`;
      
      console.log(`${index + 1}. ${emp.name} (${emp.employee_id})`);
      console.log(`   📧 ${emp.email}`);
      console.log(`   📱 ${emp.phone}`);
      console.log(`   🏢 ${emp.departments?.name || '미지정'} / ${emp.positions?.name || '미지정'}`);
      console.log(`   💼 ${emp.employment_type === 'full_time' ? '월급제' : '시급제'}`);
      console.log(`   💰 ${salaryInfo}`);
      console.log(`   📅 입사일: ${formattedHireDate}`);
      console.log('');
    });
    
    // 요약 통계
    console.log('=== 요약 통계 ===');
    console.log(`📊 총 직원 수: ${employees.length}명`);
    
    const fullTimeCount = employees.filter(emp => emp.employment_type === 'full_time').length;
    const partTimeCount = employees.filter(emp => emp.employment_type === 'part_time').length;
    
    console.log(`💼 월급제: ${fullTimeCount}명`);
    console.log(`⏰ 시급제: ${partTimeCount}명`);
    
    // 부서별 통계
    const departmentCount = {};
    employees.forEach(emp => {
      const dept = emp.departments?.name || '미지정';
      departmentCount[dept] = (departmentCount[dept] || 0) + 1;
    });
    
    console.log('\n🏢 부서별 직원 수:');
    Object.entries(departmentCount).forEach(([dept, count]) => {
      console.log(`   ${dept}: ${count}명`);
    });
    
    // 급여 총액
    const monthlyTotal = employees
      .filter(emp => emp.monthly_salary)
      .reduce((sum, emp) => sum + emp.monthly_salary, 0);
    
    console.log(`\n💰 월급 총액: ${monthlyTotal.toLocaleString()}원`);
    
  } catch (error) {
    console.error('❌ 실행 중 오류 발생:', error);
  }
}

// 스크립트가 직접 실행될 때만 실행
if (require.main === module) {
  getEmployeeListSummary().catch(console.error);
}

module.exports = { getEmployeeListSummary };
