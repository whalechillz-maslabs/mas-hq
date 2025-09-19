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

// 스케줄 데이터 디버깅
async function debugScheduleDuplicates() {
  try {
    console.log('🔍 스케줄 데이터 디버깅 시작...\n');
    
    // 1. 허상원의 9월 스케줄만 조회
    const { data: schedules, error: scheduleError } = await supabase
      .from('schedules')
      .select(`
        *,
        employee:employees!schedules_employee_id_fkey(name, employee_id)
      `)
      .eq('schedule_date', '2025-09-01')
      .order('scheduled_start', { ascending: true });
    
    if (scheduleError) {
      console.error('❌ 스케줄 조회 오류:', scheduleError);
      return;
    }
    
    console.log(`📊 2025-09-01 스케줄 수: ${schedules?.length || 0}개\n`);
    
    // 2. 각 스케줄 상세 정보 출력
    schedules?.forEach((schedule, index) => {
      const employeeName = schedule.employee?.name || '알 수 없음';
      console.log(`${index + 1}. ID: ${schedule.id}`);
      console.log(`   직원: ${employeeName} (${schedule.employee_id})`);
      console.log(`   날짜: ${schedule.schedule_date}`);
      console.log(`   시간: ${schedule.scheduled_start} - ${schedule.scheduled_end}`);
      console.log(`   상태: ${schedule.status}`);
      console.log(`   설명: ${schedule.employee_note || '없음'}`);
      console.log(`   생성일: ${schedule.created_at}`);
      console.log('');
    });
    
    // 3. 09:00-12:00 시간대 스케줄만 필터링
    const morningSchedules = schedules?.filter(s => 
      s.scheduled_start === '09:00:00' && s.scheduled_end === '12:00:00'
    );
    
    console.log(`🕘 09:00-12:00 시간대 스케줄: ${morningSchedules?.length || 0}개\n`);
    
    morningSchedules?.forEach((schedule, index) => {
      console.log(`${index + 1}. ID: ${schedule.id} | 상태: ${schedule.status} | 설명: ${schedule.employee_note || '없음'}`);
    });
    
    // 4. 모든 9월 스케줄 조회
    const { data: allSeptemberSchedules, error: allError } = await supabase
      .from('schedules')
      .select(`
        *,
        employee:employees!schedules_employee_id_fkey(name, employee_id)
      `)
      .gte('schedule_date', '2025-09-01')
      .lte('schedule_date', '2025-09-30')
      .order('schedule_date', { ascending: true })
      .order('scheduled_start', { ascending: true });
    
    if (allError) {
      console.error('❌ 전체 9월 스케줄 조회 오류:', allError);
      return;
    }
    
    console.log(`\n📊 전체 9월 스케줄 수: ${allSeptemberSchedules?.length || 0}개\n`);
    
    // 5. 날짜별 스케줄 수 통계
    const dateStats = new Map();
    allSeptemberSchedules?.forEach(schedule => {
      const date = schedule.schedule_date;
      if (!dateStats.has(date)) {
        dateStats.set(date, []);
      }
      dateStats.get(date).push(schedule);
    });
    
    console.log('📅 날짜별 스케줄 통계:');
    Array.from(dateStats.entries()).forEach(([date, schedules]) => {
      console.log(`${date}: ${schedules.length}개`);
      
      // 같은 시간대 중복 체크
      const timeStats = new Map();
      schedules.forEach(schedule => {
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
          timeSchedules.forEach(s => {
            console.log(`    - ID: ${s.id} | 상태: ${s.status} | 설명: ${s.employee_note || '없음'}`);
          });
        }
      });
    });
    
  } catch (error) {
    console.error('❌ 디버깅 중 오류 발생:', error);
  }
}

// 메인 실행
async function main() {
  await debugScheduleDuplicates();
}

main().catch(console.error);
