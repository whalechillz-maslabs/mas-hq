'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Users, ChevronLeft, ChevronRight, Plus, Search, User, Building, X, Edit, Trash2 } from 'lucide-react';
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
  }[];
  position: {
    name: string;
  }[];
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

interface ScheduleModal {
  isOpen: boolean;
  date: Date | null;
  timeSlot: TimeSlot | null;
  schedule: Schedule | null;
  mode: 'add' | 'edit' | 'delete' | 'overview';
  employeeId?: string; // 전체보기에서 사용할 직원 ID
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
  
  // 스케줄 모달 상태 추가
  const [scheduleModal, setScheduleModal] = useState<ScheduleModal>({
    isOpen: false,
    date: null,
    timeSlot: null,
    schedule: null,
    mode: 'add'
  });
  
  // 모달 입력 필드 상태
  const [modalInputs, setModalInputs] = useState({
    startTime: '',
    endTime: '',
    note: ''
  });

  // 빠른 스케줄 추가 상태 (모달 없이 바로 추가)
  const [quickAdd, setQuickAdd] = useState<{
    isActive: boolean;
    date: Date | null;
    timeSlot: TimeSlot | null;
    employeeId: string | null;
  }>({
    isActive: false,
    date: null,
    timeSlot: null,
    employeeId: null
  });

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
    { day: 6, label: '토', name: 'saturday' }
  ];

  useEffect(() => {
    loadCurrentUser();
    loadEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmployee || viewMode === 'overview') {
      fetchSchedules();
    }
  }, [selectedEmployee, currentDate, viewMode]);

  const loadCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    } catch (error) {
      console.error('사용자 로드 실패:', error);
    }
  };

  const loadEmployees = async () => {
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
        .order('name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('직원 목록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSchedules = async () => {
    try {
      const startOfWeekDate = startOfWeek(currentDate, { weekStartsOn: 0 });
      const endOfWeekDate = endOfWeek(currentDate, { weekStartsOn: 0 });
      
      let query = supabase
        .from('schedules')
        .select(`
          *,
          employee:employees!schedules_employee_id_fkey(
            name,
            employee_id
          )
        `)
        .gte('schedule_date', format(startOfWeekDate, 'yyyy-MM-dd'))
        .lte('schedule_date', format(endOfWeekDate, 'yyyy-MM-dd'))
        .order('schedule_date', { ascending: true });

      if (viewMode === 'individual' && selectedEmployee) {
        query = query.eq('employee_id', selectedEmployee.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      console.error('스케줄 로드 실패:', error);
    }
  };

  const getDaysInView = () => {
    const startOfWeekDate = startOfWeek(currentDate, { weekStartsOn: 0 });
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      days.push(addDays(startOfWeekDate, i));
    }
    
    return days;
  };

  const getSchedulesForDateAndTime = (date: Date, timeSlot: TimeSlot, employeeId?: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const timeStr = timeSlot.time + ':00';
    
    let filteredSchedules = schedules.filter(schedule => 
      schedule.schedule_date === dateStr &&
      schedule.scheduled_start <= timeStr &&
      schedule.scheduled_end > timeStr
    );

    if (employeeId) {
      filteredSchedules = filteredSchedules.filter(schedule => 
        schedule.employee_id === employeeId
      );
    }

    return filteredSchedules;
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

  // 빠른 스케줄 삭제 (모달 없이)
  const handleQuickDelete = async (scheduleId: string) => {
    try {
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', scheduleId);

      if (error) throw error;

      // 스케줄 데이터 즉시 업데이트
      await fetchSchedules();
      
      // 로컬 상태도 즉시 업데이트
      setSchedules(prev => prev.filter(s => s.id !== scheduleId));
    } catch (error: any) {
      console.error('스케줄 삭제 실패:', error);
      alert(`스케줄 삭제에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
    }
  };

  // 빠른 스케줄 추가 (모달 없이) - "내 스케줄" 페이지 방식 참고
  const handleQuickAdd = async (date: Date, timeSlot: TimeSlot, employeeId: string) => {
    if (!employeeId) {
      alert('직원을 선택해주세요.');
      return;
    }

    const updateKey = `${format(date, 'yyyy-MM-dd')}-${timeSlot.time}-${employeeId}`;
    setUpdating(updateKey);

    try {
      // 기본값 설정: 30분 단위
      const [startHour, startMinute] = timeSlot.time.split(':').map(Number);
      let endHour = startHour;
      let endMinute = startMinute + 30;
      
      if (endMinute >= 60) {
        endHour += 1;
        endMinute = 0;
      }
      
      const endTimeStr = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;

      const scheduleData = {
        employee_id: employeeId,
        schedule_date: format(date, 'yyyy-MM-dd'),
        scheduled_start: timeSlot.time + ':00',
        scheduled_end: endTimeStr + ':00',
        status: 'approved',
        employee_note: '관리자가 추가함'
      };

      console.log('스케줄 추가 시작:', scheduleData);

      // "내 스케줄" 페이지와 동일한 방식으로 upsert 실행
      const { data, error } = await supabase
        .from('schedules')
        .upsert(scheduleData, {
          onConflict: 'employee_id,schedule_date,scheduled_start'
        })
        .select(`
          *,
          employee:employees!schedules_employee_id_fkey(
            name,
            employee_id
          )
        `);

      if (error) {
        console.error('Insert error:', error);
        throw error;
      }

      console.log('스케줄 추가 완료:', data);

      // 성공 메시지 없이 바로 추가
      
      // 스케줄 데이터 즉시 업데이트
      await fetchSchedules();
      
      // 로컬 상태도 즉시 업데이트
      if (data && data.length > 0) {
        setSchedules(prev => {
          const newSchedule = data[0];
          const existingIndex = prev.findIndex(s => 
            s.employee_id === newSchedule.employee_id && 
            s.schedule_date === newSchedule.schedule_date && 
            s.scheduled_start === newSchedule.scheduled_start
          );
          
          if (existingIndex >= 0) {
            // 기존 스케줄 업데이트
            const updated = [...prev];
            updated[existingIndex] = newSchedule;
            return updated;
          } else {
            // 새 스케줄 추가
            return [...prev, newSchedule];
          }
        });
      }
    } catch (error: any) {
      console.error('스케줄 추가 실패:', error);
      alert(`스케줄 추가에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setUpdating(null);
    }
  };



  // 스케줄 모달 열기 함수
  const openScheduleModal = (date: Date, timeSlot: TimeSlot, mode: 'add' | 'edit' | 'delete', schedule?: Schedule, employeeId?: string) => {
    if (mode === 'add') {
      // 기본값 설정: 30분 단위
      const [startHour, startMinute] = timeSlot.time.split(':').map(Number);
      let endHour = startHour;
      let endMinute = startMinute + 30;
      
      if (endMinute >= 60) {
        endHour += 1;
        endMinute = 0;
      }
      
      const endTimeStr = `${endHour.toString().padStart(2, '0')}:${endMinute.toString().padStart(2, '0')}`;
      
      setModalInputs({
        startTime: timeSlot.time,
        endTime: endTimeStr,
        note: ''
      });
    } else if (mode === 'edit' && schedule) {
      setModalInputs({
        startTime: schedule.scheduled_start.substring(0, 5),
        endTime: schedule.scheduled_end.substring(0, 5),
        note: schedule.employee_note || ''
      });
    }

    setScheduleModal({
      isOpen: true,
      date,
      timeSlot,
      schedule: schedule || null,
      mode,
      employeeId
    });
  };

  // 스케줄 모달 닫기
  const closeScheduleModal = () => {
    setScheduleModal({
      isOpen: false,
      date: null,
      timeSlot: null,
      schedule: null,
      mode: 'add'
    });
    setModalInputs({
      startTime: '',
      endTime: '',
      note: ''
    });
  };

  // 스케줄 저장/수정/삭제
  const handleScheduleAction = async () => {
    if (!scheduleModal.date || !scheduleModal.timeSlot) {
      alert('필수 정보가 누락되었습니다.');
      return;
    }

    const targetEmployeeId = scheduleModal.employeeId || selectedEmployee?.id;
    if (!targetEmployeeId) {
      alert('직원 정보가 누락되었습니다.');
      return;
    }

    const dateStr = format(scheduleModal.date, 'yyyy-MM-dd');
    const updateKey = `${dateStr}-${scheduleModal.timeSlot.time}`;
    setUpdating(updateKey);

    try {
      if (scheduleModal.mode === 'delete' && scheduleModal.schedule) {
        // 스케줄 삭제
        const { error } = await supabase
          .from('schedules')
          .delete()
          .eq('id', scheduleModal.schedule.id);

        if (error) {
          console.error('Delete error:', error);
          throw error;
        }
      } else if (scheduleModal.mode === 'add' || scheduleModal.mode === 'edit') {
        // 스케줄 추가/수정
        const scheduleData = {
          employee_id: targetEmployeeId,
          schedule_date: dateStr,
          scheduled_start: modalInputs.startTime + ':00',
          scheduled_end: modalInputs.endTime + ':00',
          status: 'approved',
          employee_note: modalInputs.note || '관리자가 추가함'
        };

        if (scheduleModal.mode === 'edit' && scheduleModal.schedule) {
          // 수정 모드
          const { error } = await supabase
            .from('schedules')
            .update(scheduleData)
            .eq('id', scheduleModal.schedule.id);

          if (error) {
            console.error('Update error:', error);
            throw error;
          }
        } else {
          // 추가 모드
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
      }

      await fetchSchedules();
      closeScheduleModal();
    } catch (error: any) {
      console.error('스케줄 처리 오류:', error);
      alert(`스케줄 처리에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setUpdating(null);
    }
  };

  // 기존 toggleSchedule 함수를 openScheduleModal 호출로 변경
  const toggleSchedule = async (date: Date, timeSlot: TimeSlot, employeeId?: string) => {
    const targetEmployeeId = employeeId || selectedEmployee?.id;
    
    if (!targetEmployeeId) {
      alert('직원을 선택해주세요.');
      return;
    }

    const existingSchedules = getSchedulesForDateAndTime(date, timeSlot, targetEmployeeId);
    
    if (existingSchedules.length > 0) {
      // 기존 스케줄이 있으면 바로 삭제
      const schedule = existingSchedules[0];
      await handleQuickDelete(schedule.id);
    } else {
      // 새 스케줄이면 바로 추가
      await handleQuickAdd(date, timeSlot, targetEmployeeId);
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
    const weekNumber = getWeek(date, { locale: ko });
    
    // 해당 주의 시작일(일요일)과 끝일(토요일) 계산
    const weekStart = startOfWeek(date, { locale: ko });
    const weekEnd = endOfWeek(date, { locale: ko });
    
    // 시작일과 끝일을 MM/DD 형식으로 포맷
    const startDate = format(weekStart, 'MM/dd', { locale: ko });
    const endDate = format(weekEnd, 'MM/dd', { locale: ko });
    
    return `${startDate} - ${endDate} (${weekNumber}주차)`;
  };

  // 스케줄 정보를 직원별로 분리하여 표시하는 함수
  const formatScheduleDisplay = (schedules: Schedule[]) => {
    if (schedules.length === 0) return '';
    if (schedules.length === 1) return `1명 ${schedules[0].employee?.name || 'Unknown'}`;
    
    // 2명 이상일 때는 각 직원 이름을 개별적으로 표시
    const employeeNames = schedules.map(s => s.employee?.name || 'Unknown');
    return `${schedules.length}명 ${employeeNames.join(', ')}`;
  };

  // 특정 시간대의 스케줄을 직원별로 그룹화하는 함수
  const getSchedulesByEmployee = (date: Date, timeSlot: TimeSlot) => {
    const daySchedules = getSchedulesForDateAndTime(date, timeSlot);
    return daySchedules;
  };

  const filteredEmployees = employees.filter(employee =>
    employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    employee.department?.[0]?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 전체보기에서 새 스케줄 추가 시 직원 선택 함수
  const handleOverviewAddSchedule = async (date: Date, timeSlot: TimeSlot) => {
    try {
      // 왼쪽에서 이미 직원이 선택되어 있는지 확인
      if (selectedEmployee) {
        // 선택된 직원이 있으면 바로 추가
        console.log(`선택된 직원 "${selectedEmployee.name}"을 바로 추가합니다.`);
        await handleQuickAdd(date, timeSlot, selectedEmployee.id);
        return;
      }
      
      // 선택된 직원이 없을 때만 이름 입력 프롬프트 표시
      const selectedEmployeeName = prompt('추가할 직원의 이름을 입력하세요 (예: 하상희, 허상원, 최형호):');
      
      if (!selectedEmployeeName) return;
      
      // 입력된 이름으로 직원 찾기
      const selectedEmployeeFromPrompt = employees.find(emp => 
        emp.name.includes(selectedEmployeeName) || 
        selectedEmployeeName.includes(emp.name)
      );
      
      if (!selectedEmployeeFromPrompt) {
        alert(`직원 "${selectedEmployeeName}"을 찾을 수 없습니다.`);
        return;
      }
      
      // 스케줄 추가
      await handleQuickAdd(date, timeSlot, selectedEmployeeFromPrompt.id);
      
    } catch (error: any) {
      console.error('스케줄 추가 실패:', error);
      alert(`스케줄 추가에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
    }
  };

  // 전체보기에서 스케줄 셀 클릭 시 상세 관리 모달 열기
  const openOverviewScheduleModal = (date: Date, timeSlot: TimeSlot) => {
    const daySchedules = getSchedulesForDateAndTime(date, timeSlot);
    
    if (daySchedules.length === 0) {
      // 빈 셀이면 바로 추가
      handleOverviewAddSchedule(date, timeSlot);
      return;
    }
    
    // 스케줄이 있는 셀이면 상세 관리 모달 열기
    setScheduleModal({
      isOpen: true,
      mode: 'overview',
      date,
      timeSlot,
      schedule: null,
      employeeId: undefined
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-1 sm:p-2">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-lg p-2 sm:p-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={() => router.push('/dashboard')}
              className="mr-4 p-2 rounded-full hover:bg-gray-200 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">직원별 스케줄 관리</h1>
          </div>
          
          <div className="flex items-center space-x-3">
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
                    ? 'bg-blue-600 text-white'
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
                    {employee.department?.[0]?.name && employee.position?.[0]?.name ? 
                      `${employee.department[0].name} • ${employee.position[0].name}` : 
                      employee.department?.[0]?.name || employee.position?.[0]?.name || ''
                    }
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
                    {selectedEmployee.department?.[0]?.name && selectedEmployee.position?.[0]?.name ? 
                      `${selectedEmployee.department[0].name} • ${selectedEmployee.position[0].name}` : 
                      selectedEmployee.department?.[0]?.name || selectedEmployee.position?.[0]?.name || ''
                    }
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
                  
                  <div className="flex items-center space-x-4">
                    <h2 className="text-lg font-semibold text-gray-800">
                      {getWeekDisplay(currentDate)}
                    </h2>
                    
                    {/* 오늘로 가기 버튼 */}
                    <button
                      onClick={() => setCurrentDate(new Date())}
                      className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-1"
                      title="오늘 날짜가 포함된 주로 이동"
                    >
                      <span>📅</span>
                      <span>오늘로 가기</span>
                    </button>
                  </div>
                  
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
                    모든 직원의 스케줄을 한눈에 확인하고 관리할 수 있습니다. 시간을 클릭하면 해당 직원의 스케줄을 바로 추가/수정할 수 있습니다.
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

                {/* 전체 보기 스케줄 그리드 */}
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
                          
                          return (
                            <div
                              key={`${format(date, 'yyyy-MM-dd')}-${timeSlot.time}`}
                              className={`p-2 rounded-sm ${colorClass} min-h-[40px] flex items-center justify-center relative group cursor-pointer hover:opacity-90 transition-opacity`}
                              onClick={() => openOverviewScheduleModal(date, timeSlot)}
                              title="클릭하여 상세 관리"
                            >
                              {daySchedules.length > 0 && (
                                <div className="text-center">
                                  <div className="text-xs font-bold text-white mb-1">
                                    {daySchedules.length}명
                                  </div>
                                  <div className="text-xs text-white">
                                    {daySchedules.slice(0, 2).map(schedule => (
                                      <div key={schedule.id} className="truncate">
                                        {schedule.employee?.name || 'Unknown'}
                                      </div>
                                    ))}
                                    {daySchedules.length > 2 && (
                                      <div className="text-xs">+{daySchedules.length - 2}</div>
                                    )}
                                  </div>
                                  
                                  {/* 전체보기에서 개별 직원 삭제 버튼들과 추가 버튼 */}
                                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="flex flex-col space-y-1">
                                      {/* 기존 직원 삭제 버튼들 */}
                                      {daySchedules.map((schedule, index) => (
                                        <button
                                          key={schedule.id}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleQuickDelete(schedule.id);
                                          }}
                                          className="p-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 flex items-center space-x-1"
                                          title={`${schedule.employee?.name || 'Unknown'} 삭제`}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                          <span className="text-xs">{schedule.employee?.name || 'Unknown'}</span>
                                        </button>
                                      ))}
                                      
                                      {/* 추가 직원 추가 버튼 */}
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOverviewAddSchedule(date, timeSlot);
                                        }}
                                        className="p-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 flex items-center space-x-1"
                                        title="직원 추가"
                                      >
                                        <Plus className="h-3 w-3" />
                                        <span className="text-xs">추가</span>
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                              
                              {/* 전체보기에서 새 스케줄 추가 버튼 (빈 시간대용) */}
                              {daySchedules.length === 0 && (
                                <button
                                  onClick={() => handleOverviewAddSchedule(date, timeSlot)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-green-600 text-white rounded text-xs hover:bg-green-700"
                                  title="스케줄 추가"
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
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
              <div className="text-center py-12">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">직원을 선택해주세요</h3>
                <p className="text-gray-500">개별 관리 모드에서는 직원을 선택해야 스케줄을 관리할 수 있습니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 스케줄 입력/수정 모달 */}
      {scheduleModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {scheduleModal.mode === 'add' ? '스케줄 추가' : 
                 scheduleModal.mode === 'edit' ? '스케줄 수정' : 
                 scheduleModal.mode === 'overview' ? '스케줄 상세 관리' : '스케줄 삭제'}
              </h3>
              <button
                onClick={closeScheduleModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {scheduleModal.mode === 'overview' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    날짜 및 시간
                  </label>
                  <input
                    type="text"
                    value={scheduleModal.date && scheduleModal.timeSlot ? 
                      `${format(scheduleModal.date, 'yyyy년 MM월 dd일 (E)', { locale: ko })} ${scheduleModal.timeSlot.time}` : ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    현재 근무 직원
                  </label>
                  <div className="space-y-2">
                    {scheduleModal.date && scheduleModal.timeSlot && 
                     getSchedulesForDateAndTime(scheduleModal.date, scheduleModal.timeSlot).map((schedule, index) => (
                      <div key={schedule.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm">{schedule.employee?.name || 'Unknown'}</span>
                        <button
                          onClick={() => {
                            handleQuickDelete(schedule.id);
                            closeScheduleModal();
                          }}
                          className="p-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                          title="삭제"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    새 직원 추가
                  </label>
                  <div className="flex space-x-2">
                    {selectedEmployee && (
                      <button
                        onClick={async () => {
                          if (scheduleModal.date && scheduleModal.timeSlot) {
                            await handleQuickAdd(scheduleModal.date, scheduleModal.timeSlot, selectedEmployee.id);
                            closeScheduleModal();
                          }
                        }}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
                      >
                        {selectedEmployee.name} 추가
                      </button>
                    )}
                    <button
                      onClick={async () => {
                        if (scheduleModal.date && scheduleModal.timeSlot) {
                          await handleOverviewAddSchedule(scheduleModal.date, scheduleModal.timeSlot);
                          closeScheduleModal();
                        }
                      }}
                      className="flex-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                    >
                      다른 직원 추가
                    </button>
                  </div>
                </div>
              </div>
            ) : scheduleModal.mode !== 'delete' ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    날짜
                  </label>
                  <input
                    type="text"
                    value={scheduleModal.date ? format(scheduleModal.date, 'yyyy년 MM월 dd일 (E)', { locale: ko }) : ''}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    시작 시간
                  </label>
                  <input
                    type="text"
                    value={modalInputs.startTime}
                    onChange={(e) => setModalInputs(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    종료 시간
                  </label>
                  <input
                    type="text"
                    value={modalInputs.endTime}
                    onChange={(e) => setModalInputs(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    메모
                  </label>
                  <textarea
                    value={modalInputs.note}
                    onChange={(e) => setModalInputs(prev => ({ ...prev, note: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="스케줄에 대한 메모를 입력하세요"
                  />
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-600 mb-4">
                  이 스케줄을 삭제하시겠습니까?
                </p>
                <p className="text-sm text-gray-500">
                  {scheduleModal.schedule?.scheduled_start?.substring(0, 5)} - {scheduleModal.schedule?.scheduled_end?.substring(0, 5)}
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={closeScheduleModal}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                {scheduleModal.mode === 'overview' ? '닫기' : '취소'}
              </button>
              {scheduleModal.mode !== 'overview' && (
                <button
                  onClick={handleScheduleAction}
                  disabled={updating !== null}
                  className={`px-4 py-2 text-white rounded-md ${
                    scheduleModal.mode === 'delete' 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {updating ? '처리 중...' : 
                   scheduleModal.mode === 'add' ? '추가' : 
                   scheduleModal.mode === 'edit' ? '수정' : '삭제'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
