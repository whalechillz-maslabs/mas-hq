const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

async function testPayslipSave() {
  try {
    console.log('=== payslips 테이블 저장 기능 테스트 ===');
    
    // 1. 최형호 정보 확인
    const { data: choiEmployee, error: empError } = await supabase
      .from('employees')
      .select('*')
      .eq('name', '최형호')
      .single();
    
    if (empError) {
      console.error('최형호 정보 조회 실패:', empError);
      return;
    }
    
    console.log(`직원: ${choiEmployee.name} (${choiEmployee.employee_id})`);
    console.log(`고용형태: ${choiEmployee.employment_type}`);
    
    // 2. 8월 스케줄 조회
    const { data: schedules, error: scheduleError } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', choiEmployee.id)
      .gte('schedule_date', '2025-08-01')
      .lte('schedule_date', '2025-08-31')
      .eq('status', 'approved')
      .order('schedule_date', { ascending: true });
    
    if (scheduleError) {
      console.error('스케줄 조회 실패:', scheduleError);
      return;
    }
    
    // 3. 시간제 급여 계산
    const dailyHours = {};
    schedules.forEach(schedule => {
      const date = schedule.schedule_date;
      const start = new Date(`2025-08-01 ${schedule.scheduled_start}`);
      const end = new Date(`2025-08-01 ${schedule.scheduled_end}`);
      const hours = (end - start) / (1000 * 60 * 60);
      
      if (!dailyHours[date]) {
        dailyHours[date] = 0;
      }
      dailyHours[date] += hours;
    });
    
    // 시급별 계산
    const hourlyWage1 = 13000; // 8월 1일~7일
    const hourlyWage2 = 12000; // 8월 8일~31일
    
    let totalHours = 0;
    let totalWage = 0;
    const dailyDetails = [];
    
    Object.keys(dailyHours).sort().forEach(date => {
      const day = parseInt(date.split('-')[2]);
      const hours = dailyHours[date];
      const wage = day <= 7 ? hourlyWage1 : hourlyWage2;
      const dayWage = hours * wage;
      
      totalHours += hours;
      totalWage += dayWage;
      
      dailyDetails.push({
        date,
        hours: parseFloat(hours.toFixed(1)),
        hourly_wage: wage,
        daily_wage: dayWage
      });
    });
    
    const taxAmount = Math.floor(totalWage * 0.033);
    const netSalary = totalWage - taxAmount;
    
    // 4. payslips 테이블에 저장 시도
    const payslipData = {
      employee_id: choiEmployee.id,
      period: '2025-08',
      employment_type: 'part_time',
      base_salary: totalWage,
      overtime_pay: 0,
      incentive: 0,
      point_bonus: 0,
      total_earnings: totalWage,
      tax_amount: taxAmount,
      net_salary: netSalary,
      total_hours: parseFloat(totalHours.toFixed(1)),
      hourly_rate: hourlyWage2,
      daily_details: dailyDetails,
      status: 'generated'
    };
    
    console.log('\n=== 급여명세서 데이터 ===');
    console.log(`총 근무시간: ${payslipData.total_hours}시간`);
    console.log(`총 급여: ${payslipData.total_earnings.toLocaleString()}원`);
    console.log(`세금: ${payslipData.tax_amount.toLocaleString()}원`);
    console.log(`실수령액: ${payslipData.net_salary.toLocaleString()}원`);
    
    // 5. 저장 시도
    console.log('\n=== payslips 테이블 저장 시도 ===');
    const { data: savedPayslip, error: saveError } = await supabase
      .from('payslips')
      .insert([payslipData])
      .select();
    
    if (saveError) {
      console.error('❌ payslips 테이블 저장 실패:', saveError);
      
      if (saveError.message.includes('relation "payslips" does not exist')) {
        console.log('\n📋 payslips 테이블이 존재하지 않습니다.');
        console.log('Supabase 대시보드에서 다음 SQL을 실행하세요:');
        console.log('─'.repeat(80));
        
        const fs = require('fs');
        const sqlContent = fs.readFileSync('scripts/create_payslips_table.sql', 'utf8');
        console.log(sqlContent);
        console.log('─'.repeat(80));
      }
      
      return;
    }
    
    console.log('✅ payslips 테이블 저장 성공!');
    console.log('저장된 데이터:', savedPayslip);
    
    // 6. 저장된 데이터 확인
    console.log('\n=== 저장된 데이터 확인 ===');
    const { data: retrievedPayslip, error: retrieveError } = await supabase
      .from('payslips')
      .select('*')
      .eq('employee_id', choiEmployee.id)
      .eq('period', '2025-08')
      .single();
    
    if (retrieveError) {
      console.error('저장된 데이터 조회 실패:', retrieveError);
      return;
    }
    
    console.log('조회된 급여명세서:');
    console.log(`- ID: ${retrievedPayslip.id}`);
    console.log(`- 기간: ${retrievedPayslip.period}`);
    console.log(`- 고용형태: ${retrievedPayslip.employment_type}`);
    console.log(`- 총 근무시간: ${retrievedPayslip.total_hours}시간`);
    console.log(`- 총 급여: ${retrievedPayslip.total_earnings.toLocaleString()}원`);
    console.log(`- 실수령액: ${retrievedPayslip.net_salary.toLocaleString()}원`);
    console.log(`- 상태: ${retrievedPayslip.status}`);
    console.log(`- 생성일: ${retrievedPayslip.created_at}`);
    
  } catch (error) {
    console.error('오류 발생:', error);
  }
}

testPayslipSave();
