'use client';

import { useState, useEffect } from 'react';
import { supabase, db, Schedule, Employee } from '@/lib/supabase';
import { formatDateKR, formatTimeSimple, calculateWorkHours } from '@/utils/dateUtils';
import { formatHours, getStatusColor, getStatusLabel } from '@/utils/formatUtils';
import {
  Calendar,
  Clock,
  Plus,
  Check,
  X,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  User,
  MapPin,
  Edit,
  Trash2,
  AlertCircle
} from 'lucide-react';

interface ScheduleWithEmployee extends Schedule {
  employee?: {
    name: string;
    employee_id: string;
    department?: { name: string };
  };
}

export default function ScheduleManagement() {
  const [schedules, setSchedules] = useState<ScheduleWithEmployee[]>([]);
  const [currentEmployee, setCurrentEmployee] = useState<Employee | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState({
    status: 'all',
    employee: 'all',
    date: 'month'
  });

  // 새 스케줄 입력 폼
  const [newSchedule, setNewSchedule] = useState({
    date: '',
    startTime: '',
    endTime: '',
    employeeNote: ''
  });

  useEffect(() => {
    loadSchedules();
    loadCurrentEmployee();
  }, [selectedDate, filter]);

  const loadCurrentEmployee = async () => {
    try {
      const employee = await db.auth.getCurrentUser();
      setCurrentEmployee(employee);
    } catch (error) {
      console.error('직원 정보 로드 실패:', error);
    }
  };

  const loadSchedules = async () => {
    setIsLoading(true);
    try {
      // 현재 월의 스케줄 가져오기
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth() + 1;
      
      let query = supabase
        .from('schedules')
        .select(`
          *,
          employee:employees(
            name,
            employee_id,
            department:departments(name)
          )
        `)
        .gte('schedule_date', `${year}-${String(month).padStart(2, '0')}-01`)
        .lte('schedule_date', `${year}-${String(month).padStart(2, '0')}-31`)
        .order('schedule_date', { ascending: true });

      if (filter.status !== 'all') {
        query = query.eq('status', filter.status);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      console.error('스케줄 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSchedule = async () => {
    if (!currentEmployee || !newSchedule.date || !newSchedule.startTime || !newSchedule.endTime) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('schedules')
        .insert({
          employee_id: currentEmployee.employee_id,
          schedule_date: newSchedule.date,
          scheduled_start: newSchedule.startTime,
          scheduled_end: newSchedule.endTime,
          employee_note: newSchedule.employeeNote,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      alert('근무 스케줄이 등록되었습니다. 팀장 승인을 기다려주세요.');
      setShowAddModal(false);
      setNewSchedule({
        date: '',
        startTime: '',
        endTime: '',
        employeeNote: ''
      });
      loadSchedules();
    } catch (error) {
      console.error('스케줄 추가 실패:', error);
      alert('스케줄 추가에 실패했습니다.');
    }
  };

  const handleApproveSchedule = async (scheduleId: string) => {
    if (!currentEmployee) return;

    try {
      const { error } = await supabase
        .from('schedules')
        .update({
          status: 'confirmed',
          approved_by: currentEmployee.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', scheduleId);

      if (error) throw error;

      alert('스케줄이 승인되었습니다.');
      loadSchedules();
    } catch (error) {
      console.error('스케줄 승인 실패:', error);
      alert('스케줄 승인에 실패했습니다.');
    }
  };

  const handleRejectSchedule = async (scheduleId: string) => {
    const reason = prompt('반려 사유를 입력해주세요:');
    if (!reason) return;

    try {
      const { error } = await supabase
        .from('schedules')
        .update({
          status: 'cancelled',
          manager_note: reason
        })
        .eq('id', scheduleId);

      if (error) throw error;

      alert('스케줄이 반려되었습니다.');
      loadSchedules();
    } catch (error) {
      console.error('스케줄 반려 실패:', error);
      alert('스케줄 반려에 실패했습니다.');
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('schedules')
        .delete()
        .eq('id', scheduleId);

      if (error) throw error;

      alert('스케줄이 삭제되었습니다.');
      loadSchedules();
    } catch (error) {
      console.error('스케줄 삭제 실패:', error);
      alert('스케줄 삭제에 실패했습니다.');
    }
  };

  const exportToExcel = () => {
    // 실제로는 xlsx 라이브러리를 사용하여 구현
    console.log('Excel 내보내기');
    alert('Excel 내보내기 기능은 준비 중입니다.');
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setSelectedDate(newDate);
  };

  const isManager = currentEmployee?.role?.name === 'manager' || currentEmployee?.role?.name === 'admin';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">근무 스케줄 관리</h1>
              <p className="text-sm text-gray-600 mt-1">
                근무 일정을 등록하고 관리합니다
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={exportToExcel}
                className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Download className="w-4 h-4 mr-2" />
                Excel 내보내기
              </button>
              
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                근무 추가
              </button>
            </div>
          </div>

          {/* 월 선택 */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => changeMonth('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <h2 className="text-xl font-bold text-gray-900">
              {selectedDate.getFullYear()}년 {selectedDate.getMonth() + 1}월
            </h2>
            
            <button
              onClick={() => changeMonth('next')}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* 필터 */}
          <div className="flex items-center space-x-4">
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="all">전체 상태</option>
              <option value="pending">대기중</option>
              <option value="confirmed">승인됨</option>
              <option value="completed">완료</option>
              <option value="cancelled">취소됨</option>
            </select>
          </div>
        </div>

        {/* 스케줄 테이블 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  직원
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  날짜
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  근무시간
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  시간
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  메모
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex justify-center">
                      <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
                    </div>
                  </td>
                </tr>
              ) : schedules.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    등록된 스케줄이 없습니다.
                  </td>
                </tr>
              ) : (
                schedules.map((schedule) => (
                  <tr key={schedule.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <User className="w-4 h-4 text-gray-400 mr-2" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {schedule.employee?.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {schedule.employee?.employee_id}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {formatDateKR(schedule.schedule_date)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {schedule.scheduled_start && schedule.scheduled_end ? (
                          <>
                            {formatTimeSimple(schedule.scheduled_start)} - {formatTimeSimple(schedule.scheduled_end)}
                          </>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                      {schedule.actual_start && (
                        <div className="text-xs text-gray-500">
                          실제: {formatTimeSimple(schedule.actual_start)}
                          {schedule.actual_end && ` - ${formatTimeSimple(schedule.actual_end)}`}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {schedule.total_hours ? formatHours(schedule.total_hours) : '-'}
                      </div>
                      {schedule.overtime_hours && schedule.overtime_hours > 0 && (
                        <div className="text-xs text-red-600">
                          연장: {formatHours(schedule.overtime_hours)}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(schedule.status)}`}>
                        {getStatusLabel(schedule.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {schedule.employee_note || '-'}
                      </div>
                      {schedule.manager_note && (
                        <div className="text-xs text-red-600 mt-1">
                          관리자: {schedule.manager_note}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        {isManager && schedule.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleApproveSchedule(schedule.id)}
                              className="text-green-600 hover:text-green-900"
                              title="승인"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleRejectSchedule(schedule.id)}
                              className="text-red-600 hover:text-red-900"
                              title="반려"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {schedule.status === 'pending' && (
                          <button
                            onClick={() => handleDeleteSchedule(schedule.id)}
                            className="text-gray-600 hover:text-gray-900"
                            title="삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 요약 정보 */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">총 근무일</p>
                <p className="text-2xl font-bold text-gray-900">
                  {schedules.filter(s => s.status !== 'cancelled').length}일
                </p>
              </div>
              <Calendar className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">총 근무시간</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatHours(
                    schedules.reduce((acc, s) => acc + (s.total_hours || 0), 0)
                  )}
                </p>
              </div>
              <Clock className="w-8 h-8 text-gray-400" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">승인 대기</p>
                <p className="text-2xl font-bold text-orange-600">
                  {schedules.filter(s => s.status === 'pending').length}건
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* 근무 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">근무 스케줄 추가</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  근무일
                </label>
                <input
                  type="date"
                  value={newSchedule.date}
                  onChange={(e) => setNewSchedule({ ...newSchedule, date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    시작 시간
                  </label>
                  <input
                    type="time"
                    value={newSchedule.startTime}
                    onChange={(e) => setNewSchedule({ ...newSchedule, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    종료 시간
                  </label>
                  <input
                    type="time"
                    value={newSchedule.endTime}
                    onChange={(e) => setNewSchedule({ ...newSchedule, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  메모 (선택)
                </label>
                <textarea
                  value={newSchedule.employeeNote}
                  onChange={(e) => setNewSchedule({ ...newSchedule, employeeNote: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  rows={3}
                  placeholder="업무 내용이나 특이사항을 입력하세요"
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleAddSchedule}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
