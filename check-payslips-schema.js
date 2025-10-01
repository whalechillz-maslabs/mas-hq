const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('Supabase URL or Service Role Key is missing in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function checkPayslipsSchema() {
    console.log('🔍 payslips 테이블 스키마 확인');

    try {
        // 1. 기존 payslips 데이터 조회 (첫 번째 레코드)
        const { data: payslips, error: payslipsError } = await supabase
            .from('payslips')
            .select('*')
            .limit(1);

        if (payslipsError) {
            console.error('payslips 조회 실패:', payslipsError);
            return;
        }

        if (payslips && payslips.length > 0) {
            console.log('\n📋 payslips 테이블 컬럼 구조:');
            const firstPayslip = payslips[0];
            Object.keys(firstPayslip).forEach(key => {
                console.log(`   - ${key}: ${typeof firstPayslip[key]} = ${firstPayslip[key]}`);
            });
        } else {
            console.log('payslips 테이블에 데이터가 없습니다.');
        }

        // 2. 최형호의 기존 급여명세서 확인
        const { data: choiPayslips, error: choiError } = await supabase
            .from('payslips')
            .select('*')
            .eq('employee_id', 'e998a540-51bf-4380-bcb1-86fb36ec7eb8')
            .order('created_at', { ascending: false })
            .limit(3);

        if (!choiError && choiPayslips) {
            console.log(`\n👤 최형호의 급여명세서 ${choiPayslips.length}개:`);
            choiPayslips.forEach((payslip, index) => {
                console.log(`   ${index + 1}. 기간: ${payslip.period}, 상태: ${payslip.status}, 생성일: ${payslip.created_at}`);
            });
        }

    } catch (error) {
        console.error('❌ 확인 중 오류:', error);
    }
}

checkPayslipsSchema();
