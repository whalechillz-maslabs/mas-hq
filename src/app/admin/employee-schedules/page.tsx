'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, Users, ChevronLeft, ChevronRight, Plus, List, CalendarDays, Grid, Settings, Repeat, Search, User, Building, X, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { auth, supabase } from '@/lib/supabase';
import { format, addDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isSameDay, parseISO, addWeeks, subWeeks, addMonths, subMonths, isAfter, isBefore, startOfDay, getWeek } from 'date-fns';
import { ko } from 'date-fns/locale';
import { mergeConsecutiveTimeSlots, generateTimeSlotsExcludingLunch, generateTimeSlotsIncludingLunch } from '@/lib/schedule-optimizer';

interface Employee {
  id: string;
  name: string;
  employee_id: string;
  role?: {
    name: string;
  };
}

interface Schedule {
  id: string;
  employee_id: string;
  schedule_date: string;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  employee_note?: string;
  total_hours?: number;
  break_minutes?: number;
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

export default function EmployeeSchedulesPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month' | 'list'>('week');
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showBulkInput, setShowBulkInput] = useState(false);
  const [bulkStartTime, setBulkStartTime] = useState('09:00');
  const [bulkEndTime, setBulkEndTime] = useState('19:00');
  const [bulkDays, setBulkDays] = useState<number[]>([]);
  const [excludeLunch, setExcludeLunch] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [autoApprove, setAutoApprove] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);

  // 리스트 보기에서 연도/월 변경 시 currentDate 업데이트
  const handleYearMonthChange = (year: number, month: number) => {
    setSelectedYear(year);
    setSelectedMonth(month);
    setCurrentDate(new Date(year, month - 1, 1)); // month는 0부터 시작하므로 -1
  };

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
    const fetchUserAndData = async () => {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setCurrentUser(user);
      await loadEmployees();
    };
    fetchUserAndData();
  }, [router]);

  // 리스트 뷰에서 연도/월이 변경될 때 스케줄 다시 가져오기
  useEffect(() => {
    if (selectedEmployee && viewMode === 'list') {
      fetchSchedules();
    }
  }, [selectedYear, selectedMonth, viewMode, selectedEmployee]);

  // selectedEmployee가 설정된 후 스케줄 로딩
  useEffect(() => {
    if (selectedEmployee) {
      fetchSchedules();
    }
  }, [selectedEmployee, currentDate, viewMode]);

  const getCurrentUser = async () => {
    try {
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

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name');

      if (error) {
        console.error('직원 목록 로드 실패:', error);
        return;
      }

      setEmployees(data || []);
    } catch (error) {
      console.error('직원 목록 로드 실패:', error);
    }
  };

  const fetchSchedules = async () => {
    if (!selectedEmployee?.id) {
      console.log('선택된 직원이 없어서 스케줄을 가져올 수 없습니다.');
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
        .eq('employee_id', selectedEmployee.id)
        .gte('schedule_date', format(startDate, 'yyyy-MM-dd'))
        .lte('schedule_date', format(endDate, 'yyyy-MM-dd'))
        .order('schedule_date', { ascending: true })
        .order('scheduled_start', { ascending: true });

      if (error) {
        console.error('Error fetching schedules:', error);
        setSchedules([]);
      } else {
        setSchedules(data || []);
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
      // 월간 뷰: 해당 월의 모든 날짜 표시
      const start = startOfMonth(currentDate);
      const end = endOfMonth(currentDate);
      const days = [];
      let current = start;
      while (current <= end) {
        days.push(current);
        current = addDays(current, 1);
      }
      return days;
    }
  };

  // 월간 뷰용 시간대별 색상 강도 계산 함수
  const getMonthlyColorIntensity = (scheduleCount: number, isLunch: boolean) => {
    if (scheduleCount === 0) {
      return isLunch ? 'bg-orange-50' : 'bg-transparent';
    }
    
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
    
    return schedules.filter(schedule => {
      const scheduleDate = schedule.schedule_date;
      const startTime = schedule.scheduled_start;
      const endTime = schedule.scheduled_end;
      
      if (scheduleDate !== dateStr) return false;
      
      const normalizeTime = (timeStr: string) => {
        if (!timeStr) return null;
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
        return false;
      }
      
      return normalizedStart <= normalizedSlot && normalizedEnd > normalizedSlot;
    });
  };

  const getSchedulesForDateAndTime = (date: Date, timeSlot: TimeSlot) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const timeStr = timeSlot.time + ':00';
    
    return schedules.filter(schedule => {
      const scheduleDate = schedule.schedule_date;
      const startTime = schedule.scheduled_start;
      const endTime = schedule.scheduled_end;
      
      if (scheduleDate !== dateStr) return false;
      
      const normalizeTime = (timeStr: string) => {
        if (!timeStr) return null;
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
        return false;
      }
      
      return normalizedStart <= normalizedSlot && normalizedEnd > normalizedSlot;
    });
  };

  const getColorIntensity = (scheduleCount: number, isLunch: boolean) => {
    if (scheduleCount === 0) {
      return isLunch ? 'bg-orange-50' : 'bg-gray-50';
    }
    
    if (scheduleCount === 1) return 'bg-blue-300';
    else if (scheduleCount === 2) return 'bg-blue-400';
    else if (scheduleCount >= 3) return 'bg-blue-500';
    
    return 'bg-blue-300';
  };

  // 시간 경과 확인 (과거 시간인지)
  const isTimePassed = (date: Date, timeSlot: TimeSlot) => {
    const now = new Date();
    const targetDateTime = new Date(date);
    targetDateTime.setHours(parseInt(timeSlot.time.split(':')[0]), parseInt(timeSlot.time.split(':')[1]), 0, 0);
    
    return isBefore(targetDateTime, now);
  };

  // 관리자 페이지에서는 모든 스케줄 수정 가능
  const canModifySchedule = (date: Date, timeSlot: TimeSlot) => {
    return true; // 관리자 페이지에서는 모든 스케줄 수정 가능
  };

  // 스케줄 토글 (클릭 시)
  const toggleSchedule = async (date: Date, timeSlot: TimeSlot) => {
    if (updating) {
      console.log('이미 처리 중입니다.');
      return;
    }

    if (!selectedEmployee?.id) {
      alert('직원을 선택해주세요.');
      return;
    }

    const dateStr = format(date, 'yyyy-MM-dd');
    const timeStr = timeSlot.time + ':00';
    const existingSchedules = getSchedulesForDateAndTime(date, timeSlot);
    const mySchedule = existingSchedules.find(s => s.employee_id === selectedEmployee.id);
    
    if (!canModifySchedule(date, timeSlot)) {
      alert('스케줄을 수정할 수 없습니다.');
      return;
    }
    
    const updateKey = `${dateStr}-${timeSlot.time}`;
    setUpdating(updateKey);

    try {
      if (mySchedule) {
        // 기존 스케줄 삭제
        const { error } = await supabase
          .from('schedules')
          .delete()
          .eq('id', mySchedule.id);

        if (error) {
          console.error('Delete error:', error);
          throw error;
        }
      } else {
        // 새 스케줄 추가
        const [startHour, startMinute] = timeSlot.time.split(':').map(Number);
        let endHour = startHour;
        let endMinute = startMinute + 30;
        
        if (endMinute >= 60) {
          endHour += 1;
          endMinute = 0;
        }
        
        const endTimeStr = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}:00`;
        
        const scheduleData = {
          employee_id: selectedEmployee.id,
          schedule_date: dateStr,
          scheduled_start: timeStr,
          scheduled_end: endTimeStr,
          status: autoApprove ? 'approved' : 'pending',
          employee_note: autoApprove ? '관리자가 추가함 (자동승인)' : '관리자가 추가함'
        };

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
      }

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
    if (!selectedEmployee?.id) {
      alert('직원을 선택해주세요.');
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

      // 선택된 요일들에 대해 해당 주의 날짜들을 찾아서 스케줄 생성
      console.log('🔍 일괄 입력 디버깅:', { 
        weekStart: format(weekStart, 'yyyy-MM-dd (EEE)', { locale: ko }),
        bulkDays,
        currentDate: format(currentDate, 'yyyy-MM-dd (EEE)', { locale: ko })
      });
      
      for (let i = 0; i < 7; i++) {
        const day = addDays(weekStart, i);
        const dayOfWeek = day.getDay();
        
        console.log(`📅 ${i}일차: ${format(day, 'yyyy-MM-dd (EEE)', { locale: ko })} - 요일번호: ${dayOfWeek} - 선택됨: ${bulkDays.includes(dayOfWeek)}`);
        
        // 선택된 요일에 해당하는 날짜인지 확인
        if (bulkDays.includes(dayOfWeek)) {
          const timeSlots = excludeLunch ? 
            generateTimeSlotsExcludingLunch(bulkStartTime, bulkEndTime, '12:00', '13:00', 30) :
            generateTimeSlotsIncludingLunch(bulkStartTime, bulkEndTime, 30);
          
          const optimizedSchedules = mergeConsecutiveTimeSlots(timeSlots, '12:00', '13:00', excludeLunch);
          
          optimizedSchedules.forEach(optimizedSchedule => {
            schedulesToAdd.push({
              employee_id: selectedEmployee.id,
              schedule_date: format(day, 'yyyy-MM-dd'),
              scheduled_start: optimizedSchedule.start + ':00',
              scheduled_end: optimizedSchedule.end + ':00',
              break_minutes: optimizedSchedule.break_minutes,
              total_hours: optimizedSchedule.total_hours,
              status: autoApprove ? 'approved' : 'pending',
              employee_note: optimizedSchedule.employee_note || `일괄 입력 (${excludeLunch ? '점심시간 제외' : '점심시간 포함'})${autoApprove ? ' - 자동승인' : ''}`
            });
          });
        }
      }

      // 기존 스케줄 삭제
      const deletePromises = schedulesToAdd.map(schedule => 
        supabase
          .from('schedules')
          .delete()
          .eq('employee_id', selectedEmployee.id)
          .eq('schedule_date', schedule.schedule_date)
          .eq('scheduled_start', schedule.scheduled_start)
      );

      await Promise.all(deletePromises);

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

  // 필터된 직원 목록
  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.employee_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 승인/취소 함수 추가
  const handleScheduleApproval = async (scheduleId: string, newStatus: 'approved' | 'cancelled') => {
    if (updating) {
      console.log('이미 처리 중입니다.');
      return;
    }

    setUpdating(scheduleId);

    try {
      const { error } = await supabase
        .from('schedules')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', scheduleId);

      if (error) {
        console.error('스케줄 상태 변경 실패:', error);
        throw error;
      }

      await fetchSchedules();
      alert(`스케줄이 ${newStatus === 'approved' ? '승인' : '취소'}되었습니다.`);
    } catch (error: any) {
      console.error('스케줄 상태 변경 오류:', error);
      alert(`스케줄 상태 변경에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setUpdating(null);
    }
  };

  // 일괄 승인 함수 추가
  const handleBulkApproveAll = async () => {
    if (updating) {
      console.log('이미 처리 중입니다.');
      return;
    }

    const pendingSchedules = schedules.filter(schedule => schedule.status === 'pending');
    
    if (pendingSchedules.length === 0) {
      alert('승인할 대기 스케줄이 없습니다.');
      return;
    }

    if (!confirm(`총 ${pendingSchedules.length}개의 대기 스케줄을 모두 승인하시겠습니까?`)) {
      return;
    }

    setUpdating('bulk-approve');

    try {
      const { error } = await supabase
        .from('schedules')
        .update({ 
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('employee_id', selectedEmployee?.id)
        .eq('status', 'pending');

      if (error) {
        console.error('일괄 승인 실패:', error);
        throw error;
      }

      await fetchSchedules();
      alert(`${pendingSchedules.length}개의 스케줄이 모두 승인되었습니다.`);
    } catch (error: any) {
      console.error('일괄 승인 오류:', error);
      alert(`일괄 승인에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setUpdating(null);
    }
  };

  // 스케줄 완전 삭제 함수 추가
  const handleDeleteSchedule = async (scheduleId: string) => {
    if (updating) {
      console.log('이미 처리 중입니다.');
      return;
    }

    if (!confirm('이 스케줄을 완전히 삭제하시겠습니까? 삭제된 스케줄은 복구할 수 없습니다.')) {
      return;
    }

    setUpdating(scheduleId);

    try {
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', scheduleId);

      if (error) {
        console.error('스케줄 삭제 실패:', error);
        throw error;
      }

      await fetchSchedules();
      alert('스케줄이 완전히 삭제되었습니다.');
    } catch (error: any) {
      console.error('스케줄 삭제 오류:', error);
      alert(`스케줄 삭제에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-1 sm:p-2">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-2 sm:p-4">
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
              <Users className="h-5 w-5 sm:h-6 sm:w-6 mr-1 sm:mr-2 text-blue-600" />
              직원별 스케줄 관리
            </h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* 직원 목록 */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 rounded-lg p-3">
              <h2 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                <User className="h-4 w-4 mr-1" />
                직원 목록
              </h2>
              
              <div className="relative mb-3">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="직원 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="space-y-1 max-h-96 overflow-y-auto">
                {filteredEmployees.map((employee) => (
                  <button
                    key={employee.id}
                    onClick={() => setSelectedEmployee(employee)}
                    className={`w-full text-left p-2 rounded-lg transition-colors ${
                      selectedEmployee?.id === employee.id
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'hover:bg-gray-100 text-gray-700'
                    }`}
                  >
                    <div className="font-medium text-sm">{employee.name}</div>
                    <div className="text-xs text-gray-500">{employee.employee_id}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 스케줄 관리 영역 */}
          <div className="lg:col-span-3">
            {!selectedEmployee ? (
              <div className="text-center py-8">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">직원을 선택해주세요</h3>
                <p className="text-gray-500">개별 관리 모드에서는 직원을 선택해야 스케줄을 관리할 수 있습니다.</p>
              </div>
            ) : (
              <>
                {/* 선택된 직원 헤더 */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setSelectedEmployee(null)}
                      className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4 text-gray-700" />
                    </button>
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                      {selectedEmployee.name} 스케줄 관리
                    </h2>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setShowBulkInput(!showBulkInput)}
                      className="bg-green-600 hover:bg-green-700 text-white font-bold py-1.5 px-3 rounded-lg shadow-md flex items-center transition-all duration-200 transform hover:scale-105 text-sm"
                    >
                      <Repeat className="h-4 w-4 mr-1" />
                      일괄입력
                    </button>
                    <button
                      onClick={() => router.push('/schedules/add')}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3 rounded-lg shadow-md flex items-center transition-all duration-200 transform hover:scale-105 text-sm"
                    >
                      <Plus className="h-4 w-4 mr-1" />
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

                {/* 자동 승인 설정 */}
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

                {/* 기간 네비게이션 */}
                <div className="flex items-center justify-between mb-2 sm:mb-3 bg-gray-50 p-1.5 sm:p-2 rounded-lg">
                  <button 
                    onClick={handlePrevPeriod} 
                    className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                  </button>
                  
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <h2 className="text-sm sm:text-base font-semibold text-gray-800">
                      {viewMode === 'week' 
                        ? `${format(startOfWeek(currentDate, { locale: ko, weekStartsOn: 0 }), 'MM/dd', { locale: ko })} - ${format(endOfWeek(currentDate, { locale: ko }), 'MM/dd', { locale: ko })} (${getWeekNumber(currentDate)}주차)`
                        : `${format(currentDate, 'yyyy년 MM월', { locale: ko })}`
                      }
                    </h2>
                    
                    <button
                      onClick={() => setCurrentDate(new Date())}
                      className="px-3 py-1.5 text-gray-600 hover:text-gray-800 text-sm font-medium border border-gray-200 hover:border-gray-300 rounded-md hover:bg-gray-50 transition-all duration-200"
                      title="오늘 날짜로 이동"
                    >
                      오늘
                    </button>
                  </div>
                  
                  <button 
                    onClick={handleNextPeriod} 
                    className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-700" />
                  </button>
                </div>

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
                      리스트
                    </button>
                  </div>
                </div>

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
                              const colorClass = getColorIntensity(daySchedules.length, timeSlot.isLunch);
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
                                    title={`${timeSlot.time} - ${daySchedules.length}개 스케줄 ${canModify ? '클릭으로 수정' : '수정 불가'}`}
                                    className={`w-full h-4 sm:h-5 ${colorClass} rounded-sm transition-all duration-200 ${
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
                                    {daySchedules.length > 0 && (
                                      <span className="hidden sm:block absolute inset-0 flex items-center justify-center text-xs font-bold text-white drop-shadow-sm">
                                        {daySchedules.length}
                                      </span>
                                    )}
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        ))}
                      </div>
                    ) : viewMode === 'month' ? (
                      // 월간 요약 뷰
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
                        {/* 연도/월 선택 */}
                        <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
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
                            <div className="text-sm text-gray-600">
                              {selectedYear}년 {selectedMonth}월 스케줄
                            </div>
                          </div>
                        </div>
                        
                        {/* 일괄 승인 버튼 */}
                        {schedules.some(schedule => schedule.status === 'pending') && (
                          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <CheckCircle className="h-5 w-5 text-blue-600" />
                                <span className="text-sm font-medium text-blue-800">
                                  대기 중인 스케줄: {schedules.filter(s => s.status === 'pending').length}개
                                </span>
                              </div>
                              <button
                                onClick={handleBulkApproveAll}
                                disabled={updating === 'bulk-approve'}
                                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
                              >
                                <CheckCircle className="h-4 w-4" />
                                <span>{updating === 'bulk-approve' ? '처리중...' : '모든 대기 스케줄 일괄 승인'}</span>
                              </button>
                            </div>
                          </div>
                        )}
                        
                        {schedules.length === 0 ? (
                          <div className="text-center py-8 text-gray-500">
                            <Calendar className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                            <p>등록된 스케줄이 없습니다</p>
                          </div>
                        ) : (
                          schedules
                            .sort((a, b) => new Date(a.schedule_date).getTime() - new Date(b.schedule_date).getTime())
                            .map((schedule) => (
                              <div
                                key={schedule.id}
                                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center space-x-3">
                                      <div className="text-sm font-medium text-gray-900">
                                        {format(new Date(schedule.schedule_date), 'MM월 dd일 (EEE)', { locale: ko })}
                                      </div>
                                      <div className="text-sm text-gray-600">
                                        {schedule.scheduled_start} - {schedule.scheduled_end}
                                      </div>
                                      <div className={`px-2 py-1 text-xs rounded-full ${
                                        schedule.status === 'approved' 
                                          ? 'bg-green-100 text-green-800' 
                                          : schedule.status === 'pending'
                                          ? 'bg-yellow-100 text-yellow-800'
                                          : 'bg-red-100 text-red-800'
                                      }`}>
                                        {schedule.status === 'approved' ? '승인' : 
                                         schedule.status === 'pending' ? '대기' : '취소'}
                                      </div>
                                    </div>
                                    {schedule.employee_note && (
                                      <div className="mt-2 text-sm text-gray-500">
                                        {schedule.employee_note}
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* 승인/취소 버튼 추가 */}
                                  {schedule.status === 'pending' && (
                                    <div className="flex space-x-2">
                                      <button
                                        onClick={() => handleScheduleApproval(schedule.id, 'approved')}
                                        disabled={updating === schedule.id}
                                        className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition-colors disabled:opacity-50"
                                      >
                                        <CheckCircle className="h-4 w-4" />
                                        <span>승인</span>
                                      </button>
                                      <button
                                        onClick={() => handleScheduleApproval(schedule.id, 'cancelled')}
                                        disabled={updating === schedule.id}
                                        className="flex items-center space-x-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs rounded-lg transition-colors disabled:opacity-50"
                                      >
                                        <XCircle className="h-4 w-4" />
                                        <span>취소</span>
                                      </button>
                                    </div>
                                  )}
                                  
                                  {/* 취소된 스케줄 재승인/삭제 버튼 추가 */}
                                  {schedule.status === 'cancelled' && (
                                    <div className="flex space-x-2">
                                      <button
                                        onClick={() => handleScheduleApproval(schedule.id, 'approved')}
                                        disabled={updating === schedule.id}
                                        className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-lg transition-colors disabled:opacity-50"
                                      >
                                        <CheckCircle className="h-4 w-4" />
                                        <span>재승인</span>
                                      </button>
                                      <button
                                        onClick={() => handleDeleteSchedule(schedule.id)}
                                        disabled={updating === schedule.id}
                                        className="flex items-center space-x-1 px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded-lg transition-colors disabled:opacity-50"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        <span>삭제</span>
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* 범례 */}
                <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                  <div className="flex flex-wrap gap-2 sm:gap-3 text-xs">
                    {viewMode === 'week' ? (
                      <>
                        <div className="flex items-center">
                          <div className="w-2 h-2 sm:w-3 sm:h-3 bg-blue-300 rounded mr-1"></div>
                          <span>스케줄 있음</span>
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
                    <div className="ml-4 flex flex-wrap gap-2 text-xs text-gray-600">
                      <span className="px-2 py-1 bg-red-100 text-red-700 rounded">관리자: 모든 스케줄 수정 가능</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}