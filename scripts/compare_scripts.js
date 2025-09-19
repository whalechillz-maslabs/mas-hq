const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Supabase 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 스크립트 비교 분석
async function compareScripts() {
  try {
    console.log('🔍 스크립트 비교 분석 시작...\n');
    
    // 1. 디버깅 스크립트 방식으로 중복 찾기
    const { data: schedules, error: scheduleError } = await supabase
      .from('schedules')
      .select(`
        *,
        employee:employees!schedules_employee_id_fkey(name, employee_id)
      `)
      .gte('schedule_date', '2025-09-01')
      .lte('schedule_date', '2025-09-30')
      .order('schedule_date', { ascending: true })
      .order('scheduled_start', { ascending: true });
    
    if (scheduleError) {
      console.error('❌ 스케줄 조회 오류:', scheduleError);
      return;
    }
    
    console.log(`📊 총 9월 스케줄 수: ${schedules?.length || 0}개\n`);
    
    // 2. 날짜별 스케줄 수 통계 (디버깅 스크립트 방식)
    const dateStats = new Map();
    schedules?.forEach(schedule => {
      const date = schedule.schedule_date;
      if (!dateStats.has(date)) {
        dateStats.set(date, []);
      }
      dateStats.get(date).push(schedule);
    });
    
    console.log('📅 날짜별 스케줄 통계 (디버깅 방식):');
    let totalDuplicates = 0;
    Array.from(dateStats.entries()).forEach(([date, dateSchedules]) => {
      console.log(`${date}: ${dateSchedules.length}개`);
      
      // 같은 시간대 중복 체크
      const timeStats = new Map();
      dateSchedules.forEach(schedule => {
        const timeKey = `${schedule.scheduled_start}-${schedule.scheduled_end}`;
        if (!timeStats.has(timeKey)) {
          timeStats.set(timeKey, []);
        }
        timeStats.get(timeKey).push(schedule);
      });
      
      // 중복 시간대 출력
      Array.from(timeStats.entries()).forEach(([time, timeSchedules]) => {
        if (timeSchedules.length > 1) {
          console.log(`  ⚠️ ${time}: ${timeSchedules.length}개 중복`);
          totalDuplicates += timeSchedules.length - 1; // 중복 개수만 계산
          timeSchedules.forEach(s => {
            console.log(`    - ID: ${s.id} | 직원: ${s.employee?.name} | 상태: ${s.status} | 설명: ${s.employee_note || '없음'}`);
          });
        }
      });
    });
    
    console.log(`\n📊 총 중복 스케줄 수: ${totalDuplicates}개\n`);
    
    // 3. 제거 스크립트 방식으로 중복 찾기
    const duplicateGroups = new Map();
    
    schedules?.forEach(schedule => {
      // 중복 체크를 위한 고유 키 생성 (직원 + 날짜 + 시간대)
      const duplicateKey = `${schedule.employee_id}_${schedule.schedule_date}_${schedule.scheduled_start}_${schedule.scheduled_end}`;
      
      if (!duplicateGroups.has(duplicateKey)) {
        duplicateGroups.set(duplicateKey, []);
      }
      duplicateGroups.get(duplicateKey).push(schedule);
    });
    
    // 중복 그룹 필터링 (2개 이상인 그룹만)
    const realDuplicates = Array.from(duplicateGroups.entries())
      .filter(([key, group]) => group.length > 1);
    
    console.log('🔍 제거 스크립트 방식 중복 그룹:');
    realDuplicates.forEach(([key, group], index) => {
      const firstSchedule = group[0];
      const employeeName = firstSchedule.employee?.name || '알 수 없음';
      console.log(`${index + 1}. ${employeeName} - ${firstSchedule.schedule_date} ${firstSchedule.scheduled_start}-${firstSchedule.scheduled_end} (${group.length}개)`);
      group.forEach(s => {
        console.log(`    - ID: ${s.id} | 상태: ${s.status} | 설명: ${s.employee_note || '없음'}`);
      });
    });
    
    console.log(`\n🔄 제거 스크립트 방식 중복 그룹 수: ${realDuplicates.length}개\n`);
    
    // 4. 차이점 분석
    console.log('🔍 차이점 분석:');
    console.log(`- 디버깅 방식: ${totalDuplicates}개 중복 스케줄 발견`);
    console.log(`- 제거 방식: ${realDuplicates.length}개 중복 그룹 발견`);
    
    if (totalDuplicates > 0 && realDuplicates.length === 0) {
      console.log('\n⚠️ 문제 발견: 디버깅 방식에서는 중복을 찾았지만 제거 방식에서는 찾지 못함');
      console.log('원인: 다른 직원의 같은 시간대 스케줄이 중복으로 잘못 인식됨');
    }
    
  } catch (error) {
    console.error('❌ 비교 분석 중 오류 발생:', error);
  }
}

// 메인 실행
async function main() {
  await compareScripts();
}

main().catch(console.error);
