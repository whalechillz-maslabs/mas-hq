const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

// 정산서 데이터 (사용자 제공)
const settlementData = {
  "2025-08-11": { hours: 7.5, amount: 97500, note: "연장근무" },
  "2025-08-12": { hours: 8, amount: 104000, note: "화요일근무" },
  "2025-08-13": { hours: 7, amount: 91000, note: "연장근무" },
  "2025-08-18": { hours: 6.5, amount: 84500, note: "연장근무" },
  "2025-08-19": { hours: 7, amount: 91000, note: "화요일근무" },
  "2025-08-20": { hours: 7, amount: 91000, note: "연장근무" },
  "2025-08-21": { hours: 8, amount: 104000, note: "추가근무" },
  "2025-08-25": { hours: 7, amount: 91000, note: "연장근무" },
  "2025-08-26": { hours: 8.5, amount: 110500, note: "화요일근무" },
  "2025-08-27": { hours: 7, amount: 91000, note: "연장근무" },
  "2025-08-28": { hours: 7, amount: 91000, note: "추가근무" },
  "2025-08-29": { hours: 7, amount: 91000, note: "연장근무" }
};

async function detailedScheduleComparison() {
  console.log('=== 허상원 스케줄 vs 정산서 상세 비교 ===\n');
  
  // 허상원 직원 정보 확인
  const { data: heo, error: empError } = await supabase
    .from('employees')
    .select('*')
    .eq('name', '허상원')
    .single();
    
  if (empError) {
    console.error('허상원 직원 정보 조회 실패:', empError);
    return;
  }
  
  // 8월 스케줄 확인
  const { data: schedules, error: scheduleError } = await supabase
    .from('schedules')
    .select('*')
    .eq('employee_id', heo.id)
    .gte('schedule_date', '2025-08-01')
    .lte('schedule_date', '2025-08-31')
    .order('schedule_date');
    
  if (scheduleError) {
    console.error('스케줄 조회 실패:', scheduleError);
    return;
  }
  
  // 날짜별로 그룹화
  const scheduleByDate = {};
  schedules.forEach(schedule => {
    const date = schedule.schedule_date;
    if (!scheduleByDate[date]) {
      scheduleByDate[date] = [];
    }
    scheduleByDate[date].push(schedule);
  });
  
  console.log('📅 날짜별 상세 비교:\n');
  
  let totalScheduleHours = 0;
  let totalSettlementHours = 0;
  let totalScheduleAmount = 0;
  let totalSettlementAmount = 0;
  
  const targetDates = Object.keys(settlementData).sort();
  
  targetDates.forEach(date => {
    const daySchedules = scheduleByDate[date] || [];
    const actualHours = daySchedules.reduce((sum, s) => sum + (s.total_hours || 0), 0);
    const actualAmount = actualHours * 13000;
    
    const settlement = settlementData[date];
    const settlementHours = settlement.hours;
    const settlementAmount = settlement.amount;
    
    const hourDiff = actualHours - settlementHours;
    const amountDiff = actualAmount - settlementAmount;
    
    totalScheduleHours += actualHours;
    totalSettlementHours += settlementHours;
    totalScheduleAmount += actualAmount;
    totalSettlementAmount += settlementAmount;
    
    console.log(`📆 ${date} (${new Date(date).toLocaleDateString('ko-KR', { weekday: 'short' })})`);
    console.log(`   스케줄: ${actualHours}시간 (${actualAmount.toLocaleString()}원)`);
    console.log(`   정산서: ${settlementHours}시간 (${settlementAmount.toLocaleString()}원)`);
    console.log(`   차이: ${hourDiff > 0 ? '+' : ''}${hourDiff}시간 (${amountDiff > 0 ? '+' : ''}${amountDiff.toLocaleString()}원)`);
    
    if (daySchedules.length > 0) {
      daySchedules.forEach(s => {
        console.log(`     - ${s.scheduled_start} ~ ${s.scheduled_end}`);
      });
    } else {
      console.log(`     - 스케줄 없음`);
    }
    console.log('');
  });
  
  console.log('📊 전체 요약:');
  console.log(`스케줄 총계: ${totalScheduleHours}시간 (${totalScheduleAmount.toLocaleString()}원)`);
  console.log(`정산서 총계: ${totalSettlementHours}시간 (${totalSettlementAmount.toLocaleString()}원)`);
  console.log(`총 차이: ${totalScheduleHours - totalSettlementHours}시간 (${(totalScheduleAmount - totalSettlementAmount).toLocaleString()}원)\n`);
  
  console.log('🔍 차이점 분석:');
  
  // 차이가 있는 날짜들 분석
  const discrepancies = [];
  targetDates.forEach(date => {
    const daySchedules = scheduleByDate[date] || [];
    const actualHours = daySchedules.reduce((sum, s) => sum + (s.total_hours || 0), 0);
    const settlement = settlementData[date];
    const hourDiff = actualHours - settlement.hours;
    
    if (Math.abs(hourDiff) > 0.1) { // 0.1시간 이상 차이
      discrepancies.push({
        date,
        actualHours,
        settlementHours: settlement.hours,
        hourDiff,
        amountDiff: (actualHours - settlement.hours) * 13000
      });
    }
  });
  
  if (discrepancies.length > 0) {
    console.log('\n⚠️ 차이가 있는 날짜들:');
    discrepancies.forEach(d => {
      console.log(`${d.date}: 스케줄 ${d.actualHours}시간 vs 정산서 ${d.settlementHours}시간 (차이: ${d.hourDiff > 0 ? '+' : ''}${d.hourDiff}시간, ${d.amountDiff > 0 ? '+' : ''}${d.amountDiff.toLocaleString()}원)`);
    });
  } else {
    console.log('모든 날짜의 시간이 일치합니다.');
  }
  
  console.log('\n💡 원인 분석:');
  console.log('1. 정산서 작성 시점과 스케줄 입력 시점의 차이');
  console.log('2. 점심시간 제외 여부의 차이');
  console.log('3. 연장근무/추가근무 계산 방식의 차이');
  console.log('4. 반올림/반내림 처리 방식의 차이');
  
  console.log('\n🎯 권장사항:');
  console.log('1. 정산서를 실제 스케줄 데이터로 수정');
  console.log('2. 향후 정산 시 자동 계산 시스템 사용');
  console.log('3. 정산서 승인 전 실제 스케줄 데이터 검증 필수');
}

detailedScheduleComparison().catch(console.error);
