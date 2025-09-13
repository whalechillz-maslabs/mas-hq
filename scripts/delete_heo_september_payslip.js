const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// .env.local 파일에서 환경 변수 읽기
const envContent = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim().replace(/^["']|["']$/g, '').replace(/\\n/g, '');
  }
});

const supabase = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function deleteHeoSeptemberPayslip() {
  try {
    console.log('🗑️ 허상원 9월 급여명세서 삭제 시작');
    
    // 허상원 직원 정보
    const { data: heoEmployee } = await supabase
      .from('employees')
      .select('*')
      .eq('name', '허상원')
      .single();
    
    // 허상원의 9월 급여명세서 조회
    const { data: payslips, error: fetchError } = await supabase
      .from('payslips')
      .select('*')
      .eq('employee_id', heoEmployee.id)
      .like('period', '2025-09%');
    
    if (fetchError) {
      console.error('❌ 급여명세서 조회 실패:', fetchError);
      return;
    }
    
    console.log(`📋 발견된 9월 급여명세서: ${payslips.length}개`);
    
    if (payslips.length === 0) {
      console.log('✅ 삭제할 9월 급여명세서가 없습니다.');
      return;
    }
    
    // 각 급여명세서 정보 출력
    payslips.forEach((payslip, index) => {
      console.log(`  ${index + 1}. 기간: ${payslip.period}, 상태: ${payslip.status}, 생성일: ${payslip.created_at}`);
    });
    
    // 급여명세서 삭제
    const { error: deleteError } = await supabase
      .from('payslips')
      .delete()
      .eq('employee_id', heoEmployee.id)
      .like('period', '2025-09%');
    
    if (deleteError) {
      console.error('❌ 급여명세서 삭제 실패:', deleteError);
      return;
    }
    
    console.log('✅ 허상원의 9월 급여명세서가 모두 삭제되었습니다.');
    console.log('🔄 이제 급여명세서를 다시 생성해보세요.');
    
  } catch (error) {
    console.error('❌ 오류:', error);
  }
}

deleteHeoSeptemberPayslip();
