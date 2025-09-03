'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, supabase } from '@/lib/supabase';
import { 
  Clock, MapPin, Users, Calendar, Filter, Download,
  Search, Eye, CheckCircle, XCircle, AlertCircle,
  TrendingUp, BarChart3, Download as DownloadIcon
} from 'lucide-react';

interface AttendanceRecord {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_id_code: string;
  department: string;
  position: string;
  schedule_date: string;
  actual_start: string;
  actual_end: string;
  total_hours: number;
  overtime_hours: number;
  status: 'confirmed' | 'completed' | 'pending';
  check_in_location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  check_out_location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  employee_note?: string;
  manager_note?: string;
}

export default function AttendanceManagementPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    checkAuth();
    loadData();
  }, [selectedDate, selectedDepartment]);

  const checkAuth = async () => {
    const user = await auth.getCurrentUser();
    console.log('Current user:', user); // 디버깅용
    console.log('User ID:', user?.id);
    console.log('User employee_id:', user?.employee_id);
    console.log('User name:', user?.name);
    console.log('User role_id:', user?.role_id);
    
    if (!user) {
      router.push('/login');
      return;
    }
    
    // 관리자/매니저 권한 확인
    const isManager = user.role_id === 'admin' || 
                     user.role_id === 'manager' ||
                     user.employee_id === 'MASLABS-001' ||
                     user.name === '시스템 관리자' ||
                     user.name === '김탁수' ||
                     user.employee_id === 'WHA';
    
    if (!isManager) {
      alert('관리자 또는 매니저 권한이 필요합니다.');
      router.push('/dashboard');
      return;
    }
    
    setCurrentUser(user);
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      console.log("출근 데이터 로딩 시작...", { selectedDate });
      
      // 실제 데이터베이스에서 스케줄 데이터 가져오기
      const { data: schedules, error: schedulesError } = await supabase
        .from("schedules")
        .select(`
          id,
          employee_id,
          schedule_date,
          scheduled_start,
          scheduled_end,
          actual_start,
          actual_end,
          status,
          employee_note
        `)
        .eq("schedule_date", selectedDate);
      
      console.log("스케줄 데이터 결과:", { schedules, schedulesError });
      
      if (schedulesError) {
        console.error("스케줄 데이터 로딩 오류:", schedulesError);
        setAttendanceRecords([]);
        return;
      }
      
      if (!schedules || schedules.length === 0) {
        console.log("스케줄 데이터 없음");
        setAttendanceRecords([]);
        return;
      }
      
      // 직원 정보 가져오기
      const employeeIds = schedules.map(s => s.employee_id);
      console.log("직원 ID 목록:", employeeIds);
      
      const { data: employees, error: employeesError } = await supabase
        .from("employees")
        .select(`
          id,
          name,
          employee_id,
          departments(name),
          positions(name)
        `)
        .in("id", employeeIds);
      
      console.log("직원 데이터 결과:", { employees, employeesError });
      
      if (employeesError) {
        console.error("직원 데이터 로딩 오류:", employeesError);
        setAttendanceRecords([]);
        return;
      }
      
      // 직원별로 스케줄을 그룹화하여 중복 제거
      const employeeScheduleMap = new Map();
      
      schedules.forEach(schedule => {
        const employee = employees?.find(emp => emp.id === schedule.employee_id);
        if (!employee) return;
        
        const employeeKey = schedule.employee_id;
        
        if (!employeeScheduleMap.has(employeeKey)) {
          // 새로운 직원의 첫 번째 스케줄
          employeeScheduleMap.set(employeeKey, {
            id: schedule.id,
            employee_id: schedule.employee_id,
            employee_name: employee.name,
            employee_id_code: employee.employee_id,
            department: employee.departments?.[0]?.name || "미지정",
            position: employee.positions?.[0]?.name || "미지정",
            schedule_date: schedule.schedule_date,
            actual_start: schedule.actual_start ? schedule.actual_start : 
                         schedule.scheduled_start ? `${selectedDate}T${schedule.scheduled_start}` : null,
            actual_end: schedule.actual_end ? schedule.actual_end : 
                       schedule.scheduled_end ? `${selectedDate}T${schedule.scheduled_end}` : null,
            total_hours: schedule.actual_start && schedule.actual_end ? 
              calculateHours(schedule.actual_start.split('T')[1], schedule.actual_end.split('T')[1]) : 
              schedule.scheduled_start && schedule.scheduled_end ?
              calculateHours(schedule.scheduled_start, schedule.scheduled_end) : 0,
            overtime_hours: 0,
            status: schedule.status === "checked_out" ? "completed" : 
                    schedule.status === "checked_in" ? "confirmed" : "pending",
            employee_note: schedule.employee_note || "",
            schedule_count: 1 // 스케줄 개수
          });
        } else {
          // 기존 직원의 추가 스케줄 - 시간을 합산하고 상태를 업데이트
          const existingRecord = employeeScheduleMap.get(employeeKey);
          const currentHours = schedule.actual_start && schedule.actual_end ? 
            calculateHours(schedule.actual_start.split('T')[1], schedule.actual_end.split('T')[1]) : 
            schedule.scheduled_start && schedule.scheduled_end ?
            calculateHours(schedule.scheduled_start, schedule.scheduled_end) : 0;
          
          existingRecord.total_hours += currentHours;
          existingRecord.schedule_count += 1;
          
          // 상태 우선순위: completed > confirmed > pending
          if (schedule.status === "checked_out" || existingRecord.status === "completed") {
            existingRecord.status = "completed";
          } else if (schedule.status === "checked_in" || existingRecord.status === "confirmed") {
            existingRecord.status = "confirmed";
          }
          
          // 노트가 있으면 추가
          if (schedule.employee_note) {
            existingRecord.employee_note += existingRecord.employee_note ? ` | ${schedule.employee_note}` : schedule.employee_note;
          }
        }
      });
      
      // Map을 배열로 변환
      const attendanceRecords: AttendanceRecord[] = Array.from(employeeScheduleMap.values());
      
      console.log("중복 제거된 출근 기록:", attendanceRecords);
      setAttendanceRecords(attendanceRecords);
    } catch (error) {
      console.error("출근 데이터 로딩 중 오류:", error);
      setAttendanceRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 시간 계산 함수 추가
  const calculateHours = (startTime: string, endTime: string): number => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const diffMs = end.getTime() - start.getTime();
    return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return '-';
    return new Date(timeString).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'confirmed': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'confirmed': return <Clock className="w-4 h-4" />;
      case 'pending': return <AlertCircle className="w-4 h-4" />;
      default: return <XCircle className="w-4 h-4" />;
    }
  };

  // 실제 출근/퇴근 시간을 기반으로 상태를 판정하는 함수
  const getActualStatus = (record: AttendanceRecord) => {
    // 출근 시간과 퇴근 시간이 모두 있는 경우
    if (record.actual_start && record.actual_end) {
      const startTime = new Date(record.actual_start);
      const endTime = new Date(record.actual_end);
      
      // 현재 시간
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // 출근 날짜가 오늘인지 확인
      const startDate = new Date(startTime.getFullYear(), startTime.getMonth(), startTime.getDate());
      
      if (startDate.getTime() === today.getTime()) {
        // 오늘 출근한 경우
        if (endTime < now) {
          return 'completed'; // 퇴근 완료
        } else {
          return 'confirmed'; // 근무 중
        }
      } else {
        // 다른 날 출근한 경우
        return 'completed'; // 완료된 근무
      }
    }
    
    // 출근 시간만 있고 퇴근 시간이 없는 경우
    if (record.actual_start && !record.actual_end) {
      return 'confirmed'; // 근무 중
    }
    
    // 출근 시간이 없는 경우
    if (!record.actual_start) {
      return 'pending'; // 미출근
    }
    
    // 기본값
    return 'pending';
  };

  // 상태 텍스트를 한글로 변환하는 함수
  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '완료';
      case 'confirmed': return '근무중';
      case 'pending': return '미출근';
      default: return '미출근';
    }
  };

  const filteredRecords = attendanceRecords.filter(record => {
    const matchesSearch = record.employee_name.includes(searchTerm) || 
                         record.employee_id_code.includes(searchTerm);
    const matchesDepartment = selectedDepartment === 'all' || 
                             record.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  if (isLoading) {
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
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="mr-4 p-2 rounded-lg hover:bg-gray-100 flex items-center"
              >
                <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                뒤로가기
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">출근 관리</h1>
                <p className="text-gray-600">직원들의 출근체크 위치/시간 확인 및 관리</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center">
                <DownloadIcon className="w-4 h-4 mr-2" />
                엑셀 다운로드
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 필터 및 검색 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">날짜</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">부서</label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">전체 부서</option>
                <option value="마쓰구">마쓰구</option>
                <option value="싱싱">싱싱</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">검색</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="이름 또는 사번"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="flex items-end">
              <button
                onClick={loadData}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                <Filter className="w-4 h-4 inline mr-2" />
                필터 적용
              </button>
            </div>
          </div>
        </div>

        {/* 통계 요약 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">출근 완료</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredRecords.filter(r => getActualStatus(r) === 'completed').length}명
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">근무 중</p>
                <p className="text-2xl font-bold text-blue-600">
                  {filteredRecords.filter(r => getActualStatus(r) === 'confirmed').length}명
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">미출근</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {filteredRecords.filter(r => getActualStatus(r) === 'pending').length}명
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">평균 근무시간</p>
                <p className="text-2xl font-bold text-purple-600">
                  {Math.round(filteredRecords.reduce((sum, r) => sum + r.total_hours, 0) / Math.max(filteredRecords.length, 1) * 10) / 10}시간
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 출근 기록 테이블 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">출근 기록</h3>
            <p className="text-sm text-gray-600 mt-1">총 {filteredRecords.length}명의 기록</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    직원 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    출근 시간
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    퇴근 시간
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
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-indigo-600">
                              {record.employee_name.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{record.employee_name}</div>
                          <div className="text-sm text-gray-500">{record.employee_id_code}</div>
                          <div className="text-sm text-gray-500">{record.department} - {record.position}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatTime(record.actual_start)}</div>
                      {record.check_in_location && (
                        <div className="text-xs text-gray-500 flex items-center mt-1">
                          <MapPin className="w-3 h-3 mr-1" />
                          {record.check_in_location.address}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{formatTime(record.actual_end)}</div>
                      {record.check_out_location && (
                        <div className="text-xs text-gray-500 flex items-center mt-1">
                          <MapPin className="w-3 h-3 mr-1" />
                          {record.check_out_location.address}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {record.total_hours > 0 ? `${record.total_hours}시간` : '-'}
                      </div>
                      {record.overtime_hours > 0 && (
                        <div className="text-xs text-orange-600">
                          연장: {record.overtime_hours}시간
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {record.check_in_location ? (
                        <div className="text-xs text-gray-600">
                          <div>위도: {record.check_in_location.latitude.toFixed(6)}</div>
                          <div>경도: {record.check_in_location.longitude.toFixed(6)}</div>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500">위치 없음</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(getActualStatus(record))}`}>
                        {getStatusIcon(getActualStatus(record))}
                        <span className="ml-1">
                          {getStatusText(getActualStatus(record))}
                        </span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        <BarChart3 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
