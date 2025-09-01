'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Users, ChevronLeft, ChevronRight, Plus, Search, User, Building } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { format, addDays, startOfWeek, endOfWeek, isSameDay, parseISO, addWeeks, subWeeks, getWeek } from 'date-fns';
import { ko } from 'date-fns/locale';

interface Employee {
  id: string;
  employee_id: string;
  name: string;
  phone: string;
  department: {
    name: string;
  };
  position: {
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
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [updating, setUpdating] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'individual' | 'overview'>('individual');

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
      
      // 관리자 권한 확인 - 데이터베이스에서 role 정보 가져와서 체크
      try {
        const { data: roleData, error: roleError } = await supabase
          .from('roles')
          .select('name')
          .eq('id', user.role_id)
          .single();

        if (roleError) {
          console.error('Role 조회 오류:', roleError);
          alert('권한 확인 중 오류가 발생했습니다.');
          router.push('/dashboard');
          return;
        }

        if (roleData?.name !== 'admin') {
          console.log('현재 사용자 role:', roleData?.name);
          console.log('사용자 정보:', user);
          alert('관리자만 접근할 수 있습니다.');
          router.push('/dashboard');
          return;
        }
      } catch (error) {
        console.error('권한 확인 오류:', error);
        alert('권한 확인 중 오류가 발생했습니다.');
        router.push('/dashboard');
        return;
      }
      
      setCurrentUser(user);
      await fetchEmployees();
    };
    fetchUserAndData();
  }, [router]);

  useEffect(() => {
    if (viewMode === 'individual' && selectedEmployee) {
      fetchSchedules();
    } else if (viewMode === 'overview') {
      fetchSchedules();
    }
  }, [selectedEmployee, currentDate, viewMode]);

  const getCurrentUser = async () => {
    if (typeof window !== 'undefined') {
      const isLoggedIn = localStorage.getItem('isLoggedIn');
      const employeeData = localStorage.getItem('currentEmployee');
      
      if (isLoggedIn === 'true' && employeeData) {
        const user = JSON.parse(employeeData);
        console.log('현재 로그인된 사용자 정보:', user);
        return user;
      }
    }
    return null;
  };

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          id,
          employee_id,
          name,
          phone,
          department:departments(name),
          position:positions(name)
        `)
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('Error fetching employees:', error);
        setEmployees([]);
      } else {
        setEmployees(data || []);
        if (data && data.length > 0) {
          setSelectedEmployee(data[0]); // 첫 번째 직원을 기본 선택
        }
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedules = async () => {
    if (viewMode === 'individual' && !selectedEmployee?.id) return;

    try {
      const startDate = startOfWeek(currentDate, { locale: ko });
      const endDate = endOfWeek(currentDate, { locale: ko });

      let query = supabase
        .from('schedules')
        .select(`
          *,
          employee:employees!schedules_employee_id_fkey(name, employee_id)
        `)
        .gte('schedule_date', format(startDate, 'yyyy-MM-dd'))
        .lte('schedule_date', format(endDate, 'yyyy-MM-dd'))
        .order('schedule_date', { ascending: true })
        .order('scheduled_start', { ascending: true });

      if (viewMode === 'individual') {
        query = query.eq('employee_id', selectedEmployee.employee_id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching schedules:', error);
        setSchedules([]);
      } else {
        setSchedules(data || []);
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
      setSchedules([]);
    }
  };

  const getDaysInView = () => {
    return Array.from({ length: 7 }).map((_, i) => addDays(startOfWeek(currentDate, { locale: ko }), i));
  };

  const getSchedulesForDateAndTime = (date: Date, timeSlot: TimeSlot, employeeId?: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const timeStr = timeSlot.time + ':00';
    
    return schedules.filter(schedule => {
      const scheduleDate = schedule.schedule_date;
      const startTime = schedule.scheduled_start;
      const matchesDateAndTime = scheduleDate === dateStr && startTime === timeStr;
      
      if (employeeId) {
        return matchesDateAndTime && schedule.employee_id === employeeId;
      }
      
      return matchesDateAndTime;
    });
  };

  const getColorIntensity = (scheduleCount: number, isLunch: boolean) => {
    if (scheduleCount === 0) {
      return isLunch ? 'bg-orange-50' : 'bg-gray-50';
    }
    
    if (scheduleCount === 1) return 'bg-blue-200';
    if (scheduleCount === 2) return 'bg-blue-300';
    if (scheduleCount === 3) return 'bg-blue-400';
    return 'bg-blue-500';
  };

  const toggleSchedule = async (date: Date, timeSlot: TimeSlot, employeeId?: string) => {
    const targetEmployeeId = employeeId || selectedEmployee?.employee_id;
    
    if (!targetEmployeeId) {
      alert('직원을 선택해주세요.');
      return;
    }

    if (updating) {
      console.log('이미 처리 중입니다.');
      return;
    }

    const dateStr = format(date, 'yyyy-MM-dd');
    const timeStr = timeSlot.time + ':00';
    const existingSchedules = getSchedulesForDateAndTime(date, timeSlot, targetEmployeeId);
    const existingSchedule = existingSchedules[0];
    
    const updateKey = `${dateStr}-${timeSlot.time}`;
    setUpdating(updateKey);

    try {
      if (existingSchedule) {
        // 기존 스케줄 삭제
        const { error } = await supabase
          .from('schedules')
          .delete()
          .eq('id', existingSchedule.id);

        if (error) {
          console.error('Delete error:', error);
          throw error;
        }
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
          employee_id: targetEmployeeId,
          schedule_date: dateStr,
          scheduled_start: timeStr,
          scheduled_end: endTimeStr,
          status: 'approved',
          employee_note: '관리자가 추가함'
        };

        const { error } = await supabase
          .from('schedules')
          .upsert(scheduleData, {
            onConflict: 'employee_id,schedule_date,scheduled_start'
          });

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

  const handlePrevWeek = () => {
    setCurrentDate(subWeeks(currentDate, 1));
  };

  const handleNextWeek = () => {
    setCurrentDate(addWeeks(currentDate, 1));
  };

  // 월과 주차를 포함한 주차 표시 형식
  const getWeekDisplay = (date: Date) => {
    const month = format(date, 'M', { locale: ko });
    const weekNumber = getWeek(date, { locale: ko });
    return `${month}월 ${weekNumber}주차`;
  };

  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.department?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-1 sm:p-2">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-2 sm:p-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-full hover:bg-gray-200 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-700" />
            </button>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
              <Users className="h-5 w-5 sm:h-6 sm:w-6 mr-1 sm:mr-2 text-blue-600" />
              직원별 스케줄 관리
            </h1>
          </div>
          
          <div className="flex space-x-2">
            {/* 뷰 모드 토글 */}
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('individual')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'individual'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                개별 관리
              </button>
              <button
                onClick={() => setViewMode('overview')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'overview'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                전체 보기
              </button>
            </div>
            <button
              onClick={() => router.push('/schedules')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium"
            >
              내 스케줄
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* 직원 목록 */}
          <div className="lg:col-span-1 bg-gray-50 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
              <User className="h-5 w-5 mr-2" />
              직원 목록
            </h2>
            
            {/* 검색 */}
            <div className="mb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="직원 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* 직원 리스트 */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredEmployees.map((employee) => (
                <button
                  key={employee.id}
                  onClick={() => setSelectedEmployee(employee)}
                  className={`w-full text-left p-3 rounded-lg transition-all duration-200 ${
                    selectedEmployee?.id === employee.id
                      ? 'bg-blue-100 border-2 border-blue-300'
                      : 'bg-white border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium text-gray-900">{employee.name}</div>
                  <div className="text-sm text-gray-600">{employee.employee_id}</div>
                  <div className="text-xs text-gray-500">
                    {employee.department?.name} • {employee.position?.name}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 스케줄 뷰 */}
          <div className="lg:col-span-3">
            {viewMode === 'individual' && selectedEmployee ? (
              <div>
                {/* 선택된 직원 정보 */}
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <h3 className="text-lg font-semibold text-blue-900 mb-2">
                    {selectedEmployee.name} ({selectedEmployee.employee_id})
                  </h3>
                  <p className="text-blue-700">
                    {selectedEmployee.department?.name} • {selectedEmployee.position?.name}
                  </p>
                </div>

                {/* 주간 네비게이션 */}
                <div className="flex items-center justify-between mb-4 bg-gray-50 p-3 rounded-lg">
                  <button 
                    onClick={handlePrevWeek} 
                    className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-700" />
                  </button>
                  
                  <h2 className="text-lg font-semibold text-gray-800">
                    {getWeekDisplay(currentDate)}
                  </h2>
                  
                  <button 
                    onClick={handleNextWeek} 
                    className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-700" />
                  </button>
                </div>

                {/* 스케줄 그리드 */}
                <div className="overflow-x-auto">
                  <div className="min-w-[600px]">
                    {/* 요일 헤더 */}
                    <div className="grid grid-cols-8 gap-1 mb-1">
                      <div className="p-2 text-sm font-medium text-gray-600 text-center">시간</div>
                      {getDaysInView().map(date => (
                        <div key={format(date, 'yyyy-MM-dd')} className="p-2 text-sm font-medium text-gray-600 text-center">
                          <div className="text-xs">{format(date, 'EEE', { locale: ko })}</div>
                          <div className={`text-sm font-bold ${isSameDay(date, new Date()) ? 'text-blue-600' : 'text-gray-800'}`}>
                            {format(date, 'd')}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 시간대별 스케줄 */}
                    {timeSlots.map((timeSlot) => (
                      <div key={timeSlot.time} className="grid grid-cols-8 gap-1 mb-1">
                        <div className={`p-2 text-sm font-medium text-center ${timeSlot.isLunch ? 'text-orange-600' : 'text-gray-600'}`}>
                          {timeSlot.label}
                        </div>
                        {getDaysInView().map(date => {
                          const daySchedules = getSchedulesForDateAndTime(date, timeSlot);
                          const colorClass = getColorIntensity(daySchedules.length, timeSlot.isLunch);
                          const isUpdating = updating === `${format(date, 'yyyy-MM-dd')}-${timeSlot.time}`;
                          
                          return (
                            <button
                              key={`${format(date, 'yyyy-MM-dd')}-${timeSlot.time}`}
                              onClick={() => toggleSchedule(date, timeSlot)}
                              disabled={isUpdating}
                              className={`p-2 rounded-sm transition-all duration-200 ${
                                daySchedules.length > 0 
                                  ? 'hover:opacity-80 cursor-pointer' 
                                  : 'hover:bg-gray-100 cursor-pointer'
                              } ${colorClass} ${
                                isUpdating ? 'animate-pulse' : ''
                              }`}
                              title={`${timeSlot.time} - ${daySchedules.length}개 스케줄`}
                            >
                              {daySchedules.length > 0 && (
                                <span className="text-xs font-bold text-white">
                                  {daySchedules.length}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 범례 */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex flex-wrap gap-3 text-sm">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-gray-50 border border-gray-300 rounded mr-2"></div>
                      <span>없음</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-200 rounded mr-2"></div>
                      <span>1명</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-300 rounded mr-2"></div>
                      <span>2명</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-400 rounded mr-2"></div>
                      <span>3명+</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-orange-50 rounded mr-2"></div>
                      <span>점심</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : viewMode === 'overview' ? (
              <div>
                {/* 전체 보기 헤더 */}
                <div className="bg-green-50 rounded-lg p-4 mb-4">
                  <h3 className="text-lg font-semibold text-green-900 mb-2">
                    전체 직원 스케줄 보기
                  </h3>
                  <p className="text-green-700">
                    모든 직원의 스케줄을 한눈에 확인하고 관리할 수 있습니다.
                  </p>
                </div>

                {/* 주간 네비게이션 */}
                <div className="flex items-center justify-between mb-4 bg-gray-50 p-3 rounded-lg">
                  <button 
                    onClick={handlePrevWeek} 
                    className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-700" />
                  </button>
                  
                  <h2 className="text-lg font-semibold text-gray-800">
                    {getWeekDisplay(currentDate)}
                  </h2>
                  
                  <button 
                    onClick={handleNextWeek} 
                    className="p-2 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-700" />
                  </button>
                </div>

                {/* 전체 스케줄 그리드 */}
                <div className="overflow-x-auto">
                  <div className="min-w-[600px]">
                    {/* 요일 헤더 */}
                    <div className="grid grid-cols-8 gap-1 mb-1">
                      <div className="p-2 text-sm font-medium text-gray-600 text-center">시간</div>
                      {getDaysInView().map(date => (
                        <div key={format(date, 'yyyy-MM-dd')} className="p-2 text-sm font-medium text-gray-600 text-center">
                          <div className="text-xs">{format(date, 'EEE', { locale: ko })}</div>
                          <div className={`text-sm font-bold ${isSameDay(date, new Date()) ? 'text-blue-600' : 'text-gray-800'}`}>
                            {format(date, 'd')}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 시간대별 전체 스케줄 */}
                    {timeSlots.map((timeSlot) => (
                      <div key={timeSlot.time} className="grid grid-cols-8 gap-1 mb-1">
                        <div className={`p-2 text-sm font-medium text-center ${timeSlot.isLunch ? 'text-orange-600' : 'text-gray-600'}`}>
                          {timeSlot.label}
                        </div>
                        {getDaysInView().map(date => {
                          const allSchedules = getSchedulesForDateAndTime(date, timeSlot);
                          const colorClass = getColorIntensity(allSchedules.length, timeSlot.isLunch);
                          const isUpdating = updating === `${format(date, 'yyyy-MM-dd')}-${timeSlot.time}`;
                          
                          return (
                            <div
                              key={`${format(date, 'yyyy-MM-dd')}-${timeSlot.time}`}
                              className={`p-2 rounded-sm transition-all duration-200 relative ${colorClass} ${
                                isUpdating ? 'animate-pulse' : ''
                              }`}
                              title={`${timeSlot.time} - ${allSchedules.length}개 스케줄`}
                            >
                              {allSchedules.length > 0 && (
                                <div className="text-xs font-bold text-white mb-1">
                                  {allSchedules.length}명
                                </div>
                              )}
                              
                              {/* 직원별 스케줄 표시 및 관리 */}
                              <div className="space-y-1">
                                {allSchedules.slice(0, 3).map((schedule, index) => (
                                  <button
                                    key={schedule.id}
                                    onClick={() => toggleSchedule(date, timeSlot, schedule.employee_id)}
                                    className="w-full text-xs text-white bg-red-500 bg-opacity-80 hover:bg-red-600 px-1 py-0.5 rounded transition-colors"
                                    title={`${schedule.employee?.name} 스케줄 삭제`}
                                  >
                                    {schedule.employee?.name || '알 수 없음'} ✕
                                  </button>
                                ))}
                                {allSchedules.length > 3 && (
                                  <div className="text-xs text-white bg-black bg-opacity-20 px-1 py-0.5 rounded">
                                    +{allSchedules.length - 3}명 더
                                  </div>
                                )}
                              </div>
                              
                              {/* 직원 추가 드롭다운 */}
                              {allSchedules.length === 0 && (
                                <div className="absolute inset-0 w-full h-full opacity-0 hover:opacity-100 transition-opacity bg-blue-500 bg-opacity-20 rounded-sm">
                                  <select
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        toggleSchedule(date, timeSlot, e.target.value);
                                        e.target.value = ''; // 선택 초기화
                                      }
                                    }}
                                    className="w-full h-full opacity-0 cursor-pointer"
                                    title="직원 선택하여 스케줄 추가"
                                  >
                                    <option value="">직원 선택</option>
                                    {employees.map(employee => (
                                      <option key={employee.id} value={employee.id}>
                                        {employee.name}
                                      </option>
                                    ))}
                                  </select>
                                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                    <Plus className="w-4 h-4 text-white" />
                                  </div>
                                </div>
                              )}
                              
                              {/* 빈 시간대가 아닌 경우 추가 버튼 */}
                              {allSchedules.length > 0 && (
                                <div className="absolute top-0 right-0 w-4 h-4 opacity-0 hover:opacity-100 transition-opacity">
                                  <select
                                    onChange={(e) => {
                                      if (e.target.value) {
                                        toggleSchedule(date, timeSlot, e.target.value);
                                        e.target.value = ''; // 선택 초기화
                                      }
                                    }}
                                    className="w-full h-full opacity-0 cursor-pointer text-xs"
                                    title="직원 추가"
                                  >
                                    <option value="">+</option>
                                    {employees
                                      .filter(emp => !allSchedules.some(s => s.employee_id === emp.id))
                                      .map(employee => (
                                        <option key={employee.id} value={employee.id}>
                                          {employee.name}
                                        </option>
                                      ))}
                                  </select>
                                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                    <Plus className="w-3 h-3 text-white bg-green-500 rounded-full" />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 범례 */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex flex-wrap gap-3 text-sm">
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-gray-50 border border-gray-300 rounded mr-2"></div>
                      <span>없음</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-200 rounded mr-2"></div>
                      <span>1명</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-300 rounded mr-2"></div>
                      <span>2명</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-blue-400 rounded mr-2"></div>
                      <span>3명+</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-3 bg-orange-50 rounded mr-2"></div>
                      <span>점심</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>직원을 선택해주세요.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
