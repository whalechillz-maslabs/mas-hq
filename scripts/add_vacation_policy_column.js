const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addVacationPolicyColumn() {
  try {
    console.log('🔄 contracts 테이블에 vacation_policy 컬럼 추가 중...');

    // SQL 실행
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        -- vacation_policy 컬럼 추가 (JSONB 타입)
        ALTER TABLE contracts 
        ADD COLUMN IF NOT EXISTS vacation_policy JSONB DEFAULT '{
          "substitute_holidays": false,
          "sick_leave_deducts_annual": true,
          "family_events_days": 3
        }'::jsonb;

        -- 기존 계약서에 기본값 설정
        UPDATE contracts 
        SET vacation_policy = '{
          "substitute_holidays": false,
          "sick_leave_deducts_annual": true,
          "family_events_days": 3
        }'::jsonb
        WHERE vacation_policy IS NULL;

        -- 컬럼에 대한 코멘트 추가
        COMMENT ON COLUMN contracts.vacation_policy IS '휴가 관련 조항: 대체 공휴일 휴무 없음, 병가 연차 차감, 가족 경조사 휴가 일수';
      `
    });

    if (error) {
      console.error('❌ SQL 실행 실패:', error);
      return;
    }

    console.log('✅ vacation_policy 컬럼이 성공적으로 추가되었습니다!');

    // 기존 계약서 확인
    const { data: contracts, error: contractsError } = await supabase
      .from('contracts')
      .select('id, employee_id, vacation_policy')
      .limit(5);

    if (contractsError) {
      console.error('❌ 계약서 조회 실패:', contractsError);
      return;
    }

    console.log('📋 기존 계약서 vacation_policy 설정:');
    contracts.forEach(contract => {
      console.log(`- 계약서 ID: ${contract.id}`);
      console.log(`  직원 ID: ${contract.employee_id}`);
      console.log(`  휴가 정책:`, contract.vacation_policy);
    });

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

// 스크립트 실행
addVacationPolicyColumn();
