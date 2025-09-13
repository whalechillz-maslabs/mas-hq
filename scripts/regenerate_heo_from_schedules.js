const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

async function deleteHeoExistingPayslips() {
  console.log('🗑️ 허상원 기존 급여명세서 모두 삭제 중...');
  
  try {
    const { error: deleteError } = await supabase
      .from('payslips')
      .delete()
      .eq('employee_id', '2cc1b823-b231-4c90-8eb2-9728f21ba832'); // 허상원 ID

    if (deleteError) {
      console.error('❌ 허상원 급여명세서 삭제 실패:', deleteError);
      return false;
    }

    console.log('✅ 허상원 기존 급여명세서 삭제 완료');
    return true;

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    return false;
  }
}

async function getHeoSchedules() {
  console.log('\n📋 허상원 실제 스케줄 데이터 조회 중...');
  
  try {
    const { data: schedules, error: scheduleError } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', '2cc1b823-b231-4c90-8eb2-9728f21ba832')
      .order('schedule_date', { ascending: true });

    if (scheduleError) {
      console.error('❌ 스케줄 조회 실패:', scheduleError);
      return null;
    }

    console.log(`✅ 허상원 스케줄 ${schedules.length}개 조회 완료`);
    return schedules;

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    return null;
  }
}

async function createPayslipsFromSchedules(schedules) {
  console.log('\n📋 실제 스케줄 기반으로 급여명세서 생성 중...');
  
  try {
    // 허상원 정보 조회
    const { data: employee, error: employeeError } = await supabase
      .from('employees')
      .select('*')
      .eq('id', '2cc1b823-b231-4c90-8eb2-9728f21ba832')
      .single();

    if (employeeError || !employee) {
      console.error('❌ 허상원 정보 조회 실패:', employeeError);
      return;
    }

    // 정산일 기준으로 급여명세서 생성
    const payslipPeriods = [
      {
        period: '2025-06-1',
        settlementDate: '2025-06-28',
        startDate: '2025-06-19',
        endDate: '2025-06-30',
        issuedAt: '2025-06-28T09:00:00Z',
        paidAt: '2025-06-28T10:00:00Z'
      },
      {
        period: '2025-07-1',
        settlementDate: '2025-07-11',
        startDate: '2025-07-02',
        endDate: '2025-07-11',
        issuedAt: '2025-07-11T09:00:00Z',
        paidAt: '2025-07-11T10:00:00Z'
      },
      {
        period: '2025-07-2',
        settlementDate: '2025-07-25',
        startDate: '2025-07-14',
        endDate: '2025-07-25',
        issuedAt: '2025-07-25T09:00:00Z',
        paidAt: '2025-07-25T10:00:00Z'
      },
      {
        period: '2025-07-3',
        settlementDate: '2025-08-01',
        startDate: '2025-07-28',
        endDate: '2025-07-30',
        issuedAt: '2025-08-01T09:00:00Z',
        paidAt: '2025-08-01T10:00:00Z'
      },
      {
        period: '2025-08-1',
        settlementDate: '2025-08-08',
        startDate: '2025-08-01',
        endDate: '2025-08-08',
        issuedAt: '2025-08-08T09:00:00Z',
        paidAt: '2025-08-08T10:00:00Z'
      },
      {
        period: '2025-08-2',
        settlementDate: '2025-08-29',
        startDate: '2025-08-11',
        endDate: '2025-08-29',
        issuedAt: '2025-08-29T09:00:00Z',
        paidAt: '2025-08-29T10:00:00Z'
      }
    ];

    // 각 정산 기간별로 급여명세서 생성
    for (const period of payslipPeriods) {
      // 해당 기간의 스케줄 필터링
      const periodSchedules = schedules.filter(schedule => {
        const scheduleDate = new Date(schedule.schedule_date);
        const startDate = new Date(period.startDate);
        const endDate = new Date(period.endDate);
        return scheduleDate >= startDate && scheduleDate <= endDate;
      });

      if (periodSchedules.length === 0) {
        console.log(`⚠️ ${period.period} 기간에 스케줄이 없습니다.`);
        continue;
      }

      // 일별 상세 데이터 생성
      const dailyDetails = [];
      let totalHours = 0;
      let totalWage = 0;
      const hourlyRate = 13000; // 시급

      periodSchedules.forEach(schedule => {
        const start = new Date(`${schedule.schedule_date} ${schedule.scheduled_start}`);
        const end = new Date(`${schedule.schedule_date} ${schedule.scheduled_end}`);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        const dailyWage = hours * hourlyRate;
        
        totalHours += hours;
        totalWage += dailyWage;
        
        dailyDetails.push({
          date: schedule.schedule_date,
          hours: hours,
          hourly_rate: hourlyRate,
          daily_wage: dailyWage
        });
      });

      // 세금 계산 (3.3% 사업소득세)
      const taxAmount = Math.round(totalWage * 0.033);
      const netSalary = totalWage - taxAmount;

      // 급여명세서 데이터 생성
      const payslip = {
        employee_id: employee.id,
        period: period.period,
        employment_type: 'part_time',
        base_salary: totalWage,
        overtime_pay: 0,
        incentive: 0,
        point_bonus: 0,
        total_earnings: totalWage,
        tax_amount: taxAmount,
        net_salary: netSalary,
        status: 'paid',
        total_hours: totalHours,
        hourly_rate: hourlyRate,
        daily_details: dailyDetails,
        issued_at: period.issuedAt,
        paid_at: period.paidAt
      };

      // 급여명세서 저장
      const { error: insertError } = await supabase
        .from('payslips')
        .insert([payslip]);

      if (insertError) {
        console.error(`❌ ${period.period} 급여명세서 생성 실패:`, insertError);
        continue;
      }

      console.log(`✅ ${period.period} 급여명세서 생성 완료`);
      console.log(`   📅 정산일: ${period.settlementDate}`);
      console.log(`   📊 근무기간: ${period.startDate} ~ ${period.endDate}`);
      console.log(`   📅 실제 스케줄: ${periodSchedules.length}일`);
      console.log(`   ⏰ 총 근무시간: ${totalHours}시간`);
      console.log(`   💰 총 지급액: ${totalWage.toLocaleString()}원`);
      console.log(`   🧾 세금 (3.3%): ${taxAmount.toLocaleString()}원`);
      console.log(`   💵 실수령액: ${netSalary.toLocaleString()}원`);
      console.log(`   📅 발행일: ${new Date(period.issuedAt).toLocaleDateString('ko-KR')}`);
      console.log(`   💰 지급일: ${new Date(period.paidAt).toLocaleDateString('ko-KR')}`);
      
      // 일별상세 미리보기 (처음 3일)
      if (dailyDetails.length > 0) {
        console.log(`   📋 일별상세 (처음 3일):`);
        dailyDetails.slice(0, 3).forEach((day, index) => {
          console.log(`     ${index + 1}. ${day.date}: ${day.hours}시간 × ${day.hourly_rate.toLocaleString()}원 = ${day.daily_wage.toLocaleString()}원`);
        });
        if (dailyDetails.length > 3) {
          console.log(`     ... 외 ${dailyDetails.length - 3}일`);
        }
      }
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

async function regenerateHeoFromSchedules() {
  try {
    console.log('🔄 허상원 급여명세서 실제 스케줄 기반 재생성 시작...\n');
    
    // 1. 기존 급여명세서 삭제
    const deleteSuccess = await deleteHeoExistingPayslips();
    if (!deleteSuccess) {
      return;
    }
    
    // 2. 실제 스케줄 데이터 조회
    const schedules = await getHeoSchedules();
    if (!schedules) {
      return;
    }
    
    // 3. 실제 스케줄 기반으로 급여명세서 생성
    await createPayslipsFromSchedules(schedules);
    
    console.log('\n🎉 허상원 급여명세서 실제 스케줄 기반 재생성 완료!');
    console.log('\n⏸️ 실제 지급 금액과 비교하기 전에 멈춤');
    
    // 생성된 급여명세서 확인
    const { data: newPayslips, error: checkError } = await supabase
      .from('payslips')
      .select(`
        period,
        total_hours,
        total_earnings,
        tax_amount,
        net_salary,
        status,
        issued_at,
        paid_at,
        employees!inner(name, employee_id)
      `)
      .eq('employee_id', '2cc1b823-b231-4c90-8eb2-9728f21ba832')
      .order('period', { ascending: true });
      
    if (checkError) {
      console.error('❌ 생성된 급여명세서 확인 실패:', checkError);
      return;
    }

    console.log(`\n📊 새로 생성된 허상원 급여명세서: ${newPayslips.length}개`);
    newPayslips.forEach((payslip, index) => {
      console.log(`${index + 1}. ${payslip.period}`);
      console.log(`   📊 근무시간: ${payslip.total_hours}시간`);
      console.log(`   💰 총 지급액: ${payslip.total_earnings.toLocaleString()}원`);
      console.log(`   🧾 세금: ${payslip.tax_amount.toLocaleString()}원`);
      console.log(`   💵 실수령액: ${payslip.net_salary.toLocaleString()}원`);
      console.log(`   📊 상태: ${payslip.status}`);
      if (payslip.issued_at) {
        console.log(`   📅 발행일: ${new Date(payslip.issued_at).toLocaleDateString('ko-KR')}`);
      }
      if (payslip.paid_at) {
        console.log(`   💰 지급일: ${new Date(payslip.paid_at).toLocaleDateString('ko-KR')}`);
      }
    });

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

regenerateHeoFromSchedules();
