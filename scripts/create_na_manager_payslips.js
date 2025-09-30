const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// 나과장 급여 데이터 정의
const naManagerSalaryData = {
  // 4월~9월 (주 2회 근무)
  '2025-04': {
    baseSalary: 800000,      // 기본근무 80만원
    fuelAllowance: 200000,   // 주유대 20만원
    additionalWork: 50000,   // 4월 14일 추가근무 5만원
    mealAllowance: 70000,    // 식대 7,000원 × 10회
    workDays: 10
  },
  '2025-05': {
    baseSalary: 800000,
    fuelAllowance: 200000,
    additionalWork: 0,
    mealAllowance: 56000,    // 식대 7,000원 × 8회
    workDays: 8
  },
  '2025-06': {
    baseSalary: 800000,
    fuelAllowance: 200000,
    additionalWork: 0,
    mealAllowance: 63000,    // 식대 7,000원 × 9회
    workDays: 9
  },
  '2025-07': {
    baseSalary: 800000,
    fuelAllowance: 200000,
    additionalWork: 200000,  // 7월 7일, 21일 추가근무 20만원
    mealAllowance: 77000,    // 식대 7,000원 × 11회
    workDays: 11
  },
  '2025-08': {
    baseSalary: 800000,
    fuelAllowance: 200000,
    additionalWork: 0,
    mealAllowance: 56000,    // 식대 7,000원 × 8회
    workDays: 8
  },
  '2025-09': {
    baseSalary: 800000,
    fuelAllowance: 200000,
    additionalWork: 100000,  // 9월 26일 추가근무 10만원
    mealAllowance: 77000,    // 식대 7,000원 × 11회
    workDays: 11
  },
  // 10월~ (주 3회 근무)
  '2025-10': {
    baseSalary: 1200000,     // 기본근무 120만원
    fuelAllowance: 200000,   // 주유대 20만원
    additionalWork: 0,
    mealAllowance: 84000,    // 식대 7,000원 × 12회
    workDays: 12
  }
};

// 매월 말일 계산 함수
function getLastDayOfMonth(year, month) {
  return new Date(year, month, 0).toISOString().split('T')[0];
}

async function createNaManagerPayslips() {
  console.log('🏢 나과장 급여 명세서 생성 시작...');
  
  try {
    // 1. 나수진 직원 정보 조회
    const { data: employees, error: empError } = await supabase
      .from('employees')
      .select('id, name, employee_id')
      .eq('name', '나수진');
      
    if (empError) {
      console.error('직원 조회 오류:', empError);
      return;
    }
    
    if (!employees || employees.length === 0) {
      console.log('❌ 나수진 직원을 찾을 수 없습니다.');
      return;
    }
    
    const naManager = employees[0];
    console.log('✅ 나과장 정보:', naManager.name, naManager.employee_id);
    
    // 2. 기존 급여 명세서 삭제 (재생성)
    const { error: deleteError } = await supabase
      .from('payslips')
      .delete()
      .eq('employee_id', naManager.id);
      
    if (deleteError) {
      console.error('기존 급여 명세서 삭제 오류:', deleteError);
    } else {
      console.log('🗑️ 기존 급여 명세서 삭제 완료');
    }
    
    // 3. 월별 급여 명세서 생성
    for (const [period, salaryData] of Object.entries(naManagerSalaryData)) {
      console.log(`\n📅 ${period} 급여 명세서 생성 중...`);
      
      const [year, month] = period.split('-').map(Number);
      const lastDayOfMonth = getLastDayOfMonth(year, month);
      
      const totalEarnings = salaryData.baseSalary + 
                           salaryData.fuelAllowance + 
                           salaryData.additionalWork + 
                           salaryData.mealAllowance;
      
      const taxAmount = Math.round(totalEarnings * 0.033); // 3.3% 세금
      const netSalary = totalEarnings - taxAmount;
      
      // 일별 상세 내역 생성
      const dailyDetails = [];
      for (let i = 1; i <= salaryData.workDays; i++) {
        dailyDetails.push({
          date: `${period}-${i.toString().padStart(2, '0')}`,
          type: 'regular',
          amount: Math.round(salaryData.baseSalary / salaryData.workDays),
          meal_allowance: 7000,
          note: '정규근무'
        });
      }
      
      // 추가 근무가 있는 경우
      if (salaryData.additionalWork > 0) {
        if (period === '2025-04') {
          dailyDetails.push({
            date: '2025-04-14',
            type: 'additional',
            amount: 50000,
            meal_allowance: 7000,
            note: '추가근무 (9-12시)'
          });
        } else if (period === '2025-07') {
          dailyDetails.push(
            {
              date: '2025-07-07',
              type: 'additional',
              amount: 100000,
              meal_allowance: 7000,
              note: '추가근무'
            },
            {
              date: '2025-07-21',
              type: 'additional',
              amount: 100000,
              meal_allowance: 7000,
              note: '추가근무'
            }
          );
        } else if (period === '2025-09') {
          dailyDetails.push({
            date: '2025-09-26',
            type: 'additional',
            amount: 100000,
            meal_allowance: 7000,
            note: '추가근무'
          });
        }
      }
      
      // 급여 명세서 데이터 생성
      const payslip = {
        employee_id: naManager.id,
        period: period,
        employment_type: 'part_time',
        base_salary: salaryData.baseSalary,
        overtime_pay: salaryData.additionalWork,
        incentive: salaryData.fuelAllowance, // 주유대를 incentive 필드에 저장
        point_bonus: 0,
        meal_allowance: salaryData.mealAllowance,
        total_earnings: totalEarnings,
        tax_amount: taxAmount,
        net_salary: netSalary,
        status: 'paid',
        total_hours: salaryData.workDays * 6, // 하루 6시간 (오전3+오후3)
        hourly_rate: Math.round(salaryData.baseSalary / (salaryData.workDays * 6)), // 시간당 급여
        daily_details: dailyDetails,
        issued_at: `${lastDayOfMonth}T23:59:59.000Z`, // 매월 말일 발행
        paid_at: `${lastDayOfMonth}T23:59:59.000Z`    // 매월 말일 지급
      };
      
      // 급여 명세서 저장
      const { error: insertError } = await supabase
        .from('payslips')
        .insert([payslip]);
        
      if (insertError) {
        console.error(`❌ ${period} 급여 명세서 생성 실패:`, insertError);
        continue;
      }
      
      console.log(`✅ ${period} 급여 명세서 생성 완료`);
      console.log(`   💰 기본근무: ${salaryData.baseSalary.toLocaleString()}원`);
      console.log(`   ⛽ 주유대: ${salaryData.fuelAllowance.toLocaleString()}원`);
      console.log(`   🔧 추가근무: ${salaryData.additionalWork.toLocaleString()}원`);
      console.log(`   🍽️ 식대: ${salaryData.mealAllowance.toLocaleString()}원`);
      console.log(`   💵 총 지급액: ${totalEarnings.toLocaleString()}원`);
      console.log(`   🧾 세금 (3.3%): ${taxAmount.toLocaleString()}원`);
      console.log(`   💰 실수령액: ${netSalary.toLocaleString()}원`);
      console.log(`   📅 근무일수: ${salaryData.workDays}일`);
      console.log(`   📅 발행일/지급일: ${lastDayOfMonth} (매월 말일)`);
    }
    
    console.log('\n🎉 나과장 급여 명세서 생성 완료!');
    
  } catch (error) {
    console.error('급여 명세서 생성 오류:', error);
  }
}

// 스크립트 실행
createNaManagerPayslips().catch(console.error);
