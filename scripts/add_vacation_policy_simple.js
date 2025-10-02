const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addVacationPolicyColumn() {
  try {
    console.log('🔄 contracts 테이블에 vacation_policy 컬럼 추가 중...');

    // 기존 계약서 조회
    const { data: contracts, error: contractsError } = await supabase
      .from('contracts')
      .select('*')
      .limit(1);

    if (contractsError) {
      console.error('❌ 계약서 조회 실패:', contractsError);
      return;
    }

    console.log('📋 기존 계약서 구조 확인:');
    if (contracts.length > 0) {
      console.log('기존 컬럼들:', Object.keys(contracts[0]));
    }

    // vacation_policy 컬럼이 있는지 확인
    if (contracts.length > 0 && 'vacation_policy' in contracts[0]) {
      console.log('✅ vacation_policy 컬럼이 이미 존재합니다!');
      return;
    }

    console.log('❌ vacation_policy 컬럼이 없습니다.');
    console.log('📝 수동으로 Supabase 대시보드에서 다음 SQL을 실행해주세요:');
    console.log('');
    console.log('ALTER TABLE contracts ADD COLUMN vacation_policy JSONB DEFAULT \'{"substitute_holidays": false, "sick_leave_deducts_annual": true, "family_events_days": 3}\'::jsonb;');
    console.log('');
    console.log('UPDATE contracts SET vacation_policy = \'{"substitute_holidays": false, "sick_leave_deducts_annual": true, "family_events_days": 3}\'::jsonb WHERE vacation_policy IS NULL;');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

// 스크립트 실행
addVacationPolicyColumn();
