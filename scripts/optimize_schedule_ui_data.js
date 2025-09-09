const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://cgscbtxtgualkfalouwh.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNnc2NidHh0Z3VhbGtmYWxvdXdoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDY3MzYsImV4cCI6MjA3MDQ4MjczNn0.F0iFoFEJr87g4nA6Z7U1BK3t3ModxgZC2eWNIKRA0u8'
);

async function optimizeScheduleUIData() {
  console.log('🔧 스케줄 UI와 데이터 저장 방식 최적화...');
  
  try {
    // 최형호 직원 정보 조회
    const { data: choiEmployee, error: empError } = await supabase
      .from('employees')
      .select('id, name, employee_id')
      .eq('name', '최형호')
      .single();
    
    if (empError) {
      console.log('❌ 최형호 직원 정보 조회 실패:', empError.message);
      return;
    }
    
    console.log('✅ 최형호 직원 정보:', choiEmployee.name, choiEmployee.employee_id);
    
    // 1. 현재 8월 13일 스케줄 확인
    console.log('\n1. 현재 8월 13일 스케줄 확인...');
    const { data: currentSchedules, error: currentError } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', choiEmployee.id)
      .eq('schedule_date', '2025-08-13')
      .order('scheduled_start', { ascending: true });
    
    if (currentError) {
      console.log('❌ 현재 스케줄 조회 실패:', currentError.message);
      return;
    }
    
    console.log('✅ 현재 8월 13일 스케줄:', currentSchedules.length + '개');
    currentSchedules.forEach((schedule, index) => {
      console.log(`  ${index + 1}. ${schedule.scheduled_start} - ${schedule.scheduled_end} (${schedule.employee_note})`);
    });
    
    // 2. 30분 단위 UI 입력 시뮬레이션
    console.log('\n2. 30분 단위 UI 입력 시뮬레이션...');
    
    // 9:00-17:00을 30분 단위로 클릭했다고 가정
    const clickedTimeSlots = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
      // 12:00, 12:30은 점심시간이므로 클릭하지 않음
      '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
    ];
    
    console.log('📝 UI에서 클릭된 30분 단위:', clickedTimeSlots.length + '개');
    console.log('클릭된 시간대:', clickedTimeSlots.join(', '));
    
    // 3. 연속된 시간대 감지 및 합치기
    console.log('\n3. 연속된 시간대 감지 및 합치기...');
    
    function mergeConsecutiveTimeSlots(timeSlots) {
      if (timeSlots.length === 0) return [];
      
      const sortedSlots = [...timeSlots].sort();
      const merged = [];
      let currentStart = sortedSlots[0];
      let currentEnd = sortedSlots[0];
      
      for (let i = 1; i < sortedSlots.length; i++) {
        const currentTime = new Date(`2000-01-01T${sortedSlots[i]}:00`);
        const prevTime = new Date(`2000-01-01T${currentEnd}:00`);
        const timeDiff = (currentTime.getTime() - prevTime.getTime()) / (1000 * 60); // 분 단위
        
        if (timeDiff === 30) {
          // 연속된 시간대
          currentEnd = sortedSlots[i];
        } else {
          // 연속되지 않은 시간대 - 현재 구간 저장하고 새 구간 시작
          merged.push({
            start: currentStart,
            end: add30Minutes(currentEnd),
            duration: calculateDuration(currentStart, add30Minutes(currentEnd))
          });
          currentStart = sortedSlots[i];
          currentEnd = sortedSlots[i];
        }
      }
      
      // 마지막 구간 저장
      merged.push({
        start: currentStart,
        end: add30Minutes(currentEnd),
        duration: calculateDuration(currentStart, add30Minutes(currentEnd))
      });
      
      return merged;
    }
    
    function add30Minutes(timeStr) {
      const [hours, minutes] = timeStr.split(':').map(Number);
      let newMinutes = minutes + 30;
      let newHours = hours;
      
      if (newMinutes >= 60) {
        newHours += 1;
        newMinutes = 0;
      }
      
      return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
    }
    
    function calculateDuration(start, end) {
      const startTime = new Date(`2000-01-01T${start}:00`);
      const endTime = new Date(`2000-01-01T${end}:00`);
      return (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60); // 시간 단위
    }
    
    const mergedSchedules = mergeConsecutiveTimeSlots(clickedTimeSlots);
    
    console.log('✅ 연속된 시간대 감지 결과:', mergedSchedules.length + '개 구간');
    mergedSchedules.forEach((schedule, index) => {
      console.log(`  ${index + 1}. ${schedule.start} - ${schedule.end} (${schedule.duration}시간)`);
    });
    
    // 4. 점심시간 제외 계산
    console.log('\n4. 점심시간 제외 계산...');
    
    function calculateLunchExclusion(schedules) {
      let totalWorkHours = 0;
      let totalBreakMinutes = 0;
      
      schedules.forEach(schedule => {
        const start = new Date(`2000-01-01T${schedule.start}:00`);
        const end = new Date(`2000-01-01T${schedule.end}:00`);
        
        // 점심시간과 겹치는지 확인
        const lunchStart = new Date('2000-01-01T12:00:00');
        const lunchEnd = new Date('2000-01-01T13:00:00');
        
        const overlapStart = new Date(Math.max(start.getTime(), lunchStart.getTime()));
        const overlapEnd = new Date(Math.min(end.getTime(), lunchEnd.getTime()));
        
        if (overlapStart < overlapEnd) {
          const overlapMinutes = (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60);
          totalBreakMinutes += overlapMinutes;
          console.log(`  - ${schedule.start}-${schedule.end}: 점심시간 겹침 ${overlapMinutes}분`);
        }
        
        totalWorkHours += schedule.duration;
      });
      
      const actualWorkHours = totalWorkHours - (totalBreakMinutes / 60);
      
      return {
        totalWorkHours,
        breakMinutes: totalBreakMinutes,
        actualWorkHours
      };
    }
    
    const calculation = calculateLunchExclusion(mergedSchedules);
    
    console.log('📊 점심시간 제외 계산 결과:');
    console.log('  - 전체 시간:', calculation.totalWorkHours + '시간');
    console.log('  - 점심시간:', calculation.breakMinutes + '분');
    console.log('  - 실제 근무시간:', calculation.actualWorkHours + '시간');
    
    // 5. 최적화된 데이터 저장 방식 제안
    console.log('\n5. 최적화된 데이터 저장 방식 제안...');
    
    console.log('💡 권장 저장 방식:');
    console.log('1. UI: 30분 단위 클릭 입력 유지 (편의성)');
    console.log('2. 데이터: 연속된 시간대를 하나의 스케줄로 저장');
    console.log('3. 점심시간: break_minutes 필드로 관리');
    console.log('4. 부분 삭제: 해당 시간대만 수정');
    
    console.log('\n📋 최적화된 스케줄 데이터:');
    mergedSchedules.forEach((schedule, index) => {
      const breakMinutes = schedule.start <= '12:00' && schedule.end >= '13:00' ? 60 : 0;
      const actualHours = schedule.duration - (breakMinutes / 60);
      
      console.log(`  ${index + 1}. ${schedule.start} - ${schedule.end}`);
      console.log(`     - 전체 시간: ${schedule.duration}시간`);
      console.log(`     - 점심시간: ${breakMinutes}분`);
      console.log(`     - 실제 근무시간: ${actualHours}시간`);
    });
    
    console.log('\n🎉 스케줄 UI와 데이터 저장 방식 최적화 완료!');
    console.log('✅ UI 편의성 유지 + 데이터 효율성 확보');
    
  } catch (error) {
    console.error('❌ 최적화 중 오류:', error);
  }
}

// 스크립트가 직접 실행될 때만 실행
if (require.main === module) {
  optimizeScheduleUIData().catch(console.error);
}

module.exports = { optimizeScheduleUIData };
