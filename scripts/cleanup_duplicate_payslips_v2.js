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

async function cleanupDuplicatePayslipsV2() {
  try {
    console.log('🧹 허상원 중복 정산서 정리 (V2) 시작');
    
    // 1. 허상원 직원 정보 조회
    const { data: heoEmployee, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('name', '허상원')
      .single();
    
    if (employeeError) {
      console.error('❌ 허상원 직원 정보 조회 실패:', employeeError);
      return;
    }
    
    // 2. 허상원의 모든 정산서 조회
    const { data: allPayslips, error: payslipError } = await supabase
      .from('payslips')
      .select('*')
      .eq('employee_id', heoEmployee.id)
      .order('period', { ascending: true });
    
    if (payslipError) {
      console.error('❌ 정산서 조회 실패:', payslipError);
      return;
    }
    
    console.log('📋 현재 정산서 목록:');
    allPayslips.forEach((payslip, index) => {
      console.log(`  ${index + 1}. ${payslip.period}: ${payslip.net_salary?.toLocaleString()}원 (${payslip.id})`);
    });
    
    // 3. 중복된 정산서 식별 및 삭제
    const payslipsToDelete = [];
    
    // 2025-08과 2025-08-2는 같은 기간이므로 중복
    const augustPayslips = allPayslips.filter(p => p.period === '2025-08' || p.period === '2025-08-2');
    if (augustPayslips.length > 1) {
      console.log('\n🔍 8월 정산서 중복 확인:');
      augustPayslips.forEach(payslip => {
        console.log(`  - ${payslip.period}: ${payslip.net_salary?.toLocaleString()}원 (${payslip.created_at})`);
      });
      
      // 2025-08-2가 더 구체적인 기간이므로 2025-08 삭제
      const oldAugustPayslip = augustPayslips.find(p => p.period === '2025-08');
      if (oldAugustPayslip) {
        payslipsToDelete.push(oldAugustPayslip);
        console.log(`  🗑️ 삭제 대상: ${oldAugustPayslip.period} (${oldAugustPayslip.id})`);
      }
    }
    
    // 4. 중복된 정산서 삭제
    for (const payslip of payslipsToDelete) {
      console.log(`\n🗑️ 정산서 삭제 중: ${payslip.period} (${payslip.id})`);
      
      const { error: deleteError } = await supabase
        .from('payslips')
        .delete()
        .eq('id', payslip.id);
      
      if (deleteError) {
        console.error(`❌ 정산서 삭제 실패: ${payslip.id}`, deleteError);
      } else {
        console.log(`✅ 정산서 삭제 성공: ${payslip.period}`);
      }
    }
    
    // 5. 정리 후 정산서 목록 확인
    const { data: finalPayslips, error: finalError } = await supabase
      .from('payslips')
      .select('*')
      .eq('employee_id', heoEmployee.id)
      .order('period', { ascending: true });
    
    if (finalError) {
      console.error('❌ 최종 정산서 목록 조회 실패:', finalError);
      return;
    }
    
    console.log('\n📋 정리 후 정산서 목록:');
    finalPayslips.forEach((payslip, index) => {
      console.log(`  ${index + 1}. ${payslip.period}: ${payslip.net_salary?.toLocaleString()}원`);
    });
    
    console.log(`\n🎉 중복 정산서 정리 완료! (${allPayslips.length}개 → ${finalPayslips.length}개)`);
    
    // 6. 최종 정산서 요약
    console.log('\n📊 최종 정산서 요약:');
    const totalAmount = finalPayslips.reduce((sum, payslip) => sum + (payslip.net_salary || 0), 0);
    const totalHours = finalPayslips.reduce((sum, payslip) => sum + (payslip.total_hours || 0), 0);
    
    console.log(`  - 총 정산서 개수: ${finalPayslips.length}개`);
    console.log(`  - 총 근무시간: ${totalHours}시간`);
    console.log(`  - 총 지급액: ${totalAmount.toLocaleString()}원`);
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

cleanupDuplicatePayslipsV2();
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

async function cleanupDuplicatePayslipsV2() {
  try {
    console.log('🧹 허상원 중복 정산서 정리 (V2) 시작');
    
    // 1. 허상원 직원 정보 조회
    const { data: heoEmployee, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('name', '허상원')
      .single();
    
    if (employeeError) {
      console.error('❌ 허상원 직원 정보 조회 실패:', employeeError);
      return;
    }
    
    // 2. 허상원의 모든 정산서 조회
    const { data: allPayslips, error: payslipError } = await supabase
      .from('payslips')
      .select('*')
      .eq('employee_id', heoEmployee.id)
      .order('period', { ascending: true });
    
    if (payslipError) {
      console.error('❌ 정산서 조회 실패:', payslipError);
      return;
    }
    
    console.log('📋 현재 정산서 목록:');
    allPayslips.forEach((payslip, index) => {
      console.log(`  ${index + 1}. ${payslip.period}: ${payslip.net_salary?.toLocaleString()}원 (${payslip.id})`);
    });
    
    // 3. 중복된 정산서 식별 및 삭제
    const payslipsToDelete = [];
    
    // 2025-08과 2025-08-2는 같은 기간이므로 중복
    const augustPayslips = allPayslips.filter(p => p.period === '2025-08' || p.period === '2025-08-2');
    if (augustPayslips.length > 1) {
      console.log('\n🔍 8월 정산서 중복 확인:');
      augustPayslips.forEach(payslip => {
        console.log(`  - ${payslip.period}: ${payslip.net_salary?.toLocaleString()}원 (${payslip.created_at})`);
      });
      
      // 2025-08-2가 더 구체적인 기간이므로 2025-08 삭제
      const oldAugustPayslip = augustPayslips.find(p => p.period === '2025-08');
      if (oldAugustPayslip) {
        payslipsToDelete.push(oldAugustPayslip);
        console.log(`  🗑️ 삭제 대상: ${oldAugustPayslip.period} (${oldAugustPayslip.id})`);
      }
    }
    
    // 4. 중복된 정산서 삭제
    for (const payslip of payslipsToDelete) {
      console.log(`\n🗑️ 정산서 삭제 중: ${payslip.period} (${payslip.id})`);
      
      const { error: deleteError } = await supabase
        .from('payslips')
        .delete()
        .eq('id', payslip.id);
      
      if (deleteError) {
        console.error(`❌ 정산서 삭제 실패: ${payslip.id}`, deleteError);
      } else {
        console.log(`✅ 정산서 삭제 성공: ${payslip.period}`);
      }
    }
    
    // 5. 정리 후 정산서 목록 확인
    const { data: finalPayslips, error: finalError } = await supabase
      .from('payslips')
      .select('*')
      .eq('employee_id', heoEmployee.id)
      .order('period', { ascending: true });
    
    if (finalError) {
      console.error('❌ 최종 정산서 목록 조회 실패:', finalError);
      return;
    }
    
    console.log('\n📋 정리 후 정산서 목록:');
    finalPayslips.forEach((payslip, index) => {
      console.log(`  ${index + 1}. ${payslip.period}: ${payslip.net_salary?.toLocaleString()}원`);
    });
    
    console.log(`\n🎉 중복 정산서 정리 완료! (${allPayslips.length}개 → ${finalPayslips.length}개)`);
    
    // 6. 최종 정산서 요약
    console.log('\n📊 최종 정산서 요약:');
    const totalAmount = finalPayslips.reduce((sum, payslip) => sum + (payslip.net_salary || 0), 0);
    const totalHours = finalPayslips.reduce((sum, payslip) => sum + (payslip.total_hours || 0), 0);
    
    console.log(`  - 총 정산서 개수: ${finalPayslips.length}개`);
    console.log(`  - 총 근무시간: ${totalHours}시간`);
    console.log(`  - 총 지급액: ${totalAmount.toLocaleString()}원`);
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

cleanupDuplicatePayslipsV2();
