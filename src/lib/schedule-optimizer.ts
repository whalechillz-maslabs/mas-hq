/**
 * 스케줄 최적화 유틸리티
 * 30분 단위 UI 입력을 연속된 시간대로 합쳐서 데이터베이스에 효율적으로 저장
 */

export interface TimeSlot {
  time: string;
  label: string;
  isLunch: boolean;
}

export interface OptimizedSchedule {
  start: string;
  end: string;
  break_minutes: number;
  total_hours: number;
  employee_note?: string;
}

/**
 * 30분 단위 시간 슬롯들을 연속된 시간대로 합치는 함수
 */
export function mergeConsecutiveTimeSlots(
  timeSlots: string[],
  lunchStart: string = '12:00',
  lunchEnd: string = '13:00'
): OptimizedSchedule[] {
  if (timeSlots.length === 0) return [];
  
  // 시간 슬롯을 정렬
  const sortedSlots = [...timeSlots].sort();
  const merged: OptimizedSchedule[] = [];
  
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
        lunchEnd
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
    lunchEnd
  );
  merged.push(optimizedSchedule);
  
  return merged;
}

/**
 * 30분을 더하는 함수
 */
function add30Minutes(timeStr: string): string {
  const [hours, minutes] = timeStr.split(':').map(Number);
  let newMinutes = minutes + 30;
  let newHours = hours;
  
  if (newMinutes >= 60) {
    newHours += 1;
    newMinutes = 0;
  }
  
  return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
}

/**
 * 최적화된 스케줄 객체 생성
 */
function createOptimizedSchedule(
  start: string,
  end: string,
  lunchStart: string,
  lunchEnd: string
): OptimizedSchedule {
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
  if (overlapStart < overlapEnd) {
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
      `${start}-${end} 근무`
  };
}

/**
 * 일괄 입력 시 30분 단위로 분할된 시간 슬롯들을 생성
 */
export function generateTimeSlots(
  startTime: string,
  endTime: string,
  intervalMinutes: number = 30
): string[] {
  const slots: string[] = [];
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

/**
 * 점심시간을 제외한 시간 슬롯들 생성
 */
export function generateTimeSlotsExcludingLunch(
  startTime: string,
  endTime: string,
  lunchStart: string = '12:00',
  lunchEnd: string = '13:00',
  intervalMinutes: number = 30
): string[] {
  const allSlots = generateTimeSlots(startTime, endTime, intervalMinutes);
  
  // 점심시간 슬롯 제외
  return allSlots.filter(slot => {
    const slotTime = new Date(`2000-01-01T${slot}:00`);
    const lunchStartTime = new Date(`2000-01-01T${lunchStart}:00`);
    const lunchEndTime = new Date(`2000-01-01T${lunchEnd}:00`);
    
    return slotTime < lunchStartTime || slotTime >= lunchEndTime;
  });
}

/**
 * 스케줄 데이터베이스 저장용 객체 생성
 */
export function createScheduleData(
  employeeId: string,
  scheduleDate: string,
  optimizedSchedule: OptimizedSchedule,
  status: string = 'pending'
) {
  return {
    employee_id: employeeId,
    schedule_date: scheduleDate,
    scheduled_start: optimizedSchedule.start + ':00',
    scheduled_end: optimizedSchedule.end + ':00',
    break_minutes: optimizedSchedule.break_minutes,
    total_hours: optimizedSchedule.total_hours,
    status,
    employee_note: optimizedSchedule.employee_note,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

/**
 * 부분 삭제를 위한 스케줄 수정 함수
 */
export function modifyScheduleForPartialDeletion(
  existingSchedule: any,
  deleteStart: string,
  deleteEnd: string
): any[] {
  const existingStart = existingSchedule.scheduled_start.substring(0, 5);
  const existingEnd = existingSchedule.scheduled_end.substring(0, 5);
  
  const modifiedSchedules: any[] = [];
  
  // 삭제할 시간대가 기존 스케줄과 겹치는지 확인
  const deleteStartTime = new Date(`2000-01-01T${deleteStart}:00`);
  const deleteEndTime = new Date(`2000-01-01T${deleteEnd}:00`);
  const existingStartTime = new Date(`2000-01-01T${existingStart}:00`);
  const existingEndTime = new Date(`2000-01-01T${existingEnd}:00`);
  
  // 삭제할 시간대가 기존 스케줄 시작 전이면 기존 스케줄 유지
  if (deleteEndTime <= existingStartTime) {
    return [existingSchedule];
  }
  
  // 삭제할 시간대가 기존 스케줄 종료 후면 기존 스케줄 유지
  if (deleteStartTime >= existingEndTime) {
    return [existingSchedule];
  }
  
  // 삭제할 시간대가 기존 스케줄을 완전히 포함하면 스케줄 삭제
  if (deleteStartTime <= existingStartTime && deleteEndTime >= existingEndTime) {
    return [];
  }
  
  // 부분 삭제 - 기존 스케줄을 분할
  if (deleteStartTime > existingStartTime && deleteEndTime < existingEndTime) {
    // 앞부분과 뒷부분으로 분할
    const beforeSchedule = {
      ...existingSchedule,
      scheduled_end: deleteStart + ':00',
      employee_note: `${existingStart}-${deleteStart} 근무 (부분 삭제)`
    };
    
    const afterSchedule = {
      ...existingSchedule,
      scheduled_start: deleteEnd + ':00',
      employee_note: `${deleteEnd}-${existingEnd} 근무 (부분 삭제)`
    };
    
    modifiedSchedules.push(beforeSchedule, afterSchedule);
  } else if (deleteStartTime <= existingStartTime) {
    // 뒷부분만 남김
    const afterSchedule = {
      ...existingSchedule,
      scheduled_start: deleteEnd + ':00',
      employee_note: `${deleteEnd}-${existingEnd} 근무 (부분 삭제)`
    };
    
    modifiedSchedules.push(afterSchedule);
  } else if (deleteEndTime >= existingEndTime) {
    // 앞부분만 남김
    const beforeSchedule = {
      ...existingSchedule,
      scheduled_end: deleteStart + ':00',
      employee_note: `${existingStart}-${deleteStart} 근무 (부분 삭제)`
    };
    
    modifiedSchedules.push(beforeSchedule);
  }
  
  return modifiedSchedules;
}
