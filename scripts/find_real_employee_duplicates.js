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

// 실제 직원별 중복 스케줄 찾기
async function findRealEmployeeDuplicates() {
  try {
    console.log('🔍 실제 직원별 중복 스케줄 찾기...\n');
    
    // 1. 모든 9월 스케줄 조회
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
    
    // 2. 직원별로 그룹화
    const employeeGroups = new Map();
    schedules?.forEach(schedule => {
      const employeeId = schedule.employee_id;
      if (!employeeGroups.has(employeeId)) {
        employeeGroups.set(employeeId, []);
      }
      employeeGroups.get(employeeId).push(schedule);
    });
    
    // 3. 각 직원별로 중복 체크
    let totalDuplicates = 0;
    let totalDuplicateGroups = 0;
    
    console.log('👥 직원별 중복 분석:');
    Array.from(employeeGroups.entries()).forEach(([employeeId, employeeSchedules]) => {
      const employeeName = employeeSchedules[0]?.employee?.name || '알 수 없음';
      const employeeCode = employeeSchedules[0]?.employee?.employee_id || '알 수 없음';
      
      console.log(`\n👤 ${employeeName} (${employeeCode}): ${employeeSchedules.length}개 스케줄`);
      
      // 같은 직원의 같은 날짜, 같은 시간대 중복 체크
      const duplicateGroups = new Map();
      employeeSchedules.forEach(schedule => {
        const duplicateKey = `${schedule.schedule_date}_${schedule.scheduled_start}_${schedule.scheduled_end}`;
        if (!duplicateGroups.has(duplicateKey)) {
          duplicateGroups.set(duplicateKey, []);
        }
        duplicateGroups.get(duplicateKey).push(schedule);
      });
      
      // 중복 그룹 필터링 (2개 이상인 그룹만)
      const realDuplicates = Array.from(duplicateGroups.entries())
        .filter(([key, group]) => group.length > 1);
      
      if (realDuplicates.length > 0) {
        console.log(`  ⚠️ 중복 그룹: ${realDuplicates.length}개`);
        totalDuplicateGroups += realDuplicates.length;
        
        realDuplicates.forEach(([key, group]) => {
          const [date, start, end] = key.split('_');
          console.log(`    📅 ${date} ${start}-${end}: ${group.length}개 중복`);
          
          group.forEach((schedule, index) => {
            console.log(`      ${index + 1}. ID: ${schedule.id} | 상태: ${schedule.status} | 설명: ${schedule.employee_note || '없음'}`);
            console.log(`         생성일: ${schedule.created_at}`);
          });
          
          totalDuplicates += group.length - 1; // 중복 개수만 계산
        });
      } else {
        console.log(`  ✅ 중복 없음`);
      }
    });
    
    console.log(`\n📊 전체 중복 분석 결과:`);
    console.log(`- 중복 그룹 수: ${totalDuplicateGroups}개`);
    console.log(`- 중복 스케줄 수: ${totalDuplicates}개`);
    
    if (totalDuplicates === 0) {
      console.log('\n✅ 실제로는 중복 스케줄이 없습니다!');
      console.log('사용자가 보신 "중복"은 다른 직원들의 같은 시간대 스케줄이었습니다.');
    } else {
      console.log(`\n⚠️ 실제 중복 스케줄 ${totalDuplicates}개 발견!`);
    }
    
  } catch (error) {
    console.error('❌ 중복 분석 중 오류 발생:', error);
  }
}

// 메인 실행
async function main() {
  await findRealEmployeeDuplicates();
}

main().catch(console.error);
