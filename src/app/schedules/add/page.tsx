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
  const [scheduleDate, setScheduleDate] = useState(() => {
    // 초기 상태에서도 한국 시간 기준으로 설정
    const now = new Date();
    const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
    const todayStr = koreaTime.toISOString().split('T')[0];
    console.log('🕐 초기 상태 한국 시간 기준 날짜 설정:', todayStr);
    return todayStr; // YYYY-MM-DD 형식
  });
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
    
    // 현재 날짜로 초기화 (한국 시간 기준)
    const now = new Date();
    const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
    const todayStr = koreaTime.toISOString().split('T')[0];
    console.log('🕐 현재 한국 시간 기준 날짜 설정:', todayStr);
    setScheduleDate(todayStr);
  }, [router]);

  // 추가: 컴포넌트 마운트 후 날짜 강제 업데이트
  useEffect(() => {
    // 컴포넌트가 마운트된 후 현재 날짜로 강제 설정
    const updateDate = () => {
      const now = new Date();
      const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
      const todayStr = koreaTime.toISOString().split('T')[0];
      console.log('🔄 컴포넌트 마운트 후 날짜 강제 업데이트:', todayStr);
      setScheduleDate(todayStr);
    };
    
    // 즉시 실행
    updateDate();
    
    // 여러 번 실행하여 SSR/SSG 문제 해결
    const timer1 = setTimeout(updateDate, 100);
    const timer2 = setTimeout(updateDate, 500);
    const timer3 = setTimeout(updateDate, 1000);
    const timer4 = setTimeout(updateDate, 2000);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, []);

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
    console.log('🔍 fetchExistingSchedules 호출됨, scheduleDate:', scheduleDate);
    
    if (!scheduleDate) {
      console.log('⚠️ scheduleDate가 없음');
      return;
    }
    
    try {
              // 더 정확한 쿼리로 수정
        const { data, error } = await supabase
          .from('schedules')
          .select(`
            *,
            employee:employees!schedules_employee_id_fkey(
              name,
              employee_id
            )
          `)
          .eq('schedule_date', scheduleDate)
          .order('scheduled_start', { ascending: true });

      console.log('📊 Supabase 쿼리 결과:', { 
        data, 
        error, 
        count: data?.length || 0,
        queryDate: scheduleDate 
      });

      if (error) {
        console.error('❌ Error fetching existing schedules:', error);
        setExistingSchedules([]);
      } else {
        // 데이터가 있는지 확인
        if (data && data.length > 0) {
          console.log('✅ 스케줄 데이터 발견:', data);
          setExistingSchedules(data);
        } else {
          console.log('ℹ️ 해당 날짜에 스케줄 없음:', scheduleDate);
          setExistingSchedules([]);
        }
      }
    } catch (error) {
      console.error('❌ Error fetching existing schedules:', error);
      setExistingSchedules([]);
    }
  };

  // 스케줄을 통합하여 표시하는 함수
  const getConsolidatedSchedules = () => {
    if (!existingSchedules.length) return [];
    
    const employeeSchedules = new Map();
    
    // 직원별로 스케줄 그룹화
    existingSchedules.forEach(schedule => {
      const employeeId = schedule.employee_id;
      if (!employeeSchedules.has(employeeId)) {
        employeeSchedules.set(employeeId, {
          employee: schedule.employee,
          employee_id: employeeId,
          schedules: [],
          totalHours: 0,
          status: schedule.status,
          employee_note: schedule.employee_note
        });
      }
      
      const employeeData = employeeSchedules.get(employeeId);
      employeeData.schedules.push(schedule);
      
      // 총 근무 시간 계산
      const start = new Date(`2000-01-01T${schedule.scheduled_start}`);
      const end = new Date(`2000-01-01T${schedule.scheduled_end}`);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      employeeData.totalHours += hours;
    });
    
    // 각 직원의 연속 스케줄을 통합
    const consolidated: any[] = [];
    
    employeeSchedules.forEach((employeeData) => {
      const sortedSchedules = employeeData.schedules.sort((a: Schedule, b: Schedule) => 
        a.scheduled_start.localeCompare(b.scheduled_start)
      );
      
      if (sortedSchedules.length > 0) {
        const firstSchedule = sortedSchedules[0];
        const lastSchedule = sortedSchedules[sortedSchedules.length - 1];
        
        consolidated.push({
          id: `${employeeData.employee_id}-consolidated`,
          employee: employeeData.employee,
          employee_id: employeeData.employee_id,
          start_time: firstSchedule.scheduled_start.substring(0, 5),
          end_time: lastSchedule.scheduled_end.substring(0, 5),
          total_hours: employeeData.totalHours,
          schedule_count: sortedSchedules.length,
          status: employeeData.status,
          employee_note: employeeData.employee_note,
          is_continuous: isContinuousSchedule(sortedSchedules)
        });
      }
    });
    
    return consolidated.sort((a: any, b: any) => a.start_time.localeCompare(b.start_time));
  };
  
  // 연속 스케줄인지 확인하는 함수
  const isContinuousSchedule = (schedules: Schedule[]) => {
    if (schedules.length <= 1) return true;
    
    const sorted = schedules.sort((a, b) => 
      a.scheduled_start.localeCompare(b.scheduled_start)
    );
    
    for (let i = 0; i < sorted.length - 1; i++) {
      const currentEnd = sorted[i].scheduled_end;
      const nextStart = sorted[i + 1].scheduled_start;
      
      if (currentEnd !== nextStart) {
        return false;
      }
    }
    
    return true;
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
      if (schedule.employee_id === currentUser?.id) return false; // 본인 스케줄은 제외 (UUID 사용)
      
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

    console.log('🔍 handleSubmit 시작:', { currentUser, scheduleDate, startTime, endTime, note });

    if (!currentUser?.id) {
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
      console.log('📝 Supabase insert 시작:', {
        employee_id: currentUser.id,
        schedule_date: scheduleDate,
        scheduled_start: startTime,
        scheduled_end: endTime,
        employee_note: note,
        status: 'approved'
      });

      const { data, error: insertError } = await supabase
        .from('schedules')
        .insert({
          employee_id: currentUser.id,
          schedule_date: scheduleDate,
          scheduled_start: startTime,
          scheduled_end: endTime,
          employee_note: note,
          status: 'approved', // 기본값으로 승인됨
        })
        .select()
        .single();

      console.log('📊 Supabase insert 결과:', { data, error: insertError });

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
          employee_id: currentUser.id,
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

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
          {/* 스케줄 입력 폼 */}
          <div className="order-2 xl:order-1">
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
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
                  key={scheduleDate} // 강제 리렌더링을 위한 key 추가
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
          <div className="order-1 xl:order-2">
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center">
              <Users className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-blue-600" />
              <span className="text-sm sm:text-base">
                {format(parseISO(scheduleDate), 'yyyy년 MM월 dd일 (EEE)', { locale: ko })} 기존 스케줄
              </span>
            </h3>
            
            <div className="bg-gray-50 rounded-xl p-4">
              {(() => {
                const consolidatedSchedules = getConsolidatedSchedules();
                return consolidatedSchedules.length > 0 ? (
                  <div className="space-y-3">
                    {consolidatedSchedules.map(schedule => (
                      <div 
                        key={schedule.id} 
                        className={`p-3 rounded-lg border transition-all duration-200 hover:shadow-md ${
                          schedule.employee_id === currentUser?.employee_id 
                            ? 'bg-blue-100 border-blue-300' 
                            : 'bg-white border-gray-200'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <p className={`font-semibold text-lg ${
                                schedule.employee_id === currentUser?.employee_id 
                                  ? 'text-blue-800' 
                                  : 'text-gray-900'
                              }`}>
                                {schedule.employee?.name}
                              </p>
                              {schedule.employee_id === currentUser?.employee_id && (
                                <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                                  나
                                </span>
                              )}
                              {schedule.is_continuous && (
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                  연속
                                </span>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                              <div className="bg-gray-100 rounded-lg p-2 sm:p-3">
                                <p className="text-xs text-gray-600 mb-1">근무 시간</p>
                                <p className="font-mono text-xs sm:text-sm font-semibold text-gray-800">
                                  {schedule.start_time} - {schedule.end_time}
                                </p>
                              </div>
                              <div className="bg-gray-100 rounded-lg p-2 sm:p-3">
                                <p className="text-xs text-gray-600 mb-1">총 근무</p>
                                <p className="font-mono text-xs sm:text-sm font-semibold text-gray-800">
                                  {schedule.total_hours.toFixed(1)}시간
                                </p>
                              </div>
                            </div>
                            
                            {schedule.employee_note && (
                              <p className="text-xs text-gray-500 bg-white rounded px-2 py-1 border">
                                📝 {schedule.employee_note}
                              </p>
                            )}
                            
                            {schedule.schedule_count > 1 && (
                              <p className="text-xs text-gray-500 mt-2">
                                📅 {schedule.schedule_count}개 시간대 통합
                              </p>
                            )}
                          </div>
                          
                          <div className="flex flex-col items-end gap-2">
                            <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                              schedule.status === 'approved' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {schedule.status === 'approved' ? '승인됨' : '대기중'}
                            </span>
                            
                            <button 
                              className="text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition-colors"
                              onClick={() => {
                                // 상세 보기 기능 (향후 구현)
                                console.log('상세 보기:', schedule);
                              }}
                            >
                              상세보기
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">해당 날짜에 등록된 스케줄이 없습니다.</p>
                );
              })()}
            </div>

            {/* 시간대별 근무자 현황 */}
            <div className="mt-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                <Clock className="w-5 h-5 mr-2 text-blue-600" />
                시간대별 근무자 현황
              </h4>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {timeSlots.map(timeSlot => {
                  const schedulesInSlot = getSchedulesForTimeSlot(timeSlot);
                  const colorClass = getColorIntensity(schedulesInSlot.length, timeSlot.isLunch);
                  
                  return (
                    <div 
                      key={timeSlot.time}
                      className={`p-3 rounded-xl border-2 transition-all duration-200 hover:scale-105 cursor-pointer ${colorClass}`}
                      onClick={() => {
                        // 시간대별 상세 보기 (향후 구현)
                        console.log(`${timeSlot.label} 시간대 상세:`, schedulesInSlot);
                      }}
                    >
                      <div className="text-center">
                        <div className="font-bold text-lg mb-1">{timeSlot.label}</div>
                        <div className="text-2xl font-bold mb-1">
                          {schedulesInSlot.length}명
                        </div>
                        <div className="text-xs opacity-75">
                          {timeSlot.description}
                        </div>
                      </div>
                      
                      {/* 시간대별 직원 이름 표시 */}
                      {schedulesInSlot.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          <div className="text-xs text-gray-600 mb-1">근무자:</div>
                          <div className="flex flex-wrap gap-1">
                            {schedulesInSlot.slice(0, 3).map((schedule, index) => (
                              <span 
                                key={index}
                                className="text-xs bg-white px-2 py-1 rounded-full border"
                              >
                                {schedule.employee?.name}
                              </span>
                            ))}
                            {schedulesInSlot.length > 3 && (
                              <span className="text-xs bg-gray-200 px-2 py-1 rounded-full">
                                +{schedulesInSlot.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* 전체 요약 */}
              <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-semibold text-blue-800">전체 근무자</span>
                  <span className="text-lg font-bold text-blue-800">
                    {existingSchedules.length > 0 ? 
                      new Set(existingSchedules.map(s => s.employee_id)).size : 0}명
                  </span>
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  총 {existingSchedules.length}개 시간대 스케줄
                </div>
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
