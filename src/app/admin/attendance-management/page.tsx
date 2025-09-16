'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, supabase } from '@/lib/supabase';
import { 
  Clock, MapPin, Users, Calendar, Filter, Download,
  Search, Eye, CheckCircle, XCircle, AlertCircle,
  TrendingUp, BarChart3, Download as DownloadIcon,
  Coffee, Edit3, Save, X
} from 'lucide-react';

interface AttendanceRecord {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_id_code: string;
  employment_type: string;
  schedule_date: string;
  scheduled_start: string;
  scheduled_end: string;
  actual_start: string | null;
  actual_end: string | null;
  break_minutes: number;
  total_hours: number;
  overtime_hours: number;
  status: string;
  employee_note: string;
  manager_note: string;
  schedule_count: number;
  first_schedule_start: string;
  last_schedule_end: string;
}

export default function AttendanceManagementPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingRecord, setEditingRecord] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    checkInTime: '',
    checkOutTime: ''
  });

  // 한국 시간 기준으로 오늘 날짜 설정
  const getKoreaToday = () => {
    const now = new Date();
    const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
    return koreaTime.toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState(getKoreaToday());
  const [selectedDepartment, setSelectedDepartment] = useState('전체 부서');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser, selectedDate]);

  const checkUser = async () => {
    try {
      // localStorage 기반 인증 확인
      if (typeof window === 'undefined') return;
      
      const isLoggedIn = localStorage.getItem('isLoggedIn');
      const currentEmployee = localStorage.getItem('currentEmployee');
      
      if (!isLoggedIn || !currentEmployee) {
        router.push('/login');
        return;
      }
      
      const employee = JSON.parse(currentEmployee);
      
      // 관리자 권한 확인
      if (employee.role !== 'admin' && 
          employee.role !== 'manager' &&
          employee.name !== '김탁수') {
        router.push('/dashboard');
        return;
      }
      
      setCurrentUser(employee);
    } catch (error) {
      console.error('사용자 확인 오류:', error);
      router.push('/login');
    }
  };

  // 관리자가 출근/퇴근 시간을 수정하는 함수
  const updateAttendanceTime = async (employeeId: string, date: string, checkInTime: string, checkOutTime: string) => {
    try {
      console.log(`🔄 출근/퇴근 시간 수정: ${employeeId}, ${date}, ${checkInTime}, ${checkOutTime}`);
      
      // 근무 시간 계산
      let totalHours = 0;
      if (checkInTime && checkOutTime) {
        const startTime = new Date(`2000-01-01T${checkInTime}`);
        const endTime = new Date(`2000-01-01T${checkOutTime}`);
        totalHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      }
      
      // attendance 테이블 업데이트 또는 생성
      const { error: updateError } = await supabase
        .from('attendance')
        .upsert({
          employee_id: employeeId,
          date: date,
          check_in_time: checkInTime,
          check_out_time: checkOutTime,
          total_hours: totalHours,
          overtime_hours: 0,
          status: checkOutTime ? 'completed' : 'confirmed',
          auto_checkout: false,
          updated_at: new Date().toISOString()
        });
      
      if (updateError) {
        console.error('❌ 출근/퇴근 시간 수정 실패:', updateError);
        throw updateError;
      } else {
        console.log('✅ 출근/퇴근 시간 수정 완료');
        // 데이터 다시 로드
        loadData();
      }
    } catch (error) {
      console.error('출근/퇴근 시간 수정 오류:', error);
      throw error;
    }
  };

  // 편집 모드 시작
  const startEdit = (record: AttendanceRecord) => {
    setEditingRecord(record.employee_id);
    setEditForm({
      checkInTime: record.actual_start ? record.actual_start.split('T')[1]?.substring(0, 5) || '' : '',
      checkOutTime: record.actual_end ? record.actual_end.split('T')[1]?.substring(0, 5) || '' : ''
    });
  };

  // 편집 취소
  const cancelEdit = () => {
    setEditingRecord(null);
    setEditForm({ checkInTime: '', checkOutTime: '' });
  };

  // 편집 저장
  const saveEdit = async (record: AttendanceRecord) => {
    try {
      await updateAttendanceTime(
        record.employee_id,
        record.schedule_date,
        editForm.checkInTime,
        editForm.checkOutTime
      );
      setEditingRecord(null);
      setEditForm({ checkInTime: '', checkOutTime: '' });
    } catch (error) {
      console.error('편집 저장 실패:', error);
      alert('출근/퇴근 시간 수정에 실패했습니다.');
    }
  };

  // 상세보기 함수
  const viewDetails = (record: AttendanceRecord) => {
    const details = `
직원 정보:
- 이름: ${record.employee_name}
- 사번: ${record.employee_id_code}
- 고용형태: ${record.employment_type}

출근 정보:
- 스케줄: ${record.scheduled_start ? formatTime(record.scheduled_start) : '-'} ~ ${record.scheduled_end ? formatTime(record.scheduled_end) : '-'}
- 실제 출근: ${formatTime(record.actual_start)}
- 실제 퇴근: ${formatTime(record.actual_end)}
- 근무 시간: ${record.total_hours > 0 ? formatWorkTime(record.total_hours) : '-'}
- 상태: ${getStatusText(getActualStatus(record))}

위치 정보:
- 위치 추적: 비활성화됨
    `;
    alert(details);
  };

  // 통계보기 함수
  const viewStatistics = (record: AttendanceRecord) => {
    const stats = `
${record.employee_name} 통계 정보:

오늘 근무 현황:
- 출근 시간: ${formatTime(record.actual_start)}
- 퇴근 시간: ${formatTime(record.actual_end)}
- 총 근무시간: ${record.total_hours > 0 ? formatWorkTime(record.total_hours) : '-'}
- 상태: ${getStatusText(getActualStatus(record))}

참고: 상세한 월별/주별 통계는 추후 구현 예정입니다.
    `;
    alert(stats);
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      console.log("출근 데이터 로딩 시작...", { selectedDate });

      // 1. 스케줄 데이터 조회
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('schedules')
        .select(`
          *,
          employees!schedules_employee_id_fkey (
            id,
            name,
            employee_id,
            employment_type
          )
        `)
        .eq('schedule_date', selectedDate)
        .order('scheduled_start', { ascending: true });

      if (scheduleError) {
        console.error('스케줄 데이터 조회 오류:', scheduleError);
        throw scheduleError;
      }

      console.log(`📅 ${selectedDate} 스케줄 데이터:`, scheduleData?.length || 0);

      // 2. 출근 데이터 조회
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('*')
        .eq('date', selectedDate);

      if (attendanceError) {
        console.error('출근 데이터 조회 오류:', attendanceError);
        throw attendanceError;
      }

      console.log(`📊 ${selectedDate} 출근 데이터:`, attendanceData?.length || 0);

      // 3. 데이터 변환 및 병합
      const employeeMap = new Map();
      
      // 스케줄 데이터 처리
      if (scheduleData) {
        scheduleData.forEach(schedule => {
          const employee = schedule.employees;
          if (!employee) return;

          const employeeKey = schedule.employee_id;
          
          if (!employeeMap.has(employeeKey)) {
            employeeMap.set(employeeKey, {
              id: schedule.id,
              employee_id: schedule.employee_id,
              employee_name: employee.name,
              employee_id_code: employee.employee_id,
              employment_type: employee.employment_type || "미지정",
              schedule_date: schedule.schedule_date,
              scheduled_start: schedule.scheduled_start,
              scheduled_end: schedule.scheduled_end,
              actual_start: schedule.actual_start,
              actual_end: schedule.actual_end,
              break_minutes: schedule.break_minutes || 0,
              total_hours: 0,
              overtime_hours: 0,
              status: schedule.status || 'pending',
              employee_note: schedule.employee_note || "",
              manager_note: schedule.manager_note || "",
              schedule_count: 1,
              first_schedule_start: schedule.scheduled_start,
              last_schedule_end: schedule.scheduled_end
            });
          } else {
            const existing = employeeMap.get(employeeKey);
            existing.schedule_count += 1;
            existing.last_schedule_end = schedule.scheduled_end;
          }
        });
      }

      // 출근 데이터와 병합
      if (attendanceData) {
        for (const attendance of attendanceData) {
          const employeeKey = attendance.employee_id;
          
          if (employeeMap.has(employeeKey)) {
            const record = employeeMap.get(employeeKey);
            record.actual_start = attendance.check_in_time ? `${selectedDate}T${attendance.check_in_time}` : null;
            record.actual_end = attendance.check_out_time ? `${selectedDate}T${attendance.check_out_time}` : null;
            record.total_hours = attendance.total_hours || 0;
            record.overtime_hours = attendance.overtime_hours || 0;
            record.status = attendance.status || record.status;
          } else {
            // 출근 데이터만 있고 스케줄이 없는 경우
            const { data: employee } = await supabase
              .from('employees')
              .select('name, employee_id, employment_type')
              .eq('id', attendance.employee_id)
              .single();

            if (employee) {
              employeeMap.set(employeeKey, {
                id: attendance.id,
                employee_id: attendance.employee_id,
                employee_name: employee.name,
                employee_id_code: employee.employee_id,
                employment_type: employee.employment_type || "미지정",
                schedule_date: selectedDate,
                scheduled_start: null,
                scheduled_end: null,
                actual_start: attendance.check_in_time ? `${selectedDate}T${attendance.check_in_time}` : null,
                actual_end: attendance.check_out_time ? `${selectedDate}T${attendance.check_out_time}` : null,
                break_minutes: 0,
                total_hours: attendance.total_hours || 0,
                overtime_hours: attendance.overtime_hours || 0,
                status: attendance.status || 'pending',
                employee_note: "",
                manager_note: "",
                schedule_count: 0,
                first_schedule_start: null,
                last_schedule_end: null
              });
            }
          }
        }
      }

      const records = Array.from(employeeMap.values());
      setAttendanceRecords(records);
      console.log('✅ 출근 데이터 로딩 완료:', records.length);

    } catch (error) {
      console.error("출근 데이터 로딩 중 오류:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 시간 포맷팅 함수
  const formatTime = (timeString: string | null) => {
    if (!timeString) return '-';
    
    // 시간만 있는 경우 (HH:MM:SS 형식)
    if (timeString.match(/^\d{2}:\d{2}:\d{2}$/)) {
      return timeString.substring(0, 5); // HH:MM만 반환
    }
    
    // ISO 날짜 형식인 경우 - 이미 한국 시간이므로 추가 변환 불필요
    try {
      const date = new Date(timeString);
      
      // 이미 한국 시간이므로 추가 변환 없이 바로 시간 추출
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      
      return `${hours}:${minutes}`;
    } catch (error) {
      console.error('시간 변환 오류:', error, timeString);
      return timeString; // 파싱 실패 시 원본 반환
    }
  };

  // 근무 시간 포맷팅 함수
  const formatWorkTime = (hours: number) => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}h ${minutes}m`;
  };

  // 스케줄 시간 포맷팅 함수
  const formatScheduleDuration = (start: string, end: string) => {
    if (!start || !end) return '-';
    
    try {
      const startTime = new Date(`2000-01-01T${start}`);
      const endTime = new Date(`2000-01-01T${end}`);
      const diffMs = endTime.getTime() - startTime.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      
      return `${Math.round(diffHours)}h`;
    } catch (error) {
      return '-';
    }
  };

  // 상태 확인 함수
  const getActualStatus = (record: AttendanceRecord) => {
    if (!record.actual_start) return 'not_checked_in';
    if (!record.actual_end) return 'working';
    return 'completed';
  };

  // 상태별 스타일
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'working': return 'text-blue-600 bg-blue-100';
      case 'break': return 'text-orange-600 bg-orange-100';
      case 'not_checked_in': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // 상태별 아이콘
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'working': return <Clock className="w-4 h-4" />;
      case 'break': return <Coffee className="w-4 h-4" />;
      case 'not_checked_in': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  // 상태별 텍스트
  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '완료';
      case 'working': return '근무중';
      case 'break': return '휴식중';
      case 'not_checked_in': return '미출근';
      default: return '대기';
    }
  };

  // 필터링된 데이터
  const filteredRecords = attendanceRecords.filter(record => {
    const matchesSearch = !searchTerm || 
      record.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.employee_id_code.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  // 통계 계산
  const completedCount = filteredRecords.filter(r => getActualStatus(r) === 'completed').length;
  const workingCount = filteredRecords.filter(r => getActualStatus(r) === 'working').length;
  const breakCount = 0; // 휴식 상태는 별도 로직으로 처리
  const notCheckedInCount = filteredRecords.filter(r => getActualStatus(r) === 'not_checked_in').length;
  
  const avgHours = filteredRecords.length > 0 
    ? filteredRecords.reduce((sum, r) => sum + r.total_hours, 0) / filteredRecords.length 
    : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">출근 관리</h1>
              <p className="mt-2 text-gray-600">직원들의 출근체크 위치/시간 확인 및 관리</p>
            </div>
            <div className="flex space-x-3">
              <button className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors">
                디버그 보기
              </button>
              <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
                엑셀 다운로드
              </button>
            </div>
          </div>
        </div>

        {/* 필터 섹션 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">날짜</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">부서</label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="전체 부서">전체 부서</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">검색</label>
              <input
                type="text"
                placeholder="이름 또는 사번"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={loadData}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                필터 적용
              </button>
            </div>
          </div>
        </div>

        {/* 요약 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">출근 완료</p>
                <p className="text-2xl font-bold text-green-600">{completedCount}명</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">근무 중</p>
                <p className="text-2xl font-bold text-blue-600">{workingCount}명</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Coffee className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">휴식 중</p>
                <p className="text-2xl font-bold text-orange-600">{breakCount}명</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">미출근</p>
                <p className="text-2xl font-bold text-red-600">{notCheckedInCount}명</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">평균 근무시간</p>
                <p className="text-2xl font-bold text-purple-600">
                  {avgHours > 0 ? formatWorkTime(avgHours) : '0h 0m'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 출근 기록 테이블 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">출근 기록</h2>
            <p className="text-sm text-gray-600">총 {filteredRecords.length}명의 기록</p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    직원 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    스케줄
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    실제 출근
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    점심 휴식
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    실제 퇴근
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    근무 시간
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    위치
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRecords.map((record) => {
                  const actualStatus = getActualStatus(record);
                  return (
                    <tr key={record.employee_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                {record.employee_name.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {record.employee_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {record.employee_id_code} • {record.employment_type}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {record.scheduled_start && record.scheduled_end ? (
                            <>
                              {formatTime(record.scheduled_start)} - {formatTime(record.scheduled_end)}
                              <br />
                              <span className="text-xs text-gray-500">
                                ({formatScheduleDuration(record.scheduled_start, record.scheduled_end)})
                              </span>
                            </>
                          ) : (
                            <span className="text-gray-400">---</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingRecord === record.employee_id ? (
                          <div className="text-sm text-gray-900">
                            <div className="font-medium mb-1">실제 출근</div>
                            <input
                              type="time"
                              value={editForm.checkInTime}
                              onChange={(e) => setEditForm({...editForm, checkInTime: e.target.value})}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                            />
                          </div>
                        ) : (
                          <div className="text-sm text-gray-900">
                            <div className="font-medium">실제 출근</div>
                            <div className="text-xs text-gray-500">
                              {formatTime(record.actual_start)}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">-</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingRecord === record.employee_id ? (
                          <div className="text-sm text-gray-900">
                            <div className="font-medium mb-1">실제 퇴근</div>
                            <input
                              type="time"
                              value={editForm.checkOutTime}
                              onChange={(e) => setEditForm({...editForm, checkOutTime: e.target.value})}
                              className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
                            />
                          </div>
                        ) : (
                          <div className="text-sm text-gray-900">
                            <div className="font-medium">실제 퇴근</div>
                            <div className="text-xs text-gray-500">
                              {formatTime(record.actual_end)}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {record.total_hours > 0 ? formatWorkTime(record.total_hours) : '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs text-gray-500">위치 없음</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(actualStatus)}`}>
                          {getStatusIcon(actualStatus)}
                          <span className="ml-1">{getStatusText(actualStatus)}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {editingRecord === record.employee_id ? (
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => saveEdit(record)}
                              className="text-green-600 hover:text-green-900"
                              title="저장"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={cancelEdit}
                              className="text-red-600 hover:text-red-900"
                              title="취소"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex space-x-2">
                            <button 
                              onClick={() => startEdit(record)}
                              className="text-blue-600 hover:text-blue-900"
                              title="출근/퇴근 시간 수정"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => viewDetails(record)}
                              className="text-indigo-600 hover:text-indigo-900" 
                              title="상세보기"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => viewStatistics(record)}
                              className="text-green-600 hover:text-green-900" 
                              title="통계보기"
                            >
                              <BarChart3 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}