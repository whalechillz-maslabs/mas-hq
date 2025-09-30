const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function migratePayslipStructure() {
  console.log('🔄 급여 명세서 구조 마이그레이션 시작...');
  
  try {
    // 1. 모든 급여 명세서 조회
    const { data: payslips, error: payslipError } = await supabase
      .from('payslips')
      .select(`
        *,
        employees!inner(name, employee_id)
      `);
      
    if (payslipError) {
      console.error('급여 명세서 조회 실패:', payslipError);
      return;
    }
    
    console.log(`📊 총 급여 명세서: ${payslips?.length || 0}개`);
    
    // 2. 각 급여 명세서를 새로운 구조로 업데이트
    for (const payslip of payslips || []) {
      const employeeName = payslip.employees.name;
      let updateData = {};
      
      console.log(`\n👤 ${employeeName} ${payslip.period} 처리 중...`);
      
      if (employeeName === '나수진') {
        // 나수진: 주유대 + 추가근무 구조
        updateData = {
          fuel_allowance: payslip.incentive,        // 주유대
          additional_work: payslip.overtime_pay,    // 추가근무
          weekly_holiday_pay: 0,                    // 주휴수당 없음
          transportation_allowance: 0,
          performance_bonus: 0,
          // 기존 필드는 0으로 초기화
          incentive: 0,
          overtime_pay: 0
        };
        console.log(`   ⛽ 주유대: ${payslip.incentive?.toLocaleString() || 0}원`);
        console.log(`   💼 추가근무: ${payslip.overtime_pay?.toLocaleString() || 0}원`);
        
      } else if (employeeName === '최형호') {
        // 최형호: 실제 주휴수당 구조
        updateData = {
          fuel_allowance: 0,
          additional_work: 0,
          weekly_holiday_pay: payslip.overtime_pay, // 실제 주휴수당
          transportation_allowance: 0,
          performance_bonus: 0,
          // 기존 필드는 0으로 초기화
          incentive: 0,
          overtime_pay: 0
        };
        console.log(`   ⏰ 주휴수당: ${payslip.overtime_pay?.toLocaleString() || 0}원`);
        
      } else {
        // 기타 직원: 기존 구조 유지
        updateData = {
          fuel_allowance: 0,
          additional_work: 0,
          weekly_holiday_pay: 0,
          transportation_allowance: 0,
          performance_bonus: 0
          // 기존 필드는 그대로 유지
        };
        console.log(`   📋 기존 구조 유지`);
      }
      
      // 3. 급여 명세서 업데이트
      const { error: updateError } = await supabase
        .from('payslips')
        .update(updateData)
        .eq('id', payslip.id);
        
      if (updateError) {
        console.error(`❌ ${employeeName} ${payslip.period} 업데이트 실패:`, updateError);
        continue;
      }
      
      console.log(`   ✅ 업데이트 완료`);
    }
    
    console.log('\n🎉 급여 명세서 구조 마이그레이션 완료!');
    console.log('📋 새로운 필드 구조:');
    console.log('   - fuel_allowance: 주유대');
    console.log('   - additional_work: 추가 근무 수당');
    console.log('   - weekly_holiday_pay: 주휴수당');
    console.log('   - transportation_allowance: 교통비');
    console.log('   - performance_bonus: 성과급/보너스');
    
    // 4. 마이그레이션 결과 확인
    console.log('\n📊 마이그레이션 결과 확인:');
    const { data: updatedPayslips, error: checkError } = await supabase
      .from('payslips')
      .select(`
        *,
        employees!inner(name, employee_id)
      `)
      .order('created_at', { ascending: false });
      
    if (checkError) {
      console.error('마이그레이션 결과 확인 실패:', checkError);
      return;
    }
    
    // 직원별로 그룹화하여 결과 출력
    const payslipsByEmployee = {};
    updatedPayslips?.forEach(payslip => {
      const employeeName = payslip.employees.name;
      if (!payslipsByEmployee[employeeName]) {
        payslipsByEmployee[employeeName] = [];
      }
      payslipsByEmployee[employeeName].push(payslip);
    });
    
    Object.keys(payslipsByEmployee).forEach(employeeName => {
      const employeePayslips = payslipsByEmployee[employeeName];
      console.log(`\n👤 ${employeeName} (${employeePayslips.length}개):`);
      
      employeePayslips.forEach(payslip => {
        console.log(`   📅 ${payslip.period}:`);
        console.log(`      💰 기본급: ${payslip.base_salary?.toLocaleString() || 0}원`);
        console.log(`      ⛽ 주유대: ${payslip.fuel_allowance?.toLocaleString() || 0}원`);
        console.log(`      💼 추가근무: ${payslip.additional_work?.toLocaleString() || 0}원`);
        console.log(`      ⏰ 주휴수당: ${payslip.weekly_holiday_pay?.toLocaleString() || 0}원`);
        console.log(`      🍽️ 식대: ${payslip.meal_allowance?.toLocaleString() || 0}원`);
        console.log(`      💵 총 지급액: ${payslip.total_earnings?.toLocaleString() || 0}원`);
      });
    });
    
  } catch (error) {
    console.error('급여 명세서 구조 마이그레이션 중 오류:', error);
  }
}

// 스크립트 실행
migratePayslipStructure().catch(console.error);
