'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/supabase';
import { 
  Calendar, Clock, Plus, Edit, Trash, Save,
  CheckCircle, XCircle, AlertCircle, MapPin
} from 'lucide-react';

interface Schedule {
  id: string;
  employee_id: string;
  schedule_date: string;
  scheduled_start: string;
  scheduled_end: string;
  actual_start?: string;
  actual_end?: string;
  total_hours?: number;
  overtime_hours?: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  employee_note?: string;
  manager_note?: string;
  created_at: string;
  updated_at: string;
}

export default function SchedulesPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().split('T')[0].substring(0, 7));
  const [isAddingSchedule, setIsAddingSchedule] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);

  // 새 스케줄 폼 상태
  const [newSchedule, setNewSchedule] = useState({
    schedule_date: '',
    scheduled_start: '09:00',
    scheduled_end: '18:00',
    employee_note: ''
  });

  useEffect(() => {
    checkAuth();
    loadSchedules();
  }, [selectedMonth]);

  const checkAuth = async () => {
    const user = await auth.getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setCurrentUser(user);
  };

  const loadSchedules = async () => {
    // 샘플 스케줄 데이터
    const sampleSchedules: Schedule[] = [
      {
        id: '1',
        employee_id: '1',
        schedule_date: '2025-01-15',
        scheduled_start: '09:00',
        scheduled_end: '18:00',
        actual_start: '2025-01-15T09:05:00Z',
        actual_end: '2025-01-15T18:30:00Z',
        total_hours: 8.5,
        overtime_hours: 0.5,
        status: 'completed',
        employee_note: '정상 근무',
        created_at: '2025-01-15T00:00:00Z',
        updated_at: '2025-01-15T00:00:00Z'
      },
      {
        id: '2',
        employee_id: '1',
        schedule_date: '2025-01-16',
        scheduled_start: '09:00',
        scheduled_end: '18:00',
        status: 'pending',
        employee_note: '예정',
        created_at: '2025-01-15T00:00:00Z',
        updated_at: '2025-01-15T00:00:00Z'
      },
      {
        id: '3',
        employee_id: '1',
        schedule_date: '2025-01-17',
        scheduled_start: '10:00',
        scheduled_end: '19:00',
        status: 'pending',
        employee_note: '늦은 출근',
        created_at: '2025-01-15T00:00:00Z',
        updated_at: '2025-01-15T00:00:00Z'
      }
    ];

    setSchedules(sampleSchedules);
    setIsLoading(false);
  };

  const handleAddSchedule = () => {
    setIsAddingSchedule(true);
    setNewSchedule({
      schedule_date: '',
      scheduled_start: '09:00',
      scheduled_end: '18:00',
      employee_note: ''
    });
  };

  const handleSaveSchedule = async () => {
    if (!newSchedule.schedule_date) {
      alert('날짜를 선택해주세요.');
      return;
    }

    // 새 스케줄 추가 로직
    const schedule: Schedule = {
      id: Date.now().toString(),
      employee_id: currentUser.id,
      schedule_date: newSchedule.schedule_date,
      scheduled_start: newSchedule.scheduled_start,
      scheduled_end: newSchedule.scheduled_end,
      status: 'pending',
      employee_note: newSchedule.employee_note,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    setSchedules(prev => [...prev, schedule]);
    setIsAddingSchedule(false);
    alert('스케줄이 추가되었습니다.');
  };

  const handleEditSchedule = (schedule: Schedule) => {
    setEditingSchedule(schedule);
  };

  const handleUpdateSchedule = async () => {
    if (!editingSchedule) return;

    setSchedules(prev => 
      prev.map(s => 
        s.id === editingSchedule.id 
          ? { ...editingSchedule, updated_at: new Date().toISOString() }
          : s
      )
    );
    setEditingSchedule(null);
    alert('스케줄이 수정되었습니다.');
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm('이 스케줄을 삭제하시겠습니까?')) return;

    setSchedules(prev => prev.filter(s => s.id !== scheduleId));
    alert('스케줄이 삭제되었습니다.');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'confirmed': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'confirmed': return <Clock className="w-4 h-4" />;
      case 'pending': return <AlertCircle className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      weekday: 'short'
    });
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return '-';
    return new Date(timeString).toLocaleTimeString('ko-KR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

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
            <div>
              <h1 className="text-2xl font-bold text-gray-900">근무 스케줄</h1>
              <p className="text-gray-600">본인의 근무 일정을 관리하세요</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleAddSchedule}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                스케줄 추가
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 월 선택 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">월 선택</label>
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">총 {schedules.length}개의 스케줄</p>
              <p className="text-lg font-semibold text-gray-900">
                {selectedMonth} 스케줄
              </p>
            </div>
          </div>
        </div>

        {/* 새 스케줄 추가 폼 */}
        {isAddingSchedule && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">새 스케줄 추가</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">날짜</label>
                <input
                  type="date"
                  value={newSchedule.schedule_date}
                  onChange={(e) => setNewSchedule(prev => ({ ...prev, schedule_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">시작 시간</label>
                <input
                  type="time"
                  value={newSchedule.scheduled_start}
                  onChange={(e) => setNewSchedule(prev => ({ ...prev, scheduled_start: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">종료 시간</label>
                <input
                  type="time"
                  value={newSchedule.scheduled_end}
                  onChange={(e) => setNewSchedule(prev => ({ ...prev, scheduled_end: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-end space-x-2">
                <button
                  onClick={handleSaveSchedule}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center justify-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  저장
                </button>
                <button
                  onClick={() => setIsAddingSchedule(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  취소
                </button>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">메모</label>
              <textarea
                value={newSchedule.employee_note}
                onChange={(e) => setNewSchedule(prev => ({ ...prev, employee_note: e.target.value }))}
                placeholder="스케줄에 대한 메모를 입력하세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={2}
              />
            </div>
          </div>
        )}

        {/* 스케줄 목록 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">스케줄 목록</h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {schedules.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">등록된 스케줄이 없습니다.</p>
                <button
                  onClick={handleAddSchedule}
                  className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  첫 번째 스케줄 추가
                </button>
              </div>
            ) : (
              schedules.map((schedule) => (
                <div key={schedule.id} className="px-6 py-4 hover:bg-gray-50">
                  {editingSchedule?.id === schedule.id ? (
                    // 편집 모드
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">날짜</label>
                        <input
                          type="date"
                          value={editingSchedule.schedule_date}
                          onChange={(e) => setEditingSchedule(prev => prev ? { ...prev, schedule_date: e.target.value } : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">시작 시간</label>
                        <input
                          type="time"
                          value={editingSchedule.scheduled_start}
                          onChange={(e) => setEditingSchedule(prev => prev ? { ...prev, scheduled_start: e.target.value } : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">종료 시간</label>
                        <input
                          type="time"
                          value={editingSchedule.scheduled_end}
                          onChange={(e) => setEditingSchedule(prev => prev ? { ...prev, scheduled_end: e.target.value } : null)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="flex items-end space-x-2">
                        <button
                          onClick={handleUpdateSchedule}
                          className="flex-1 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                        >
                          저장
                        </button>
                        <button
                          onClick={() => setEditingSchedule(null)}
                          className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-sm"
                        >
                          취소
                        </button>
                      </div>
                    </div>
                  ) : (
                    // 보기 모드
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-900">
                            {formatDate(schedule.schedule_date)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {schedule.scheduled_start} - {schedule.scheduled_end}
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(schedule.status)}`}>
                            {getStatusIcon(schedule.status)}
                            <span className="ml-1">
                              {schedule.status === 'completed' ? '완료' : 
                               schedule.status === 'confirmed' ? '확정' : 
                               schedule.status === 'pending' ? '대기' : '취소'}
                            </span>
                          </span>
                        </div>

                        {schedule.actual_start && (
                          <div className="text-sm text-gray-600">
                            <div>실제 출근: {formatTime(schedule.actual_start)}</div>
                            {schedule.actual_end && (
                              <div>실제 퇴근: {formatTime(schedule.actual_end)}</div>
                            )}
                          </div>
                        )}

                        {schedule.total_hours && (
                          <div className="text-sm text-gray-600">
                            <div>근무시간: {schedule.total_hours}시간</div>
                            {schedule.overtime_hours && schedule.overtime_hours > 0 && (
                              <div className="text-orange-600">연장: {schedule.overtime_hours}시간</div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        {schedule.employee_note && (
                          <div className="text-sm text-gray-600 max-w-xs truncate">
                            {schedule.employee_note}
                          </div>
                        )}
                        
                        {schedule.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleEditSchedule(schedule)}
                              className="text-indigo-600 hover:text-indigo-900"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSchedule(schedule.id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
