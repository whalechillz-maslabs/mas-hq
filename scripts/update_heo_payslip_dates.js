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

async function updateHeoPayslipDates() {
  try {
    console.log('📅 허상원 정산서 발행일/지급일 업데이트 시작');
    
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
    
    // 2. 정산일 매핑 데이터
    const settlementDates = {
      '2025-06-1': {
        period: '6월 1차',
        issuedDate: '2025-06-28', // 6/28(금)
        paidDate: '2025-06-28'    // 6/28(금)
      },
      '2025-07-1': {
        period: '7월 1차',
        issuedDate: '2025-07-11', // 7/11(금)
        paidDate: '2025-07-11'    // 7/11(금)
      },
      '2025-07-2': {
        period: '7월 2차',
        issuedDate: '2025-07-25', // 7/25(금)
        paidDate: '2025-07-25'    // 7/25(금)
      },
      '2025-07-3': {
        period: '7월 3차',
        issuedDate: '2025-08-01', // 8/1(금)
        paidDate: '2025-08-01'    // 8/1(금)
      },
      '2025-08-1': {
        period: '8월 1차',
        issuedDate: '2025-08-08', // 8/8(금)
        paidDate: '2025-08-08'    // 8/8(금)
      },
      '2025-08-2': {
        period: '8월 2차',
        issuedDate: '2025-08-29', // 8/29(금)
        paidDate: '2025-08-29'    // 8/29(금)
      }
    };
    
    // 3. 허상원의 모든 정산서 조회
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
      console.log(`  ${index + 1}. ${payslip.period}: ${payslip.net_salary?.toLocaleString()}원`);
      console.log(`     - 발행일: ${payslip.issued_at || '없음'}`);
      console.log(`     - 지급일: ${payslip.paid_at || '없음'}`);
    });
    
    // 4. 각 정산서의 발행일/지급일 업데이트
    for (const payslip of allPayslips) {
      const dateInfo = settlementDates[payslip.period];
      
      if (dateInfo) {
        console.log(`\n📅 ${payslip.period} (${dateInfo.period}) 업데이트 중...`);
        console.log(`  - 발행일: ${dateInfo.issuedDate}`);
        console.log(`  - 지급일: ${dateInfo.paidDate}`);
        
        // 발행일과 지급일을 ISO 형식으로 변환
        const issuedAt = new Date(`${dateInfo.issuedDate}T09:00:00.000Z`).toISOString();
        const paidAt = new Date(`${dateInfo.paidDate}T18:00:00.000Z`).toISOString();
        
        // 정산서 업데이트
        const { data: updatedPayslip, error: updateError } = await supabase
          .from('payslips')
          .update({
            issued_at: issuedAt,
            paid_at: paidAt,
            status: 'paid', // 지급완료로 상태 변경
            updated_at: new Date().toISOString()
          })
          .eq('id', payslip.id)
          .select();
        
        if (updateError) {
          console.error(`❌ ${payslip.period} 정산서 업데이트 실패:`, updateError);
        } else {
          console.log(`✅ ${payslip.period} 정산서 업데이트 성공`);
          console.log(`  - 새로운 발행일: ${updatedPayslip[0].issued_at}`);
          console.log(`  - 새로운 지급일: ${updatedPayslip[0].paid_at}`);
          console.log(`  - 새로운 상태: ${updatedPayslip[0].status}`);
        }
      } else {
        console.log(`⚠️ ${payslip.period}에 대한 정산일 정보가 없습니다.`);
      }
    }
    
    // 5. 업데이트 후 정산서 목록 확인
    const { data: finalPayslips, error: finalError } = await supabase
      .from('payslips')
      .select('*')
      .eq('employee_id', heoEmployee.id)
      .order('period', { ascending: true });
    
    if (finalError) {
      console.error('❌ 최종 정산서 목록 조회 실패:', finalError);
      return;
    }
    
    console.log('\n📋 업데이트 후 정산서 목록:');
    finalPayslips.forEach((payslip, index) => {
      const issuedDate = payslip.issued_at ? new Date(payslip.issued_at).toLocaleDateString('ko-KR') : '없음';
      const paidDate = payslip.paid_at ? new Date(payslip.paid_at).toLocaleDateString('ko-KR') : '없음';
      
      console.log(`  ${index + 1}. ${payslip.period}: ${payslip.net_salary?.toLocaleString()}원`);
      console.log(`     - 발행일: ${issuedDate}`);
      console.log(`     - 지급일: ${paidDate}`);
      console.log(`     - 상태: ${payslip.status}`);
    });
    
    console.log('\n🎉 허상원 정산서 발행일/지급일 업데이트 완료!');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

