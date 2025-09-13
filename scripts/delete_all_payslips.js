const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

async function deleteAllPayslips() {
  try {
    console.log('🔍 기존 급여명세서 데이터 조회 중...');
    
    // 기존 급여명세서 조회
    const { data: payslips, error: fetchError } = await supabase
      .from('payslips')
      .select(`
        id,
        period,
        employees!inner(name, employee_id)
      `)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('❌ 급여명세서 조회 실패:', fetchError);
      return;
    }

    if (!payslips || payslips.length === 0) {
      console.log('✅ 삭제할 급여명세서가 없습니다.');
      return;
    }

    console.log(`📋 총 ${payslips.length}개의 급여명세서를 찾았습니다:`);
    payslips.forEach((payslip, index) => {
      console.log(`${index + 1}. ${payslip.employees.name} - ${payslip.period} (ID: ${payslip.id})`);
    });

    // 모든 급여명세서 삭제
    console.log('\n🗑️ 모든 급여명세서 삭제 중...');
    const { error: deleteError } = await supabase
      .from('payslips')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // 모든 레코드 삭제

    if (deleteError) {
      console.error('❌ 급여명세서 삭제 실패:', deleteError);
      return;
    }

    console.log('✅ 모든 급여명세서가 성공적으로 삭제되었습니다.');
    
    // 삭제 확인
    const { data: remainingPayslips, error: checkError } = await supabase
      .from('payslips')
      .select('id');
      
    if (checkError) {
      console.error('❌ 삭제 확인 중 오류:', checkError);
      return;
    }

    console.log(`✅ 삭제 완료 확인: ${remainingPayslips?.length || 0}개의 급여명세서가 남아있습니다.`);

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

deleteAllPayslips();
