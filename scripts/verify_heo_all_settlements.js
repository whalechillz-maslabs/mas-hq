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

async function verifyHeoAllSettlements() {
  try {
    console.log('🔍 허상원 전체 정산 내역 검증 시작');
    
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
    
    console.log('👤 허상원 직원 정보:', heoEmployee.name, `(${heoEmployee.employee_id})`);
    
    // 2. 허상원의 모든 스케줄 데이터 조회
    const { data: allSchedules, error: scheduleError } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', heoEmployee.id)
      .order('schedule_date', { ascending: true });
    
    if (scheduleError) {
      console.error('❌ 허상원 스케줄 조회 실패:', scheduleError);
      return;
    }
    
    console.log('📅 총 스케줄 수:', allSchedules.length);
    
    // 3. 허상원의 시급 데이터 조회
    const { data: wages, error: wageError } = await supabase
      .from('hourly_wages')
      .select('*')
      .eq('employee_id', heoEmployee.id)
      .order('effective_start_date', { ascending: true });
    
    if (wageError) {
      console.error('❌ 허상원 시급 데이터 조회 실패:', wageError);
      return;
    }
    
    console.log('💰 시급 버전 수:', wages.length);
    wages.forEach((wage, index) => {
      console.log(`  ${index + 1}. ${wage.effective_start_date}부터: ${wage.base_wage}원/시간`);
    });
    
    // 4. 정산 기간별로 스케줄 분류
    const settlementPeriods = [
      { name: '6월 1차', start: '2025-06-19', end: '2025-06-30', expectedAmount: 348000, expectedHours: 27, expectedDays: 6 },
      { name: '7월 1차', start: '2025-07-02', end: '2025-07-11', expectedAmount: 578500, expectedHours: 44.5, expectedDays: 7 },
      { name: '7월 2차', start: '2025-07-14', end: '2025-07-25', expectedAmount: 598000, expectedHours: 46, expectedDays: 7 },
      { name: '7월 3차', start: '2025-07-28', end: '2025-07-30', expectedAmount: 273000, expectedHours: 21, expectedDays: 3 },
      { name: '8월 1차', start: '2025-08-01', end: '2025-08-08', expectedAmount: 435500, expectedHours: 33.5, expectedDays: 5 },
      { name: '8월 2차', start: '2025-08-11', end: '2025-08-29', expectedAmount: 1137500, expectedHours: 87.5, expectedDays: 12 }
    ];
    
    console.log('\n📊 정산 기간별 검증:');
    
    for (const period of settlementPeriods) {
      console.log(`\n🔍 ${period.name} (${period.start} ~ ${period.end})`);
      
      // 해당 기간의 스케줄 필터링
      const periodSchedules = allSchedules.filter(schedule => {
        const scheduleDate = new Date(schedule.schedule_date);
        const startDate = new Date(period.start);
        const endDate = new Date(period.end);
        return scheduleDate >= startDate && scheduleDate <= endDate;
      });
      
      console.log(`  📅 실제 스케줄 수: ${periodSchedules.length}개`);
      
      // 근무일수 계산
      const uniqueDays = new Set(periodSchedules.map(s => s.schedule_date)).size;
      console.log(`  📅 실제 근무일수: ${uniqueDays}일`);
      
      // 총 근무시간 계산
      let totalHours = 0;
      let totalAmount = 0;
      const dailyDetails = [];
      
      periodSchedules.forEach(schedule => {
        const scheduleDate = new Date(schedule.schedule_date);
        const currentWage = wages.find(wage => 
          new Date(wage.effective_start_date) <= scheduleDate &&
          (!wage.effective_end_date || new Date(wage.effective_end_date) >= scheduleDate)
        );
        
        if (currentWage) {
          const dailyAmount = schedule.total_hours * currentWage.base_wage;
          totalHours += schedule.total_hours;
          totalAmount += dailyAmount;
          
          dailyDetails.push({
            date: schedule.schedule_date,
            hours: schedule.total_hours,
            hourlyRate: currentWage.base_wage,
            amount: dailyAmount
          });
        }
      });
      
      console.log(`  ⏰ 실제 근무시간: ${totalHours}시간`);
      console.log(`  💰 실제 총 금액: ${totalAmount.toLocaleString()}원`);
      
      // 예상값과 비교
      const hoursMatch = Math.abs(totalHours - period.expectedHours) < 0.1;
      const amountMatch = Math.abs(totalAmount - period.expectedAmount) < 1;
      const daysMatch = uniqueDays === period.expectedDays;
      
      console.log(`  ✅ 근무시간 일치: ${hoursMatch ? '✅' : '❌'} (예상: ${period.expectedHours}시간, 실제: ${totalHours}시간)`);
      console.log(`  ✅ 총 금액 일치: ${amountMatch ? '✅' : '❌'} (예상: ${period.expectedAmount.toLocaleString()}원, 실제: ${totalAmount.toLocaleString()}원)`);
      console.log(`  ✅ 근무일수 일치: ${daysMatch ? '✅' : '❌'} (예상: ${period.expectedDays}일, 실제: ${uniqueDays}일)`);
      
      if (!hoursMatch || !amountMatch || !daysMatch) {
        console.log(`  ⚠️ ${period.name} 검증 실패 - 상세 내역 확인 필요`);
        console.log('  📋 일별 상세:');
        dailyDetails.forEach(detail => {
          console.log(`    ${detail.date}: ${detail.hours}시간 × ${detail.hourlyRate.toLocaleString()}원 = ${detail.amount.toLocaleString()}원`);
        });
      }
    }
    
    // 5. 기존 정산서 확인
    const { data: existingPayslips, error: payslipError } = await supabase
      .from('payslips')
      .select('*')
      .eq('employee_id', heoEmployee.id)
      .order('created_at', { ascending: true });
    
    if (payslipError) {
      console.error('❌ 기존 정산서 조회 실패:', payslipError);
      return;
    }
    
    console.log('\n📋 기존 정산서 목록:');
    existingPayslips.forEach((payslip, index) => {
      console.log(`  ${index + 1}. ${payslip.period}: ${payslip.net_salary?.toLocaleString()}원 (${payslip.status})`);
    });
    
    console.log('\n🎉 허상원 전체 정산 내역 검증 완료');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

verifyHeoAllSettlements();
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

async function verifyHeoAllSettlements() {
  try {
    console.log('🔍 허상원 전체 정산 내역 검증 시작');
    
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
    
    console.log('👤 허상원 직원 정보:', heoEmployee.name, `(${heoEmployee.employee_id})`);
    
    // 2. 허상원의 모든 스케줄 데이터 조회
    const { data: allSchedules, error: scheduleError } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', heoEmployee.id)
      .order('schedule_date', { ascending: true });
    
    if (scheduleError) {
      console.error('❌ 허상원 스케줄 조회 실패:', scheduleError);
      return;
    }
    
    console.log('📅 총 스케줄 수:', allSchedules.length);
    
    // 3. 허상원의 시급 데이터 조회
    const { data: wages, error: wageError } = await supabase
      .from('hourly_wages')
      .select('*')
      .eq('employee_id', heoEmployee.id)
      .order('effective_start_date', { ascending: true });
    
    if (wageError) {
      console.error('❌ 허상원 시급 데이터 조회 실패:', wageError);
      return;
    }
    
    console.log('💰 시급 버전 수:', wages.length);
    wages.forEach((wage, index) => {
      console.log(`  ${index + 1}. ${wage.effective_start_date}부터: ${wage.base_wage}원/시간`);
    });
    
    // 4. 정산 기간별로 스케줄 분류
    const settlementPeriods = [
      { name: '6월 1차', start: '2025-06-19', end: '2025-06-30', expectedAmount: 348000, expectedHours: 27, expectedDays: 6 },
      { name: '7월 1차', start: '2025-07-02', end: '2025-07-11', expectedAmount: 578500, expectedHours: 44.5, expectedDays: 7 },
      { name: '7월 2차', start: '2025-07-14', end: '2025-07-25', expectedAmount: 598000, expectedHours: 46, expectedDays: 7 },
      { name: '7월 3차', start: '2025-07-28', end: '2025-07-30', expectedAmount: 273000, expectedHours: 21, expectedDays: 3 },
      { name: '8월 1차', start: '2025-08-01', end: '2025-08-08', expectedAmount: 435500, expectedHours: 33.5, expectedDays: 5 },
      { name: '8월 2차', start: '2025-08-11', end: '2025-08-29', expectedAmount: 1137500, expectedHours: 87.5, expectedDays: 12 }
    ];
    
    console.log('\n📊 정산 기간별 검증:');
    
    for (const period of settlementPeriods) {
      console.log(`\n🔍 ${period.name} (${period.start} ~ ${period.end})`);
      
      // 해당 기간의 스케줄 필터링
      const periodSchedules = allSchedules.filter(schedule => {
        const scheduleDate = new Date(schedule.schedule_date);
        const startDate = new Date(period.start);
        const endDate = new Date(period.end);
        return scheduleDate >= startDate && scheduleDate <= endDate;
      });
      
      console.log(`  📅 실제 스케줄 수: ${periodSchedules.length}개`);
      
      // 근무일수 계산
      const uniqueDays = new Set(periodSchedules.map(s => s.schedule_date)).size;
      console.log(`  📅 실제 근무일수: ${uniqueDays}일`);
      
      // 총 근무시간 계산
      let totalHours = 0;
      let totalAmount = 0;
      const dailyDetails = [];
      
      periodSchedules.forEach(schedule => {
        const scheduleDate = new Date(schedule.schedule_date);
        const currentWage = wages.find(wage => 
          new Date(wage.effective_start_date) <= scheduleDate &&
          (!wage.effective_end_date || new Date(wage.effective_end_date) >= scheduleDate)
        );
        
        if (currentWage) {
          const dailyAmount = schedule.total_hours * currentWage.base_wage;
          totalHours += schedule.total_hours;
          totalAmount += dailyAmount;
          
          dailyDetails.push({
            date: schedule.schedule_date,
            hours: schedule.total_hours,
            hourlyRate: currentWage.base_wage,
            amount: dailyAmount
          });
        }
      });
      
      console.log(`  ⏰ 실제 근무시간: ${totalHours}시간`);
      console.log(`  💰 실제 총 금액: ${totalAmount.toLocaleString()}원`);
      
      // 예상값과 비교
      const hoursMatch = Math.abs(totalHours - period.expectedHours) < 0.1;
      const amountMatch = Math.abs(totalAmount - period.expectedAmount) < 1;
      const daysMatch = uniqueDays === period.expectedDays;
      
      console.log(`  ✅ 근무시간 일치: ${hoursMatch ? '✅' : '❌'} (예상: ${period.expectedHours}시간, 실제: ${totalHours}시간)`);
      console.log(`  ✅ 총 금액 일치: ${amountMatch ? '✅' : '❌'} (예상: ${period.expectedAmount.toLocaleString()}원, 실제: ${totalAmount.toLocaleString()}원)`);
      console.log(`  ✅ 근무일수 일치: ${daysMatch ? '✅' : '❌'} (예상: ${period.expectedDays}일, 실제: ${uniqueDays}일)`);
      
      if (!hoursMatch || !amountMatch || !daysMatch) {
        console.log(`  ⚠️ ${period.name} 검증 실패 - 상세 내역 확인 필요`);
        console.log('  📋 일별 상세:');
        dailyDetails.forEach(detail => {
          console.log(`    ${detail.date}: ${detail.hours}시간 × ${detail.hourlyRate.toLocaleString()}원 = ${detail.amount.toLocaleString()}원`);
        });
      }
    }
    
    // 5. 기존 정산서 확인
    const { data: existingPayslips, error: payslipError } = await supabase
      .from('payslips')
      .select('*')
      .eq('employee_id', heoEmployee.id)
      .order('created_at', { ascending: true });
    
    if (payslipError) {
      console.error('❌ 기존 정산서 조회 실패:', payslipError);
      return;
    }
    
    console.log('\n📋 기존 정산서 목록:');
    existingPayslips.forEach((payslip, index) => {
      console.log(`  ${index + 1}. ${payslip.period}: ${payslip.net_salary?.toLocaleString()}원 (${payslip.status})`);
    });
    
    console.log('\n🎉 허상원 전체 정산 내역 검증 완료');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

verifyHeoAllSettlements();
