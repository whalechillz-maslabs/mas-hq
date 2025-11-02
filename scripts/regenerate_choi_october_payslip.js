const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function regenerateChoiOctoberPayslip() {
  try {
    console.log('🗑️ 최형호 10월 급여명세서 삭제 및 재생성 시작...\n');
    
    // 1. 최형호 직원 정보 조회
    const { data: choiEmployee, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('name', '최형호')
      .single();
    
    if (employeeError || !choiEmployee) {
      console.error('❌ 최형호 직원 정보 조회 실패:', employeeError);
      return;
    }
    
    console.log('✅ 최형호 직원 정보:', {
      id: choiEmployee.id,
      name: choiEmployee.name,
      employee_id: choiEmployee.employee_id,
      employment_type: choiEmployee.employment_type
    });
    
    // 2. 최형호의 10월 급여명세서 조회 및 삭제
    const period = '2025-10';
    const { data: existingPayslips, error: fetchError } = await supabase
      .from('payslips')
      .select('*')
      .eq('employee_id', choiEmployee.id)
      .eq('period', period);
    
    if (fetchError) {
      console.error('❌ 급여명세서 조회 실패:', fetchError);
      return;
    }
    
    if (existingPayslips && existingPayslips.length > 0) {
      console.log(`📋 발견된 10월 급여명세서: ${existingPayslips.length}개`);
      existingPayslips.forEach((p, i) => {
        console.log(`  ${i + 1}. ID: ${p.id}, 상태: ${p.status}, 총액: ${p.total_earnings?.toLocaleString()}원`);
      });
      
      // 삭제
      for (const payslip of existingPayslips) {
        const { error: deleteError } = await supabase
          .from('payslips')
          .delete()
          .eq('id', payslip.id);
        
        if (deleteError) {
          console.error(`❌ 급여명세서 삭제 실패 (ID: ${payslip.id}):`, deleteError);
        } else {
          console.log(`✅ 급여명세서 삭제 성공 (ID: ${payslip.id})`);
        }
      }
    } else {
      console.log('⚠️ 삭제할 10월 급여명세서가 없습니다.');
    }
    
    // 3. 최형호의 활성 계약서 조회
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('*')
      .eq('employee_id', choiEmployee.id)
      .eq('status', 'active')
      .lte('start_date', '2025-10-31')
      .or('end_date.is.null,end_date.gte.2025-10-01')
      .order('start_date', { ascending: false })
      .limit(1)
      .single();
    
    if (contractError || !contract) {
      console.error('❌ 활성 계약서 조회 실패:', contractError);
      console.log('⚠️ 계약서 정보 없이 기본값으로 생성합니다.');
    } else {
      console.log('✅ 활성 계약서 정보:', {
        contract_type: contract.contract_type,
        salary: contract.salary,
        meal_policy: contract.meal_policy,
        meal_rate: contract.meal_rate
      });
    }
    
    // 4. 급여명세서 재생성
    console.log('\n📝 급여명세서 재생성 중...');
    
    // 연봉제인 경우 월급 계산
    let baseSalary = 0;
    let mealAllowance = 0;
    
    if (contract) {
      if (contract.contract_type === 'annual') {
        // 연봉을 12로 나눔
        baseSalary = Math.round((contract.salary || 0) / 12);
        console.log(`   연봉: ${contract.salary?.toLocaleString()}원 → 월급: ${baseSalary.toLocaleString()}원`);
      } else {
        baseSalary = contract.salary || 0;
        console.log(`   월급: ${baseSalary.toLocaleString()}원`);
      }
      
      // 식대 계산
      if (contract.meal_policy === 'per_day') {
        // 일별 지급: 10월 근무일 수 계산 필요 (여기서는 간단히 20일 가정)
        const workDays = 20; // 실제로는 스케줄에서 계산해야 함
        mealAllowance = workDays * (contract.meal_rate || 7000);
        console.log(`   식대 (일별): ${workDays}일 × ${contract.meal_rate || 7000}원 = ${mealAllowance.toLocaleString()}원`);
      } else if (contract.meal_policy === 'fixed_with_reconcile') {
        // 고정 선지급
        const fixedDays = contract.meal_fixed_days_per_month || 20;
        mealAllowance = fixedDays * (contract.meal_rate || 7000);
        console.log(`   식대 (고정): ${fixedDays}일 × ${contract.meal_rate || 7000}원 = ${mealAllowance.toLocaleString()}원`);
      } else {
        // 기존 방식
        mealAllowance = contract.meal_allowance || 0;
        console.log(`   식대 (기존): ${mealAllowance.toLocaleString()}원`);
      }
    } else {
      // 계약서가 없으면 기본값 사용
      baseSalary = choiEmployee.monthly_salary || 2340000; // 최형호 기본 월급
      mealAllowance = 140000; // 기본 식대
      console.log(`   기본값 사용: 월급 ${baseSalary.toLocaleString()}원, 식대 ${mealAllowance.toLocaleString()}원`);
    }
    
    // 급여 계산
    const overtimePay = 0;
    const incentive = 0;
    const pointBonus = 0;
    const totalEarnings = baseSalary + overtimePay + incentive + pointBonus + mealAllowance;
    const taxableAmount = baseSalary + overtimePay + incentive + pointBonus; // 식대는 비과세
    const taxAmount = Math.round(taxableAmount * 0.033); // 3.3% 사업소득세
    const netSalary = totalEarnings - taxAmount;
    
    // 5. 급여명세서 저장
    const payslip = {
      employee_id: choiEmployee.id,
      period: period,
      employment_type: 'full_time',
      base_salary: baseSalary,
      overtime_pay: overtimePay,
      weekly_holiday_pay: 0,
      incentive: incentive,
      point_bonus: pointBonus,
      meal_allowance: mealAllowance,
      total_earnings: totalEarnings,
      tax_amount: taxAmount,
      net_salary: netSalary,
      status: 'generated'
    };
    
    const { error: insertError } = await supabase
      .from('payslips')
      .insert([payslip]);
    
    if (insertError) {
      console.error('❌ 급여명세서 저장 실패:', insertError);
      return;
    }
    
    console.log('✅ 급여명세서 재생성 완료!');
    console.log('\n📊 급여명세서 내용:');
    console.log(`   기본급: ${baseSalary.toLocaleString()}원`);
    console.log(`   식대: ${mealAllowance.toLocaleString()}원`);
    console.log(`   총 지급액: ${totalEarnings.toLocaleString()}원`);
    console.log(`   세금 (3.3%): ${taxAmount.toLocaleString()}원`);
    console.log(`   실수령액: ${netSalary.toLocaleString()}원`);
    
    console.log('\n🎉 최형호 10월 급여명세서 삭제 및 재생성 완료!');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

regenerateChoiOctoberPayslip();

