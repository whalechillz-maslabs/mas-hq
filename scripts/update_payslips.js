const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

async function updateChoiPayslip() {
  console.log('📋 최형호 8월 급여명세서 업데이트 중...');
  
  try {
    // 최형호 8월 급여명세서 조회
    const { data: payslips, error: fetchError } = await supabase
      .from('payslips')
      .select('*')
      .eq('employee_id', '2cc1b823-b231-4c90-8eb2-9728f21ba832') // 최형호 ID
      .eq('period', '2025-08')
      .single();

    if (fetchError) {
      console.error('❌ 최형호 8월 급여명세서 조회 실패:', fetchError);
      return;
    }

    if (!payslips) {
      console.log('⚠️ 최형호 8월 급여명세서를 찾을 수 없습니다.');
      return;
    }

    // 발행일과 지급일 추가
    const issuedAt = new Date('2025-08-31T09:00:00Z').toISOString();
    const paidAt = new Date('2025-09-01T10:00:00Z').toISOString();

    const { error: updateError } = await supabase
      .from('payslips')
      .update({
        status: 'paid',
        issued_at: issuedAt,
        paid_at: paidAt
      })
      .eq('id', payslips.id);

    if (updateError) {
      console.error('❌ 최형호 8월 급여명세서 업데이트 실패:', updateError);
      return;
    }

    console.log('✅ 최형호 8월 급여명세서 업데이트 완료');
    console.log(`   📅 발행일: ${new Date(issuedAt).toLocaleDateString('ko-KR')}`);
    console.log(`   💰 지급일: ${new Date(paidAt).toLocaleDateString('ko-KR')}`);
    console.log(`   📊 상태: 지급완료`);

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

async function deleteHeoMonthlyPayslips() {
  console.log('\n🗑️ 허상원 월 급여명세서 삭제 중...');
  
  try {
    // 허상원의 월 급여명세서 삭제 (2025-07, 2025-08, 2025-09)
    const { error: deleteError } = await supabase
      .from('payslips')
      .delete()
      .eq('employee_id', '2cc1b823-b231-4c90-8eb2-9728f21ba832') // 허상원 ID
      .in('period', ['2025-07', '2025-08', '2025-09']);

    if (deleteError) {
      console.error('❌ 허상원 월 급여명세서 삭제 실패:', deleteError);
      return;
    }

    console.log('✅ 허상원 월 급여명세서 삭제 완료');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

async function generateHeoSplitPayslips() {
  console.log('\n📋 허상원 나눠서 지급된 급여명세서 생성 중...');
  
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

    // 나눠서 지급된 급여명세서 데이터 (기존 데이터 기반)
    const splitPayslips = [
      {
        period: '2025-07-1',
        startDate: '2025-07-01',
        endDate: '2025-07-10',
        totalHours: 42.5,
        totalEarnings: 552500,
        taxAmount: 18233,
        netSalary: 534267,
        issuedAt: '2025-07-11T09:00:00Z',
        paidAt: '2025-07-12T10:00:00Z',
        status: 'paid'
      },
      {
        period: '2025-07-2',
        startDate: '2025-07-11',
        endDate: '2025-07-20',
        totalHours: 42.5,
        totalEarnings: 552500,
        taxAmount: 18233,
        netSalary: 534267,
        issuedAt: '2025-07-21T09:00:00Z',
        paidAt: '2025-07-22T10:00:00Z',
        status: 'paid'
      },
      {
        period: '2025-07-3',
        startDate: '2025-07-21',
        endDate: '2025-07-31',
        totalHours: 42.5,
        totalEarnings: 552500,
        taxAmount: 18233,
        netSalary: 534267,
        issuedAt: '2025-08-01T09:00:00Z',
        paidAt: '2025-08-02T10:00:00Z',
        status: 'paid'
      },
      {
        period: '2025-08-1',
        startDate: '2025-08-01',
        endDate: '2025-08-15',
        totalHours: 43.75,
        totalEarnings: 568750,
        taxAmount: 18769,
        netSalary: 549981,
        issuedAt: '2025-08-16T09:00:00Z',
        paidAt: '2025-08-17T10:00:00Z',
        status: 'paid'
      },
      {
        period: '2025-08-2',
        startDate: '2025-08-16',
        endDate: '2025-08-31',
        totalHours: 43.75,
        totalEarnings: 568750,
        taxAmount: 18769,
        netSalary: 549981,
        issuedAt: '2025-09-01T09:00:00Z',
        paidAt: '2025-09-02T10:00:00Z',
        status: 'paid'
      },
      {
        period: '2025-09-1',
        startDate: '2025-09-01',
        endDate: '2025-09-15',
        totalHours: 43.75,
        totalEarnings: 568750,
        taxAmount: 18769,
        netSalary: 549981,
        issuedAt: '2025-09-16T09:00:00Z',
        paidAt: '2025-09-17T10:00:00Z',
        status: 'paid'
      }
    ];

    // 각 분할 급여명세서 생성
    for (const payslipData of splitPayslips) {
      const payslip = {
        employee_id: employee.id,
        period: payslipData.period,
        employment_type: 'part_time',
        base_salary: payslipData.totalEarnings,
        overtime_pay: 0,
        incentive: 0,
        point_bonus: 0,
        total_earnings: payslipData.totalEarnings,
        tax_amount: payslipData.taxAmount,
        net_salary: payslipData.netSalary,
        status: payslipData.status,
        total_hours: payslipData.totalHours,
        hourly_rate: 13000,
        daily_details: [], // 간단한 형태로 설정
        issued_at: payslipData.issuedAt,
        paid_at: payslipData.paidAt
      };

      const { error: insertError } = await supabase
        .from('payslips')
        .insert([payslip]);

      if (insertError) {
        console.error(`❌ ${payslipData.period} 급여명세서 생성 실패:`, insertError);
        continue;
      }

      console.log(`✅ ${payslipData.period} 급여명세서 생성 완료`);
      console.log(`   📊 근무시간: ${payslipData.totalHours}시간`);
      console.log(`   💰 총 지급액: ${payslipData.totalEarnings.toLocaleString()}원`);
      console.log(`   🧾 세금: ${payslipData.taxAmount.toLocaleString()}원`);
      console.log(`   💵 실수령액: ${payslipData.netSalary.toLocaleString()}원`);
      console.log(`   📅 발행일: ${new Date(payslipData.issuedAt).toLocaleDateString('ko-KR')}`);
      console.log(`   💰 지급일: ${new Date(payslipData.paidAt).toLocaleDateString('ko-KR')}`);
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

async function updateAllPayslips() {
  try {
    console.log('🔄 급여명세서 업데이트 시작...\n');
    
    // 1. 최형호 8월 급여명세서 업데이트
    await updateChoiPayslip();
    
    // 2. 허상원 월 급여명세서 삭제
    await deleteHeoMonthlyPayslips();
    
    // 3. 허상원 나눠서 지급된 급여명세서 생성
    await generateHeoSplitPayslips();
    
    console.log('\n🎉 모든 급여명세서 업데이트 완료!');
    
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
      .order('created_at', { ascending: false });
      
    if (checkError) {
      console.error('❌ 업데이트된 급여명세서 확인 실패:', checkError);
      return;
    }

    console.log(`\n📊 업데이트된 급여명세서: ${updatedPayslips.length}개`);
    updatedPayslips.forEach((payslip, index) => {
      console.log(`${index + 1}. ${payslip.employees.name} - ${payslip.period}`);
      if (payslip.total_hours) {
        console.log(`   📊 근무시간: ${payslip.total_hours}시간`);
      }
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

updateAllPayslips();
