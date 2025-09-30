const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Supabase URL or Service Role Key is missing in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function regenerateNaPayslips() {
  console.log('🔄 나수진 급여명세서 재생성 시작...');

  // 나수진 직원 정보 조회
  const { data: naEmployee, error: empError } = await supabase
    .from('employees')
    .select('*')
    .eq('name', '나수진')
    .single();

  if (empError) {
    console.error('나수진 직원 찾기 실패:', empError);
    return;
  }

  console.log('✅ 나수진 직원 정보:', naEmployee.name, naEmployee.employee_id);

  // 4-9월 기존 급여명세서 삭제
  const months = ['04', '05', '06', '07', '08', '09'];
  
  for (const month of months) {
    const period = `2025-${month}`;
    console.log(`\n🗑️ ${period} 기존 급여명세서 삭제 중...`);
    
    const { error: deleteError } = await supabase
      .from('payslips')
      .delete()
      .eq('employee_id', naEmployee.id)
      .eq('period', period);

    if (deleteError) {
      console.error(`❌ ${period} 급여명세서 삭제 실패:`, deleteError);
    } else {
      console.log(`✅ ${period} 기존 급여명세서 삭제 완료`);
    }
  }

  // 새로운 급여명세서 생성
  for (const month of months) {
    const year = 2025;
    const monthNum = parseInt(month);
    const period = `2025-${month}`;
    
    console.log(`\n📋 ${period} 급여명세서 생성 중...`);
    
    try {
      // 해당 월의 스케줄 조회
      const startDate = `${year}-${month}-01`;
      const lastDay = new Date(year, monthNum, 0).getDate();
      const endDate = `${year}-${month}-${lastDay.toString().padStart(2, '0')}`;
      
      const { data: schedules, error: scheduleError } = await supabase
        .from('schedules')
        .select('*')
        .eq('employee_id', naEmployee.id)
        .gte('schedule_date', startDate)
        .lte('schedule_date', endDate)
        .order('schedule_date');

      if (scheduleError) {
        console.error(`❌ ${period} 스케줄 조회 실패:`, scheduleError);
        continue;
      }

      if (!schedules || schedules.length === 0) {
        console.log(`⚠️ ${period} 스케줄이 없습니다.`);
        continue;
      }

      // 계약서에서 식대 정보 조회
      const { data: contract, error: contractError } = await supabase
        .from('contracts')
        .select('meal_allowance')
        .eq('employee_id', naEmployee.id)
        .lte('start_date', endDate)
        .or(`end_date.is.null,end_date.gte.${startDate}`)
        .eq('status', 'active')
        .order('start_date', { ascending: false })
        .limit(1)
        .single();

      const mealAllowance = contract?.meal_allowance || 0;
      
      // 나수진의 급여 구성 요소 계산
      const workDays = schedules.length;
      const isNewSystem = monthNum >= 10; // 10월부터 주 3회
      
      // 기본급 계산 (10월부터 120만원, 이전은 80만원)
      const baseSalary = isNewSystem ? 1200000 : 800000;
      
      // 식대 계산 (근무일수 × 일일 식대)
      const totalMealAllowance = workDays * mealAllowance;
      
      // 주유대 (고정 20만원)
      const fuelAllowance = 200000;
      
      // 추가근무 (0일 × 10만원)
      const additionalWork = 0;
      
      // 총 지급액 계산
      const totalEarnings = baseSalary + totalMealAllowance + fuelAllowance + additionalWork;
      
      // 나수진은 현금 지급 (4대보험 및 세금 없음)
      const nationalPension = 0;
      const healthInsurance = 0;
      const employmentInsurance = 0;
      const industrialAccidentInsurance = 0;
      const totalInsurance = 0;
      const taxAmount = 0;
      const netSalary = totalEarnings;
      
      // 일별 상세 내역 생성 (날짜별로 그룹화)
      const scheduleByDate = {};
      schedules.forEach(schedule => {
        const date = schedule.schedule_date;
        if (!scheduleByDate[date]) {
          scheduleByDate[date] = [];
        }
        scheduleByDate[date].push(schedule);
      });
      
      const dailyDetails = Object.keys(scheduleByDate).sort().map(date => {
        const daySchedules = scheduleByDate[date];
        let totalHours = 0;
        
        daySchedules.forEach(schedule => {
          if (schedule.scheduled_start && schedule.scheduled_end) {
            const start = new Date(`${date} ${schedule.scheduled_start}`);
            const end = new Date(`${date} ${schedule.scheduled_end}`);
            const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            totalHours += hours;
          }
        });
        
        const dailyWage = baseSalary / workDays;
        
        return {
          date: date,
          hours: totalHours,
          hourly_rate: totalHours > 0 ? Math.round(dailyWage / totalHours) : 0,
          daily_wage: dailyWage,
          note: '월 정규근무'
        };
      });
      
      // 총 근무시간 계산
      const totalHours = dailyDetails.reduce((sum, detail) => sum + detail.hours, 0);
      
      // 주휴수당 계산 (주 15시간 이상 근무 시)
      const weeklyHolidayPay = totalHours >= 15 ? Math.round(totalHours * 0.2) : 0;
      
      // 급여명세서 데이터 생성
      const payslip = {
        employee_id: naEmployee.id,
        period: period,
        employment_type: 'part_time',
        base_salary: baseSalary,
        overtime_pay: 0,
        incentive: 0,
        point_bonus: 0,
        meal_allowance: totalMealAllowance,
        fuel_allowance: fuelAllowance,
        additional_work: additionalWork,
        weekly_holiday_pay: weeklyHolidayPay,
        total_earnings: totalEarnings,
        tax_amount: taxAmount,
        net_salary: netSalary,
        status: 'generated',
        total_hours: totalHours,
        hourly_rate: totalHours > 0 ? Math.round(totalEarnings / totalHours) : 0,
        daily_details: dailyDetails
      };

      // 급여명세서 저장
      const { error: saveError } = await supabase
        .from('payslips')
        .insert([payslip]);

      if (saveError) {
        console.error(`❌ ${period} 급여명세서 저장 실패:`, saveError);
      } else {
        console.log(`✅ ${period} 급여명세서 생성 완료`);
        console.log(`   - 근무일: ${workDays}일, 총 근무시간: ${totalHours.toFixed(1)}시간`);
        console.log(`   - 기본급: ${baseSalary.toLocaleString()}원`);
        console.log(`   - 식대: ${totalMealAllowance.toLocaleString()}원`);
        console.log(`   - 주유대: ${fuelAllowance.toLocaleString()}원`);
        console.log(`   - 총 지급액: ${totalEarnings.toLocaleString()}원`);
        console.log(`   - 실수령액: ${netSalary.toLocaleString()}원 (현금 지급)`);
      }
      
    } catch (error) {
      console.error(`❌ ${period} 급여명세서 생성 중 오류:`, error);
    }
  }

  console.log('\n🎉 나수진 급여명세서 재생성 완료!');
}

regenerateNaPayslips().catch(console.error);
