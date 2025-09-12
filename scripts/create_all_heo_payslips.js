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

async function createAllHeoPayslips() {
  try {
    console.log('🧾 허상원 모든 정산서 생성 시작');
    
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
    
    // 2. 허상원의 시급 데이터 조회
    const { data: wages, error: wageError } = await supabase
      .from('hourly_wages')
      .select('*')
      .eq('employee_id', heoEmployee.id)
      .order('effective_start_date', { ascending: true });
    
    if (wageError) {
      console.error('❌ 허상원 시급 데이터 조회 실패:', wageError);
      return;
    }
    
    // 3. 정산 기간별 데이터 정의 (실제 지급 내역 기준)
    const settlementData = [
      {
        period: '2025-06-1',
        name: '6월 1차',
        startDate: '2025-06-19',
        endDate: '2025-06-30',
        totalHours: 27,
        baseSalary: 348000,
        mealAllowance: 10000,
        netSalary: 358000,
        workDays: 6,
        hourlyRate: 12000
      },
      {
        period: '2025-07-1',
        name: '7월 1차',
        startDate: '2025-07-02',
        endDate: '2025-07-11',
        totalHours: 44.5,
        baseSalary: 578500,
        mealAllowance: 0,
        netSalary: 578500,
        workDays: 7,
        hourlyRate: 13000
      },
      {
        period: '2025-07-2',
        name: '7월 2차',
        startDate: '2025-07-14',
        endDate: '2025-07-25',
        totalHours: 46,
        baseSalary: 598000,
        mealAllowance: 0,
        netSalary: 598000,
        workDays: 7,
        hourlyRate: 13000
      },
      {
        period: '2025-07-3',
        name: '7월 3차',
        startDate: '2025-07-28',
        endDate: '2025-07-30',
        totalHours: 21,
        baseSalary: 273000,
        mealAllowance: 0,
        netSalary: 273000,
        workDays: 3,
        hourlyRate: 13000
      },
      {
        period: '2025-08-1',
        name: '8월 1차',
        startDate: '2025-08-01',
        endDate: '2025-08-08',
        totalHours: 33.5,
        baseSalary: 435500,
        mealAllowance: 0,
        netSalary: 435500,
        workDays: 5,
        hourlyRate: 13000
      },
      {
        period: '2025-08-2',
        name: '8월 2차',
        startDate: '2025-08-11',
        endDate: '2025-08-29',
        totalHours: 87.5,
        baseSalary: 1137500,
        mealAllowance: 0,
        netSalary: 1137500,
        workDays: 12,
        hourlyRate: 13000
      }
    ];
    
    // 4. 각 정산서 생성
    for (const settlement of settlementData) {
      console.log(`\n📄 ${settlement.name} 정산서 생성 중...`);
      
      // 일별 상세 내역 생성 (간단한 버전)
      const dailyDetails = [];
      const startDate = new Date(settlement.startDate);
      const endDate = new Date(settlement.endDate);
      const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
      const avgHoursPerDay = settlement.totalHours / settlement.workDays;
      
      for (let i = 0; i < settlement.workDays; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        const dateStr = currentDate.toISOString().split('T')[0];
        
        dailyDetails.push({
          date: dateStr,
          hours: avgHoursPerDay,
          daily_wage: Math.round(avgHoursPerDay * settlement.hourlyRate),
          hourly_wage: settlement.hourlyRate
        });
      }
      
      // 정산서 데이터 생성
      const payslipData = {
        employee_id: heoEmployee.id,
        period: settlement.period,
        employment_type: 'part_time',
        base_salary: settlement.baseSalary,
        overtime_pay: 0,
        incentive: 0,
        point_bonus: settlement.mealAllowance,
        total_earnings: settlement.baseSalary + settlement.mealAllowance,
        tax_amount: 0,
        net_salary: settlement.netSalary,
        total_hours: settlement.totalHours,
        hourly_rate: settlement.hourlyRate,
        daily_details: dailyDetails,
        status: 'issued',
        issued_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };
      
      // 기존 정산서 확인
      const { data: existingPayslips, error: checkError } = await supabase
        .from('payslips')
        .select('*')
        .eq('employee_id', heoEmployee.id)
        .eq('period', settlement.period);
      
      if (checkError) {
        console.error(`❌ ${settlement.name} 기존 정산서 확인 실패:`, checkError);
        continue;
      }
      
      if (existingPayslips.length > 0) {
        console.log(`⚠️ ${settlement.name} 정산서가 이미 존재합니다. 업데이트합니다.`);
        
        // 기존 정산서 업데이트
        const { data: updatedPayslip, error: updateError } = await supabase
          .from('payslips')
          .update({
            base_salary: payslipData.base_salary,
            point_bonus: payslipData.point_bonus,
            total_earnings: payslipData.total_earnings,
            net_salary: payslipData.net_salary,
            total_hours: payslipData.total_hours,
            hourly_rate: payslipData.hourly_rate,
            daily_details: payslipData.daily_details,
            status: 'issued',
            issued_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPayslips[0].id)
          .select();
        
        if (updateError) {
          console.error(`❌ ${settlement.name} 정산서 업데이트 실패:`, updateError);
        } else {
          console.log(`✅ ${settlement.name} 정산서 업데이트 성공:`, updatedPayslip[0].id);
        }
      } else {
        // 새 정산서 생성
        const { data: newPayslip, error: createError } = await supabase
          .from('payslips')
          .insert([payslipData])
          .select();
        
        if (createError) {
          console.error(`❌ ${settlement.name} 정산서 생성 실패:`, createError);
        } else {
          console.log(`✅ ${settlement.name} 정산서 생성 성공:`, newPayslip[0].id);
        }
      }
      
      console.log(`  - 기간: ${settlement.startDate} ~ ${settlement.endDate}`);
      console.log(`  - 근무시간: ${settlement.totalHours}시간`);
      console.log(`  - 총 금액: ${settlement.netSalary.toLocaleString()}원`);
      console.log(`  - 시급: ${settlement.hourlyRate.toLocaleString()}원/시간`);
    }
    
    // 5. 생성된 정산서 목록 확인
    const { data: allPayslips, error: finalError } = await supabase
      .from('payslips')
      .select('*')
      .eq('employee_id', heoEmployee.id)
      .order('period', { ascending: true });
    
    if (finalError) {
      console.error('❌ 최종 정산서 목록 조회 실패:', finalError);
      return;
    }
    
    console.log('\n📋 허상원 전체 정산서 목록:');
    allPayslips.forEach((payslip, index) => {
      console.log(`  ${index + 1}. ${payslip.period}: ${payslip.net_salary?.toLocaleString()}원 (${payslip.status})`);
    });
    
    console.log('\n🎉 허상원 모든 정산서 생성 완료!');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

createAllHeoPayslips();
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

async function createAllHeoPayslips() {
  try {
    console.log('🧾 허상원 모든 정산서 생성 시작');
    
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
    
    // 2. 허상원의 시급 데이터 조회
    const { data: wages, error: wageError } = await supabase
      .from('hourly_wages')
      .select('*')
      .eq('employee_id', heoEmployee.id)
      .order('effective_start_date', { ascending: true });
    
    if (wageError) {
      console.error('❌ 허상원 시급 데이터 조회 실패:', wageError);
      return;
    }
    
    // 3. 정산 기간별 데이터 정의 (실제 지급 내역 기준)
    const settlementData = [
      {
        period: '2025-06-1',
        name: '6월 1차',
        startDate: '2025-06-19',
        endDate: '2025-06-30',
        totalHours: 27,
        baseSalary: 348000,
        mealAllowance: 10000,
        netSalary: 358000,
        workDays: 6,
        hourlyRate: 12000
      },
      {
        period: '2025-07-1',
        name: '7월 1차',
        startDate: '2025-07-02',
        endDate: '2025-07-11',
        totalHours: 44.5,
        baseSalary: 578500,
        mealAllowance: 0,
        netSalary: 578500,
        workDays: 7,
        hourlyRate: 13000
      },
      {
        period: '2025-07-2',
        name: '7월 2차',
        startDate: '2025-07-14',
        endDate: '2025-07-25',
        totalHours: 46,
        baseSalary: 598000,
        mealAllowance: 0,
        netSalary: 598000,
        workDays: 7,
        hourlyRate: 13000
      },
      {
        period: '2025-07-3',
        name: '7월 3차',
        startDate: '2025-07-28',
        endDate: '2025-07-30',
        totalHours: 21,
        baseSalary: 273000,
        mealAllowance: 0,
        netSalary: 273000,
        workDays: 3,
        hourlyRate: 13000
      },
      {
        period: '2025-08-1',
        name: '8월 1차',
        startDate: '2025-08-01',
        endDate: '2025-08-08',
        totalHours: 33.5,
        baseSalary: 435500,
        mealAllowance: 0,
        netSalary: 435500,
        workDays: 5,
        hourlyRate: 13000
      },
      {
        period: '2025-08-2',
        name: '8월 2차',
        startDate: '2025-08-11',
        endDate: '2025-08-29',
        totalHours: 87.5,
        baseSalary: 1137500,
        mealAllowance: 0,
        netSalary: 1137500,
        workDays: 12,
        hourlyRate: 13000
      }
    ];
    
    // 4. 각 정산서 생성
    for (const settlement of settlementData) {
      console.log(`\n📄 ${settlement.name} 정산서 생성 중...`);
      
      // 일별 상세 내역 생성 (간단한 버전)
      const dailyDetails = [];
      const startDate = new Date(settlement.startDate);
      const endDate = new Date(settlement.endDate);
      const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
      const avgHoursPerDay = settlement.totalHours / settlement.workDays;
      
      for (let i = 0; i < settlement.workDays; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        const dateStr = currentDate.toISOString().split('T')[0];
        
        dailyDetails.push({
          date: dateStr,
          hours: avgHoursPerDay,
          daily_wage: Math.round(avgHoursPerDay * settlement.hourlyRate),
          hourly_wage: settlement.hourlyRate
        });
      }
      
      // 정산서 데이터 생성
      const payslipData = {
        employee_id: heoEmployee.id,
        period: settlement.period,
        employment_type: 'part_time',
        base_salary: settlement.baseSalary,
        overtime_pay: 0,
        incentive: 0,
        point_bonus: settlement.mealAllowance,
        total_earnings: settlement.baseSalary + settlement.mealAllowance,
        tax_amount: 0,
        net_salary: settlement.netSalary,
        total_hours: settlement.totalHours,
        hourly_rate: settlement.hourlyRate,
        daily_details: dailyDetails,
        status: 'issued',
        issued_at: new Date().toISOString(),
        created_at: new Date().toISOString()
      };
      
      // 기존 정산서 확인
      const { data: existingPayslips, error: checkError } = await supabase
        .from('payslips')
        .select('*')
        .eq('employee_id', heoEmployee.id)
        .eq('period', settlement.period);
      
      if (checkError) {
        console.error(`❌ ${settlement.name} 기존 정산서 확인 실패:`, checkError);
        continue;
      }
      
      if (existingPayslips.length > 0) {
        console.log(`⚠️ ${settlement.name} 정산서가 이미 존재합니다. 업데이트합니다.`);
        
        // 기존 정산서 업데이트
        const { data: updatedPayslip, error: updateError } = await supabase
          .from('payslips')
          .update({
            base_salary: payslipData.base_salary,
            point_bonus: payslipData.point_bonus,
            total_earnings: payslipData.total_earnings,
            net_salary: payslipData.net_salary,
            total_hours: payslipData.total_hours,
            hourly_rate: payslipData.hourly_rate,
            daily_details: payslipData.daily_details,
            status: 'issued',
            issued_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', existingPayslips[0].id)
          .select();
        
        if (updateError) {
          console.error(`❌ ${settlement.name} 정산서 업데이트 실패:`, updateError);
        } else {
          console.log(`✅ ${settlement.name} 정산서 업데이트 성공:`, updatedPayslip[0].id);
        }
      } else {
        // 새 정산서 생성
        const { data: newPayslip, error: createError } = await supabase
          .from('payslips')
          .insert([payslipData])
          .select();
        
        if (createError) {
          console.error(`❌ ${settlement.name} 정산서 생성 실패:`, createError);
        } else {
          console.log(`✅ ${settlement.name} 정산서 생성 성공:`, newPayslip[0].id);
        }
      }
      
      console.log(`  - 기간: ${settlement.startDate} ~ ${settlement.endDate}`);
      console.log(`  - 근무시간: ${settlement.totalHours}시간`);
      console.log(`  - 총 금액: ${settlement.netSalary.toLocaleString()}원`);
      console.log(`  - 시급: ${settlement.hourlyRate.toLocaleString()}원/시간`);
    }
    
    // 5. 생성된 정산서 목록 확인
    const { data: allPayslips, error: finalError } = await supabase
      .from('payslips')
      .select('*')
      .eq('employee_id', heoEmployee.id)
      .order('period', { ascending: true });
    
    if (finalError) {
      console.error('❌ 최종 정산서 목록 조회 실패:', finalError);
      return;
    }
    
    console.log('\n📋 허상원 전체 정산서 목록:');
    allPayslips.forEach((payslip, index) => {
      console.log(`  ${index + 1}. ${payslip.period}: ${payslip.net_salary?.toLocaleString()}원 (${payslip.status})`);
    });
    
    console.log('\n🎉 허상원 모든 정산서 생성 완료!');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

createAllHeoPayslips();
