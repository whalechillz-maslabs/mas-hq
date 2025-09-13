const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

async function deleteHeoPayslips() {
  console.log('🗑️ 허상원 기존 급여명세서 모두 삭제 중...');
  
  try {
    // 허상원의 모든 급여명세서 삭제
    const { error: deleteError } = await supabase
      .from('payslips')
      .delete()
      .eq('employee_id', '2cc1b823-b231-4c90-8eb2-9728f21ba832'); // 허상원 ID

    if (deleteError) {
      console.error('❌ 허상원 급여명세서 삭제 실패:', deleteError);
      return;
    }

    console.log('✅ 허상원 기존 급여명세서 삭제 완료');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

async function createHeoNewPayslips() {
  console.log('\n📋 허상원 새로운 급여명세서 생성 중...');
  
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

    // 표 데이터 기반 급여명세서 (식대 제외, 3.3% 세금 공제)
    const payslipData = [
      {
        period: '2025-06-1',
        settlementDate: '2025-06-28',
        workPeriod: '6/19~6/30',
        workDays: 6,
        workHours: 27,
        grossSalary: 348000, // 급여 (식대 제외)
        taxAmount: Math.round(348000 * 0.033), // 3.3% 세금
        netSalary: 348000 - Math.round(348000 * 0.033), // 실수령액
        issuedAt: '2025-06-28T09:00:00Z',
        paidAt: '2025-06-28T10:00:00Z'
      },
      {
        period: '2025-07-1',
        settlementDate: '2025-07-11',
        workPeriod: '7/2~7/11',
        workDays: 7,
        workHours: 44.5,
        grossSalary: 578500,
        taxAmount: Math.round(578500 * 0.033),
        netSalary: 578500 - Math.round(578500 * 0.033),
        issuedAt: '2025-07-11T09:00:00Z',
        paidAt: '2025-07-11T10:00:00Z'
      },
      {
        period: '2025-07-2',
        settlementDate: '2025-07-25',
        workPeriod: '7/14~7/25',
        workDays: 7,
        workHours: 46,
        grossSalary: 598000,
        taxAmount: Math.round(598000 * 0.033),
        netSalary: 598000 - Math.round(598000 * 0.033),
        issuedAt: '2025-07-25T09:00:00Z',
        paidAt: '2025-07-25T10:00:00Z'
      },
      {
        period: '2025-07-3',
        settlementDate: '2025-08-01',
        workPeriod: '7/28~7/30',
        workDays: 3,
        workHours: 21,
        grossSalary: 273000,
        taxAmount: Math.round(273000 * 0.033),
        netSalary: 273000 - Math.round(273000 * 0.033),
        issuedAt: '2025-08-01T09:00:00Z',
        paidAt: '2025-08-01T10:00:00Z'
      },
      {
        period: '2025-08-1',
        settlementDate: '2025-08-08',
        workPeriod: '8/1~8/8',
        workDays: 5,
        workHours: 33.5,
        grossSalary: 435500,
        taxAmount: Math.round(435500 * 0.033),
        netSalary: 435500 - Math.round(435500 * 0.033),
        issuedAt: '2025-08-08T09:00:00Z',
        paidAt: '2025-08-08T10:00:00Z'
      },
      {
        period: '2025-08-2',
        settlementDate: '2025-08-29',
        workPeriod: '8/11~8/29',
        workDays: 12,
        workHours: 87.5,
        grossSalary: 1137500,
        taxAmount: Math.round(1137500 * 0.033),
        netSalary: 1137500 - Math.round(1137500 * 0.033),
        issuedAt: '2025-08-29T09:00:00Z',
        paidAt: '2025-08-29T10:00:00Z'
      }
    ];

    // 각 급여명세서 생성
    for (const data of payslipData) {
      const payslip = {
        employee_id: employee.id,
        period: data.period,
        employment_type: 'part_time',
        base_salary: data.grossSalary,
        overtime_pay: 0,
        incentive: 0,
        point_bonus: 0,
        total_earnings: data.grossSalary,
        tax_amount: data.taxAmount,
        net_salary: data.netSalary,
        status: 'paid',
        total_hours: data.workHours,
        hourly_rate: 13000,
        daily_details: [], // 간단한 형태로 설정
        issued_at: data.issuedAt,
        paid_at: data.paidAt
      };

      const { error: insertError } = await supabase
        .from('payslips')
        .insert([payslip]);

      if (insertError) {
        console.error(`❌ ${data.period} 급여명세서 생성 실패:`, insertError);
        continue;
      }

      console.log(`✅ ${data.period} 급여명세서 생성 완료`);
      console.log(`   📅 정산일: ${data.settlementDate}`);
      console.log(`   📊 근무기간: ${data.workPeriod} (${data.workDays}일)`);
      console.log(`   ⏰ 근무시간: ${data.workHours}시간`);
      console.log(`   💰 급여: ${data.grossSalary.toLocaleString()}원`);
      console.log(`   🧾 세금 (3.3%): ${data.taxAmount.toLocaleString()}원`);
      console.log(`   💵 실수령액: ${data.netSalary.toLocaleString()}원`);
      console.log(`   📅 발행일: ${new Date(data.issuedAt).toLocaleDateString('ko-KR')}`);
      console.log(`   💰 지급일: ${new Date(data.paidAt).toLocaleDateString('ko-KR')}`);
    }

    // 총계 계산
    const totalWorkDays = payslipData.reduce((sum, data) => sum + data.workDays, 0);
    const totalWorkHours = payslipData.reduce((sum, data) => sum + data.workHours, 0);
    const totalGrossSalary = payslipData.reduce((sum, data) => sum + data.grossSalary, 0);
    const totalTaxAmount = payslipData.reduce((sum, data) => sum + data.taxAmount, 0);
    const totalNetSalary = payslipData.reduce((sum, data) => sum + data.netSalary, 0);

    console.log('\n📊 허상원 급여명세서 총계:');
    console.log(`   📅 총 근무일수: ${totalWorkDays}일`);
    console.log(`   ⏰ 총 근무시간: ${totalWorkHours}시간`);
    console.log(`   💰 총 급여: ${totalGrossSalary.toLocaleString()}원`);
    console.log(`   🧾 총 세금: ${totalTaxAmount.toLocaleString()}원`);
    console.log(`   💵 총 실수령액: ${totalNetSalary.toLocaleString()}원`);

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

async function updateHeoPayslips() {
  try {
    console.log('🔄 허상원 급여명세서 최종 업데이트 시작...\n');
    
    // 1. 허상원 기존 급여명세서 삭제
    await deleteHeoPayslips();
    
    // 2. 표 데이터 기반으로 새로운 급여명세서 생성
    await createHeoNewPayslips();
    
    console.log('\n🎉 허상원 급여명세서 최종 업데이트 완료!');
    
    // 업데이트된 급여명세서 확인
    const { data: updatedPayslips, error: checkError } = await supabase
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
      console.error('❌ 업데이트된 급여명세서 확인 실패:', checkError);
      return;
    }

    console.log(`\n📊 허상원 최종 급여명세서: ${updatedPayslips.length}개`);
    updatedPayslips.forEach((payslip, index) => {
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

updateHeoPayslips();
