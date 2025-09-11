const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

// 정산서 데이터 (사용자 제공)
const settlementData = {
  "3주차": { hours: 22.5, amount: 292500 },
  "4주차": { hours: 28.5, amount: 370500 },
  "5주차": { hours: 36.5, amount: 474500 },
  "total": { hours: 87.5, amount: 1137500 }
};

// 실제 스케줄 데이터 (계산된 값)
const actualData = {
  "1주차": { hours: 25.5, amount: 331500 },
  "2주차": { hours: 32.5, amount: 422500 },
  "3주차": { hours: 41.5, amount: 539500 },
  "total": { hours: 99.5, amount: 1293500 }
};

async function compareSettlementData() {
  console.log('=== 정산서 vs 실제 데이터 비교 ===\n');
  
  console.log('📊 정산서 데이터:');
  console.log(`3주차: ${settlementData["3주차"].hours}시간, ${settlementData["3주차"].amount.toLocaleString()}원`);
  console.log(`4주차: ${settlementData["4주차"].hours}시간, ${settlementData["4주차"].amount.toLocaleString()}원`);
  console.log(`5주차: ${settlementData["5주차"].hours}시간, ${settlementData["5주차"].amount.toLocaleString()}원`);
  console.log(`총계: ${settlementData.total.hours}시간, ${settlementData.total.amount.toLocaleString()}원\n`);
  
  console.log('📊 실제 스케줄 데이터:');
  console.log(`1주차: ${actualData["1주차"].hours}시간, ${actualData["1주차"].amount.toLocaleString()}원`);
  console.log(`2주차: ${actualData["2주차"].hours}시간, ${actualData["2주차"].amount.toLocaleString()}원`);
  console.log(`3주차: ${actualData["3주차"].hours}시간, ${actualData["3주차"].amount.toLocaleString()}원`);
  console.log(`총계: ${actualData.total.hours}시간, ${actualData.total.amount.toLocaleString()}원\n`);
  
  console.log('🔍 차이 분석:');
  const hourDiff = actualData.total.hours - settlementData.total.hours;
  const amountDiff = actualData.total.amount - settlementData.total.amount;
  
  console.log(`시간 차이: ${hourDiff}시간 (${hourDiff > 0 ? '실제가 더 많음' : '정산서가 더 많음'})`);
  console.log(`금액 차이: ${amountDiff.toLocaleString()}원 (${amountDiff > 0 ? '실제가 더 많음' : '정산서가 더 많음'})\n`);
  
  console.log('⚠️ 문제점:');
  if (hourDiff > 0) {
    console.log(`- 실제 근무시간이 정산서보다 ${hourDiff}시간 더 많음`);
    console.log(`- 추가 지급해야 할 금액: ${amountDiff.toLocaleString()}원`);
  } else if (hourDiff < 0) {
    console.log(`- 정산서가 실제 근무시간보다 ${Math.abs(hourDiff)}시간 더 많음`);
    console.log(`- 과다 지급된 금액: ${Math.abs(amountDiff).toLocaleString()}원`);
  } else {
    console.log('- 정산서와 실제 데이터가 일치함');
  }
  
  console.log('\n💡 권장사항:');
  console.log('1. 정산서 데이터를 실제 스케줄 데이터로 수정 필요');
  console.log('2. 중간 정산 시스템 구축으로 향후 오류 방지');
  console.log('3. 정산서 승인 프로세스에서 실제 스케줄 데이터 검증 필수');
}

compareSettlementData().catch(console.error);
