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

async function cleanupDuplicatePayslips() {
  try {
    console.log('🧹 허상원 중복 정산서 정리 시작');
    
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
    
    // 3. 중복된 정산서 찾기
    const duplicatePayslips = [];
    const periodGroups = {};
    
    allPayslips.forEach(payslip => {
      const period = payslip.period;
      if (!periodGroups[period]) {
        periodGroups[period] = [];
      }
      periodGroups[period].push(payslip);
    });
    
    // 중복된 기간 찾기
    Object.keys(periodGroups).forEach(period => {
      if (periodGroups[period].length > 1) {
        console.log(`⚠️ 중복된 기간 발견: ${period} (${periodGroups[period].length}개)`);
        duplicatePayslips.push(...periodGroups[period]);
      }
    });
    
    // 4. 중복된 정산서 삭제 (최신 것만 남기고 나머지 삭제)
    for (const period in periodGroups) {
      const payslips = periodGroups[period];
      if (payslips.length > 1) {
        // 생성일 기준으로 정렬 (최신 것 제외하고 삭제)
        payslips.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        console.log(`\n🔍 ${period} 기간 정산서 정리:`);
        console.log(`  - 총 ${payslips.length}개 정산서 발견`);
        
        // 첫 번째(최신) 정산서는 유지
        const keepPayslip = payslips[0];
        console.log(`  ✅ 유지할 정산서: ${keepPayslip.id} (${keepPayslip.created_at})`);
        
        // 나머지 정산서 삭제
        for (let i = 1; i < payslips.length; i++) {
          const deletePayslip = payslips[i];
          console.log(`  🗑️ 삭제할 정산서: ${deletePayslip.id} (${deletePayslip.created_at})`);
          
          const { error: deleteError } = await supabase
            .from('payslips')
            .delete()
            .eq('id', deletePayslip.id);
          
          if (deleteError) {
            console.error(`❌ 정산서 삭제 실패: ${deletePayslip.id}`, deleteError);
          } else {
            console.log(`✅ 정산서 삭제 성공: ${deletePayslip.id}`);
          }
        }
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
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

cleanupDuplicatePayslips();
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

async function cleanupDuplicatePayslips() {
  try {
    console.log('🧹 허상원 중복 정산서 정리 시작');
    
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
    
    // 3. 중복된 정산서 찾기
    const duplicatePayslips = [];
    const periodGroups = {};
    
    allPayslips.forEach(payslip => {
      const period = payslip.period;
      if (!periodGroups[period]) {
        periodGroups[period] = [];
      }
      periodGroups[period].push(payslip);
    });
    
    // 중복된 기간 찾기
    Object.keys(periodGroups).forEach(period => {
      if (periodGroups[period].length > 1) {
        console.log(`⚠️ 중복된 기간 발견: ${period} (${periodGroups[period].length}개)`);
        duplicatePayslips.push(...periodGroups[period]);
      }
    });
    
    // 4. 중복된 정산서 삭제 (최신 것만 남기고 나머지 삭제)
    for (const period in periodGroups) {
      const payslips = periodGroups[period];
      if (payslips.length > 1) {
        // 생성일 기준으로 정렬 (최신 것 제외하고 삭제)
        payslips.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        console.log(`\n🔍 ${period} 기간 정산서 정리:`);
        console.log(`  - 총 ${payslips.length}개 정산서 발견`);
        
        // 첫 번째(최신) 정산서는 유지
        const keepPayslip = payslips[0];
        console.log(`  ✅ 유지할 정산서: ${keepPayslip.id} (${keepPayslip.created_at})`);
        
        // 나머지 정산서 삭제
        for (let i = 1; i < payslips.length; i++) {
          const deletePayslip = payslips[i];
          console.log(`  🗑️ 삭제할 정산서: ${deletePayslip.id} (${deletePayslip.created_at})`);
          
          const { error: deleteError } = await supabase
            .from('payslips')
            .delete()
            .eq('id', deletePayslip.id);
          
          if (deleteError) {
            console.error(`❌ 정산서 삭제 실패: ${deletePayslip.id}`, deleteError);
          } else {
            console.log(`✅ 정산서 삭제 성공: ${deletePayslip.id}`);
          }
        }
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
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

cleanupDuplicatePayslips();
