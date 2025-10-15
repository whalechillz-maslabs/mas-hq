const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addContractEnhancements() {
  try {
    console.log('🔄 contracts 테이블에 식대 정책 및 보험 표시 제어 컬럼 추가 중...');

    // 기존 계약서 구조 확인
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

    // 새로운 컬럼들이 있는지 확인
    const newColumns = ['meal_policy', 'meal_rate', 'meal_fixed_days_per_month', 'meal_settlement_carryover', 'insurance_display'];
    const existingColumns = contracts.length > 0 ? Object.keys(contracts[0]) : [];
    
    const missingColumns = newColumns.filter(col => !existingColumns.includes(col));
    
    if (missingColumns.length === 0) {
      console.log('✅ 모든 새로운 컬럼이 이미 존재합니다!');
      return;
    }

    console.log('❌ 누락된 컬럼들:', missingColumns);
    console.log('📝 Supabase 대시보드에서 다음 SQL을 실행해주세요:');
    console.log('');
    console.log('-- 식대 정책 관련 컬럼 추가');
    console.log('ALTER TABLE contracts ADD COLUMN IF NOT EXISTS meal_policy VARCHAR(20) DEFAULT \'per_day\' CHECK (meal_policy IN (\'per_day\', \'fixed_with_reconcile\'));');
    console.log('ALTER TABLE contracts ADD COLUMN IF NOT EXISTS meal_rate INTEGER DEFAULT 7000;');
    console.log('ALTER TABLE contracts ADD COLUMN IF NOT EXISTS meal_fixed_days_per_month INTEGER DEFAULT 20;');
    console.log('ALTER TABLE contracts ADD COLUMN IF NOT EXISTS meal_settlement_carryover INTEGER DEFAULT 0;');
    console.log('');
    console.log('-- 보험 표시 제어 컬럼 추가');
    console.log('ALTER TABLE contracts ADD COLUMN IF NOT EXISTS insurance_display JSONB DEFAULT \'{"national_pension": true, "health": true, "employment": true, "industrial_accident": true}\'::jsonb;');
    console.log('');
    console.log('-- 기존 계약서에 기본값 설정');
    console.log('UPDATE contracts SET meal_policy = \'per_day\', meal_rate = 7000, meal_fixed_days_per_month = 20, meal_settlement_carryover = 0, insurance_display = \'{"national_pension": true, "health": true, "employment": true, "industrial_accident": true}\'::jsonb WHERE meal_policy IS NULL;');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

// 스크립트 실행
addContractEnhancements();
