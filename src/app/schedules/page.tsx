'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, Users, ChevronLeft, ChevronRight, Plus, List, CalendarDays, Grid, Settings, Repeat } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { auth, supabase } from '@/lib/supabase';
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay, parseISO, addWeeks, subWeeks, addMonths, subMonths, isAfter, isBefore, startOfDay, getWeek } from 'date-fns';
import { ko } from 'date-fns/locale';
import { mergeConsecutiveTimeSlots, generateTimeSlotsExcludingLunch, generateTimeSlotsIncludingLunch } from '@/lib/schedule-optimizer';

interface Schedule {
  id: string;
  employee_id: string;
  schedule_date: string;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  employee_note?: string;
  break_minutes?: number;
  total_hours?: number;
  created_at?: string;
  employee: {
    name: string;
    employee_id: string;
  };
}

interface TimeSlot {
  time: string;
  label: string;
  isLunch: boolean;
}

export default function SchedulesPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month' | 'list'>('week');
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showBulkInput, setShowBulkInput] = useState(false);
  const [bulkStartTime, setBulkStartTime] = useState('09:00');
  const [bulkEndTime, setBulkEndTime] = useState('19:00');
  const [bulkDays, setBulkDays] = useState<number[]>([]);
  const [excludeLunch, setExcludeLunch] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [autoApprove, setAutoApprove] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [showOnlyMySchedules, setShowOnlyMySchedules] = useState(false);

  // 리스트 보기에서 연도/월 변경 시 currentDate 업데이트
  const handleYearMonthChange = (year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);
    setCurrentDate(new Date(year, month - 1, 1)); // month는 0부터 시작하므로 -1
  };
  
  // 관리자 권한 확인
  const isAdmin = currentUser?.role?.name === 'admin';

  // 시간대 정의 (30분 단위, 18-19시까지 확장)
  const timeSlots: TimeSlot[] = [
    { time: '09:00', label: '9:00', isLunch: false },
    { time: '09:30', label: '9:30', isLunch: false },
    { time: '10:00', label: '10:00', isLunch: false },
    { time: '10:30', label: '10:30', isLunch: false },
    { time: '11:00', label: '11:00', isLunch: false },
    { time: '11:30', label: '11:30', isLunch: false },
    { time: '12:00', label: '12:00', isLunch: true },
    { time: '12:30', label: '12:30', isLunch: true },
    { time: '13:00', label: '13:00', isLunch: false },
    { time: '13:30', label: '13:30', isLunch: false },
    { time: '14:00', label: '14:00', isLunch: false },
    { time: '14:30', label: '14:30', isLunch: false },
    { time: '15:00', label: '15:00', isLunch: false },
    { time: '15:30', label: '15:30', isLunch: false },
    { time: '16:00', label: '16:00', isLunch: false },
    { time: '16:30', label: '16:30', isLunch: false },
    { time: '17:00', label: '17:00', isLunch: false },
    { time: '17:30', label: '17:30', isLunch: false },
    { time: '18:00', label: '18:00', isLunch: false },
    { time: '18:30', label: '18:30', isLunch: false },
    { time: '19:00', label: '19:00', isLunch: false },
  ];

  const weekDays = [
    { day: 0, label: '일', name: 'sunday' },
    { day: 1, label: '월', name: 'monday' },
    { day: 2, label: '화', name: 'tuesday' },
    { day: 3, label: '수', name: 'wednesday' },
    { day: 4, label: '목', name: 'thursday' },
    { day: 5, label: '금', name: 'friday' },
    { day: 6, label: '토', name: 'saturday' },
  ];

  useEffect(() => {
    const fetchUserAndSchedules = async () => {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setCurrentUser(user);
    };
    fetchUserAndSchedules();
  }, [router]);

  // currentUser가 설정된 후 스케줄 로딩
  useEffect(() => {
    if (currentUser?.employee_id) {
      fetchSchedules();
    }
  }, [currentUser]);

  // 리스트 뷰에서 연도/월이 변경될 때 스케줄 다시 가져오기
  useEffect(() => {
    if (currentUser?.employee_id && viewMode === 'list') {
      fetchSchedules();
    }
  }, [selectedYear, selectedMonth, viewMode, currentUser]);

  const getCurrentUser = async () => {
    try {
      // localStorage 기반 인증 사용
    if (typeof window !== 'undefined') {
      const isLoggedIn = localStorage.getItem('isLoggedIn');
      const employeeData = localStorage.getItem('currentEmployee');
      
      if (isLoggedIn === 'true' && employeeData) {
          const employee = JSON.parse(employeeData);
          console.log('✅ getCurrentUser - localStorage에서 사용자 정보 로드됨:', employee.name);
          return employee;
        }
      }
    } catch (error) {
      console.error('사용자 인증 오류:', error);
    }
    return null;
  };

  const fetchSchedules = async () => {
          if (!currentUser?.id) {
        console.log('사용자 정보가 없어서 스케줄을 가져올 수 없습니다.');
        return;
      }
    
    setLoading(true);
    
    try {
      let startDate, endDate;
      
      if (viewMode === 'week') {
        startDate = startOfWeek(currentDate, { locale: ko, weekStartsOn: 0 }); // 일요일부터 시작
        endDate = endOfWeek(currentDate, { locale: ko });
      } else if (viewMode === 'month') {
        startDate = startOfMonth(currentDate);
        endDate = endOfMonth(currentDate);
      } else {
        // 리스트 뷰: 선택된 연도/월의 해당 월 전체
        startDate = new Date(selectedYear, selectedMonth - 1, 1);
        endDate = new Date(selectedYear, selectedMonth, 0); // 해당 월의 마지막 날
      }

      const { data, error } = await supabase
        .from('schedules')
        .select(`
          *,
          employee:employees!schedules_employee_id_fkey(name, employee_id)
        `)
        .gte('schedule_date', format(startDate, 'yyyy-MM-dd'))
        .lte('schedule_date', format(endDate, 'yyyy-MM-dd'))
        .order('schedule_date', { ascending: true })
        .order('scheduled_start', { ascending: true });

      if (error) {
        console.error('Error fetching schedules:', error);
        setSchedules([]);
      } else {
        // 중복 제거 로직 추가
        const uniqueSchedules = new Map();
        
        (data || []).forEach(schedule => {
          // 중복 체크를 위한 고유 키 생성
          const uniqueKey = `${schedule.employee_id}_${schedule.schedule_date}_${schedule.scheduled_start}_${schedule.scheduled_end}`;
          
          if (!uniqueSchedules.has(uniqueKey)) {
            uniqueSchedules.set(uniqueKey, schedule);
          } else {
            // 중복 발견 시 더 최근에 생성된 것을 유지
            const existing = uniqueSchedules.get(uniqueKey);
            if (new Date(schedule.created_at) > new Date(existing.created_at)) {
              uniqueSchedules.set(uniqueKey, schedule);
            }
          }
        });
        
        // 클라이언트 사이드에서 시간순, 이름순으로 정렬
        const sortedSchedules = Array.from(uniqueSchedules.values()).sort((a, b) => {
          // 1순위: 날짜순
          if (a.schedule_date !== b.schedule_date) {
            return a.schedule_date.localeCompare(b.schedule_date);
          }
          // 2순위: 시작 시간순
          if (a.scheduled_start !== b.scheduled_start) {
            return a.scheduled_start.localeCompare(b.scheduled_start);
          }
          // 3순위: 이름순 (한글 가나다순)
          const nameA = a.employee?.name || '';
          const nameB = b.employee?.name || '';
          return nameA.localeCompare(nameB, 'ko');
        });
        
        console.log(`📊 중복 제거 후 스케줄 수: ${sortedSchedules.length}개 (원본: ${data?.length || 0}개)`);
        setSchedules(sortedSchedules);
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInView = () => {
    if (viewMode === 'week') {
      return Array.from({ length: 7 }).map((_, i) => addDays(startOfWeek(currentDate, { locale: ko, weekStartsOn: 0 }), i)); // 일요일부터 시작
    } else {
      // 월간 뷰: 해당 월의 첫 번째 날이 포함된 주의 시작부터 마지막 날이 포함된 주의 끝까지 표시
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      const calendarStart = startOfWeek(monthStart, { locale: ko, weekStartsOn: 0 }); // 해당 월의 첫 번째 날이 포함된 주의 일요일
      const calendarEnd = endOfWeek(monthEnd, { locale: ko, weekStartsOn: 0 }); // 해당 월의 마지막 날이 포함된 주의 토요일
      
      const days = [];
      let current = calendarStart;
      while (current <= calendarEnd) {
        days.push(current);
        current = addDays(current, 1);
      }
      return days;
    }
  };

  // 월간 뷰용 시간대별 색상 강도 계산 함수
  const getMonthlyColorIntensity = (scheduleCount: number, isLunch: boolean) => {
    if (scheduleCount === 0) {
      return isLunch ? 'bg-orange-50' : 'bg-transparent'; // 점심시간이거나 근무자가 없으면 투명
    }
    
    // 근무자 수에 따른 색상 강도
    if (scheduleCount === 1) return 'bg-blue-200';
    if (scheduleCount === 2) return 'bg-blue-300';
    if (scheduleCount === 3) return 'bg-blue-400';
    if (scheduleCount >= 4) return 'bg-blue-500';
    
    return 'bg-blue-200';
  };

  // 월간 뷰용 시간대별 스케줄 조회 함수
  const getSchedulesForDateAndTimeMonthly = (date: Date, timeSlot: TimeSlot) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const timeStr = timeSlot.time + ':00';
    
    console.log('🔍 getSchedulesForDateAndTimeMonthly 호출:', { dateStr, timeStr });
    
    return schedules.filter(schedule => {
      // 내 스케줄만 보기 필터 적용
      if (showOnlyMySchedules && schedule.employee_id !== currentUser?.id) {
        return false;
      }
      const scheduleDate = schedule.schedule_date;
      const startTime = schedule.scheduled_start;
      const endTime = schedule.scheduled_end;
      
      // 날짜가 일치하는지 확인
      if (scheduleDate !== dateStr) return false;
      
      // 시간 형식 정규화 (HH:MM 형식으로 변환)
      const normalizeTime = (timeStr: string) => {
        if (!timeStr) return null;
        
        // "09:00:00" -> "09:00", "09:00" -> "09:00"
        const match = timeStr.match(/^(\d{1,2}):(\d{2})/);
        if (match) {
          const hours = match[1].padStart(2, '0');
          const minutes = match[2];
          return `${hours}:${minutes}`;
        }
        return null;
      };
      
      const normalizedStart = normalizeTime(startTime);
      const normalizedEnd = normalizeTime(endTime);
      const normalizedSlot = normalizeTime(timeStr);
      
      if (!normalizedStart || !normalizedEnd || !normalizedSlot) {
        console.log('⚠️ 시간 형식 변환 실패:', { startTime, endTime, timeStr });
        return false;
      }
      
      // 해당 시간대에 근무 중인지 확인 (시간 범위 기반)
      const isInTimeSlot = normalizedStart <= normalizedSlot && normalizedEnd > normalizedSlot;
      
      console.log('⏰ 월간 뷰 시간 비교:', { 
        schedule: `${schedule.employee?.name} (${normalizedStart}-${normalizedEnd})`, 
        slotTime: normalizedSlot, 
        isInTimeSlot 
      });
      
      return isInTimeSlot;
    });
  };

  const getSchedulesForDateAndTime = (date: Date, timeSlot: TimeSlot) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const timeStr = timeSlot.time + ':00'; // HH:MM:SS 형식으로 맞춤
    
    console.log('🔍 getSchedulesForDateAndTime 호출:', { dateStr, timeStr });
    
    return schedules.filter(schedule => {
      // 내 스케줄만 보기 필터 적용
      if (showOnlyMySchedules && schedule.employee_id !== currentUser?.id) {
        return false;
      }
      const scheduleDate = schedule.schedule_date;
      const startTime = schedule.scheduled_start;
      const endTime = schedule.scheduled_end;
      
      // 날짜가 일치하는지 확인
      if (scheduleDate !== dateStr) return false;
      
      // 시간 형식 정규화 (HH:MM 형식으로 변환)
      const normalizeTime = (timeStr: string) => {
        if (!timeStr) return null;
        
        // "09:00:00" -> "09:00", "09:00" -> "09:00"
        const match = timeStr.match(/^(\d{1,2}):(\d{2})/);
        if (match) {
          const hours = match[1].padStart(2, '0');
          const minutes = match[2];
          return `${hours}:${minutes}`;
        }
        return null;
      };
      
      const normalizedStart = normalizeTime(startTime);
      const normalizedEnd = normalizeTime(endTime);
      const normalizedSlot = normalizeTime(timeStr);
      
      if (!normalizedStart || !normalizedEnd || !normalizedSlot) {
        console.log('⚠️ 시간 형식 변환 실패:', { startTime, endTime, timeStr });
        return false;
      }
      
      // 해당 시간대에 근무 중인지 확인 (시간 범위 기반)
      const isInTimeSlot = normalizedStart <= normalizedSlot && normalizedEnd > normalizedSlot;
      
      console.log('⏰ 시간 비교:', { 
        schedule: `${schedule.employee?.name} (${normalizedStart}-${normalizedEnd})`, 
        slotTime: normalizedSlot, 
        isInTimeSlot 
      });
      
      return isInTimeSlot;
    });
  };

  const getColorIntensity = (scheduleCount: number, isLunch: boolean, hasCurrentUser: boolean) => {
    if (scheduleCount === 0) {
      return isLunch ? 'bg-orange-50' : 'bg-gray-50';
    }
    
    // 근무자 수에 따른 색상 강도
    if (scheduleCount === 1) {
      return hasCurrentUser ? 'bg-blue-300' : 'bg-gray-300'; // 본인: 파란색, 다른 사람: 회색
    } else if (scheduleCount === 2) {
      return hasCurrentUser ? 'bg-blue-400' : 'bg-gray-400'; // 본인 포함: 진한 파란색, 다른 사람만: 진한 회색
    } else if (scheduleCount >= 3) {
      return hasCurrentUser ? 'bg-blue-500' : 'bg-gray-500'; // 본인 포함: 가장 진한 파란색, 다른 사람만: 가장 진한 회색
    }
    
    return 'bg-blue-300';
  };

  // 시간 경과 확인 (과거 시간인지)
  const isTimePassed = (date: Date, timeSlot: TimeSlot) => {
    const now = new Date();
    const targetDateTime = new Date(date);
    targetDateTime.setHours(parseInt(timeSlot.time.split(':')[0]), parseInt(timeSlot.time.split(':')[1]), 0, 0);
    
    return isBefore(targetDateTime, now);
  };

  // 권한 확인 (수정 가능한지) - 옵션 A: 역할별 세분화
  const canModifySchedule = (date: Date, timeSlot: TimeSlot, targetEmployeeId?: string) => {
    const isPassed = isTimePassed(date, timeSlot);
    const userRole = currentUser?.role?.name;
    const isOwnSchedule = !targetEmployeeId || targetEmployeeId === currentUser?.id;
    
    // 미래 시간은 모든 사용자가 본인 스케줄 수정 가능
    if (!isPassed && isOwnSchedule) return true;
    
    // 과거 시간 권한 체크
    if (userRole === 'admin') {
      // 총관리자: 모든 스케줄 수정 가능 (본인 + 타인, 과거 + 미래)
      return true;
    } else if (userRole === 'manager') {
      // 매니저: 본인 스케줄만 과거 수정 가능, 타인은 미래만
      if (isOwnSchedule) return true; // 본인 스케줄은 과거라도 수정 가능
      return !isPassed; // 타인 스케줄은 미래만
    } else {
      // 일반 직원: 본인 스케줄의 미래 시간만 수정 가능
      return !isPassed && isOwnSchedule;
    }
  };

  // 스케줄 수정 함수
  const handleEditSchedule = (schedule: Schedule) => {
    const scheduleDate = new Date(schedule.schedule_date);
    const isPassed = isTimePassed(scheduleDate, { time: schedule.scheduled_start, label: '', isLunch: false });
    const userRole = currentUser?.role?.name;
    
    // 권한 체크 
    if (userRole === 'admin') {
      // 관리자는 모든 스케줄 수정 가능
    } else if (userRole === 'manager') {
      // 매니저는 본인 스케줄만 수정 가능
    } else {
      // 일반 직원은 미래 스케줄만 수정 가능
      if (isPassed) {
        alert('과거 스케줄은 수정할 수 없습니다.');
        return;
      }
    }
    
    // 수정 모달 또는 페이지로 이동
    const editData = {
      id: schedule.id,
      date: schedule.schedule_date,
      startTime: schedule.scheduled_start,
      endTime: schedule.scheduled_end,
      note: schedule.employee_note || '',
      status: schedule.status
    };
    
    // URL 파라미터로 수정 데이터 전달
    const params = new URLSearchParams(editData);
    router.push(`/schedules/edit?${params.toString()}`);
  };

  // 스케줄 삭제 함수
  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm('정말로 이 스케줄을 삭제하시겠습니까?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', scheduleId);
      
      if (error) {
        console.error('스케줄 삭제 실패:', error);
        alert('스케줄 삭제에 실패했습니다.');
        return;
      }
      
      // 스케줄 목록 새로고침
      await fetchSchedules();
      alert('스케줄이 삭제되었습니다.');
    } catch (error) {
      console.error('스케줄 삭제 오류:', error);
      alert('스케줄 삭제 중 오류가 발생했습니다.');
    }
  };

  // 스케줄 토글 (클릭 시)
  const toggleSchedule = async (date: Date, timeSlot: TimeSlot) => {
    // 중복 클릭 방지
    if (updating) {
      console.log('이미 처리 중입니다.');
      return;
    }

    if (!currentUser?.id) {
      alert('로그인이 필요합니다.');
      return;
    }

    const dateStr = format(date, 'yyyy-MM-dd');
    const timeStr = timeSlot.time + ':00'; // HH:MM:SS 형식으로 변경
    const existingSchedules = getSchedulesForDateAndTime(date, timeSlot);
            const mySchedule = existingSchedules.find(s => s.employee_id === currentUser.id);
    
    // 권한 체크
    if (!canModifySchedule(date, timeSlot)) {
      const userRole = currentUser?.role?.name;
      if (userRole === 'admin') {
        // 관리자는 모든 권한이 있으므로 이 경우는 없어야 함
        alert('알 수 없는 오류가 발생했습니다.');
      } else if (userRole === 'manager') {
        alert('매니저는 본인 스케줄만 과거 시간을 수정할 수 있습니다.');
      } else {
        alert('과거 시간은 수정할 수 없습니다.');
      }
      return;
    }
    
    const updateKey = `${dateStr}-${timeSlot.time}`;
    setUpdating(updateKey);

    try {
      if (mySchedule) {
        // 기존 스케줄 삭제
        console.log('스케줄 삭제 시작:', mySchedule.id);
        const { error } = await supabase
          .from('schedules')
          .delete()
          .eq('id', mySchedule.id);

        if (error) {
          console.error('Delete error:', error);
          throw error;
        }
        console.log('스케줄 삭제 완료:', mySchedule.id);
      } else {
        // 새 스케줄 추가 - 정확히 해당 시간에 30분 스케줄 생성
        const [startHour, startMinute] = timeSlot.time.split(':').map(Number);
        let endHour = startHour;
        let endMinute = startMinute + 30;
        
        if (endMinute >= 60) {
          endHour += 1;
          endMinute = 0;
        }
        
        const endTimeStr = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}:00`;
        
        const scheduleData = {
          employee_id: currentUser.id,
          schedule_date: dateStr,
          scheduled_start: timeStr, // 예: "11:00:00"
          scheduled_end: endTimeStr, // 예: "12:00:00"
          status: 'approved',
          employee_note: '클릭으로 추가됨'
        };

        console.log('스케줄 추가 시작:', scheduleData);

        const { data, error } = await supabase
          .from('schedules')
          .upsert(scheduleData, {
            onConflict: 'employee_id,schedule_date,scheduled_start'
          })
          .select();

        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
        console.log('스케줄 추가 완료:', data);
      }

      // 스케줄 다시 불러오기
      await fetchSchedules();
    } catch (error: any) {
      console.error('스케줄 토글 오류:', error);
      alert(`스케줄 수정에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setUpdating(null);
    }
  };

  // 일괄 스케줄 추가
  const addBulkSchedules = async () => {
    if (!currentUser?.id) {
      alert('로그인이 필요합니다.');
      return;
    }

    if (bulkDays.length === 0) {
      alert('요일을 선택해주세요.');
      return;
    }

    setUpdating('bulk');

    try {
      const weekStart = startOfWeek(currentDate, { locale: ko, weekStartsOn: 0 }); // 일요일부터 시작
      const schedulesToAdd: any[] = [];

      // 선택된 시간 범위를 30분 단위로 분할
      const [startHour, startMinute] = bulkStartTime.split(':').map(Number);
      const [endHour, endMinute] = bulkEndTime.split(':').map(Number);
      
      // 선택된 요일들에 대해 최적화된 스케줄 생성
      console.log('🔍 개인 스케줄 일괄 입력 디버깅:', { 
        weekStart: format(weekStart, 'yyyy-MM-dd (EEE)', { locale: ko }),
        bulkDays,
        currentDate: format(currentDate, 'yyyy-MM-dd (EEE)', { locale: ko })
      });
      
      for (let i = 0; i < 7; i++) {
        const day = addDays(weekStart, i);
        const dayOfWeek = day.getDay();
        
        console.log(`📅 ${i}일차: ${format(day, 'yyyy-MM-dd (EEE)', { locale: ko })} - 요일번호: ${dayOfWeek} - 선택됨: ${bulkDays.includes(dayOfWeek)}`);
        
        if (bulkDays.includes(dayOfWeek)) {
          // 30분 단위 시간 슬롯 생성 (점심시간 옵션에 따라)
          const timeSlots = excludeLunch ? 
            generateTimeSlotsExcludingLunch(bulkStartTime, bulkEndTime, '12:00', '13:00', 30) :
            generateTimeSlotsIncludingLunch(bulkStartTime, bulkEndTime, 30);
          
          // 연속된 시간대로 합치기
          const optimizedSchedules = mergeConsecutiveTimeSlots(timeSlots, '12:00', '13:00', excludeLunch);
          
          // 데이터베이스 저장용 객체 생성
          optimizedSchedules.forEach(optimizedSchedule => {
            schedulesToAdd.push({
              employee_id: currentUser.id,
              schedule_date: format(day, 'yyyy-MM-dd'),
              scheduled_start: optimizedSchedule.start + ':00',
              scheduled_end: optimizedSchedule.end + ':00',
              break_minutes: optimizedSchedule.break_minutes,
              total_hours: optimizedSchedule.total_hours,
              status: (isAdmin && autoApprove) ? 'approved' : 'pending',
              employee_note: optimizedSchedule.employee_note || `일괄 입력 (${excludeLunch ? '점심시간 제외' : '점심시간 포함'})${(isAdmin && autoApprove) ? ' - 자동승인' : ''}`
            });
          });
        }
      }

      console.log('일괄 스케줄 추가 데이터:', schedulesToAdd);

      // 기존 스케줄 삭제 (선택된 요일들 전체)
      const uniqueDates = [...new Set(schedulesToAdd.map(s => s.schedule_date))];
      console.log(`🗑️ 삭제할 날짜들: ${uniqueDates.join(', ')}`);
      
      const deletePromises = uniqueDates.map(date => 
        supabase
          .from('schedules')
          .delete()
          .eq('employee_id', currentUser.id)
          .eq('schedule_date', date)
      );

      const deleteResults = await Promise.all(deletePromises);
      const deleteErrors = deleteResults.filter(result => result.error);
      
      if (deleteErrors.length > 0) {
        console.error('기존 스케줄 삭제 오류:', deleteErrors);
      } else {
        console.log(`✅ ${uniqueDates.length}개 날짜의 기존 스케줄 삭제 완료`);
      }

      // 새 스케줄 추가
      if (schedulesToAdd.length > 0) {
        const { data, error: insertError } = await supabase
          .from('schedules')
          .insert(schedulesToAdd)
          .select();

        if (insertError) {
          console.error('일괄 스케줄 추가 오류:', insertError);
          throw insertError;
        }
        console.log('일괄 스케줄 추가 완료:', data);
      }

      await fetchSchedules();
      setShowBulkInput(false);
      setBulkDays([]);
      alert(`일괄 스케줄이 성공적으로 추가되었습니다. (${schedulesToAdd.length}개 30분 단위)`);
    } catch (error: any) {
      console.error('일괄 스케줄 추가 오류:', error);
      alert(`일괄 스케줄 추가에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setUpdating(null);
    }
  };

  const handlePrevPeriod = () => {
    if (viewMode === 'week') {
      setCurrentDate(subWeeks(currentDate, 1));
    } else {
      setCurrentDate(subMonths(currentDate, 1));
    }
  };

  const handleNextPeriod = () => {
    if (viewMode === 'week') {
      setCurrentDate(addWeeks(currentDate, 1));
    } else {
      setCurrentDate(addMonths(currentDate, 1));
    }
  };

  const handleAddSchedule = () => {
    router.push('/schedules/add');
  };

  const toggleBulkDay = (day: number) => {
    setBulkDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  // 주차 계산
  const getWeekNumber = (date: Date) => {
    return getWeek(date, { locale: ko });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-1 sm:p-2">
      <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg p-2 sm:p-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="p-2 rounded-full hover:bg-gray-200 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-700" />
            </button>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
              <Calendar className="h-5 w-5 sm:h-6 sm:w-6 mr-1 sm:mr-2 text-blue-600" />
            근무 스케줄
          </h1>
          </div>
          
          <div className="flex space-x-2">
            <button
              onClick={() => setShowBulkInput(!showBulkInput)}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-1.5 px-3 sm:py-2 sm:px-4 rounded-lg shadow-md flex items-center transition-all duration-200 transform hover:scale-105 text-sm"
            >
              <Repeat className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              일괄입력
            </button>
          <button
            onClick={() => router.push('/schedules/add')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3 sm:py-2 sm:px-4 rounded-lg shadow-md flex items-center transition-all duration-200 transform hover:scale-105 text-sm"
          >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              상세 추가
          </button>
          </div>
        </div>

        {/* 일괄 입력 모달 */}
        {showBulkInput && (
          <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <h3 className="text-sm font-semibold text-green-800 mb-2 flex items-center">
              <Repeat className="h-4 w-4 mr-1" />
              일괄 스케줄 입력 (30분 단위로 자동 분할)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">시작 시간</label>
                <input
                  type="time"
                  value={bulkStartTime}
                  onChange={(e) => setBulkStartTime(e.target.value)}
                  className="w-full p-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">종료 시간</label>
                <input
                  type="time"
                  value={bulkEndTime}
                  onChange={(e) => setBulkEndTime(e.target.value)}
                  className="w-full p-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">요일 선택</label>
                <div className="flex flex-wrap gap-1">
                  {weekDays.map(day => (
                    <button
                      key={day.day}
                      onClick={() => toggleBulkDay(day.day)}
                      className={`px-2 py-1 text-xs rounded ${
                        bulkDays.includes(day.day)
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={excludeLunch}
                    onChange={(e) => setExcludeLunch(e.target.checked)}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-xs text-gray-700">
                    점심시간(12:00-13:00) 제외
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  {excludeLunch ? '점심시간을 제외하고 근무시간을 계산합니다' : '점심시간을 포함하여 근무시간을 계산합니다'}
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-3">
              <button
                onClick={() => setShowBulkInput(false)}
                className="px-3 py-1 text-xs bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                취소
              </button>
              <button
                onClick={addBulkSchedules}
                disabled={updating === 'bulk'}
                className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {updating === 'bulk' ? '처리중...' : '적용'}
              </button>
            </div>
          </div>
        )}

        {/* 기간 네비게이션 */}
        <div className="flex items-center justify-between mb-2 sm:mb-3 bg-gray-50 p-1.5 sm:p-2 rounded-lg">
          <button 
            onClick={handlePrevPeriod} 
            className="p-1 rounded-full hover:bg-gray-200 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
          </button>
          
          {viewMode !== 'list' && (
            <div className="flex items-center space-x-2 sm:space-x-3">
              <h2 className="text-sm sm:text-base font-semibold text-gray-800">
                {viewMode === 'week' 
                  ? `${format(startOfWeek(currentDate, { locale: ko, weekStartsOn: 0 }), 'MM/dd', { locale: ko })} - ${format(endOfWeek(currentDate, { locale: ko }), 'MM/dd', { locale: ko })} (${getWeekNumber(currentDate)}주차)`
                  : `${format(currentDate, 'yyyy년 MM월', { locale: ko })}`
                }
          </h2>
              
              {/* 오늘로 가기 버튼 */}
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1.5 text-gray-600 hover:text-gray-800 text-sm font-medium border border-gray-200 hover:border-gray-300 rounded-md hover:bg-gray-50 transition-all duration-200"
                title="오늘 날짜로 이동"
              >
                오늘
              </button>
            </div>
          )}
          
          <button 
            onClick={handleNextPeriod} 
            className="p-1 rounded-full hover:bg-gray-200 transition-colors"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
          </button>
        </div>

        {/* 자동 승인 설정 (관리자만) */}
        {isAdmin && (
          <div className="mb-2 sm:mb-3 p-2 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="autoApprove"
                checked={autoApprove}
                onChange={(e) => setAutoApprove(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="autoApprove" className="text-sm font-medium text-gray-700">
                자동 승인 (스케줄 추가 시 즉시 승인됨)
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {autoApprove ? '✅ 모든 새 스케줄이 자동으로 승인됩니다' : '⚠️ 새 스케줄은 수동 승인이 필요합니다'}
            </p>
          </div>
        )}

        {/* 뷰 모드 토글 */}
        <div className="flex justify-center mb-2 sm:mb-3">
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setViewMode('week')}
              className={`px-2 py-1 sm:px-3 sm:py-1 rounded-md transition-all duration-200 text-xs sm:text-sm ${
                viewMode === 'week' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              주간
            </button>
            <button
              onClick={() => setViewMode('month')}
              className={`px-2 py-1 sm:px-3 sm:py-1 rounded-md transition-all duration-200 text-xs sm:text-sm ${
                viewMode === 'month' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              월간
            </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`px-2 py-1 sm:px-3 sm:py-1 rounded-md transition-all duration-200 text-xs sm:text-sm ${
                        viewMode === 'list' 
                          ? 'bg-white text-blue-600 shadow-sm' 
                          : 'text-gray-600 hover:text-gray-800'
                      }`}
                    >
                      월간 리스트
            </button>
          </div>
        </div>

        {/* 내 스케줄만 보기 필터 (주간/월간 화면용) */}
        {viewMode !== 'list' && (
          <div className="flex justify-center mb-2 sm:mb-3">
            <div className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
              <input
                type="checkbox"
                id="showOnlyMySchedulesMain"
                checked={showOnlyMySchedules}
                onChange={(e) => setShowOnlyMySchedules(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="showOnlyMySchedulesMain" className="text-sm font-medium text-gray-700">
                내 스케줄만 보기
              </label>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-4 sm:py-6">
            <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600 text-xs sm:text-sm">로딩 중...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {viewMode === 'week' ? (
              // 주간 상세 뷰 (클릭 가능)
              <div className="min-w-[400px] sm:min-w-[500px]">
                {/* 요일 헤더 */}
                <div className="grid grid-cols-8 gap-0.5 sm:gap-1 mb-0.5 sm:mb-1">
                  <div className="p-0.5 sm:p-1 text-xs font-medium text-gray-600 text-center">시간</div>
                  {getDaysInView().map(date => (
                    <div key={format(date, 'yyyy-MM-dd')} className="p-0.5 sm:p-1 text-xs font-medium text-gray-600 text-center">
                      <div className="text-xs">{format(date, 'EEE', { locale: ko })}</div>
                      <div className={`text-xs sm:text-sm font-bold ${isSameDay(date, new Date()) ? 'text-blue-600' : 'text-gray-800'}`}>
                        {format(date, 'd')}
                      </div>
                  </div>
                ))}
                </div>

                {/* 시간대별 스케줄 (클릭 가능) */}
                {timeSlots.map((timeSlot, index) => (
                  <div key={timeSlot.time} className="grid grid-cols-8 gap-0.5 sm:gap-1 mb-0.5" style={{ isolation: 'isolate' }}>
                    <div className={`p-0.5 sm:p-1 text-xs font-medium text-center ${timeSlot.isLunch ? 'text-orange-600' : 'text-gray-600'}`}>
                      {timeSlot.label}
                    </div>
                    {getDaysInView().map(date => {
                      const daySchedules = getSchedulesForDateAndTime(date, timeSlot);
                      const isCurrentUser = daySchedules.some(s => s.employee_id === currentUser?.id);
                      const colorClass = getColorIntensity(daySchedules.length, timeSlot.isLunch, isCurrentUser);
                      const canModify = canModifySchedule(date, timeSlot);
                      const isUpdating = updating === `${format(date, 'yyyy-MM-dd')}-${timeSlot.time}`;
                      
                      return (
                        <div
                          key={`${format(date, 'yyyy-MM-dd')}-${timeSlot.time}`}
                          className="relative flex items-center justify-center"
                          style={{ 
                            pointerEvents: canModify ? 'auto' : 'none',
                            userSelect: 'none',
                            minHeight: '1rem'
                          }}
                        >
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              toggleSchedule(date, timeSlot);
                            }}
                            disabled={!canModify || isUpdating}
                            title={`${timeSlot.time} - ${daySchedules.length}명 근무 ${isCurrentUser ? '(나 포함)' : ''} ${canModify ? '클릭으로 수정' : '수정 불가'}`}
                            className={`w-full h-4 sm:h-5 ${colorClass} rounded-sm transition-all duration-200 ${
                              isCurrentUser ? 'ring-1 ring-blue-500' : ''
                            } ${
                              canModify 
                                ? 'hover:opacity-80 cursor-pointer hover:scale-105' 
                                : 'cursor-not-allowed opacity-60'
                            } ${
                              isUpdating ? 'animate-pulse' : ''
                            } relative group`}
                            style={{ 
                              pointerEvents: canModify ? 'auto' : 'none',
                              userSelect: 'none',
                              position: 'relative',
                              zIndex: 10,
                              touchAction: 'manipulation'
                            }}
                          >
                            {/* 스케줄 개수 표시 (데스크톱에서만) */}
                            {daySchedules.length > 0 && (
                              <span className="hidden sm:block absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-sm">
                                {daySchedules.length}
                              </span>
                            )}
                            
                            {/* 호버 시 상세 정보 툴팁 */}
                            <div className="hidden group-hover:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-1 z-20">
                              <div className="bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                {timeSlot.time} ({daySchedules.length}명)
                                {isCurrentUser && <div className="text-blue-300">나 포함</div>}
                                {daySchedules.length > 0 && (
                                  <div className="text-gray-300">
                                    {daySchedules.slice(0, 2).map(s => 
                                      s.employee_id === currentUser?.id 
                                        ? `${s.employee?.name || '나'} (나)`
                                        : s.employee?.name || s.employee?.employee_id || 'Unknown'
                                    ).join(', ')}
                                    {daySchedules.length > 2 && ` +${daySchedules.length - 2}명`}
                                  </div>
                                )}
                              </div>
                            </div>
                          </button>
                      </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            ) : viewMode === 'month' ? (
              // 월간 요약 뷰 (시간별 구분 추가)
              <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
                {/* 요일 헤더 */}
                {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                  <div key={day} className="p-0.5 sm:p-1 text-xs font-medium text-gray-600 text-center">
                    {day}
                  </div>
                ))}
                
                {/* 날짜별 시간대별 구분 */}
                {getDaysInView().map(date => {
                  return (
                  <div
                    key={format(date, 'yyyy-MM-dd')}
                      className={`aspect-square rounded-md sm:rounded-lg transition-all duration-200 relative ${
                      isSameDay(date, new Date()) 
                          ? 'ring-2 ring-blue-500' 
                          : ''
                      } bg-white border border-gray-200`}
                    >
                      {/* 일자 표시 */}
                      <div className={`absolute top-1 left-1 text-xs font-medium z-10 ${
                        isSameDay(date, new Date()) 
                          ? 'text-blue-600' 
                          : 'text-gray-600'
                      }`}>
                      {format(date, 'd')}
                    </div>
                      
                      {/* 시간대별 구분 */}
                      <div className="absolute inset-0 flex flex-col">
                        {timeSlots.map((timeSlot, index) => {
                          const daySchedules = getSchedulesForDateAndTimeMonthly(date, timeSlot);
                          const scheduleCount = daySchedules.length;
                          const colorClass = getMonthlyColorIntensity(scheduleCount, timeSlot.isLunch);
                          const segmentHeight = `${100 / timeSlots.length}%`;
                          
                          return (
                            <div
                              key={`${format(date, 'yyyy-MM-dd')}-${timeSlot.time}`}
                              className={`${colorClass} transition-all duration-200`}
                              style={{ 
                                height: segmentHeight,
                                borderBottom: index < timeSlots.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none'
                              }}
                              title={`${timeSlot.time} - ${scheduleCount}명 근무`}
                            />
                          );
                        })}
                      </div>
                  </div>
                  );
                })}
              </div>
            ) : (
              // 리스트 뷰
              <div className="space-y-2">
                {/* 월별 서머리 및 연도/월 선택 */}
                <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium text-gray-700">연도:</label>
                        <select
                          value={selectedYear}
                          onChange={(e) => handleYearMonthChange(parseInt(e.target.value), selectedMonth)}
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {Array.from({ length: 5 }, (_, i) => {
                            const year = new Date().getFullYear() - 2 + i;
                            return (
                              <option key={year} value={year}>
                                {year}년
                              </option>
                            );
                          })}
                        </select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <label className="text-sm font-medium text-gray-700">월:</label>
                        <select
                          value={selectedMonth}
                          onChange={(e) => handleYearMonthChange(selectedYear, parseInt(e.target.value))}
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                              {i + 1}월
                            </option>
                          ))}
                        </select>
                      </div>
                      {/* 개인 스케줄 필터 */}
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="showOnlyMySchedules"
                          checked={showOnlyMySchedules}
                          onChange={(e) => setShowOnlyMySchedules(e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <label htmlFor="showOnlyMySchedules" className="text-sm font-medium text-gray-700">
                          내 스케줄만 보기
                        </label>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-blue-800">
                        {selectedYear}년 {selectedMonth}월
                        {showOnlyMySchedules && <span className="text-sm text-blue-600 ml-2">(내 스케줄만)</span>}
                      </div>
                      <div className="text-sm text-blue-600">
                        총 근무예정시간: {schedules.reduce((total, schedule) => {
                          const start = new Date(`${schedule.schedule_date} ${schedule.scheduled_start}`);
                          const end = new Date(`${schedule.schedule_date} ${schedule.scheduled_end}`);
                          const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                          const breakHours = (schedule.break_minutes || 0) / 60;
                          return total + (hours - breakHours);
                        }, 0).toFixed(1)}시간
                      </div>
                    </div>
                  </div>
                </div>
                
                {schedules.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                    <p>등록된 스케줄이 없습니다</p>
                  </div>
                ) : (
                  schedules
                    .filter(schedule => !showOnlyMySchedules || schedule.employee_id === currentUser?.id)
                    .sort((a, b) => new Date(a.schedule_date).getTime() - new Date(b.schedule_date).getTime())
                    .map((schedule, index) => (
                      <div
                        key={`${schedule.id}-${index}`}
                        className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium text-gray-900">
                                {/* 직원 이름 표시 */}
                                <span className={`inline-block px-2 py-1 text-xs rounded-full mr-2 ${
                                  schedule.employee_id === currentUser?.id 
                                    ? 'bg-blue-100 text-blue-800 font-semibold' 
                                    : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {schedule.employee?.name || schedule.employee?.employee_id || '알 수 없음'}
                                  {schedule.employee_id === currentUser?.id && ' (나)'}
                                </span>
                                {format(new Date(schedule.schedule_date), 'MM월 dd일 (EEE)', { locale: ko })} {schedule.scheduled_start} - {schedule.scheduled_end}
                                {schedule.employee_note && (
                                  <span className="ml-2 text-gray-500">• {schedule.employee_note}</span>
                                )}
                                {/* 디버깅용 ID 표시 (개발 모드에서만) */}
                                {process.env.NODE_ENV === 'development' && (
                                  <span className="ml-2 text-xs text-gray-400">ID: {schedule.id.substring(0, 8)}</span>
                                )}
                            </div>
                              <div className="flex items-center gap-2">
                                <div className={`px-2 py-1 text-xs rounded-full ${
                                schedule.status === 'approved' 
                                  ? 'bg-green-100 text-green-800' 
                                    : schedule.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-800'
                                    : schedule.status === 'completed'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-red-100 text-red-800'
                                }`}>
                                  {schedule.status === 'approved' ? '승인' : 
                                   schedule.status === 'pending' ? '대기' : 
                                   schedule.status === 'completed' ? '완료' : '취소'}
                                </div>
                                {/* 수정/삭제 버튼 (본인 스케줄만) */}
                                {schedule.employee_id === currentUser?.id && (
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => handleEditSchedule(schedule)}
                                      className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors"
                                      title="스케줄 수정"
                                    >
                                      수정
                                    </button>
                                    <button
                                      onClick={() => handleDeleteSchedule(schedule.id)}
                                      className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200 transition-colors"
                                      title="스케줄 삭제"
                                    >
                                      삭제
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                  </div>
                        </div>
                      </div>
                    ))
                )}
              </div>
            )}
          </div>
        )}

        {/* 개선된 범례 */}
        <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
          <div className="flex flex-wrap gap-2 sm:gap-3 text-xs">
            {viewMode === 'week' ? (
              <>
                <div className="flex items-center">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gray-300 rounded mr-1"></div>
                  <span>다른사람</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-300 rounded mr-1 ring-1 ring-blue-500"></div>
                  <span>나 포함</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-orange-50 rounded mr-1"></div>
                  <span>점심</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-gray-50 rounded mr-1"></div>
                  <span>없음</span>
                </div>
              </>
            ) : viewMode === 'month' ? (
              <>
                <div className="flex items-center">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-200 rounded mr-1"></div>
                  <span>1명</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-300 rounded mr-1"></div>
                  <span>2명</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-400 rounded mr-1"></div>
                  <span>3명</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-500 rounded mr-1"></div>
                  <span>4명+</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-orange-50 rounded mr-1"></div>
                  <span>점심</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-transparent border border-gray-200 rounded mr-1"></div>
                  <span>없음</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-100 rounded mr-1"></div>
                  <span>승인</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-yellow-100 rounded mr-1"></div>
                  <span>대기</span>
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-100 rounded mr-1"></div>
                  <span>취소</span>
                </div>
              </>
            )}
            {/* 권한별 설명 */}
            <div className="ml-4 flex flex-wrap gap-2 text-xs text-gray-600">
              {currentUser?.role?.name === 'admin' && (
                <span className="px-2 py-1 bg-red-100 text-red-700 rounded">관리자: 모든 스케줄 수정 가능</span>
              )}
              {currentUser?.role?.name === 'manager' && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded">매니저: 본인 과거 스케줄 수정 가능</span>
              )}
              {currentUser?.role?.name === 'employee' && (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">직원: 미래 스케줄만 수정 가능</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}