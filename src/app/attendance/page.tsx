'use client';

import { useState, useEffect } from 'react';
import { Clock, MapPin, CheckCircle, XCircle, Calendar, User, Building, Coffee } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { format, isToday, startOfMonth, endOfMonth } from 'date-fns';
import { ko } from 'date-fns/locale';

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
          }
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
    try {
      setCheckingIn(true);
      const now = new Date().toISOString();
      
      // 모든 오늘 스케줄에 출근 시간 기록
      const updates = todaySchedules.map(schedule => ({
        id: schedule.id,
        actual_start: now,
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
      
      setDailyAttendance(prev => ({
        ...prev,
        isCheckedIn: true,
        checkInTime: now
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
    try {
      setCheckingIn(true);
      const now = new Date().toISOString();
      
      // 모든 오늘 스케줄에 퇴근 시간 기록
      const updates = todaySchedules.map(schedule => ({
        id: schedule.id,
        actual_end: now,
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
      
      // 총 근무 시간 계산
      const checkInTime = dailyAttendance.checkInTime;
      if (checkInTime) {
        const start = new Date(checkInTime);
        const end = new Date(now);
        const diffMs = end.getTime() - start.getTime();
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const totalTime = `${hours}h ${minutes}m`;
        
        setDailyAttendance(prev => ({
          ...prev,
          isCheckedIn: false,
          checkOutTime: now,
          totalWorkTime: totalTime
        }));
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
    try {
      setCheckingIn(true);
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
    try {
      setCheckingIn(true);
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
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
            <Clock className="h-5 w-5 sm:h-6 sm:w-6 mr-1 sm:mr-2 text-green-600" />
            출근 관리
          </h1>
          
          <div className="text-right">
            <p className="text-xs text-gray-600">현재 시간</p>
            <p className="text-sm font-semibold text-gray-900">
              {format(currentTime, 'yyyy년 MM월 dd일 HH:mm:ss', { locale: ko })}
            </p>
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
                  const groupedSchedules = groupSchedulesByTimeRange(todaySchedules);
                  return groupedSchedules.length;
                })()}
              </div>
              <div className="text-sm text-gray-500">오늘 근무 시간대</div>
              <div className="text-xs text-gray-400">
                {todaySchedules.length}개 세부 스케줄
              </div>
            </div>
          </div>
        </div>

        {/* 일일 근무 요약 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">📊 오늘 근무 요약</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">
                {(() => {
                  const { totalHours, totalMinutes } = calculateDailyWorkHours(todaySchedules);
                  return totalHours > 0 || totalMinutes > 0 ? `${totalHours}h ${totalMinutes}m` : '0h 0m';
                })()}
              </div>
              <div className="text-sm text-blue-700">총 근무 시간</div>
            </div>
            
            <div>
              <div className="text-2xl font-bold text-green-600">
                {(() => {
                  const analysis = analyzeDailyAttendance(todaySchedules);
                  return analysis.completedCount || 0;
                })()}
              </div>
              <div className="text-sm text-green-700">완료된 근무</div>
            </div>
            
            <div>
              <div className="text-2xl font-bold text-orange-600">
                {(() => {
                  const analysis = analyzeDailyAttendance(todaySchedules);
                  return analysis.inProgressCount || 0;
                })()}
              </div>
              <div className="text-sm text-orange-700">진행 중</div>
            </div>
            
            <div>
              <div className="text-2xl font-bold text-gray-600">
                {(() => {
                  const analysis = analyzeDailyAttendance(todaySchedules);
                  return analysis.pendingCount || 0;
                })()}
              </div>
              <div className="text-sm text-gray-700">대기 중</div>
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
                        <div key={groupIndex} className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-4 border border-gray-200">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <span className="text-xl font-bold text-gray-800">
                                {formatTime(group.startTime)} - {formatTime(group.endTime)}
                              </span>
                              <span className="text-2xl">
                                {getStatusIcon(group.status)}
                              </span>
                              <span className="px-3 py-1 bg-white rounded-full text-sm font-medium text-gray-700 border">
                                {getStatusText(group.status)}
                              </span>
                            </div>
                            
                            <div className="text-right">
                              <div className="text-lg font-bold text-blue-600">
                                {completedSlots}/{totalSlots}
                              </div>
                              <div className="text-sm text-gray-500">완료</div>
                              {group.isContinuous && (
                                <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full mt-1">
                                  연속 근무
                                </div>
                              )}
                              <div className="text-sm font-semibold text-green-600 mt-1">
                                {group.totalHours}시간
                              </div>
                              <div className="text-xs text-gray-500">
                                예상: {group.estimatedWage.toLocaleString()}원
                              </div>
                            </div>
                          </div>
                          
                          {/* 간단한 진행률 바 */}
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${(completedSlots / totalSlots) * 100}%` }}
                            ></div>
                          </div>
                          
                          {/* 실제 시간 정보 (간단하게) */}
                          {(group.actualStart || group.actualEnd) && (
                            <div className="flex justify-center space-x-6 text-sm text-gray-600">
                              {group.actualStart && (
                                <div className="flex items-center">
                                  <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                                  출근: {formatDateTime(group.actualStart).split(' ')[1]}
                                </div>
                              )}
                              {group.actualEnd && (
                                <div className="flex items-center">
                                  <XCircle className="h-4 w-4 mr-1 text-red-500" />
                                  퇴근: {formatDateTime(group.actualEnd).split(' ')[1]}
                                </div>
                              )}
                            </div>
                          )}
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
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">
                          {monthlyRecords.length}
                        </div>
                        <div className="text-sm text-gray-600">총 스케줄</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-green-600">
                          {monthlyRecords.filter(r => r.actual_start && r.actual_end).length}
                        </div>
                        <div className="text-sm text-gray-600">완료된 근무</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold text-orange-600">
                          {(() => {
                            const totalMinutes = monthlyRecords
                              .filter(r => r.actual_start && r.actual_end)
                              .reduce((total, r) => {
                                const start = new Date(r.actual_start!);
                                const end = new Date(r.actual_end!);
                                return total + (end.getTime() - start.getTime()) / (1000 * 60);
                              }, 0);
                            return Math.round(totalMinutes / 60);
                          })()}
                        </div>
                        <div className="text-sm text-gray-600">총 근무시간</div>
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
                              totalHours: 0
                            };
                          }
                          acc[date].totalSchedules++;
                          if (record.actual_start && record.actual_end) {
                            acc[date].completedSchedules++;
                            const start = new Date(record.actual_start);
                            const end = new Date(record.actual_end);
                            acc[date].totalHours += (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                          }
                          return acc;
                        }, {} as Record<string, { date: string; totalSchedules: number; completedSchedules: number; totalHours: number }>);
                        
                        return Object.values(dailySummary).map((summary) => (
                          <div key={summary.date} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                            <span className="font-medium text-gray-900">
                              {format(new Date(summary.date), 'MM/dd (EEE)', { locale: ko })}
                            </span>
                            <div className="flex items-center space-x-4 text-gray-600">
                              <span>{summary.completedSchedules}/{summary.totalSchedules}</span>
                              <span>{summary.totalHours.toFixed(1)}시간</span>
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
