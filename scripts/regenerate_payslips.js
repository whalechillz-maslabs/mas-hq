const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

async function generateHourlyPayslip(employee, year, month) {
  console.log(`\n📋 ${employee.name}의 ${year}년 ${month}월 급여명세서 생성 중...`);
  
  // 해당 월의 스케줄 조회
  const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
  
  const { data: schedules, error: scheduleError } = await supabase
    .from('schedules')
    .select('*')
    .eq('employee_id', employee.id)
    .gte('schedule_date', startDate)
    .lte('schedule_date', endDate)
    .neq('status', 'cancelled')
    .order('schedule_date', { ascending: true });

  if (scheduleError) {
    throw new Error('스케줄 조회 실패');
  }

  if (!schedules || schedules.length === 0) {
    console.log(`⚠️ ${year}년 ${month}월에 유효한 스케줄이 없습니다.`);
    return null;
  }

  // 시급 정보 조회
  const { data: wages, error: wageError } = await supabase
    .from('hourly_wages')
    .select('*')
    .eq('employee_id', employee.id)
    .order('effective_start_date');

  if (wageError) {
    throw new Error('시급 정보 조회에 실패했습니다.');
  }

  if (!wages || wages.length === 0) {
    throw new Error('시급 정보가 없습니다.');
  }

  // 일별 근무시간 계산 (스케줄의 실제 시간을 그대로 사용)
  const dailyHours = {};
  schedules.forEach(schedule => {
    const date = schedule.schedule_date;
    const start = new Date(`${date} ${schedule.scheduled_start}`);
    const end = new Date(`${date} ${schedule.scheduled_end}`);
    const rawHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    
    // 근무시간을 그대로 사용 (정규화하지 않음)
    const hours = rawHours;
    
    if (!dailyHours[date]) {
      dailyHours[date] = 0;
    }
    dailyHours[date] += hours;
  });
  
  let totalHours = 0;
  let totalWage = 0;
  const dailyDetails = [];

  Object.keys(dailyHours).sort().forEach(date => {
    const hours = dailyHours[date];
    const scheduleDate = new Date(date);
    
    // 해당 날짜에 적용되는 시급 찾기
    const applicableWages = wages.filter(wage => {
      const startDate = new Date(wage.effective_start_date);
      const endDate = wage.effective_end_date ? new Date(wage.effective_end_date) : null;
      return startDate <= scheduleDate && (!endDate || endDate >= scheduleDate);
    });
    
    const applicableWage = applicableWages.length > 0 
      ? applicableWages.reduce((latest, current) => 
          new Date(current.effective_start_date) > new Date(latest.effective_start_date) ? current : latest
        )
      : wages[0];
    
    const hourlyWage = applicableWage ? applicableWage.base_wage : wages[0].base_wage;
    const dayWage = hours * hourlyWage;
    
    totalHours += hours;
    totalWage += dayWage;
    
    dailyDetails.push({
      date,
      hours,
      hourly_rate: hourlyWage,
      daily_wage: dayWage
    });
  });

  // 세금 계산 (3.3% 사업소득세)
  const taxAmount = Math.round(totalWage * 0.033);
  const netSalary = totalWage - taxAmount; // 총 급여에서 세금을 차감한 실수령액

  const payslip = {
    employee_id: employee.id,
    period: `${year}-${month.toString().padStart(2, '0')}`,
    employment_type: 'part_time',
    base_salary: totalWage,
    overtime_pay: 0,
    incentive: 0,
    point_bonus: 0,
    total_earnings: totalWage,
    tax_amount: taxAmount,
    net_salary: netSalary,
    status: 'generated',
    total_hours: totalHours,
    hourly_rate: wages[wages.length - 1].base_wage,
    daily_details: dailyDetails
  };

  // 급여명세서 저장
  const { error: saveError } = await supabase
    .from('payslips')
    .insert([payslip]);

  if (saveError) {
    throw new Error('급여명세서 저장에 실패했습니다.');
  }

  console.log(`✅ ${employee.name} ${year}년 ${month}월 급여명세서 생성 완료`);
  console.log(`   📊 총 근무시간: ${totalHours}시간`);
  console.log(`   💰 총 지급액: ${totalWage.toLocaleString()}원`);
  console.log(`   🧾 세금 (3.3%): ${taxAmount.toLocaleString()}원`);
  console.log(`   💵 실수령액: ${netSalary.toLocaleString()}원`);
  
  return payslip;
}

