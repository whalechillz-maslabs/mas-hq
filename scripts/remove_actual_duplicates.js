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

// 실제 중복 스케줄 제거 함수
async function removeActualDuplicates() {
  try {
    console.log('🔍 실제 중복 스케줄 제거 시작...\n');
    
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
    
    // 2. 중복 그룹 찾기 (같은 직원, 같은 날짜, 같은 시간대)
    const duplicateGroups = new Map();
    
    schedules?.forEach(schedule => {
      // 중복 체크를 위한 고유 키 생성 (직원 + 날짜 + 시간대)
      const duplicateKey = `${schedule.employee_id}_${schedule.schedule_date}_${schedule.scheduled_start}_${schedule.scheduled_end}`;
      
      if (!duplicateGroups.has(duplicateKey)) {
        duplicateGroups.set(duplicateKey, []);
      }
      duplicateGroups.get(duplicateKey).push(schedule);
    });
    
    // 3. 중복 그룹 필터링 (2개 이상인 그룹만)
    const realDuplicates = Array.from(duplicateGroups.entries())
      .filter(([key, group]) => group.length > 1);
    
    // 디버깅: 중복 그룹 상세 정보 출력
    console.log('🔍 중복 그룹 상세 정보:');
    realDuplicates.forEach(([key, group], index) => {
      const firstSchedule = group[0];
      const employeeName = firstSchedule.employee?.name || '알 수 없음';
      console.log(`${index + 1}. ${employeeName} - ${firstSchedule.schedule_date} ${firstSchedule.scheduled_start}-${firstSchedule.scheduled_end} (${group.length}개)`);
    });
    
    console.log(`🔄 중복 그룹 발견: ${realDuplicates.length}개\n`);
    
    if (realDuplicates.length === 0) {
      console.log('✅ 중복 스케줄이 없습니다.');
      return;
    }
    
    // 4. 중복 제거 전략 적용
    console.log('🗑️ 중복 제거 시작...');
    let totalDeleted = 0;
    let totalErrors = 0;
    
    for (const [key, group] of realDuplicates) {
      const firstSchedule = group[0];
      const employeeName = firstSchedule.employee?.name || '알 수 없음';
      const employeeId = firstSchedule.employee?.employee_id || '알 수 없음';
      
      console.log(`\n🔧 처리 중: ${employeeName} (${employeeId}) - ${firstSchedule.schedule_date} ${firstSchedule.scheduled_start}-${firstSchedule.scheduled_end}`);
      console.log(`   중복 개수: ${group.length}개`);
      
      // 우선순위에 따라 정렬
      const sortedGroup = group.sort((a, b) => {
        // 1순위: 상태 (승인 > 대기 > 진행중 > 완료 > 취소)
        const statusPriority = { 
          'approved': 5, 
          'pending': 4, 
          'in_progress': 3, 
          'completed': 2, 
          'cancelled': 1 
        };
        const aStatus = statusPriority[a.status] || 0;
        const bStatus = statusPriority[b.status] || 0;
        
        if (aStatus !== bStatus) {
          return bStatus - aStatus;
        }
        
        // 2순위: 생성일 (최신 우선)
        return new Date(b.created_at) - new Date(a.created_at);
      });
      
      // 첫 번째(우선순위 높은) 것만 남기고 나머지 삭제
      const keepSchedule = sortedGroup[0];
      const deleteSchedules = sortedGroup.slice(1);
      
      console.log(`   ✅ 유지할 스케줄: ID ${keepSchedule.id} (${keepSchedule.status}) - ${keepSchedule.employee_note || '없음'}`);
      console.log(`   🗑️ 삭제할 스케줄: ${deleteSchedules.length}개`);
      
      for (const schedule of deleteSchedules) {
        console.log(`     - ID: ${schedule.id} (${schedule.status}) - ${schedule.employee_note || '없음'}`);
        
        const { error: deleteError } = await supabase
          .from('schedules')
          .delete()
          .eq('id', schedule.id);
        
        if (deleteError) {
          console.error(`     ❌ 삭제 실패:`, deleteError);
          totalErrors++;
        } else {
          console.log(`     ✅ 삭제 완료`);
          totalDeleted++;
        }
      }
    }
    
    // 5. 결과 요약
    console.log('\n📊 중복 제거 결과:');
    console.log(`✅ 성공적으로 삭제: ${totalDeleted}개`);
    console.log(`❌ 삭제 실패: ${totalErrors}개`);
    console.log(`📈 처리된 중복 그룹: ${realDuplicates.length}개`);
    
    // 6. 최종 검증
    const { data: finalSchedules, error: finalError } = await supabase
      .from('schedules')
      .select('id')
      .gte('schedule_date', '2025-09-01')
      .lte('schedule_date', '2025-09-30');
    
    if (!finalError) {
      console.log(`\n🔍 최종 검증: 현재 9월 스케줄 수 ${finalSchedules?.length || 0}개`);
      console.log(`📉 삭제된 스케줄: ${(schedules?.length || 0) - (finalSchedules?.length || 0)}개`);
    }
    
  } catch (error) {
    console.error('❌ 중복 제거 중 오류 발생:', error);
  }
}

// 중복 방지 로직 개선 제안
async function suggestDuplicatePrevention() {
  console.log('\n💡 중복 방지 개선 제안:');
  console.log('1. 스케줄 추가 시 같은 시간대 체크 강화');
  console.log('2. 클릭 중복 방지 (버튼 비활성화)');
  console.log('3. 자동승인과 수동 추가 충돌 방지');
  console.log('4. 사용자에게 명확한 중복 경고 메시지');
  console.log('5. 주기적 중복 체크 및 정리');
  console.log('6. 데이터베이스 제약 조건 강화');
}

// 메인 실행
async function main() {
  console.log('🚀 실제 중복 스케줄 제거 시작\n');
  
  await removeActualDuplicates();
  await suggestDuplicatePrevention();
  
  console.log('\n✅ 작업 완료!');
}

main().catch(console.error);
