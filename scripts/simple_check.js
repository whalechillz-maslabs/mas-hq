const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// .env.local 파일에서 환경 변수 읽기
const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim().replace(/['"]/g, '');
  }
});

console.log('환경 변수 확인:');
console.log('SUPABASE_URL:', envVars.NEXT_PUBLIC_SUPABASE_URL ? '설정됨' : '없음');
console.log('SERVICE_KEY:', envVars.SUPABASE_SERVICE_ROLE_KEY ? '설정됨' : '없음');

const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
);

async function simpleCheck() {
  try {
    // 직원 테이블 확인
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, name')
      .limit(5);

    console.log('\n직원 조회 결과:');
    if (empError) {
      console.error('오류:', empError);
    } else {
      console.log('직원 수:', employees?.length || 0);
      employees?.forEach(emp => console.log(`- ${emp.name} (${emp.id})`));
    }

    // 스케줄 테이블 확인
    const { data: schedules, error: schError } = await supabase
      .from('schedules')
      .select('id, employee_id, schedule_date, status')
      .gte('schedule_date', '2025-09-01')
      .lte('schedule_date', '2025-09-30')
      .limit(10);

    console.log('\n9월 스케줄 조회 결과:');
    if (schError) {
      console.error('오류:', schError);
    } else {
      console.log('스케줄 수:', schedules?.length || 0);
      schedules?.forEach(sch => console.log(`- ${sch.schedule_date} (${sch.status || 'null'})`));
    }

  } catch (error) {
    console.error('전체 오류:', error);
  }
}

simpleCheck();
