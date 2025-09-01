'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Calendar, Clock, Edit, Save, XCircle, User, ArrowLeft, Users, AlertCircle } from 'lucide-react';
import { format, parseISO, isSameDay } from 'date-fns';
import { ko } from 'date-fns/locale';

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
  description: string;
}

export default function AddSchedulePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [scheduleDate, setScheduleDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [existingSchedules, setExistingSchedules] = useState<Schedule[]>([]);
  const [showConflictWarning, setShowConflictWarning] = useState(false);

  // 시간대 정의
  const timeSlots: TimeSlot[] = [
    { time: '09:00', label: '9-10', isLunch: false, description: '오전 근무' },
    { time: '10:00', label: '10-11', isLunch: false, description: '오전 근무' },
    { time: '11:00', label: '11-12', isLunch: false, description: '오전 근무' },
    { time: '12:00', label: '12-1', isLunch: true, description: '점심시간 (전화/업무 가능)' },
    { time: '13:00', label: '1-2', isLunch: false, description: '오후 근무' },
    { time: '14:00', label: '2-3', isLunch: false, description: '오후 근무' },
    { time: '15:00', label: '3-4', isLunch: false, description: '오후 근무' },
    { time: '16:00', label: '4-5', isLunch: false, description: '오후 근무' },
    { time: '17:00', label: '5-6', isLunch: false, description: '오후 근무' },
  ];

  useEffect(() => {
    const fetchUser = async () => {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setCurrentUser(user);
      setLoading(false);
    };
    fetchUser();
  }, [router]);

  useEffect(() => {
    if (scheduleDate) {
      fetchExistingSchedules();
    }
  }, [scheduleDate]);

  const getCurrentUser = async () => {
    if (typeof window !== 'undefined') {
      const isLoggedIn = localStorage.getItem('isLoggedIn');
      const employeeData = localStorage.getItem('currentEmployee');
      
      if (isLoggedIn === 'true' && employeeData) {
        return JSON.parse(employeeData);
      }
    }
    return null;
  };

  const fetchExistingSchedules = async () => {
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select(`
          *,
          employee:employees!schedules_employee_id_fkey(name, employee_id)
        `)
        .eq('schedule_date', scheduleDate)
        .order('scheduled_start', { ascending: true });

      if (error) {
        console.error('Error fetching existing schedules:', error);
        setExistingSchedules([]);
      } else {
        setExistingSchedules(data || []);
      }
    } catch (error) {
      console.error('Error fetching existing schedules:', error);
      setExistingSchedules([]);
    }
  };

  const getSchedulesForTimeSlot = (timeSlot: TimeSlot) => {
    return existingSchedules.filter(schedule => {
      const startTime = schedule.scheduled_start;
      const endTime = schedule.scheduled_end;
      const slotTime = timeSlot.time;
      
      return startTime <= slotTime && endTime > slotTime;
    });
  };

  const getColorIntensity = (scheduleCount: number, isLunch: boolean) => {
    if (scheduleCount === 0) {
      return isLunch ? 'bg-orange-50 border-orange-200' : 'bg-gray-50';
    }
    if (scheduleCount === 1) return 'bg-blue-100 border-blue-200';
    if (scheduleCount === 2) return 'bg-blue-200 border-blue-300';
    if (scheduleCount === 3) return 'bg-blue-300 border-blue-400';
    return 'bg-blue-400 border-blue-500';
  };

  const checkTimeConflict = () => {
    const selectedStart = startTime;
    const selectedEnd = endTime;
    
    const conflicts = existingSchedules.filter(schedule => {
      if (schedule.employee_id === currentUser?.employee_id) return false; // 본인 스케줄은 제외
      
      const existingStart = schedule.scheduled_start;
      const existingEnd = schedule.scheduled_end;
      
      // 시간 겹침 확인
      return (selectedStart < existingEnd && selectedEnd > existingStart);
    });
    
    return conflicts.length > 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    if (!currentUser?.employee_id) {
      setError('사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.');
      setSubmitting(false);
      return;
    }

    // 시간 충돌 확인
    if (checkTimeConflict()) {
      setShowConflictWarning(true);
      setSubmitting(false);
      return;
    }

    try {
      const { data, error: insertError } = await supabase
        .from('schedules')
        .insert({
          employee_id: currentUser.employee_id,
          schedule_date: scheduleDate,
          scheduled_start: startTime,
          scheduled_end: endTime,
          employee_note: note,
          status: 'approved', // 기본값으로 승인됨
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      setSuccess('스케줄이 성공적으로 추가되었습니다!');
      
      // 3초 후 스케줄 페이지로 이동
      setTimeout(() => {
        router.push('/schedules');
      }, 3000);
      
    } catch (err: any) {
      console.error('스케줄 추가 오류:', err);
      setError(`스케줄 추가 실패: ${err.message || '알 수 없는 오류'}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleForceSubmit = async () => {
    setShowConflictWarning(false);
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const { data, error: insertError } = await supabase
        .from('schedules')
        .insert({
          employee_id: currentUser.employee_id,
          schedule_date: scheduleDate,
          scheduled_start: startTime,
          scheduled_end: endTime,
          employee_note: note,
          status: 'approved',
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      setSuccess('스케줄이 성공적으로 추가되었습니다!');
      
      setTimeout(() => {
        router.push('/schedules');
      }, 3000);
      
    } catch (err: any) {
      console.error('스케줄 추가 오류:', err);
      setError(`스케줄 추가 실패: ${err.message || '알 수 없는 오류'}`);
    } finally {
      setSubmitting(false);
    }
  };

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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-6 sm:p-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push('/schedules')}
            className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center">
            <Calendar className="h-8 w-8 mr-3 text-blue-600" />
            새 스케줄 추가
          </h1>
          <div className="w-10"></div>
        </div>

        {/* 사용자 정보 */}
        {currentUser && (
          <div className="flex items-center justify-center mb-6 p-4 bg-blue-50 rounded-xl">
            <User className="w-5 h-5 mr-2 text-blue-600" />
            <span className="font-semibold text-blue-900">
              {currentUser.name} ({currentUser.employee_id})
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 스케줄 입력 폼 */}
          <div>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* 날짜 선택 */}
              <div>
                <label htmlFor="scheduleDate" className="block text-lg font-medium text-gray-700 mb-2">
                  <Calendar className="inline-block w-5 h-5 mr-2 text-gray-500" />
                  근무 날짜
                </label>
                <input
                  type="date"
                  id="scheduleDate"
                  value={scheduleDate}
                  onChange={(e) => setScheduleDate(e.target.value)}
                  required
                  className="mt-1 block w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 text-lg"
                />
              </div>

              {/* 시간 선택 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="startTime" className="block text-lg font-medium text-gray-700 mb-2">
                    <Clock className="inline-block w-5 h-5 mr-2 text-gray-500" />
                    시작 시간
                  </label>
                  <input
                    type="time"
                    id="startTime"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    required
                    className="mt-1 block w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 text-lg"
                  />
                </div>
                <div>
                  <label htmlFor="endTime" className="block text-lg font-medium text-gray-700 mb-2">
                    <Clock className="inline-block w-5 h-5 mr-2 text-gray-500" />
                    종료 시간
                  </label>
                  <input
                    type="time"
                    id="endTime"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    required
                    className="mt-1 block w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 text-lg"
                  />
                </div>
              </div>

              {/* 메모 */}
              <div>
                <label htmlFor="note" className="block text-lg font-medium text-gray-700 mb-2">
                  <Edit className="inline-block w-5 h-5 mr-2 text-gray-500" />
                  메모 (선택 사항)
                </label>
                <textarea
                  id="note"
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="mt-1 block w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 text-lg"
                  placeholder="예: 정상 근무, 외근, 휴가, 회의 등"
                ></textarea>
              </div>

              {/* 오류 메시지 */}
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative flex items-center">
                  <XCircle className="w-5 h-5 mr-2" />
                  <span className="block sm:inline">{error}</span>
                </div>
              )}

              {/* 성공 메시지 */}
              {success && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl relative flex items-center">
                  <Save className="w-5 h-5 mr-2" />
                  <span className="block sm:inline">{success}</span>
                </div>
              )}

              {/* 버튼 */}
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => router.push('/schedules')}
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-6 rounded-xl shadow-md transition-all duration-200 transform hover:scale-105"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg flex items-center justify-center transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      저장 중...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      스케줄 추가
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* 기존 스케줄 표시 */}
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2 text-blue-600" />
              {format(parseISO(scheduleDate), 'yyyy년 MM월 dd일 (EEE)', { locale: ko })} 기존 스케줄
            </h3>
            
            <div className="bg-gray-50 rounded-xl p-4">
              {existingSchedules.length > 0 ? (
                <div className="space-y-3">
                  {existingSchedules.map(schedule => (
                    <div 
                      key={schedule.id} 
                      className={`p-3 rounded-lg border ${
                        schedule.employee_id === currentUser?.employee_id 
                          ? 'bg-blue-100 border-blue-300' 
                          : 'bg-white border-gray-200'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className={`font-semibold ${
                            schedule.employee_id === currentUser?.employee_id 
                              ? 'text-blue-800' 
                              : 'text-gray-900'
                          }`}>
                            {schedule.employee?.name}
                            {schedule.employee_id === currentUser?.employee_id && (
                              <span className="ml-2 text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                                나
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-gray-600">
                            {schedule.scheduled_start?.substring(0, 5)} - {schedule.scheduled_end?.substring(0, 5)}
                          </p>
                          {schedule.employee_note && (
                            <p className="text-xs text-gray-500 mt-1">
                              {schedule.employee_note}
                            </p>
                          )}
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          schedule.status === 'approved' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {schedule.status === 'approved' ? '승인됨' : '대기중'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">해당 날짜에 등록된 스케줄이 없습니다.</p>
              )}
            </div>

            {/* 시간대별 요약 */}
            <div className="mt-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-3">시간대별 근무자 현황</h4>
              <div className="grid grid-cols-3 gap-2">
                {timeSlots.map(timeSlot => {
                  const schedulesInSlot = getSchedulesForTimeSlot(timeSlot);
                  const colorClass = getColorIntensity(schedulesInSlot.length, timeSlot.isLunch);
                  
                  return (
                    <div 
                      key={timeSlot.time}
                      className={`p-2 rounded-lg border text-center text-sm ${colorClass}`}
                    >
                      <div className="font-bold">{timeSlot.label}</div>
                      <div className="text-xs opacity-75">{schedulesInSlot.length}명</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 시간 충돌 경고 모달 */}
        {showConflictWarning && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-6 max-w-md mx-4">
              <div className="flex items-center mb-4">
                <AlertCircle className="w-6 h-6 text-yellow-600 mr-2" />
                <h3 className="text-lg font-bold text-gray-900">시간 충돌 확인</h3>
              </div>
              <p className="text-gray-700 mb-6">
                선택한 시간대에 다른 직원의 스케줄이 있습니다. 
                정말로 이 시간에 스케줄을 추가하시겠습니까?
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowConflictWarning(false)}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded-xl transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleForceSubmit}
                  className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded-xl transition-colors"
                >
                  추가하기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
