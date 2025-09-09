const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

async function generateChoiAugustPayslip() {
  try {
    console.log('=== 최형호 8월 시간제 급여명세서 생성 ===');
    
    // 1. 최형호 정보 확인
    const { data: choiEmployee, error: empError } = await supabase
      .from('employees')
      .select('id, name, employee_id')
      .eq('name', '최형호')
      .single();
    
    if (empError) {
      console.error('직원 조회 오류:', empError);
      return;
    }
    
    console.log(`직원: ${choiEmployee.name} (${choiEmployee.employee_id})`);
    
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
      console.error('스케줄 조회 오류:', scheduleError);
      return;
    }
    
    // 3. 급여 계산
    const dailyHours = {};
    let totalHours = 0;
    
    schedules.forEach(schedule => {
      const date = schedule.schedule_date;
      const startTime = schedule.scheduled_start;
      const endTime = schedule.scheduled_end;
      
      if (!dailyHours[date]) {
        dailyHours[date] = 0;
      }
      
      // 시간 계산
      const start = new Date(`2025-08-01 ${startTime}`);
      const end = new Date(`2025-08-01 ${endTime}`);
      const hours = (end - start) / (1000 * 60 * 60);
      
      dailyHours[date] += hours;
      totalHours += hours;
    });
    
    // 4. 시급별 계산
    const hourlyWage1 = 13000; // 8월 1일~7일
    const hourlyWage2 = 12000; // 8월 8일~31일
    
    let totalWage = 0;
    const dailyDetails = [];
    
    Object.keys(dailyHours).sort().forEach(date => {
      const day = parseInt(date.split('-')[2]);
      const hours = dailyHours[date];
      const wage = day <= 7 ? hourlyWage1 : hourlyWage2;
      const dayWage = hours * wage;
      totalWage += dayWage;
      
      dailyDetails.push({
        date,
        hours: hours.toFixed(1),
        hourlyWage: wage,
        dailyWage: dayWage
      });
    });
    
    // 5. 급여명세서 데이터 생성
    const payslipData = {
      employee_id: choiEmployee.id,
      employee_name: choiEmployee.name,
      employee_number: choiEmployee.employee_id,
      period: '2025년 8월',
      employment_type: 'part_time',
      total_hours: totalHours.toFixed(1),
      total_wage: totalWage,
      daily_details: dailyDetails,
      generated_at: new Date().toISOString()
    };
    
    // 6. 급여명세서 저장 (payslips 테이블이 있다면)
    const { data: payslip, error: payslipError } = await supabase
      .from('payslips')
      .insert([{
        employee_id: choiEmployee.id,
        period: '2025-08',
        employment_type: 'part_time',
        total_hours: totalHours,
        total_wage: totalWage,
        details: dailyDetails,
        status: 'generated',
        created_at: new Date().toISOString()
      }])
      .select();
    
    if (payslipError) {
      console.log('급여명세서 저장 실패 (테이블이 없을 수 있음):', payslipError.message);
    } else {
      console.log('급여명세서 저장 완료:', payslip);
    }
    
    // 7. 결과 출력
    console.log('\n=== 📋 급여명세서 ===');
    console.log(`직원명: ${payslipData.employee_name}`);
    console.log(`직원번호: ${payslipData.employee_number}`);
    console.log(`급여기간: ${payslipData.period}`);
    console.log(`고용형태: 시간제 (Part-time)`);
    console.log(`총 근무시간: ${payslipData.total_hours}시간`);
    console.log(`총 급여: ${payslipData.total_wage.toLocaleString()}원`);
    
    console.log('\n=== 📅 일별 상세 내역 ===');
    dailyDetails.forEach(detail => {
      console.log(`${detail.date}: ${detail.hours}시간 × ${detail.hourlyWage.toLocaleString()}원 = ${detail.dailyWage.toLocaleString()}원`);
    });
    
    console.log('\n=== 💰 급여 요약 ===');
    console.log(`기본급 (시간제): ${totalWage.toLocaleString()}원`);
    console.log(`세금 (3.3%): ${Math.floor(totalWage * 0.033).toLocaleString()}원`);
    console.log(`실수령액: ${(totalWage - Math.floor(totalWage * 0.033)).toLocaleString()}원`);
    
    return payslipData;
    
  } catch (error) {
    console.error('오류 발생:', error);
  }
}

generateChoiAugustPayslip();
