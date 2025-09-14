'use client';

import { useState, useEffect } from 'react';
import { Clock, MapPin, CheckCircle, XCircle, Calendar, User, Building, Coffee, DollarSign } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { format, isToday, startOfMonth, endOfMonth } from 'date-fns';
import { ko } from 'date-fns/locale';
import { getHourlyWage, calculateSimpleWage, formatWageBreakdown } from '@/lib/wage-calculator';

interface AttendanceRecord {
  id: string;
  employee_id: string;
  schedule_date: string;
  scheduled_start: string;
  scheduled_end: string;
  actual_start: string | null;
  actual_end: string | null;
  status: string;
  check_in_location: any;
  check_out_location: any;
  employee_note?: string;
  total_hours?: number;
  employee: {
    name: string;
    employee_id: string;
  };
}

export default function AttendancePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [todaySchedules, setTodaySchedules] = useState<AttendanceRecord[]>([]);
  const [monthlyRecords, setMonthlyRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [error, setError] = useState<string | null>(null);
  const [dailyAttendance, setDailyAttendance] = useState<{
    isCheckedIn: boolean;
    checkInTime: string | null;
    checkOutTime: string | null;
    totalWorkTime: string | null;
    hasBreak: boolean;
  }>({
    isCheckedIn: false,
    checkInTime: null,
    checkOutTime: null,
    totalWorkTime: null,
    hasBreak: false
  });
  
  // 급여 계산 관련 상태
  const [hourlyWage, setHourlyWage] = useState<number>(12000); // 기본 시급 12,000원 (hourly_wages 테이블에서 동적으로 로드)
  const [wageType, setWageType] = useState<'hourly' | 'monthly'>('hourly'); // 급여 형태
  const [monthlySalary, setMonthlySalary] = useState<number | null>(null); // 월급 정보
  const [wageCalculation, setWageCalculation] = useState<{
    scheduledPay: number;
    actualPay: number;
    difference: number;
  } | null>(null);
  const [pointBonus, setPointBonus] = useState<number>(0); // 포인트 수당
  const [totalEarnings, setTotalEarnings] = useState<number>(0); // 총 수입 (급여 + 포인트)
  // 실시간 근무 시간 계산을 위한 useEffect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (dailyAttendance.isCheckedIn && !dailyAttendance.checkOutTime) {
      // 출근했지만 퇴근하지 않은 경우, 1분마다 근무 시간 업데이트
      interval = setInterval(() => {
        if (dailyAttendance.checkInTime) {
          const now = new Date();
          const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
          
          // checkInTime이 "2025-09-14T10:41:20" 형식인 경우
          const start = new Date(dailyAttendance.checkInTime);
          
          // 디버깅 로그 추가
          console.log('🕐 실시간 근무 시간 계산:', {
            checkInTime: dailyAttendance.checkInTime,
            start: start.toISOString(),
            koreaTime: koreaTime.toISOString(),
            now: now.toISOString(),
            startTime: start.getTime(),
            koreaTimeTime: koreaTime.getTime()
          });
          
          const diffMs = koreaTime.getTime() - start.getTime();
          const hours = Math.floor(diffMs / (1000 * 60 * 60));
          const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          const totalHours = hours + (minutes / 60);
          
          console.log('⏱️ 계산된 근무 시간:', { hours, minutes, totalHours, diffMs });
          
          setDailyAttendance(prev => ({
            ...prev,
            totalWorkTime: `${hours}h ${minutes}m`
          }));
          
          // 급여 계산도 업데이트
          if (wageType === 'hourly') {
            const currentPay = totalHours * hourlyWage;
            setWageCalculation(prev => prev ? {
              ...prev,
              actualPay: currentPay,
              difference: currentPay - prev.scheduledPay
            } : null);
          }
        }
      }, 60000); // 1분마다 업데이트
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [dailyAttendance.isCheckedIn, dailyAttendance.checkInTime, dailyAttendance.checkOutTime, hourlyWage, wageType]);

  // getCurrentUser 함수 정의
  // 일일 근무 시간 계산 함수
  const calculateDailyWorkHours = (schedules: AttendanceRecord[]) => {
    if (schedules.length === 0) return { totalHours: 0, totalMinutes: 0 };
    
    let totalMinutes = 0;
    
    schedules.forEach(schedule => {
      if (schedule.actual_start && schedule.actual_end) {
        const start = new Date(schedule.actual_start);
        const end = new Date(schedule.actual_end);
        const diffMs = end.getTime() - start.getTime();
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        totalMinutes += diffMinutes;
      }
    });
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return { totalHours: hours, totalMinutes: minutes };
  };

  // 포인트 수당 계산 함수
  const calculatePointBonus = async (employeeId: string, date: string) => {
    try {
      // 해당 날짜의 업무 기록 조회
      const { data: tasks, error } = await supabase
        .from('employee_tasks')
        .select(`
          id,
          points,
          operation_types!inner(
            id,
            name,
            points
          )
        `)
        .eq('employee_id', employeeId)
        .eq('task_date', date);
      
      if (error) {
        console.error('업무 기록 조회 오류:', error);
        return 0;
      }
      
      // 포인트 합계 계산
      const totalPoints = (tasks || []).reduce((sum, task) => {
        return sum + (task.operation_types?.points || 0);
      }, 0);
      
      // 포인트를 원화로 환산 (1포인트 = 100원 가정)
      const pointValue = totalPoints * 100;
      
      console.log(`포인트 수당: ${totalPoints}포인트 → ${pointValue.toLocaleString()}원`);
      return pointValue;
    } catch (error) {
      console.error('포인트 수당 계산 오류:', error);
      return 0;
    }
  };

  // 급여 계산 함수
  const calculateWage = async () => {
    console.log('=== 급여 계산 함수 시작 ===');
    console.log('currentUser:', currentUser);
    console.log('todaySchedules.length:', todaySchedules.length);
    
    if (!currentUser) {
      console.log('❌ currentUser가 없습니다.');
      return;
    }
    
    console.log('✅ 급여 계산 함수 실행 중...');
    
    if (todaySchedules.length === 0) {
      console.log('❌ todaySchedules가 비어있습니다. 하지만 급여 정보는 표시합니다.');
      // 스케줄이 없어도 급여 정보는 표시해야 함
    }
    
    try {
      // 직원 정보 조회 (월급제 vs 시급제 구분)
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('employment_type, monthly_salary, hourly_rate')
        .eq('id', currentUser.id)
        .single();
      
      if (employeeError) {
        console.error('직원 정보 조회 오류:', employeeError);
        return;
      }
      
      console.log('직원 정보 조회 결과:', employee);
      console.log('monthly_salary 값:', employee.monthly_salary, '타입:', typeof employee.monthly_salary);
      console.log('hourly_rate 값:', employee.hourly_rate, '타입:', typeof employee.hourly_rate);
      
      let baseWage = 12000; // 기본값
      let wageType = 'hourly'; // 기본값
      
      // 월급제 vs 시급제 구분 (월급제 우선)
      if (employee.monthly_salary && employee.monthly_salary > 0) {
        // 월급제: 월급을 일급으로 환산 (월 22일 기준)
        baseWage = Math.round(employee.monthly_salary / 22);
        wageType = 'monthly';
        setMonthlySalary(employee.monthly_salary);
        console.log(`월급제: ${employee.monthly_salary.toLocaleString()}원/월 → ${baseWage.toLocaleString()}원/일`);
      } else if (employee.hourly_rate && employee.hourly_rate > 0) {
        // 시급제: employees 테이블의 hourly_rate 사용
        baseWage = employee.hourly_rate;
        wageType = 'hourly';
        setMonthlySalary(null);
        console.log(`시급제 (employees): ${baseWage.toLocaleString()}원/시간`);
      } else {
        // hourly_wages 테이블에서 시급 조회 (fallback)
        const wageInfo = await getHourlyWage(currentUser.id, new Date().toISOString().split('T')[0]);
        baseWage = wageInfo?.base_wage || 12000;
        wageType = 'hourly';
        setMonthlySalary(null);
        console.log(`시급제 (hourly_wages): ${baseWage.toLocaleString()}원/시간`);
      }
      
      // 급여 상태 업데이트
      setHourlyWage(baseWage);
      setWageType(wageType);
      
      // 스케줄된 시간과 실제 근무 시간 계산
      const scheduledHours = todaySchedules.length > 0 ? todaySchedules.reduce((total, schedule) => {
        if (schedule.scheduled_start && schedule.scheduled_end) {
          const start = new Date(`2000-01-01T${schedule.scheduled_start}`);
          const end = new Date(`2000-01-01T${schedule.scheduled_end}`);
          const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          return total + hours;
        }
        return total;
      }, 0) : 0;
      
      const actualHours = todaySchedules.length > 0 ? todaySchedules
        .filter(s => s.actual_start && s.actual_end)
        .reduce((total, s) => {
          const start = new Date(s.actual_start!);
          const end = new Date(s.actual_end!);
          return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        }, 0) : 0;
      
      // 급여 계산
      const calculation = calculateSimpleWage(baseWage, actualHours, scheduledHours);
      setWageCalculation(calculation);
      
      // 포인트 수당 계산
      const today = new Date().toISOString().split('T')[0];
      const pointBonusAmount = await calculatePointBonus(currentUser.id, today);
      setPointBonus(pointBonusAmount);
      
      // 총 수입 계산 (급여 + 포인트 수당)
      const totalEarningsAmount = calculation.actualPay + pointBonusAmount;
      setTotalEarnings(totalEarningsAmount);
    } catch (error) {
      console.error('급여 계산 오류:', error);
    }
  };

  // 스케줄을 시간대별로 그룹화하는 함수 (연속 스케줄 통합)
  const groupSchedulesByTimeRange = (schedules: AttendanceRecord[]) => {
    if (schedules.length === 0) return [];
    
    // 스케줄을 시작 시간순으로 정렬
    const sortedSchedules = [...schedules].sort((a, b) => 
      a.scheduled_start.localeCompare(b.scheduled_start)
    );
    
    const groups: {
      startTime: string;
      endTime: string;
      schedules: AttendanceRecord[];
      status: 'completed' | 'in-progress' | 'pending';
      actualStart?: string;
      actualEnd?: string;
      totalHours: number;
      estimatedWage: number;
      isContinuous: boolean;
    }[] = [];
    
    let currentGroup: typeof groups[0] | null = null;
    
    sortedSchedules.forEach(schedule => {
      const startTime = schedule.scheduled_start;
      const endTime = schedule.scheduled_end;
      
      if (!currentGroup) {
        // 첫 번째 그룹 시작
        currentGroup = {
          startTime,
          endTime,
          schedules: [schedule],
          status: schedule.actual_start && schedule.actual_end ? 'completed' 
                 : schedule.actual_start ? 'in-progress' 
                 : 'pending',
          actualStart: schedule.actual_start || undefined,
          actualEnd: schedule.actual_end || undefined,
          totalHours: 0,
          estimatedWage: 0,
          isContinuous: false
        };
      } else {
        // 연속된 시간대인지 확인 (30분 단위)
        const currentEnd = new Date(`2000-01-01T${currentGroup.endTime}`);
        const nextStart = new Date(`2000-01-01T${startTime}`);
        const timeDiff = nextStart.getTime() - currentEnd.getTime();
        
        if (timeDiff <= 30 * 60 * 1000) { // 30분 이내
          // 같은 그룹에 추가
          currentGroup.schedules.push(schedule);
          currentGroup.endTime = endTime;
          currentGroup.isContinuous = true;
          
          // 상태 업데이트
          if (schedule.actual_start && schedule.actual_end) {
            currentGroup.status = 'completed';
          } else if (schedule.actual_start && currentGroup.status === 'pending') {
            currentGroup.status = 'in-progress';
          }
          
          // 실제 시간 업데이트
          if (schedule.actual_start && !currentGroup.actualStart) {
            currentGroup.actualStart = schedule.actual_start;
          }
          if (schedule.actual_end) {
            currentGroup.actualEnd = schedule.actual_end;
          }
        } else {
          // 새로운 그룹 시작
          groups.push(currentGroup);
          currentGroup = {
            startTime,
            endTime,
            schedules: [schedule],
            status: schedule.actual_start && schedule.actual_end ? 'completed' 
                   : schedule.actual_start ? 'in-progress' 
                   : 'pending',
            actualStart: schedule.actual_start || undefined,
            actualEnd: schedule.actual_end || undefined,
            totalHours: 0,
            estimatedWage: 0,
            isContinuous: false
          };
        }
      }
    });
    
    // 마지막 그룹 추가
    if (currentGroup) {
      groups.push(currentGroup);
    }
    
    // 각 그룹의 총 근무 시간과 예상 알바비 계산
    return groups.map(group => {
      const totalSlots = group.schedules.length;
      const totalHours = totalSlots * 0.5; // 30분 = 0.5시간
      const hourlyWage = 9860; // 2025년 최저시급
      const estimatedWage = totalHours * hourlyWage;
      
      return {
        ...group,
        totalHours,
        estimatedWage
      };
    });
  };

  // 일일 출근 상태 분석
  const analyzeDailyAttendance = (schedules: AttendanceRecord[]) => {
    const completedSchedules = schedules.filter(s => s.actual_start && s.actual_end);
    const inProgressSchedules = schedules.filter(s => s.actual_start && !s.actual_end);
    const pendingSchedules = schedules.filter(s => !s.actual_start);
    
    const hasCheckedIn = inProgressSchedules.length > 0 || completedSchedules.length > 0;
    const hasCheckedOut = completedSchedules.length > 0 && inProgressSchedules.length === 0;
    
    let checkInTime = null;
    let checkOutTime = null;
    
    if (schedules.length > 0) {
      const firstSchedule = schedules[0];
      if (firstSchedule.actual_start) {
        checkInTime = firstSchedule.actual_start;
      }
      
      const lastCompletedSchedule = completedSchedules[completedSchedules.length - 1];
      if (lastCompletedSchedule?.actual_end) {
        checkOutTime = lastCompletedSchedule.actual_end;
      }
    }
    
    return {
      hasCheckedIn,
      hasCheckedOut,
      checkInTime,
      checkOutTime,
      completedCount: completedSchedules.length,
      inProgressCount: inProgressSchedules.length,
      pendingCount: pendingSchedules.length
    };
  };
  const getCurrentUser = async () => {
    try {
      if (typeof window !== 'undefined') {
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        const employeeData = localStorage.getItem('currentEmployee');
        
        if (isLoggedIn === 'true' && employeeData) {
          return JSON.parse(employeeData);
        }
      }
      return null;
    } catch (error) {
      console.error('사용자 정보 파싱 오류:', error);
      return null;
    }
  };

  // 컴포넌트 마운트 시 즉시 실행
  useEffect(() => {
    console.log('🚀 개인별 출근 관리 페이지 마운트됨');
    
    let isMounted = true; // 컴포넌트 마운트 상태 추적
    
    // 즉시 실행되는 함수
    const loadData = async () => {
      try {
        setError(null); // 에러 상태 초기화
        
        const user = await getCurrentUser();
        console.log('👤 사용자 정보:', user);
        
        if (!isMounted) return; // 컴포넌트가 언마운트된 경우 중단
        
        if (!user) {
          console.log('❌ 사용자 정보 없음 - 로그인 페이지로 이동');
          router.push('/login');
          return;
        }
        
        console.log('✅ 사용자 정보 설정 완료:', user.employee_id);
        setCurrentUser(user);
        
        // 스케줄 데이터 로딩
        console.log('📅 오늘 스케줄 조회 시작...');
        const today = format(new Date(), 'yyyy-MM-dd');
        console.log('📅 오늘 날짜:', today, '사용자 ID:', user.employee_id);
        
        const { data: todayData, error: todayError } = await supabase
          .from('schedules')
          .select(`
            *,
            employee:employees!schedules_employee_id_fkey (
              id,
              employee_id,
              name
            )
          `)
          .eq('employee_id', user.id) // UUID 사용
          .eq('schedule_date', today);

        if (!isMounted) return; // 컴포넌트가 언마운트된 경우 중단
        
        if (todayError) {
          console.error('❌ 오늘 스케줄 조회 오류:', todayError);
          setTodaySchedules([]);
        } else {
          console.log('✅ 오늘 스케줄 조회 성공:', todayData?.length || 0, '개');
          console.log('📊 스케줄 데이터:', todayData);
          setTodaySchedules(todayData || []);
          
          // 일일 출근 상태 분석 및 설정
          if (todayData && todayData.length > 0) {
            const analysis = analyzeDailyAttendance(todayData);
            const hasBreak = todayData.some(s => s.status === 'break');
            
            setDailyAttendance({
              isCheckedIn: analysis.hasCheckedIn,
              checkInTime: analysis.checkInTime,
              checkOutTime: analysis.hasCheckedOut ? analysis.checkOutTime : null,
              totalWorkTime: null,
              hasBreak: hasBreak
            });
            
            // 스케줄 로드 후 급여 계산
            setTimeout(() => calculateWage(), 100);
          } else {
            // 스케줄이 없어도 급여 계산
            setTimeout(() => calculateWage(), 100);
          }
          
          // 추가로 급여 계산 강제 실행
          setTimeout(() => calculateWage(), 500);
        }

        // attendance 테이블에서 오늘 출근 상태 확인 (스케줄이 없어도 확인)
        console.log('🔍 attendance 테이블에서 오늘 출근 상태 확인...');
        const { data: attendanceData, error: attendanceError } = await supabase
          .from('attendance')
          .select('*')
          .eq('employee_id', user.id)
          .eq('date', today)
          .single();

        if (!isMounted) return;

        if (attendanceError && attendanceError.code !== 'PGRST116') { // PGRST116은 데이터 없음 오류
          console.error('❌ attendance 데이터 조회 오류:', attendanceError);
        } else if (attendanceData) {
          console.log('✅ attendance 데이터 조회 성공:', attendanceData);
          
          // attendance 데이터를 기반으로 출근 상태 설정 (스케줄 데이터보다 우선)
          const hasCheckedIn = !!attendanceData.check_in_time;
          const hasCheckedOut = !!attendanceData.check_out_time;
          
          let totalWorkTime = null;
          if (attendanceData.total_hours) {
            // 퇴근한 경우: 저장된 총 근무 시간 사용
            totalWorkTime = `${Math.floor(attendanceData.total_hours)}h ${Math.round((attendanceData.total_hours % 1) * 60)}m`;
          } else if (hasCheckedIn && !hasCheckedOut) {
            // 출근했지만 퇴근하지 않은 경우: 실시간 계산
            const now = new Date();
            const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
            
            // 출근 시간을 한국 시간으로 올바르게 파싱
            const [hours, minutes, seconds] = attendanceData.check_in_time.split(':');
            const startKoreaTime = new Date();
            startKoreaTime.setUTCHours(parseInt(hours) - 9, parseInt(minutes), parseInt(seconds), 0); // 한국 시간을 UTC로 변환
            
            // 디버깅 로그 추가
            console.log('🕐 attendance 데이터 로드 시 근무 시간 계산:', {
              today,
              checkInTime: attendanceData.check_in_time,
              startKoreaTime: startKoreaTime.toISOString(),
              koreaTime: koreaTime.toISOString(),
              now: now.toISOString()
            });
            
            const diffMs = koreaTime.getTime() - startKoreaTime.getTime();
            const hours = Math.floor(diffMs / (1000 * 60 * 60));
            const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            totalWorkTime = `${hours}h ${minutes}m`;
            
            console.log('⏱️ attendance 로드 시 계산된 근무 시간:', { hours, minutes, diffMs });
          }
          
          setDailyAttendance(prev => ({
            ...prev,
            isCheckedIn: hasCheckedIn,
            checkInTime: attendanceData.check_in_time ? `${today}T${attendanceData.check_in_time}` : prev.checkInTime,
            checkOutTime: attendanceData.check_out_time ? `${today}T${attendanceData.check_out_time}` : prev.checkOutTime,
            totalWorkTime: totalWorkTime
          }));
          
          console.log('✅ attendance 기반 출근 상태 설정 완료:', {
            hasCheckedIn,
            hasCheckedOut,
            checkInTime: attendanceData.check_in_time ? `${today}T${attendanceData.check_in_time}` : null,
            checkOutTime: attendanceData.check_out_time ? `${today}T${attendanceData.check_out_time}` : null,
            totalWorkTime: totalWorkTime
          });
        } else {
          console.log('📝 오늘 attendance 데이터 없음');
        }
        
        // 월간 기록 조회 시작...
        const startDate = startOfMonth(new Date());
        const endDate = endOfMonth(new Date());
        
        console.log('📅 월간 조회 기간:', format(startDate, 'yyyy-MM-dd'), '~', format(endDate, 'yyyy-MM-dd'));
        
        const { data: monthlyData, error: monthlyError } = await supabase
          .from('schedules')
          .select(`
            *,
            employee:employees!schedules_employee_id_fkey (
              id,
              employee_id,
              name
            )
          `)
          .eq('employee_id', user.id) // UUID 사용
          .gte('schedule_date', format(startDate, 'yyyy-MM-dd'))
          .lte('schedule_date', format(endDate, 'yyyy-MM-dd'))
          .not('actual_start', 'is', null);

        if (!isMounted) return; // 컴포넌트가 언마운트된 경우 중단
        
        if (monthlyError) {
          console.error('❌ 월간 기록 조회 오류:', monthlyError);
          setMonthlyRecords([]);
        } else {
          console.log('✅ 월간 기록 조회 성공:', monthlyData?.length || 0, '개');
          console.log('📊 월간 데이터:', monthlyData);
          setMonthlyRecords(monthlyData || []);
        }
        
        if (isMounted) {
          console.log('🔄 로딩 상태 해제');
          setLoading(false);
          console.log('✅ 모든 데이터 로딩 완료');
        }
        
      } catch (error: any) {
        console.error('❌ 전체 로딩 과정 실패:', error);
        if (isMounted) {
          setError(error.message || '데이터 로딩 중 오류가 발생했습니다.');
          setLoading(false);
          // 에러 발생 시 기본값 설정
          setTodaySchedules([]);
          setMonthlyRecords([]);
        }
      }
    };
    
    // 즉시 실행
    loadData();

    // 시간 업데이트
    const timer = setInterval(() => {
      if (isMounted) {
        setCurrentTime(new Date());
      }
    }, 1000);
    
    return () => {
      isMounted = false; // 컴포넌트 언마운트 시 플래그 설정
      clearInterval(timer);
    };
  }, [router]);

  // 에러가 발생한 경우 에러 화면 표시
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">오류가 발생했습니다</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            페이지 새로고침
          </button>
        </div>
      </div>
    );
  }


  const fetchTodaySchedules = async (user: any) => {
    if (!user?.employee_id) {
      console.log('❌ fetchTodaySchedules: 사용자 ID 없음');
      setTodaySchedules([]);
      return;
    }

    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      console.log('📅 오늘 날짜:', today, '사용자 ID:', user.employee_id);
      
      // 단순한 쿼리로 테스트
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('employee_id', user.id) // UUID 사용
        .eq('schedule_date', today);

      if (error) {
        console.error('❌ 오늘 스케줄 조회 오류:', error);
        setTodaySchedules([]);
      } else {
        console.log('✅ 오늘 스케줄 조회 성공:', data?.length || 0, '개');
        console.log('📊 스케줄 데이터:', data);
        setTodaySchedules(data || []);
      }
    } catch (error) {
      console.error('❌ 오늘 스케줄 조회 예외:', error);
      setTodaySchedules([]);
    }
  };

  const fetchMonthlyRecords = async (user: any) => {
    if (!user?.employee_id) {
      console.log('❌ fetchMonthlyRecords: 사용자 ID 없음');
      setMonthlyRecords([]);
      setLoading(false);
      return;
    }

    try {
      const startDate = startOfMonth(new Date());
      const endDate = endOfMonth(new Date());
      
      console.log('📅 월간 조회 기간:', format(startDate, 'yyyy-MM-dd'), '~', format(endDate, 'yyyy-MM-dd'));
      
      // 단순한 쿼리로 테스트
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('employee_id', user.employee_id)
        .gte('schedule_date', format(startDate, 'yyyy-MM-dd'))
        .lte('schedule_date', format(endDate, 'yyyy-MM-dd'))
        .not('actual_start', 'is', null);

      if (error) {
        console.error('❌ 월간 기록 조회 오류:', error);
        setMonthlyRecords([]);
      } else {
        console.log('✅ 월간 기록 조회 성공:', data?.length || 0, '개');
        console.log('📊 월간 데이터:', data);
        setMonthlyRecords(data || []);
      }
    } catch (error) {
      console.error('❌ 월간 기록 조회 예외:', error);
      setMonthlyRecords([]);
    } finally {
      console.log('🔄 로딩 상태 해제');
      setLoading(false);
    }
  };

  const getCurrentLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('위치 서비스가 지원되지 않습니다.'));
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      });
    });
  };

  const handleCheckIn = async (scheduleId: string) => {
    setCheckingIn(true);

    try {
      let location = null;
      
      try {
        const position = await getCurrentLocation();
        location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString()
        };
      } catch (locationError) {
        console.warn('위치 정보를 가져올 수 없습니다:', locationError);
        // 위치 정보 없이도 출근 체크 가능
      }

      const { error } = await supabase
        .from('schedules')
        .update({
          actual_start: new Date().toISOString(),
          check_in_location: location,
          status: 'in_progress'
        })
        .eq('id', scheduleId);

      if (error) {
        console.error('Check-in error:', error);
        throw error;
      }

      alert('출근 체크가 완료되었습니다!');
      await fetchTodaySchedules(currentUser);
      await fetchMonthlyRecords(currentUser);
    } catch (error: any) {
      console.error('출근 체크 오류:', error);
      alert(`출근 체크에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setCheckingIn(false);
    }
  };

  // 간단한 출근 체크
  const handleSimpleCheckIn = async () => {
    if (checkingIn) return; // 이미 처리 중이면 중복 실행 방지
    
    try {
      setCheckingIn(true);
      setError(null); // 에러 상태 초기화
      
      // 한국 시간으로 현재 시간 계산
      const now = new Date();
      const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
      const nowISO = koreaTime.toISOString();
      const today = koreaTime.toISOString().split('T')[0];
      const checkInTime = koreaTime.toISOString().split('T')[1].split('.')[0]; // HH:MM:SS 형식
      
      // 1. schedules 테이블에 출근 시간 기록 (스케줄이 있는 경우에만)
      if (todaySchedules && todaySchedules.length > 0) {
        const updates = todaySchedules.map(schedule => ({
          id: schedule.id,
          actual_start: nowISO,
          status: "in_progress"
        }));
        
        // 일괄 업데이트
        for (const update of updates) {
          const { error } = await supabase
            .from("schedules")
            .update(update)
            .eq("id", update.id);
          
          if (error) throw error;
        }
        console.log('✅ schedules 테이블에 출근 시간 기록 완료');
      } else {
        console.log('📝 오늘 스케줄이 없어서 schedules 테이블 업데이트 건너뜀');
      }
      
      // 2. attendance 테이블에 출근 기록 저장 (항상 실행)
      const attendanceData = {
        employee_id: currentUser.id,
        date: today,
        check_in_time: checkInTime,
        status: 'present',
        location: {
          latitude: 37.5665, // 기본값 (실제로는 GPS 위치 사용)
          longitude: 126.9780,
          address: '서울시 중구'
        }
      };
      
      const { error: attendanceError } = await supabase
        .from('attendance')
        .upsert(attendanceData, { 
          onConflict: 'employee_id,date' 
        });
      
      if (attendanceError) {
        console.error('attendance 테이블 저장 오류:', attendanceError);
        throw attendanceError; // attendance 저장 실패 시 오류 발생
      } else {
        console.log('✅ attendance 테이블에 출근 기록 저장 완료');
      }
      
      setDailyAttendance(prev => ({
        ...prev,
        isCheckedIn: true,
        checkInTime: nowISO
      }));
      
      alert("출근 체크가 완료되었습니다!");
      await fetchTodaySchedules(currentUser);
      
    } catch (error: any) {
      console.error("출근 체크 오류:", error);
      alert(`출근 체크에 실패했습니다: ${error.message}`);
    } finally {
      setCheckingIn(false);
    }
  };

  // 간단한 퇴근 체크
  const handleSimpleCheckOut = async () => {
    if (checkingIn) return; // 이미 처리 중이면 중복 실행 방지
    
    try {
      setCheckingIn(true);
      setError(null); // 에러 상태 초기화
      
      // 한국 시간으로 현재 시간 계산
      const now = new Date();
      const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
      const nowISO = koreaTime.toISOString();
      const today = koreaTime.toISOString().split('T')[0];
      const checkOutTime = koreaTime.toISOString().split('T')[1].split('.')[0]; // HH:MM:SS 형식
      
      // 1. schedules 테이블에 퇴근 시간 기록 (스케줄이 있는 경우에만)
      if (todaySchedules && todaySchedules.length > 0) {
        const updates = todaySchedules.map(schedule => ({
          id: schedule.id,
          actual_end: nowISO,
          status: "completed"
        }));
        
        // 일괄 업데이트
        for (const update of updates) {
          const { error } = await supabase
            .from("schedules")
            .update(update)
            .eq("id", update.id);
          
          if (error) throw error;
        }
        console.log('✅ schedules 테이블에 퇴근 시간 기록 완료');
      } else {
        console.log('📝 오늘 스케줄이 없어서 schedules 테이블 업데이트 건너뜀');
      }
      
      // 2. attendance 테이블에 퇴근 시간 업데이트 (항상 실행)
      const checkInTime = dailyAttendance.checkInTime;
      if (checkInTime) {
        const start = new Date(checkInTime);
        const end = new Date(now);
        const diffMs = end.getTime() - start.getTime();
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const totalHours = hours + (minutes / 60); // 소수점으로 계산
        const overtimeHours = totalHours > 8 ? totalHours - 8 : 0;
        
        const attendanceUpdate = {
          check_out_time: checkOutTime,
          total_hours: Math.round(totalHours * 100) / 100,
          overtime_hours: Math.round(overtimeHours * 100) / 100,
          status: 'completed'
        };
        
        const { error: attendanceError } = await supabase
          .from('attendance')
          .update(attendanceUpdate)
          .eq('employee_id', currentUser.id)
          .eq('date', today);
        
        if (attendanceError) {
          console.error('attendance 테이블 업데이트 오류:', attendanceError);
          throw attendanceError; // attendance 업데이트 실패 시 오류 발생
        } else {
          console.log('✅ attendance 테이블에 퇴근 기록 업데이트 완료');
        }
        
        const totalTime = `${hours}h ${minutes}m`;
        
        setDailyAttendance(prev => ({
          ...prev,
          isCheckedIn: false,
          checkOutTime: now,
          totalWorkTime: totalTime
        }));
      } else {
        // 출근 시간이 없는 경우에도 퇴근 시간만 기록
        const attendanceUpdate = {
          check_out_time: checkOutTime,
          status: 'completed'
        };
        
        const { error: attendanceError } = await supabase
          .from('attendance')
          .update(attendanceUpdate)
          .eq('employee_id', currentUser.id)
          .eq('date', today);
        
        if (attendanceError) {
          console.error('attendance 테이블 퇴근 시간 업데이트 오류:', attendanceError);
        } else {
          console.log('✅ attendance 테이블에 퇴근 시간만 기록 완료');
        }
      }
      
      alert("퇴근 체크가 완료되었습니다!");
      await fetchTodaySchedules(currentUser);
      
    } catch (error: any) {
      console.error("퇴근 체크 오류:", error);
      alert(`퇴근 체크에 실패했습니다: ${error.message}`);
    } finally {
      setCheckingIn(false);
    }
  };

  // 중간 휴식 후 복귀 체크
  const handleBreakReturn = async () => {
    if (checkingIn) return; // 이미 처리 중이면 중복 실행 방지
    
    try {
      setCheckingIn(true);
      setError(null); // 에러 상태 초기화
      
      const now = new Date().toISOString();
      
      // 현재 진행 중인 스케줄에 퇴근 시간 기록
      const inProgressSchedules = todaySchedules.filter(s => 
        s.actual_start && !s.actual_end
      );
      
      for (const schedule of inProgressSchedules) {
        const { error } = await supabase
          .from("schedules")
          .update({
            actual_end: now,
            status: "break",
            employee_note: "중간 휴식"
          })
          .eq("id", schedule.id);
        
        if (error) throw error;
      }
      
      // 새로운 근무 세션 시작
      const remainingSchedules = todaySchedules.filter(s => 
        !s.actual_start
      );
      
      for (const schedule of remainingSchedules) {
        const { error } = await supabase
          .from("schedules")
          .update({
            actual_start: now,
            status: "in_progress"
          })
          .eq("id", schedule.id);
        
        if (error) throw error;
      }
      
      setDailyAttendance(prev => ({
        ...prev,
        hasBreak: false,
        isCheckedIn: true
      }));
      
      await fetchTodaySchedules(currentUser);
      
    } catch (error: any) {
      console.error("복귀 체크 오류:", error);
      alert(`복귀 체크에 실패했습니다: ${error.message}`);
    } finally {
      setCheckingIn(false);
    }
  };

  // 휴식 시작 함수 추가
  const handleBreakStart = async () => {
    if (checkingIn) return; // 이미 처리 중이면 중복 실행 방지
    
    try {
      setCheckingIn(true);
      setError(null); // 에러 상태 초기화
      
      const now = new Date().toISOString();
      
      // 현재 진행 중인 스케줄들을 휴식 상태로 변경
      const inProgressSchedules = todaySchedules.filter(s => 
        s.actual_start && !s.actual_end
      );
      
      for (const schedule of inProgressSchedules) {
        const { error } = await supabase
          .from('schedules')
          .update({
            actual_end: now,
            status: 'break',
            employee_note: '휴식 시작'
          })
          .eq('id', schedule.id);
        
        if (error) throw error;
      }
      
      setDailyAttendance(prev => ({
        ...prev,
        isCheckedIn: false,
        hasBreak: true
      }));
      
      await fetchTodaySchedules(currentUser);
      
    } catch (error: any) {
      console.error('휴식 시작 오류:', error);
      alert(`휴식 시작에 실패했습니다: ${error.message}`);
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async (scheduleId: string) => {
    setCheckingIn(true);

    try {
      let location = null;
      
      try {
        const position = await getCurrentLocation();
        location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString()
        };
      } catch (locationError) {
        console.warn('위치 정보를 가져올 수 없습니다:', locationError);
      }

      const { error } = await supabase
        .from('schedules')
        .update({
          actual_end: new Date().toISOString(),
          check_out_location: location,
          status: 'completed'
        })
        .eq('id', scheduleId);

      if (error) {
        console.error('Check-out error:', error);
        throw error;
      }

      alert('퇴근 체크가 완료되었습니다!');
      await fetchTodaySchedules(currentUser);
      await fetchMonthlyRecords(currentUser);
    } catch (error: any) {
      console.error('퇴근 체크 오류:', error);
      alert(`퇴근 체크에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setCheckingIn(false);
    }
  };

  const getAttendanceStatus = (schedule: AttendanceRecord) => {
    try {
      if (schedule.actual_start && schedule.actual_end) {
        return { status: 'completed', text: '완료', color: 'text-green-600 bg-green-100' };
      } else if (schedule.actual_start) {
        return { status: 'in_progress', text: '근무중', color: 'text-blue-600 bg-blue-100' };
      } else {
        return { status: 'pending', text: '대기', color: 'text-gray-600 bg-gray-100' };
      }
    } catch (error) {
      console.error('출근 상태 확인 오류:', error);
      return { status: 'error', text: '오류', color: 'text-red-600 bg-red-100' };
    }
  };

  const formatTime = (timeString: string) => {
    try {
      if (!timeString) {
        console.warn('formatTime: timeString이 비어있음');
        return '시간 없음';
      }
      
      // ISO 문자열이 아닌 경우 처리
      let date: Date;
      if (timeString.includes('T') || timeString.includes('Z')) {
        // ISO 형식 (예: "2025-09-03T09:00:00Z")
        date = new Date(timeString);
      } else if (timeString.includes(':')) {
        // 시간 형식 (예: "09:00:00" 또는 "09:00")
        const today = new Date();
        const [hours, minutes, seconds] = timeString.split(':');
        date = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 
                       parseInt(hours), parseInt(minutes), seconds ? parseInt(seconds) : 0);
      } else {
        // 기타 형식
        date = new Date(timeString);
      }
      
      if (isNaN(date.getTime())) {
        console.error('formatTime: 유효하지 않은 날짜/시간:', timeString);
        return '시간 오류';
      }
      
      return format(date, 'HH:mm', { locale: ko });
    } catch (error) {
      console.error('formatTime 오류:', error, 'timeString:', timeString);
      return '시간 오류';
    }
  };

  const formatDateTime = (dateTimeString: string) => {
    try {
      if (!dateTimeString) {
        console.warn('formatDateTime: dateTimeString이 비어있음');
        return '날짜/시간 없음';
      }
      
      const date = new Date(dateTimeString);
      
      if (isNaN(date.getTime())) {
        console.error('formatDateTime: 유효하지 않은 날짜/시간:', dateTimeString);
        return '날짜/시간 오류';
      }
      
      return format(date, 'MM/dd HH:mm', { locale: ko });
    } catch (error) {
      console.error('formatDateTime 오류:', error, 'dateTimeString:', dateTimeString);
      return '날짜/시간 오류';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 p-1 sm:p-2">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-2 sm:p-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => window.history.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="뒤로가기"
            >
              <span className="text-2xl">←</span>
            </button>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
              <Clock className="h-5 w-5 sm:h-6 sm:w-6 mr-1 sm:mr-2 text-green-600" />
              출근 관리
            </h1>
          </div>
          
          <div className="text-right">
            <div className="text-sm font-semibold text-gray-900">
              <div>{format(currentTime, 'yyyy년 MM월 dd일', { locale: ko })}</div>
              <div>{format(currentTime, 'HH:mm:ss', { locale: ko })}</div>
            </div>
          </div>
        </div>

        {/* 간단한 사용자 정보 - 업계 표준 스타일 */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <User className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-lg font-semibold text-gray-900">{currentUser?.name || '사용자'}</p>
                <p className="text-sm text-gray-500">{currentUser?.employee_id || 'ID'}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {(() => {
                  if (todaySchedules.length === 0) return '0.0';
                  
                  // 스케줄된 시간 계산 (각 스케줄의 시간 합계 - 점심시간 자동 제외)
                  const totalScheduledHours = todaySchedules.reduce((total, schedule) => {
                    if (schedule.scheduled_start && schedule.scheduled_end) {
                      const start = new Date(`2000-01-01T${schedule.scheduled_start}`);
                      const end = new Date(`2000-01-01T${schedule.scheduled_end}`);
                      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                      return total + hours;
                    }
                    return total;
                  }, 0);
                  
                  return totalScheduledHours.toFixed(1);
                })()}
              </div>
              <div className="text-sm text-gray-500">오늘 근무 시간</div>
            </div>
          </div>
        </div>

        {/* 일일 근무 요약 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">📊 오늘 근무 요약</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {(() => {
                  if (todaySchedules.length === 0) return '0h 0m';
                  
                  // 스케줄된 시간 계산 (각 스케줄의 시간 합계 - 점심시간 자동 제외)
                  const totalScheduledHours = todaySchedules.reduce((total, schedule) => {
                    if (schedule.scheduled_start && schedule.scheduled_end) {
                      const start = new Date(`2000-01-01T${schedule.scheduled_start}`);
                      const end = new Date(`2000-01-01T${schedule.scheduled_end}`);
                      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                      return total + hours;
                    }
                    return total;
                  }, 0);
                  
                  const hours = Math.floor(totalScheduledHours);
                  const minutes = Math.round((totalScheduledHours - hours) * 60);
                  return `${hours}h ${minutes}m`;
                })()}
              </div>
              <div className="text-sm text-blue-700">스케줄 시간</div>
            </div>
            
            <div>
              <div className="text-2xl font-bold text-green-600">
                {(() => {
                  if (todaySchedules.length === 0) return '0h 0m';
                  
                  const totalHours = todaySchedules
                    .filter(s => s.actual_start && s.actual_end)
                    .reduce((total, s) => {
                      const start = new Date(s.actual_start!);
                      const end = new Date(s.actual_end!);
                      return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                    }, 0);
                  
                  if (totalHours === 0) return '0h 0m';
                  
                  const hours = Math.floor(totalHours);
                  const minutes = Math.round((totalHours - hours) * 60);
                  return `${hours}h ${minutes}m`;
                })()}
              </div>
              <div className="text-sm text-green-700">실제 근무 시간</div>
            </div>
            
            <div className="relative group">
              <div className="text-2xl font-bold text-purple-600">
                {(() => {
                  if (todaySchedules.length === 0) return '0h 0m';
                  
                  // 스케줄된 시간 계산 (각 스케줄의 시간 합계 - 점심시간 자동 제외)
                  const scheduledHours = todaySchedules.reduce((total, schedule) => {
                    if (schedule.scheduled_start && schedule.scheduled_end) {
                      const start = new Date(`2000-01-01T${schedule.scheduled_start}`);
                      const end = new Date(`2000-01-01T${schedule.scheduled_end}`);
                      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                      return total + hours;
                    }
                    return total;
                  }, 0);
                  
                  // 실제 근무 시간 계산
                  const actualHours = todaySchedules
                    .filter(s => s.actual_start && s.actual_end)
                    .reduce((total, s) => {
                      const start = new Date(s.actual_start!);
                      const end = new Date(s.actual_end!);
                      return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                    }, 0);
                  
                  const difference = actualHours - scheduledHours;
                  
                  if (difference === 0) return '0h 0m';
                  
                  const hours = Math.floor(Math.abs(difference));
                  const minutes = Math.round((Math.abs(difference) - hours) * 60);
                  const sign = difference > 0 ? '+' : '-';
                  
                  return `${sign}${hours}h ${minutes}m`;
                })()}
              </div>
              <div className="text-sm text-purple-700">시간 차이</div>
              
              {/* 툴팁 */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none whitespace-nowrap z-10">
                <div className="text-center">
                  <div className="font-medium mb-1">실제 근무 시간 - 스케줄 시간</div>
                  <div className="text-gray-300">
                    +값: 초과 근무<br/>
                    -값: 부족 근무
                  </div>
                </div>
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
              </div>
            </div>
            

          </div>
        </div>


        {/* 간단한 출근 관리 - 업계 표준 스타일 */}
        <div className="bg-white rounded-lg border p-6 shadow-sm mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">📱 간단한 출근 관리</h3>
          
          <div className="space-y-6">
            {/* 현재 상태 표시 */}
            <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-green-50 rounded-xl border-2 border-blue-200">
              <div className="text-2xl font-bold text-gray-800 mb-2">
                {dailyAttendance.hasBreak ? "☕ 휴식 중" :
                 dailyAttendance.isCheckedIn && !dailyAttendance.checkOutTime ? "🟢 근무 중" : 
                 dailyAttendance.checkOutTime ? "✅ 근무 완료" : "⏰ 출근 전"}
              </div>
              
              {dailyAttendance.checkInTime && (
                <div className="text-lg text-gray-600">
                  출근: {format(new Date(dailyAttendance.checkInTime), "MM/dd HH:mm", { locale: ko })}
                </div>
              )}
              
              {dailyAttendance.totalWorkTime && (
                <div className="text-lg font-semibold text-blue-600 mt-2">
                  총 근무: {dailyAttendance.totalWorkTime}
                </div>
              )}
            </div>
            
            {/* 간단한 버튼들 */}
            <div className="grid grid-cols-1 gap-4">
              {!dailyAttendance.isCheckedIn && !dailyAttendance.hasBreak && (
                <button
                  onClick={handleSimpleCheckIn}
                  disabled={checkingIn}
                  className="bg-green-500 hover:bg-green-600 text-white px-8 py-4 rounded-xl text-xl font-bold disabled:opacity-50 w-full shadow-lg transform hover:scale-105 transition-all"
                >
                  <CheckCircle className="h-6 w-6 mr-3 inline" />
                  {checkingIn ? "처리중..." : "출근 체크"}
                </button>
              )}
              
              {dailyAttendance.isCheckedIn && !dailyAttendance.checkOutTime && !dailyAttendance.hasBreak && (
                <>
                  <button
                    onClick={handleBreakStart}
                    disabled={checkingIn}
                    className="bg-yellow-500 hover:bg-yellow-600 text-white px-8 py-4 rounded-xl text-xl font-bold disabled:opacity-50 w-full shadow-lg transform hover:scale-105 transition-all"
                  >
                    <Coffee className="h-6 w-6 mr-3 inline" />
                    {checkingIn ? "처리중..." : "휴식 시작"}
                  </button>
                  
                  <button
                    onClick={handleSimpleCheckOut}
                    disabled={checkingIn}
                    className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-xl text-xl font-bold disabled:opacity-50 w-full shadow-lg transform hover:scale-105 transition-all"
                  >
                    <XCircle className="h-6 w-6 mr-3 inline" />
                    {checkingIn ? "처리중..." : "퇴근 체크"}
                  </button>
                </>
              )}

              {dailyAttendance.hasBreak && (
                <>
                  <button
                    onClick={handleBreakReturn}
                    disabled={checkingIn}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-4 rounded-xl text-xl font-bold disabled:opacity-50 w-full shadow-lg transform hover:scale-105 transition-all"
                  >
                    <Coffee className="h-6 w-6 mr-3 inline" />
                    {checkingIn ? "처리중..." : "휴식 후 복귀"}
                  </button>
                  
                  <button
                    onClick={handleSimpleCheckOut}
                    disabled={checkingIn}
                    className="bg-red-500 hover:bg-red-600 text-white px-8 py-4 rounded-xl text-xl font-bold disabled:opacity-50 w-full shadow-lg transform hover:scale-105 transition-all"
                  >
                    <XCircle className="h-6 w-6 mr-3 inline" />
                    {checkingIn ? "처리중..." : "퇴근 체크"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
            <p className="text-gray-600">로딩 중...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 간단한 스케줄 요약 - 업계 표준 스타일 */}
            <div className="bg-white rounded-lg border p-6 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4 text-center flex items-center justify-center">
                <Calendar className="h-6 w-6 mr-2 text-blue-600" />
                오늘의 근무 요약
              </h2>
              
              {todaySchedules.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg">오늘 등록된 근무 스케줄이 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {(() => {
                    const groupedSchedules = groupSchedulesByTimeRange(todaySchedules);
                    
                    return groupedSchedules.map((group, groupIndex) => {
                      const totalSlots = group.schedules.length;
                      const completedSlots = group.schedules.filter(s => s.actual_start && s.actual_end).length;
                      const inProgressSlots = group.schedules.filter(s => s.actual_start && !s.actual_end).length;
                      
                      const getStatusIcon = (status: string) => {
                        switch (status) {
                          case 'completed': return '✅';
                          case 'in-progress': return '🟢';
                          case 'pending': return '⏰';
                          default: return '❓';
                        }
                      };
                      
                      const getStatusText = (status: string) => {
                        switch (status) {
                          case 'completed': return '완료';
                          case 'in-progress': return '근무중';
                          case 'pending': return '대기중';
                          default: return '알 수 없음';
                        }
                      };
                      
                      return (
                                              <div key={groupIndex} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-4">
                            <span className="text-2xl font-bold text-gray-900">
                              {formatTime(group.startTime)} - {formatTime(group.endTime)}
                            </span>
                            <span className="text-3xl">
                              {getStatusIcon(group.status)}
                            </span>
                            <span className="px-4 py-2 bg-gradient-to-r from-green-50 to-blue-50 rounded-full text-sm font-semibold text-gray-700 border border-green-200">
                              {getStatusText(group.status)}
                            </span>
                          </div>
                            
                            <div className="text-right">
                              <div className="text-center">
                                <div className="text-xs text-gray-500 mb-1">실제 근무</div>
                                <div className="text-sm font-medium text-gray-700">
                                  {group.actualStart ? formatTime(group.actualStart) : '--:--'} → {group.actualEnd ? formatTime(group.actualEnd) : '--:--'}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* 고급스러운 진행률 바 */}
                          <div className="w-full bg-gray-100 rounded-full h-3 mb-4 overflow-hidden">
                            <div 
                              className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500 ease-out"
                              style={{ width: `${(completedSlots / totalSlots) * 100}%` }}
                            ></div>
                          </div>
                          

                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>

            {/* 이번 달 출근 요약 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <User className="h-5 w-5 mr-2 text-blue-600" />
                이번 달 출근 요약
              </h2>
              
              {monthlyRecords.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Building className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>이번 달 출근 기록이 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* 월간 통계 */}
                  <div className="bg-white rounded-lg border p-4">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {(() => {
                            const totalHours = monthlyRecords
                              .filter(r => r.actual_start && r.actual_end)
                              .reduce((total, r) => {
                                const start = new Date(r.actual_start!);
                                const end = new Date(r.actual_end!);
                                return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                              }, 0);
                            return totalHours.toFixed(1);
                          })()}
                        </div>
                        <div className="text-sm text-gray-600">완료된 시간</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-orange-600">
                          {(() => {
                            // 스케줄된 시간의 총합 (각 날짜별 스케줄 시간 누적)
                            const totalScheduledHours = monthlyRecords.reduce((total, r) => {
                              if (r.scheduled_start && r.scheduled_end) {
                                const start = new Date(`2000-01-01T${r.scheduled_start}`);
                                const end = new Date(`2000-01-01T${r.scheduled_end}`);
                                const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                                console.log(`월간 스케줄: ${r.schedule_date} ${r.scheduled_start}-${r.scheduled_end} = ${hours}시간`);
                                return total + hours;
                              }
                              return total;
                            }, 0);
                            console.log(`총 스케줄 시간: ${totalScheduledHours}시간`);
                            return totalScheduledHours.toFixed(1);
                          })()}
                        </div>
                        <div className="text-sm text-gray-600">스케줄 시간</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 일별 요약 (최근 7일) */}
                  <div className="bg-white rounded-lg border p-4">
                    <h3 className="text-md font-medium text-gray-700 mb-3">최근 7일 요약</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {(() => {
                        const recentRecords = monthlyRecords
                          .filter(r => {
                            const recordDate = new Date(r.schedule_date);
                            const today = new Date();
                            const diffTime = Math.abs(today.getTime() - recordDate.getTime());
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            return diffDays <= 7;
                          })
                          .sort((a, b) => new Date(b.schedule_date).getTime() - new Date(a.schedule_date).getTime());
                        
                        const dailySummary = recentRecords.reduce((acc, record) => {
                          const date = record.schedule_date;
                          if (!acc[date]) {
                            acc[date] = {
                              date,
                              totalSchedules: 0,
                              completedSchedules: 0,
                              totalHours: 0,
                              scheduledHours: 0
                            };
                          }
                          acc[date].totalSchedules++;
                          
                          // 스케줄된 시간 계산 (각 날짜별로 누적)
                          if (record.scheduled_start && record.scheduled_end) {
                            const start = new Date(`2000-01-01T${record.scheduled_start}`);
                            const end = new Date(`2000-01-01T${record.scheduled_end}`);
                            acc[date].scheduledHours += (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                          }
                          
                          if (record.actual_start && record.actual_end) {
                            acc[date].completedSchedules++;
                            const start = new Date(record.actual_start);
                            const end = new Date(record.actual_end);
                            acc[date].totalHours += (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                          }
                          return acc;
                        }, {} as Record<string, { date: string; totalSchedules: number; completedSchedules: number; totalHours: number; scheduledHours: number }>);
                        
                        return Object.values(dailySummary).map((summary) => (
                          <div key={summary.date} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                            <span className="font-medium text-gray-900">
                              {format(new Date(summary.date), 'MM/dd (EEE)', { locale: ko })}
                            </span>
                            <div className="flex items-center space-x-4 text-gray-600">
                              <span className="text-xs text-gray-500">스케줄: {summary.scheduledHours.toFixed(1)}시간</span>
                              <span className="text-xs text-gray-500">실제: {summary.totalHours.toFixed(1)}시간</span>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
