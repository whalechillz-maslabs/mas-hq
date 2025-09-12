const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// .env.local 파일에서 환경 변수 읽기
const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    // 따옴표와 개행 문자 제거
    envVars[key.trim()] = value.trim().replace(/['"]/g, '');
  }
});

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
);

async function checkAllEmployees() {
  console.log('🔍 모든 직원 정보 확인 중...\n');

  try {
    const { data: employees, error } = await supabase
      .from('employees')
      .select('*')
      .order('name');

    if (error) {
      console.error('❌ 직원 조회 실패:', error);
      return;
    }

    if (!employees || employees.length === 0) {
      console.log('❌ 직원이 없습니다.');
      return;
    }

    console.log(`📋 총 ${employees.length}명의 직원:\n`);

    employees.forEach(employee => {
      console.log(`👤 ${employee.name} (ID: ${employee.id}, 코드: ${employee.employee_id})`);
    });

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

checkAllEmployees();