updateHeoPayslipDates();
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

async function updateHeoPayslipDates() {
  try {
    console.log('📅 허상원 정산서 발행일/지급일 업데이트 시작');
    
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
    
    // 2. 정산일 매핑 데이터
    const settlementDates = {
      '2025-06-1': {
        period: '6월 1차',
        issuedDate: '2025-06-28', // 6/28(금)
        paidDate: '2025-06-28'    // 6/28(금)
      },
      '2025-07-1': {
        period: '7월 1차',
        issuedDate: '2025-07-11', // 7/11(금)
        paidDate: '2025-07-11'    // 7/11(금)
      },
      '2025-07-2': {
        period: '7월 2차',
        issuedDate: '2025-07-25', // 7/25(금)
        paidDate: '2025-07-25'    // 7/25(금)
      },
      '2025-07-3': {
        period: '7월 3차',
        issuedDate: '2025-08-01', // 8/1(금)
        paidDate: '2025-08-01'    // 8/1(금)
      },
      '2025-08-1': {
        period: '8월 1차',
        issuedDate: '2025-08-08', // 8/8(금)
        paidDate: '2025-08-08'    // 8/8(금)
      },
      '2025-08-2': {
        period: '8월 2차',
        issuedDate: '2025-08-29', // 8/29(금)
        paidDate: '2025-08-29'    // 8/29(금)
      }
    };
    
    // 3. 허상원의 모든 정산서 조회
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
      console.log(`  ${index + 1}. ${payslip.period}: ${payslip.net_salary?.toLocaleString()}원`);
      console.log(`     - 발행일: ${payslip.issued_at || '없음'}`);
      console.log(`     - 지급일: ${payslip.paid_at || '없음'}`);
    });
    
    // 4. 각 정산서의 발행일/지급일 업데이트
    for (const payslip of allPayslips) {
      const dateInfo = settlementDates[payslip.period];
      
      if (dateInfo) {
        console.log(`\n📅 ${payslip.period} (${dateInfo.period}) 업데이트 중...`);
        console.log(`  - 발행일: ${dateInfo.issuedDate}`);
        console.log(`  - 지급일: ${dateInfo.paidDate}`);
        
        // 발행일과 지급일을 ISO 형식으로 변환
        const issuedAt = new Date(`${dateInfo.issuedDate}T09:00:00.000Z`).toISOString();
        const paidAt = new Date(`${dateInfo.paidDate}T18:00:00.000Z`).toISOString();
        
        // 정산서 업데이트
        const { data: updatedPayslip, error: updateError } = await supabase
          .from('payslips')
          .update({
            issued_at: issuedAt,
            paid_at: paidAt,
            status: 'paid', // 지급완료로 상태 변경
            updated_at: new Date().toISOString()
          })
          .eq('id', payslip.id)
          .select();
        
        if (updateError) {
          console.error(`❌ ${payslip.period} 정산서 업데이트 실패:`, updateError);
        } else {
          console.log(`✅ ${payslip.period} 정산서 업데이트 성공`);
          console.log(`  - 새로운 발행일: ${updatedPayslip[0].issued_at}`);
          console.log(`  - 새로운 지급일: ${updatedPayslip[0].paid_at}`);
          console.log(`  - 새로운 상태: ${updatedPayslip[0].status}`);
        }
      } else {
        console.log(`⚠️ ${payslip.period}에 대한 정산일 정보가 없습니다.`);
      }
    }
    
    // 5. 업데이트 후 정산서 목록 확인
    const { data: finalPayslips, error: finalError } = await supabase
      .from('payslips')
      .select('*')
      .eq('employee_id', heoEmployee.id)
      .order('period', { ascending: true });
    
    if (finalError) {
      console.error('❌ 최종 정산서 목록 조회 실패:', finalError);
      return;
    }
    
    console.log('\n📋 업데이트 후 정산서 목록:');
    finalPayslips.forEach((payslip, index) => {
      const issuedDate = payslip.issued_at ? new Date(payslip.issued_at).toLocaleDateString('ko-KR') : '없음';
      const paidDate = payslip.paid_at ? new Date(payslip.paid_at).toLocaleDateString('ko-KR') : '없음';
      
      console.log(`  ${index + 1}. ${payslip.period}: ${payslip.net_salary?.toLocaleString()}원`);
      console.log(`     - 발행일: ${issuedDate}`);
      console.log(`     - 지급일: ${paidDate}`);
      console.log(`     - 상태: ${payslip.status}`);
    });
    
    console.log('\n🎉 허상원 정산서 발행일/지급일 업데이트 완료!');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

updateHeoPayslipDates();
