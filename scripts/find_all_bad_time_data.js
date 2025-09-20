const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function findAllBadTimeData() {
  console.log('🔍 모든 문제 시간 데이터 찾기');
  
  try {
    // 9월 19일 모든 스케줄 확인
    const { data: schedules } = await supabase
      .from('schedules')
      .select('*')
      .eq('schedule_date', '2025-09-19');

    console.log(`📊 총 ${schedules.length}개 스케줄 확인 중...`);
    
    const badSchedules = [];
    
    schedules.forEach((schedule, index) => {
      const issues = [];
      
      // actual_start 검사
      if (schedule.actual_start) {
        try {
          const startDate = new Date(schedule.actual_start);
          if (isNaN(startDate.getTime())) {
            issues.push(`actual_start 파싱 불가: ${schedule.actual_start}`);
          }
        } catch (e) {
          issues.push(`actual_start 에러: ${e.message}`);
        }
      }
      
      // actual_end 검사
      if (schedule.actual_end) {
        try {
          const endDate = new Date(schedule.actual_end);
          if (isNaN(endDate.getTime())) {
            issues.push(`actual_end 파싱 불가: ${schedule.actual_end}`);
          }
        } catch (e) {
          issues.push(`actual_end 에러: ${e.message}`);
        }
      }
      
      // scheduled_start 검사
      if (schedule.scheduled_start) {
        try {
          // HH:mm:ss 형식인지 확인
          const timeMatch = schedule.scheduled_start.match(/^(\d{1,2}):(\d{2}):(\d{2})$/);
          if (!timeMatch) {
            issues.push(`scheduled_start 형식 이상: ${schedule.scheduled_start}`);
          }
        } catch (e) {
          issues.push(`scheduled_start 에러: ${e.message}`);
        }
      }
      
      // scheduled_end 검사
      if (schedule.scheduled_end) {
        try {
          const timeMatch = schedule.scheduled_end.match(/^(\d{1,2}):(\d{2}):(\d{2})$/);
          if (!timeMatch) {
            issues.push(`scheduled_end 형식 이상: ${schedule.scheduled_end}`);
          }
        } catch (e) {
          issues.push(`scheduled_end 에러: ${e.message}`);
        }
      }
      
      if (issues.length > 0) {
        badSchedules.push({
          index: index + 1,
          id: schedule.id,
          employee: schedule.employee_id,
          issues: issues,
          actual_start: schedule.actual_start,
          actual_end: schedule.actual_end,
          scheduled_start: schedule.scheduled_start,
          scheduled_end: schedule.scheduled_end
        });
      }
    });
    
    if (badSchedules.length > 0) {
      console.log(`\n❌ 문제가 있는 스케줄 ${badSchedules.length}개 발견:`);
      
      badSchedules.forEach(bad => {
        console.log(`\n📋 스케줄 ${bad.index} (ID: ${bad.id}):`);
        console.log(`   직원 ID: ${bad.employee}`);
        console.log(`   예정 시작: ${bad.scheduled_start}`);
        console.log(`   예정 종료: ${bad.scheduled_end}`);
        console.log(`   실제 시작: ${bad.actual_start}`);
        console.log(`   실제 종료: ${bad.actual_end}`);
        console.log(`   문제점:`);
        bad.issues.forEach(issue => {
          console.log(`     - ${issue}`);
        });
      });
      
      // 자동 수정 가능한 문제들 수정
      console.log('\n🔧 자동 수정 시작...');
      
      for (const bad of badSchedules) {
        const updates = {};
        let needsUpdate = false;
        
        // actual_start가 00:00:00인 경우 수정
        if (bad.actual_start && bad.actual_start.includes('00:00:00')) {
          const newStart = bad.actual_start.replace('00:00:00', '09:00:00');
          updates.actual_start = newStart;
          needsUpdate = true;
          console.log(`   수정: actual_start ${bad.actual_start} → ${newStart}`);
        }
        
        // actual_end가 00:30:00인 경우 수정
        if (bad.actual_end && bad.actual_end.includes('00:30:00')) {
          const newEnd = bad.actual_end.replace('00:30:00', '09:30:00');
          updates.actual_end = newEnd;
          needsUpdate = true;
          console.log(`   수정: actual_end ${bad.actual_end} → ${newEnd}`);
        }
        
        if (needsUpdate) {
          updates.updated_at = new Date().toISOString();
          
          const { error } = await supabase
            .from('schedules')
            .update(updates)
            .eq('id', bad.id);
          
          if (error) {
            console.log(`   ❌ 수정 실패: ${error.message}`);
          } else {
            console.log(`   ✅ 수정 완료`);
          }
        }
      }
      
    } else {
      console.log('✅ 문제가 있는 스케줄 없음');
    }
    
  } catch (error) {
    console.error('❌ 전체 에러:', error);
  }
}

findAllBadTimeData();
