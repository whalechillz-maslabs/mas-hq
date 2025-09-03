import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface HourlyWage {
  id: number;
  employee_id: string;
  base_wage: number;
  overtime_multiplier: number; // 1.0 = 수당 없음, 1.5 = 50% 추가
  night_shift_multiplier: number; // 1.0 = 수당 없음, 1.3 = 30% 추가
  holiday_multiplier: number; // 1.0 = 수당 없음, 2.0 = 100% 추가
  effective_date: string;
  end_date?: string;
}

export interface WorkTime {
  start_time: string;
  end_time: string;
  is_overtime: boolean;
  is_night_shift: boolean;
  is_holiday: boolean;
}

export interface WageCalculation {
  base_wage: number;
  total_hours: number;
  regular_hours: number;
  overtime_hours: number;
  night_shift_hours: number;
  holiday_hours: number;
  regular_pay: number;
  overtime_pay: number;
  night_shift_pay: number;
  holiday_pay: number;
  total_pay: number;
  breakdown: {
    regular: { hours: number; rate: number; pay: number };
    overtime: { hours: number; rate: number; pay: number };
    night_shift: { hours: number; rate: number; pay: number };
    holiday: { hours: number; rate: number; pay: number };
  };
}

/**
 * 특정 날짜에 적용되는 시급 정보를 가져옵니다
 */
export async function getHourlyWage(employeeId: string, date: string): Promise<HourlyWage | null> {
  try {
    const { data, error } = await supabase
      .from('hourly_wages')
      .select('*')
      .eq('employee_id', employeeId)
      .lte('effective_date', date)
      .or(`end_date.is.null,end_date.gte.${date}`)
      .order('effective_date', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error('시급 조회 오류:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('시급 조회 예외:', error);
    return null;
  }
}

/**
 * 야간 근무 여부를 판단합니다 (22:00-06:00)
 */
export function isNightShift(startTime: string, endTime: string): boolean {
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);
  
  const startHour = start.getHours();
  const endHour = end.getHours();
  
  // 22:00-06:00 구간 체크
  return (startHour >= 22 || startHour < 6) || (endHour >= 22 || endHour < 6);
}

/**
 * 휴일 여부를 판단합니다 (주말 또는 공휴일)
 */
export function isHoliday(date: string): boolean {
  const workDate = new Date(date);
  const dayOfWeek = workDate.getDay();
  
  // 주말 체크 (0: 일요일, 6: 토요일)
  return dayOfWeek === 0 || dayOfWeek === 6;
}

/**
 * 근무 시간을 분석하여 급여를 계산합니다
 */
export function calculateWage(
  hourlyWage: HourlyWage,
  workTimes: WorkTime[],
  scheduledHours: number
): WageCalculation {
  let regularHours = 0;
  let overtimeHours = 0;
  let nightShiftHours = 0;
  let holidayHours = 0;

  // 각 근무 시간을 분석
  workTimes.forEach(workTime => {
    const start = new Date(`2000-01-01T${workTime.start_time}`);
    const end = new Date(`2000-01-01T${workTime.end_time}`);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

    if (workTime.is_holiday) {
      holidayHours += hours;
    } else if (workTime.is_night_shift) {
      nightShiftHours += hours;
    } else if (workTime.is_overtime) {
      overtimeHours += hours;
    } else {
      regularHours += hours;
    }
  });

  // 기본 급여 계산 (계약 시간 기준)
  const regularPay = scheduledHours * hourlyWage.base_wage;
  
  // 초과 근무 수당
  const overtimePay = overtimeHours * hourlyWage.base_wage * hourlyWage.overtime_multiplier;
  
  // 야간 근무 수당
  const nightShiftPay = nightShiftHours * hourlyWage.base_wage * hourlyWage.night_shift_multiplier;
  
  // 휴일 근무 수당
  const holidayPay = holidayHours * hourlyWage.base_wage * hourlyWage.holiday_multiplier;
  
  const totalPay = regularPay + overtimePay + nightShiftPay + holidayPay;
  const totalHours = regularHours + overtimeHours + nightShiftHours + holidayHours;

  return {
    base_wage: hourlyWage.base_wage,
    total_hours: totalHours,
    regular_hours: regularHours,
    overtime_hours: overtimeHours,
    night_shift_hours: nightShiftHours,
    holiday_hours: holidayHours,
    regular_pay: regularPay,
    overtime_pay: overtimePay,
    night_shift_pay: nightShiftPay,
    holiday_pay: holidayPay,
    total_pay: totalPay,
    breakdown: {
      regular: {
        hours: regularHours,
        rate: hourlyWage.base_wage,
        pay: regularPay
      },
      overtime: {
        hours: overtimeHours,
        rate: hourlyWage.base_wage * hourlyWage.overtime_multiplier,
        pay: overtimePay
      },
      night_shift: {
        hours: nightShiftHours,
        rate: hourlyWage.base_wage * hourlyWage.night_shift_multiplier,
        pay: nightShiftPay
      },
      holiday: {
        hours: holidayHours,
        rate: hourlyWage.base_wage * hourlyWage.holiday_multiplier,
        pay: holidayPay
      }
    }
  };
}

/**
 * 간단한 급여 계산 (기본 시급만 적용)
 */
export function calculateSimpleWage(
  baseWage: number,
  totalHours: number,
  scheduledHours: number
): {
  scheduledPay: number;
  actualPay: number;
  difference: number;
} {
  const scheduledPay = scheduledHours * baseWage;
  const actualPay = totalHours * baseWage;
  const difference = actualPay - scheduledPay;

  return {
    scheduledPay,
    actualPay,
    difference
  };
}

/**
 * 급여 계산 결과를 한국어로 포맷팅합니다
 */
export function formatWageBreakdown(calculation: WageCalculation): string {
  const { breakdown } = calculation;
  
  let result = `기본 급여: ${breakdown.regular.pay.toLocaleString()}원 (${breakdown.regular.hours}시간)\n`;
  
  if (breakdown.overtime.hours > 0) {
    result += `초과 근무: ${breakdown.overtime.pay.toLocaleString()}원 (${breakdown.overtime.hours}시간, ${breakdown.overtime.rate.toLocaleString()}원/시간)\n`;
  }
  
  if (breakdown.night_shift.hours > 0) {
    result += `야간 근무: ${breakdown.night_shift.pay.toLocaleString()}원 (${breakdown.night_shift.hours}시간, ${breakdown.night_shift.rate.toLocaleString()}원/시간)\n`;
  }
  
  if (breakdown.holiday.hours > 0) {
    result += `휴일 근무: ${breakdown.holiday.pay.toLocaleString()}원 (${breakdown.holiday.hours}시간, ${breakdown.holiday.rate.toLocaleString()}원/시간)\n`;
  }
  
  result += `총 급여: ${calculation.total_pay.toLocaleString()}원`;
  
  return result;
}
