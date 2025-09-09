/**
 * 점심시간 옵션 테스트
 */

// 30분 단위 시간 슬롯들을 연속된 시간대로 합치는 함수
function mergeConsecutiveTimeSlots(timeSlots, lunchStart = '12:00', lunchEnd = '13:00', excludeLunch = true) {
  if (timeSlots.length === 0) return [];
  
  // 시간 슬롯을 정렬
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
      const optimizedSchedule = createOptimizedSchedule(
        currentStart,
        add30Minutes(currentEnd),
        lunchStart,
        lunchEnd,
        excludeLunch
      );
      merged.push(optimizedSchedule);
      
      currentStart = sortedSlots[i];
      currentEnd = sortedSlots[i];
    }
  }
  
  // 마지막 구간 저장
  const optimizedSchedule = createOptimizedSchedule(
    currentStart,
    add30Minutes(currentEnd),
    lunchStart,
    lunchEnd,
    excludeLunch
  );
  merged.push(optimizedSchedule);
  
  return merged;
}

// 30분을 더하는 함수
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

// 최적화된 스케줄 객체 생성
function createOptimizedSchedule(start, end, lunchStart, lunchEnd, excludeLunch = true) {
  const startTime = new Date(`2000-01-01T${start}:00`);
  const endTime = new Date(`2000-01-01T${end}:00`);
  const lunchStartTime = new Date(`2000-01-01T${lunchStart}:00`);
  const lunchEndTime = new Date(`2000-01-01T${lunchEnd}:00`);
  
  // 전체 시간 계산
  const totalHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
  
  // 점심시간과 겹치는지 확인
  const overlapStart = new Date(Math.max(startTime.getTime(), lunchStartTime.getTime()));
  const overlapEnd = new Date(Math.min(endTime.getTime(), lunchEndTime.getTime()));
  
  let breakMinutes = 0;
  if (overlapStart < overlapEnd && excludeLunch) {
    // 점심시간 제외 옵션이 활성화된 경우에만 점심시간 제외
    breakMinutes = (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60);
  }
  
  // 실제 근무시간 계산
  const actualWorkHours = totalHours - (breakMinutes / 60);
  
  return {
    start,
    end,
    break_minutes: breakMinutes,
    total_hours: actualWorkHours,
    employee_note: breakMinutes > 0 ? 
      `${start}-${end} 근무 (점심시간 ${breakMinutes}분 제외)` : 
      excludeLunch && overlapStart < overlapEnd ?
      `${start}-${end} 근무 (점심시간 포함)` :
      `${start}-${end} 근무`
  };
}

// 30분 단위 시간 슬롯 생성 (점심시간 제외)
function generateTimeSlotsExcludingLunch(startTime, endTime, lunchStart = '12:00', lunchEnd = '13:00', intervalMinutes = 30) {
  const slots = [];
  const start = new Date(`2000-01-01T${startTime}:00`);
  const end = new Date(`2000-01-01T${endTime}:00`);
  
  let current = new Date(start);
  
  while (current < end) {
    const timeStr = current.toTimeString().substring(0, 5);
    
    // 점심시간 제외
    const slotTime = new Date(`2000-01-01T${timeStr}:00`);
    const lunchStartTime = new Date(`2000-01-01T${lunchStart}:00`);
    const lunchEndTime = new Date(`2000-01-01T${lunchEnd}:00`);
    
    if (slotTime < lunchStartTime || slotTime >= lunchEndTime) {
      slots.push(timeStr);
    }
    
    current.setMinutes(current.getMinutes() + intervalMinutes);
  }
  
  return slots;
}

// 30분 단위 시간 슬롯 생성 (점심시간 포함)
function generateTimeSlotsIncludingLunch(startTime, endTime, intervalMinutes = 30) {
  const slots = [];
  const start = new Date(`2000-01-01T${startTime}:00`);
  const end = new Date(`2000-01-01T${endTime}:00`);
  
  let current = new Date(start);
  
  while (current < end) {
    const timeStr = current.toTimeString().substring(0, 5);
    slots.push(timeStr);
    current.setMinutes(current.getMinutes() + intervalMinutes);
  }
  
  return slots;
}

// 테스트 실행
console.log('🧪 점심시간 옵션 테스트...');
console.log('');

console.log('1. 점심시간 제외 옵션 테스트:');
const timeSlotsExcluding = generateTimeSlotsExcludingLunch('09:00', '17:00', '12:00', '13:00', 30);
const mergedExcluding = mergeConsecutiveTimeSlots(timeSlotsExcluding, '12:00', '13:00', true);
console.log('생성된 시간 슬롯 (점심시간 제외):', timeSlotsExcluding.length + '개');
console.log('시간 슬롯:', timeSlotsExcluding.join(', '));
console.log('합쳐진 스케줄:', mergedExcluding.length + '개');
mergedExcluding.forEach((schedule, index) => {
  console.log(`  ${index + 1}. ${schedule.start} - ${schedule.end} (${schedule.total_hours}시간, 점심시간 ${schedule.break_minutes}분)`);
});
console.log('');

console.log('2. 점심시간 포함 옵션 테스트:');
const timeSlotsIncluding = generateTimeSlotsIncludingLunch('09:00', '17:00', 30);
const mergedIncluding = mergeConsecutiveTimeSlots(timeSlotsIncluding, '12:00', '13:00', false);
console.log('생성된 시간 슬롯 (점심시간 포함):', timeSlotsIncluding.length + '개');
console.log('시간 슬롯:', timeSlotsIncluding.join(', '));
console.log('합쳐진 스케줄:', mergedIncluding.length + '개');
mergedIncluding.forEach((schedule, index) => {
  console.log(`  ${index + 1}. ${schedule.start} - ${schedule.end} (${schedule.total_hours}시간, 점심시간 ${schedule.break_minutes}분)`);
});
console.log('');

console.log('3. 비교 분석:');
const totalWorkHoursExcluding = mergedExcluding.reduce((sum, schedule) => sum + schedule.total_hours, 0);
const totalWorkHoursIncluding = mergedIncluding.reduce((sum, schedule) => sum + schedule.total_hours, 0);
console.log('  - 점심시간 제외: 총 근무시간', totalWorkHoursExcluding + '시간');
console.log('  - 점심시간 포함: 총 근무시간', totalWorkHoursIncluding + '시간');
console.log('  - 차이:', (totalWorkHoursIncluding - totalWorkHoursExcluding) + '시간');
console.log('');

console.log('4. 점심시간 근무자 시나리오:');
console.log('  - 일반 직원: 점심시간 제외 옵션 사용 (7시간 근무)');
console.log('  - 점심시간 근무자: 점심시간 포함 옵션 사용 (8시간 근무)');
console.log('  - 유연한 스케줄 관리 가능');
console.log('');

console.log('✅ 점심시간 옵션 테스트 완료!');
console.log('💡 사용자가 점심시간 포함/제외를 선택할 수 있습니다');
