const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// .env.local 파일에서 환경 변수 읽기
const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    // 따옴표와 개행 문자 제거
    envVars[key.trim()] = value.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '');
  }
});

// 환경 변수에서 Supabase 설정 가져오기
const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPayslipsSchema() {
  try {
    console.log('🔍 payslips 테이블 구조 확인 시작');
    
    // 1. payslips 테이블의 샘플 데이터 조회
    const { data: payslips, error: payslipError } = await supabase
      .from('payslips')
      .select('*')
      .limit(1);
    
    if (payslipError) {
      console.error('❌ payslips 테이블 조회 실패:', payslipError);
      return;
    }
    
    if (payslips.length > 0) {
      console.log('📋 payslips 테이블 구조:');
      console.log('  컬럼들:', Object.keys(payslips[0]));
      console.log('  샘플 데이터:', payslips[0]);
    } else {
      console.log('📋 payslips 테이블이 비어있습니다.');
    }
    
    // 2. 허상원 정산서 저장 시도
    const { data: heoEmployee, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('name', '허상원')
      .single();
    
    if (employeeError) {
      console.error('❌ 허상원 직원 정보 조회 실패:', employeeError);
      return;
    }
    
    // 3. 정산서 데이터 생성 (올바른 형식)
    const payslipData = {
      employee_id: heoEmployee.id,
      period: '2025-08',
      employment_type: 'part_time',
      base_salary: 1137500,
      overtime_pay: 0,
      incentive: 0,
      point_bonus: 0,
      total_earnings: 1137500,
      tax_amount: 0,
      net_salary: 1137500,
      total_hours: 87.5,
      hourly_rate: 13000,
      daily_details: [
        {
          date: '2025-08-11',
          hours: 7.5,
          daily_wage: 97500,
          hourly_wage: 13000
        },
        {
          date: '2025-08-12',
          hours: 8,
          daily_wage: 104000,
          hourly_wage: 13000
        }
      ],
      status: 'pending',
      created_at: new Date().toISOString()
    };
    
    console.log('💾 저장할 정산서 데이터:');
    console.log('  - 직원 ID:', payslipData.employee_id);
    console.log('  - 기간:', payslipData.period);
    console.log('  - 총 금액:', payslipData.net_salary.toLocaleString(), '원');
    console.log('  - 상태:', payslipData.status);
    
    // 4. 정산서 저장 시도
    const { data: savedPayslip, error: saveError } = await supabase
      .from('payslips')
      .insert([payslipData])
      .select();
    
    if (saveError) {
      console.error('❌ 정산서 저장 실패:', saveError);
      
      // 오류 분석
      if (saveError.message.includes('value too long for type character varying')) {
        console.log('🔧 해결 방법: period 필드 길이를 줄여야 합니다.');
        console.log('   현재 period:', payslipData.period);
        console.log('   권장 period:', '2025-08');
      }
    } else {
      console.log('✅ 정산서 저장 성공:', savedPayslip[0].id);
    }
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

checkPayslipsSchema();
