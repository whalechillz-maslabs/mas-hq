'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function InsertAttendancePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [employees, setEmployees] = useState([]);
  const [showEmployeeSelect, setShowEmployeeSelect] = useState(false);
  
  // 근무 시간 설정 옵션
  const [workStartTime, setWorkStartTime] = useState('09:00');
  const [workEndTime, setWorkEndTime] = useState('17:30');
  const [lunchStartTime, setLunchStartTime] = useState('12:00');
  const [lunchEndTime, setLunchEndTime] = useState('13:00');
  const [customWorkHours, setCustomWorkHours] = useState(false);

  // 컴포넌트 마운트 시 직원 목록 조회
  useEffect(() => {
    loadEmployees();
    // 오늘 날짜를 기본값으로 설정
    setSelectedDate(format(new Date(), 'yyyy-MM-dd'));
  }, []);

  // 직원 목록 조회
  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          id, 
          name, 
          employee_id, 
          department_id,
          departments!inner(name)
        `)
        .order('name');
      
      if (error) throw error;
      
      // 데이터 구조 변환
      const formattedEmployees = (data || []).map(emp => ({
        id: emp.id,
        name: emp.name,
        employee_id: emp.employee_id,
        department: emp.departments?.name || '부서 미지정'
      }));
      
      setEmployees(formattedEmployees);
    } catch (error: any) {
      setMessage(`직원 목록 조회 오류: ${error.message}`);
      setMessageType('error');
    }
  };

  // 동적 스케줄 생성 함수
  const generateSchedules = (startTime: string, endTime: string, lunchStart: string, lunchEnd: string, date: string) => {
    const schedules = [];
    
    // 시간을 분으로 변환하는 함수
    const timeToMinutes = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };
    
    // 분을 시간으로 변환하는 함수
    const minutesToTime = (minutes: number) => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    };
    
    const startMinutes = timeToMinutes(startTime);
    const endMinutes = timeToMinutes(endTime);
    const lunchStartMinutes = timeToMinutes(lunchStart);
    const lunchEndMinutes = timeToMinutes(lunchEnd);
    
    // 오전 근무 (시작시간 ~ 점심시작시간)
    for (let current = startMinutes; current < lunchStartMinutes; current += 30) {
      const next = Math.min(current + 30, lunchStartMinutes);
      schedules.push({
        start: minutesToTime(current),
        end: minutesToTime(next),
        actual_start: `${date}T${minutesToTime(current)}:00+09:00`,
        actual_end: `${date}T${minutesToTime(next)}:00+09:00`
      });
    }
    
    // 오후 근무 (점심종료시간 ~ 종료시간)
    for (let current = lunchEndMinutes; current < endMinutes; current += 30) {
      const next = Math.min(current + 30, endMinutes);
      schedules.push({
        start: minutesToTime(current),
        end: minutesToTime(next),
        actual_start: `${date}T${minutesToTime(current)}:00+09:00`,
        actual_end: `${date}T${minutesToTime(next)}:00+09:00`
      });
    }
    
    return schedules;
  };

  const insertCorrectAttendance = async () => {
    try {
      // 유효성 검사
      if (!selectedEmployee) {
        setMessage('❌ 직원을 선택해주세요.');
        setMessageType('error');
        return;
      }
      
      if (!selectedDate) {
        setMessage('❌ 날짜를 선택해주세요.');
        setMessageType('error');
        return;
      }

      setIsLoading(true);
      setMessage('🚀 정확한 출근 데이터 입력 시작...');
      setMessageType('info');

      // 1. 선택된 직원의 UUID 조회
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('id')
        .eq('id', selectedEmployee)
        .single();

      if (employeeError || !employee) {
        throw new Error('선택된 직원을 찾을 수 없습니다.');
      }

      // 2. 기존 선택된 날짜 데이터 삭제
      setMessage('🗑️ 기존 데이터 삭제 중...');
      const { error: deleteError } = await supabase
        .from('schedules')
        .delete()
        .eq('schedule_date', selectedDate)
        .eq('employee_id', employee.id);

      if (deleteError) {
        throw new Error(`기존 데이터 삭제 오류: ${deleteError.message}`);
      }

      // 3. 정시 출근/퇴근 데이터 입력
      setMessage('📝 정시 출근/퇴근 데이터 입력 중...');
      
      // 동적으로 스케줄 생성
      const schedules = generateSchedules(workStartTime, workEndTime, lunchStartTime, lunchEndTime, selectedDate);

      for (const schedule of schedules) {
                 const { error: insertError } = await supabase
           .from('schedules')
           .insert({
             employee_id: employee.id,
             schedule_date: selectedDate,
             scheduled_start: schedule.start,
             scheduled_end: schedule.end,
             actual_start: schedule.actual_start,
             actual_end: schedule.actual_end,
             status: 'completed',
             total_hours: 0.5
           });

        if (insertError) {
          throw new Error(`스케줄 입력 오류: ${insertError.message}`);
        }
      }

      // 4. 입력된 데이터 확인
      setMessage('🔍 입력된 데이터 확인 중...');
             const { data: insertedData, error: selectError } = await supabase
         .from('schedules')
         .select(`
           schedule_date,
           scheduled_start,
           scheduled_end,
           actual_start,
           actual_end,
           total_hours,
           status
         `)
         .eq('schedule_date', selectedDate)
         .eq('employee_id', employee.id)
         .order('scheduled_start');

      if (selectError) {
        throw new Error(`데이터 조회 오류: ${selectError.message}`);
      }

      const totalHours = insertedData.reduce((sum, record) => sum + record.total_hours, 0);
      
      setMessage(`🎉 정확한 출근 데이터 입력 완료! 총 ${insertedData.length}개 스케줄, ${totalHours}시간`);
      setMessageType('success');

    } catch (error: any) {
      setMessage(`❌ 오류 발생: ${error.message}`);
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            📝 출근 데이터 입력 관리
          </h1>

          <div className="space-y-6">
            {/* 현재 상태 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-blue-900 mb-4 flex items-center">
                <Clock className="h-6 w-6 mr-2" />
                현재 상황
              </h2>
              <div className="space-y-2 text-blue-800">
                <p>• 직원의 출근 데이터가 부정확하거나 누락된 경우</p>
                <p>• "실제 근무 시간"이 음수로 표시되는 문제</p>
                <p>• "시간 차이"가 부정확하게 계산되는 문제</p>
                <p>• 정시 출근/퇴근 데이터를 수동으로 입력해야 하는 경우</p>
                <p>• 점심시간을 제외한 정확한 근무 시간 데이터 필요</p>
                <p>• 테스트 데이터 삭제 후 정확한 데이터로 교체</p>
              </div>
            </div>

            {/* 직원 및 날짜 선택 */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">👤 직원 및 날짜 선택</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                {/* 직원 선택 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    직원 선택
                  </label>
                  <select
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">직원을 선택하세요</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.employee_id}) - {emp.department}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* 날짜 선택 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    날짜 선택
                  </label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              {/* 근무 시간 설정 */}
              <div className="mb-4">
                <div className="flex items-center mb-3">
                  <input
                    type="checkbox"
                    id="customWorkHours"
                    checked={customWorkHours}
                    onChange={(e) => setCustomWorkHours(e.target.checked)}
                    className="mr-2"
                  />
                  <label htmlFor="customWorkHours" className="text-sm font-medium text-gray-700">
                    근무 시간 커스터마이징
                  </label>
                </div>
                
                {customWorkHours && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        출근 시간
                      </label>
                      <input
                        type="time"
                        value={workStartTime}
                        onChange={(e) => setWorkStartTime(e.target.value)}
                        className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        퇴근 시간
                      </label>
                      <input
                        type="time"
                        value={workEndTime}
                        onChange={(e) => setWorkEndTime(e.target.value)}
                        className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        점심 시작
                      </label>
                      <input
                        type="time"
                        value={lunchStartTime}
                        onChange={(e) => setLunchStartTime(e.target.value)}
                        className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        점심 종료
                      </label>
                      <input
                        type="time"
                        value={lunchEndTime}
                        onChange={(e) => setLunchEndTime(e.target.value)}
                        className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>
              
              {/* 데이터 입력 버튼 */}
              <div className="text-center">
                <button
                  onClick={insertCorrectAttendance}
                  disabled={isLoading || !selectedEmployee || !selectedDate}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-8 py-4 rounded-xl text-xl font-bold disabled:opacity-50 shadow-lg transform hover:scale-105 transition-all"
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                      처리중...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <CheckCircle className="h-6 w-6 mr-3" />
                      정시 출근/퇴근 데이터 입력
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* 메시지 표시 */}
            {message && (
              <div className={`p-4 rounded-lg border ${
                messageType === 'success' 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : messageType === 'error'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}>
                <div className="flex items-center">
                  {messageType === 'success' ? (
                    <CheckCircle className="h-5 w-5 mr-2" />
                  ) : messageType === 'error' ? (
                    <AlertCircle className="h-5 w-5 mr-2" />
                  ) : (
                    <Clock className="h-5 w-5 mr-2" />
                  )}
                  <span className="font-medium">{message}</span>
                </div>
              </div>
            )}

            {/* 입력될 데이터 미리보기 */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 입력될 데이터 미리보기</h3>
              {selectedEmployee && selectedDate ? (
                <div>
                  {(() => {
                    const previewSchedules = generateSchedules(workStartTime, workEndTime, lunchStartTime, lunchEndTime, selectedDate);
                    const morningSchedules = previewSchedules.filter(s => s.start < lunchStartTime);
                    const afternoonSchedules = previewSchedules.filter(s => s.start >= lunchEndTime);
                    const totalHours = previewSchedules.length * 0.5;
                    
                    return (
                      <div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-white p-4 rounded-lg border">
                            <h4 className="font-semibold text-blue-600 mb-2">
                              오전 근무 ({workStartTime}-{lunchStartTime})
                            </h4>
                            <p className="text-sm text-gray-600">
                              {morningSchedules.length * 0.5}시간, {morningSchedules.length}개 스케줄
                            </p>
                            <p className="text-xs text-gray-500">정시 출근 → 점심 시작</p>
                          </div>
                          <div className="bg-white p-4 rounded-lg border">
                            <h4 className="font-semibold text-green-600 mb-2">
                              오후 근무 ({lunchEndTime}-{workEndTime})
                            </h4>
                            <p className="text-sm text-gray-600">
                              {afternoonSchedules.length * 0.5}시간, {afternoonSchedules.length}개 스케줄
                            </p>
                            <p className="text-xs text-gray-500">점심 종료 → 정시 퇴근</p>
                          </div>
                        </div>
                        <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                          <p className="text-sm text-blue-800 font-medium">
                            💡 총 근무시간: {totalHours}시간 ({previewSchedules.length}개 30분 스케줄)
                          </p>
                          <p className="text-xs text-blue-600 mt-1">
                            점심시간 {lunchStartTime}-{lunchEndTime} 제외
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>직원과 날짜를 선택하면 미리보기가 표시됩니다.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
