const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

async function checkAllEmployees() {
  console.log('=== 현재 저장된 직원 목록 전체 데이터 ===\n');
  
  try {
    // 1. 직원 기본 정보 조회
    console.log('1. 직원 기본 정보:');
    console.log('='.repeat(80));
    
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select(`
        id,
        name,
        employee_id,
        email,
        phone,
        password_hash,
        pin_code,
        nickname,
        employment_type,
        monthly_salary,
        hourly_rate,
        hire_date,
        status,
        is_active,
        created_at,
        updated_at,
        departments!inner(name),
        positions!inner(name)
      `)
      .order('employee_id');
    
    if (employeesError) {
      console.log('❌ 직원 정보 조회 실패:', employeesError);
      return;
    }
    
    employees.forEach((emp, index) => {
      console.log(`\n${index + 1}. ${emp.name} (${emp.employee_id})`);
      console.log(`   📧 이메일: ${emp.email}`);
      console.log(`   📱 전화번호: ${emp.phone}`);
      console.log(`   🔐 비밀번호: ${emp.password_hash}`);
      console.log(`   🔢 핀번호: ${emp.pin_code}`);
      console.log(`   👤 닉네임: ${emp.nickname}`);
      console.log(`   💼 고용형태: ${emp.employment_type}`);
      console.log(`   💰 월급: ${emp.monthly_salary?.toLocaleString() || 'null'}원`);
      console.log(`   ⏰ 시급: ${emp.hourly_rate?.toLocaleString() || 'null'}원`);
      console.log(`   🏢 부서: ${emp.departments?.name || '미지정'}`);
      console.log(`   📋 직책: ${emp.positions?.name || '미지정'}`);
      console.log(`   📅 입사일: ${emp.hire_date}`);
      console.log(`   📊 상태: ${emp.status}`);
      console.log(`   ✅ 활성: ${emp.is_active ? '예' : '아니오'}`);
      console.log(`   🕐 생성일: ${emp.created_at}`);
      console.log(`   🕐 수정일: ${emp.updated_at}`);
    });
    
    // 2. 시급 데이터 조회
    console.log('\n\n2. 시급 데이터:');
    console.log('='.repeat(80));
    
    const { data: wages, error: wagesError } = await supabase
      .from('hourly_wages')
      .select(`
        id,
        base_wage,
        overtime_multiplier,
        night_multiplier,
        holiday_multiplier,
        effective_start_date,
        effective_end_date,
        status,
        created_at,
        employees!inner(name, employee_id)
      `)
      .order('effective_start_date', { ascending: false });
    
    if (wagesError) {
      console.log('❌ 시급 데이터 조회 실패:', wagesError);
    } else {
      if (wages && wages.length > 0) {
        wages.forEach((wage, index) => {
          console.log(`\n${index + 1}. ${wage.employees.name} (${wage.employees.employee_id})`);
          console.log(`   💰 기본 시급: ${wage.base_wage.toLocaleString()}원`);
          console.log(`   ⏰ 초과근무 배수: ${wage.overtime_multiplier}`);
          console.log(`   🌙 야간근무 배수: ${wage.night_multiplier}`);
          console.log(`   🎉 휴일근무 배수: ${wage.holiday_multiplier}`);
          console.log(`   📅 적용 시작일: ${wage.effective_start_date}`);
          console.log(`   📅 적용 종료일: ${wage.effective_end_date || '무제한'}`);
          console.log(`   📊 상태: ${wage.status}`);
          console.log(`   🕐 생성일: ${wage.created_at}`);
        });
      } else {
        console.log('시급 데이터가 없습니다.');
      }
    }
    
    // 3. 요약 정보
    console.log('\n\n3. 요약 정보:');
    console.log('='.repeat(80));
    console.log(`📊 총 직원 수: ${employees.length}명`);
    
    const fullTimeCount = employees.filter(emp => emp.employment_type === 'full_time').length;
    const partTimeCount = employees.filter(emp => emp.employment_type === 'part_time').length;
    
    console.log(`💼 월급제 직원: ${fullTimeCount}명`);
    console.log(`⏰ 시급제 직원: ${partTimeCount}명`);
    console.log(`💰 시급 데이터: ${wages?.length || 0}건`);
    
    // 4. 부서별 직원 수
    console.log('\n4. 부서별 직원 수:');
    console.log('='.repeat(80));
    
    const departmentCount = {};
    employees.forEach(emp => {
      const dept = emp.departments?.name || '미지정';
      departmentCount[dept] = (departmentCount[dept] || 0) + 1;
    });
    
    Object.entries(departmentCount).forEach(([dept, count]) => {
      console.log(`🏢 ${dept}: ${count}명`);
    });
    
    // 5. 급여 현황
    console.log('\n5. 급여 현황:');
    console.log('='.repeat(80));
    
    const monthlyTotal = employees
      .filter(emp => emp.monthly_salary)
      .reduce((sum, emp) => sum + emp.monthly_salary, 0);
    
    const hourlyEmployees = employees.filter(emp => emp.hourly_rate);
    
    console.log(`💰 월급 총액: ${monthlyTotal.toLocaleString()}원`);
    console.log(`⏰ 시급제 직원: ${hourlyEmployees.length}명`);
    
    hourlyEmployees.forEach(emp => {
      console.log(`   - ${emp.name}: ${emp.hourly_rate.toLocaleString()}원/시간`);
    });
    
  } catch (error) {
    console.error('❌ 실행 중 오류 발생:', error);
  }
}

// 스크립트가 직접 실행될 때만 실행
if (require.main === module) {
  checkAllEmployees().catch(console.error);
}

module.exports = { checkAllEmployees };
