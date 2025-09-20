'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Users, CheckCircle, XCircle, Search, Filter, Download } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { format, startOfMonth, endOfMonth, addDays, subDays } from 'date-fns';
import { ko } from 'date-fns/locale';

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
  actual_start: string | null;
  actual_end: string | null;
  employee: {
    name: string;
    employee_id: string;
  };
}

export default function BulkAttendancePage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('no-attendance');
  const [selectedSchedules, setSelectedSchedules] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    checkInTime: '',
    checkOutTime: '',
    note: ''
  });

  useEffect(() => {
    loadEmployees();
    loadSchedules();
  }, [selectedDate, selectedEmployee, filterStatus]);

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('직원 목록 로드 오류:', error);
    }
  };

  const loadSchedules = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('schedules')
        .select(`
          *,
          employee:employees!schedules_employee_id_fkey(name, employee_id)
        `)
        .eq('schedule_date', selectedDate)
        .in('status', ['approved', 'pending', 'completed']);

      if (selectedEmployee !== 'all') {
        query = query.eq('employee_id', selectedEmployee);
      }

      const { data, error } = await query;

      if (error) throw error;

      // 필터 적용
      let filteredData = data || [];
      
      if (filterStatus === 'no-attendance') {
        filteredData = filteredData.filter(schedule => !schedule.actual_start);
      } else if (filterStatus === 'partial-attendance') {
        filteredData = filteredData.filter(schedule => 
          schedule.actual_start && !schedule.actual_end
        );
      } else if (filterStatus === 'completed') {
        filteredData = filteredData.filter(schedule => 
          schedule.actual_start && schedule.actual_end
        );
      }

      setSchedules(filteredData);
    } catch (error) {
      console.error('스케줄 로드 오류:', error);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedSchedules.length === schedules.length) {
      setSelectedSchedules([]);
    } else {
      setSelectedSchedules(schedules.map(s => s.id));
    }
  };

  const handleSelectSchedule = (scheduleId: string) => {
    setSelectedSchedules(prev => 
      prev.includes(scheduleId) 
        ? prev.filter(id => id !== scheduleId)
        : [...prev, scheduleId]
    );
  };

  const handleBulkCheckIn = async () => {
    if (selectedSchedules.length === 0) {
      alert('선택된 스케줄이 없습니다.');
      return;
    }

    if (!confirm(`선택된 ${selectedSchedules.length}개 스케줄에 출근 체크를 적용하시겠습니까?`)) {
      return;
    }

    setProcessing(true);
    try {
      const now = new Date().toISOString();
      
      // 선택된 스케줄들에 출근 시간 설정
      const { error: scheduleError } = await supabase
        .from('schedules')
        .update({ 
          actual_start: now,
          status: 'in_progress',
          updated_at: now
        })
        .in('id', selectedSchedules);

      if (scheduleError) throw scheduleError;

      // attendance 테이블에도 기록
      const scheduleData = schedules.filter(s => selectedSchedules.includes(s.id));
      const attendanceRecords = scheduleData.map(schedule => ({
        employee_id: schedule.employee_id,
        date: schedule.schedule_date,
        check_in_time: now,
        check_in_location: null,
        created_at: now,
        updated_at: now
      }));

      const { error: attendanceError } = await supabase
        .from('attendance')
        .upsert(attendanceRecords, { 
          onConflict: 'employee_id,date',
          ignoreDuplicates: false 
        });

      if (attendanceError) throw attendanceError;

      alert(`✅ ${selectedSchedules.length}개 스케줄에 출근 체크가 완료되었습니다!`);
      setSelectedSchedules([]);
      await loadSchedules();
    } catch (error: any) {
      console.error('일괄 출근 체크 오류:', error);
      alert(`일괄 출근 체크 실패: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkCheckOut = async () => {
    if (selectedSchedules.length === 0) {
      alert('선택된 스케줄이 없습니다.');
      return;
    }

    if (!confirm(`선택된 ${selectedSchedules.length}개 스케줄에 퇴근 체크를 적용하시겠습니까?`)) {
      return;
    }

    setProcessing(true);
    try {
      const now = new Date().toISOString();
      
      // 선택된 스케줄들에 퇴근 시간 설정
      const { error: scheduleError } = await supabase
        .from('schedules')
        .update({ 
          actual_end: now,
          status: 'completed',
          updated_at: now
        })
        .in('id', selectedSchedules);

      if (scheduleError) throw scheduleError;

      // attendance 테이블에도 기록
      const scheduleData = schedules.filter(s => selectedSchedules.includes(s.id));
      const attendanceUpdates = scheduleData.map(schedule => ({
        employee_id: schedule.employee_id,
        date: schedule.schedule_date,
        check_out_time: now,
        updated_at: now
      }));

      for (const update of attendanceUpdates) {
        const { error: attendanceError } = await supabase
          .from('attendance')
          .update({ 
            check_out_time: update.check_out_time,
            updated_at: update.updated_at
          })
          .eq('employee_id', update.employee_id)
          .eq('date', update.date);

        if (attendanceError) throw attendanceError;
      }

      alert(`✅ ${selectedSchedules.length}개 스케줄에 퇴근 체크가 완료되었습니다!`);
      setSelectedSchedules([]);
      await loadSchedules();
    } catch (error: any) {
      console.error('일괄 퇴근 체크 오류:', error);
      alert(`일괄 퇴근 체크 실패: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleBulkComplete = async () => {
    if (selectedSchedules.length === 0) {
      alert('선택된 스케줄이 없습니다.');
      return;
    }

    if (!confirm(`선택된 ${selectedSchedules.length}개 스케줄을 완료 처리하시겠습니까?`)) {
      return;
    }

    setProcessing(true);
    try {
      const now = new Date().toISOString();
      
      // 선택된 스케줄들을 완료 처리
      const { error } = await supabase
        .from('schedules')
        .update({ 
          status: 'completed',
          employee_note: '관리자 일괄 완료 처리',
          updated_at: now
        })
        .in('id', selectedSchedules);

      if (error) throw error;

      alert(`✅ ${selectedSchedules.length}개 스케줄이 완료 처리되었습니다!`);
      setSelectedSchedules([]);
      await loadSchedules();
    } catch (error: any) {
      console.error('일괄 완료 처리 오류:', error);
      alert(`일괄 완료 처리 실패: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  // 개인 출근시간 수정 기능
  const handleEditAttendance = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setEditForm({
      checkInTime: schedule.actual_start ? format(new Date(schedule.actual_start), 'HH:mm') : '',
      checkOutTime: schedule.actual_end ? format(new Date(schedule.actual_end), 'HH:mm') : '',
      note: schedule.employee_note || ''
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingSchedule) return;

    try {
      const checkInDateTime = editForm.checkInTime ? 
        new Date(`${selectedDate}T${editForm.checkInTime}:00`).toISOString() : null;
      const checkOutDateTime = editForm.checkOutTime ? 
        new Date(`${selectedDate}T${editForm.checkOutTime}:00`).toISOString() : null;

      if (editingSchedule.id === 'new') {
        // 새로운 스케줄 생성 (스케줄이 없는 직원)
        const { error: scheduleError } = await supabase
          .from('schedules')
          .insert({
            employee_id: editingSchedule.employee_id,
            schedule_date: selectedDate,
            scheduled_start: editForm.checkInTime || '09:00',
            scheduled_end: editForm.checkOutTime || '18:00',
            actual_start: checkInDateTime,
            actual_end: checkOutDateTime,
            employee_note: editForm.note,
            status: checkInDateTime && checkOutDateTime ? 'completed' : 
                    checkInDateTime ? 'in_progress' : 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (scheduleError) throw scheduleError;
      } else {
        // 기존 스케줄 업데이트
        const { error: scheduleError } = await supabase
          .from('schedules')
          .update({
            actual_start: checkInDateTime,
            actual_end: checkOutDateTime,
            employee_note: editForm.note,
            status: checkInDateTime && checkOutDateTime ? 'completed' : 
                    checkInDateTime ? 'in_progress' : 'pending',
            updated_at: new Date().toISOString()
          })
          .eq('id', editingSchedule.id);

        if (scheduleError) throw scheduleError;
      }

      // attendance 테이블 업데이트 또는 생성
      const attendanceData = {
        employee_id: editingSchedule.employee_id,
        date: selectedDate,
        check_in_time: checkInDateTime,
        check_out_time: checkOutDateTime,
        updated_at: new Date().toISOString()
      };

      const { error: attendanceError } = await supabase
        .from('attendance')
        .upsert(attendanceData, { 
          onConflict: 'employee_id,date',
          ignoreDuplicates: false 
        });

      if (attendanceError) throw attendanceError;

      alert('✅ 출근시간이 성공적으로 저장되었습니다!');
      setShowEditModal(false);
      setEditingSchedule(null);
      await loadSchedules();
    } catch (error: any) {
      console.error('출근시간 저장 오류:', error);
      alert(`출근시간 저장 실패: ${error.message}`);
    }
  };

  // 스케줄이 없는 직원의 출근시간 추가
  const handleAddAttendance = async (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return;

    setEditingSchedule({
      id: 'new',
      employee_id: employeeId,
      schedule_date: selectedDate,
      scheduled_start: '09:00',
      scheduled_end: '18:00',
      status: 'pending',
      actual_start: null,
      actual_end: null,
      employee: {
        name: employee.name,
        employee_id: employee.employee_id
      }
    });
    setEditForm({
      checkInTime: '',
      checkOutTime: '',
      note: '관리자가 추가한 출근 기록'
    });
    setShowEditModal(true);
  };

  const getStatusBadge = (schedule: Schedule) => {
    if (schedule.actual_start && schedule.actual_end) {
      return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">완료</span>;
    } else if (schedule.actual_start) {
      return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">근무중</span>;
    } else {
      return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">미출근</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Users className="h-6 w-6 mr-2 text-blue-600" />
            일괄 출근 관리
          </h1>
          <p className="text-gray-600 mt-1">직원들의 출근/퇴근을 일괄로 처리할 수 있습니다.</p>
        </div>

        {/* 필터 섹션 */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
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
              <label className="block text-sm font-medium text-gray-700 mb-2">직원</label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">전체 직원</option>
                {employees.map(employee => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} ({employee.employee_id})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="no-attendance">미출근</option>
                <option value="partial-attendance">근무중</option>
                <option value="completed">완료</option>
                <option value="all">전체</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={loadSchedules}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Search className="h-4 w-4 inline mr-2" />
                조회
              </button>
            </div>
          </div>
        </div>

        {/* 일괄 액션 버튼 */}
        {selectedSchedules.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  {selectedSchedules.length}개 스케줄 선택됨
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleBulkCheckIn}
                  disabled={processing}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                >
                  <Clock className="h-4 w-4 inline mr-2" />
                  일괄 출근
                </button>
                <button
                  onClick={handleBulkCheckOut}
                  disabled={processing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <Clock className="h-4 w-4 inline mr-2" />
                  일괄 퇴근
                </button>
                <button
                  onClick={handleBulkComplete}
                  disabled={processing}
                  className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
                >
                  <CheckCircle className="h-4 w-4 inline mr-2" />
                  일괄 완료
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 스케줄이 없는 직원들 */}
        {selectedEmployee === 'all' && (
          <div className="bg-white rounded-lg shadow-sm border mb-6">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">스케줄이 없는 직원들</h2>
              <p className="text-sm text-gray-600 mt-1">해당 날짜에 스케줄이 없지만 출근 기록을 추가할 수 있습니다.</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {employees
                  .filter(emp => !schedules.some(s => s.employee_id === emp.id))
                  .map(employee => (
                    <div key={employee.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {employee.name.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {employee.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {employee.employee_id}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddAttendance(employee.id)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        출근 추가
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* 스케줄 목록 */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">스케줄 목록</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {selectedSchedules.length === schedules.length ? '전체 해제' : '전체 선택'}
                </button>
                <span className="text-sm text-gray-500">
                  총 {schedules.length}개
                </span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">로딩 중...</p>
            </div>
          ) : schedules.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>해당 조건에 맞는 스케줄이 없습니다.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      선택
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      직원
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      스케줄 시간
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      실제 출근
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      실제 퇴근
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
                  {schedules.map((schedule) => (
                    <tr key={schedule.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedSchedules.includes(schedule.id)}
                          onChange={() => handleSelectSchedule(schedule.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-8 w-8">
                            <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-800">
                                {schedule.employee?.name?.charAt(0) || '?'}
                              </span>
                            </div>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {schedule.employee?.name || '알 수 없음'}
                            </div>
                            <div className="text-sm text-gray-500">
                              {schedule.employee?.employee_id || 'N/A'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {schedule.scheduled_start} - {schedule.scheduled_end}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {schedule.actual_start ? 
                          format(new Date(schedule.actual_start), 'HH:mm') : 
                          <span className="text-gray-400">-</span>
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {schedule.actual_end ? 
                          format(new Date(schedule.actual_end), 'HH:mm') : 
                          <span className="text-gray-400">-</span>
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(schedule)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleEditAttendance(schedule)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          수정
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 출근시간 수정 모달 */}
        {showEditModal && editingSchedule && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  출근시간 수정 - {editingSchedule.employee?.name}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      출근 시간
                    </label>
                    <input
                      type="time"
                      value={editForm.checkInTime}
                      onChange={(e) => setEditForm({...editForm, checkInTime: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      퇴근 시간
                    </label>
                    <input
                      type="time"
                      value={editForm.checkOutTime}
                      onChange={(e) => setEditForm({...editForm, checkOutTime: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      메모
                    </label>
                    <textarea
                      value={editForm.note}
                      onChange={(e) => setEditForm({...editForm, note: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="출근 관련 메모를 입력하세요..."
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingSchedule(null);
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    저장
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