async function generateMonthlyPayslip(employee, year, month) {
  console.log(`\n📋 ${employee.name}의 ${year}년 ${month}월 급여명세서 생성 중...`);
  
  const baseSalary = employee.monthly_salary || 0;
  const overtimePay = 0;
  const incentive = 0;
  const pointBonus = 0;
  const totalEarnings = baseSalary + overtimePay + incentive + pointBonus;
  const taxAmount = Math.round(totalEarnings * 0.033); // 3.3% 사업소득세
  const netSalary = totalEarnings - taxAmount; // 총 급여에서 세금을 차감한 실수령액

  const payslip = {
    employee_id: employee.id,
    period: `${year}-${month.toString().padStart(2, '0')}`,
    employment_type: 'full_time',
    base_salary: baseSalary,
    overtime_pay: overtimePay,
    incentive: incentive,
    point_bonus: pointBonus,
    total_earnings: totalEarnings,
    tax_amount: taxAmount,
    net_salary: netSalary,
    status: 'generated'
  };

  // 급여명세서 저장
  const { error: saveError } = await supabase
    .from('payslips')
    .insert([payslip]);

  if (saveError) {
    throw new Error('급여명세서 저장에 실패했습니다.');
  }

  console.log(`✅ ${employee.name} ${year}년 ${month}월 급여명세서 생성 완료`);
  console.log(`   💰 총 지급액: ${totalEarnings.toLocaleString()}원`);
  console.log(`   🧾 세금 (3.3%): ${taxAmount.toLocaleString()}원`);
  console.log(`   💵 실수령액: ${netSalary.toLocaleString()}원`);
  
  return payslip;
}

async function regenerateAllPayslips() {
  try {
    console.log('🔄 개선된 로직으로 급여명세서 재생성 시작...\n');
    
    // 직원 목록 조회
    const { data: employees, error: employeesError } = await supabase
      .from('employees')
      .select('*')
      .order('name');

    if (employeesError) {
      console.error('❌ 직원 목록 조회 실패:', employeesError);
      return;
    }

    console.log(`📋 총 ${employees.length}명의 직원을 찾았습니다.`);

    // 각 직원별로 최근 3개월 급여명세서 생성
    const currentDate = new Date();
    const monthsToGenerate = 3;
    
    for (const employee of employees) {
      console.log(`\n👤 ${employee.name} (${employee.employee_id}) - ${employee.employment_type}`);
      
      for (let i = 0; i < monthsToGenerate; i++) {
        const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const year = targetDate.getFullYear();
        const month = targetDate.getMonth() + 1;
        
        try {
          if (employee.employment_type === 'part_time') {
            await generateHourlyPayslip(employee, year, month);
          } else {
            await generateMonthlyPayslip(employee, year, month);
          }
        } catch (error) {
          console.log(`⚠️ ${employee.name} ${year}년 ${month}월 급여명세서 생성 실패:`, error.message);
        }
      }
    }

    console.log('\n🎉 모든 급여명세서 재생성 완료!');
    
    // 생성된 급여명세서 확인
    const { data: newPayslips, error: checkError } = await supabase
      .from('payslips')
      .select(`
        period,
        total_hours,
        total_earnings,
        tax_amount,
        net_salary,
        employees!inner(name, employee_id)
      `)
      .order('created_at', { ascending: false });
      
    if (checkError) {
      console.error('❌ 생성된 급여명세서 확인 실패:', checkError);
      return;
    }

    console.log(`\n📊 새로 생성된 급여명세서: ${newPayslips.length}개`);
    newPayslips.forEach((payslip, index) => {
      console.log(`${index + 1}. ${payslip.employees.name} - ${payslip.period}`);
      if (payslip.total_hours) {
        console.log(`   📊 근무시간: ${payslip.total_hours}시간`);
      }
      console.log(`   💰 총 지급액: ${payslip.total_earnings.toLocaleString()}원`);
      console.log(`   🧾 세금: ${payslip.tax_amount.toLocaleString()}원`);
      console.log(`   💵 실수령액: ${payslip.net_salary.toLocaleString()}원`);
    });

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

regenerateAllPayslips();
