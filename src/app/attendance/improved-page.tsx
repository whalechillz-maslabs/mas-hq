'use client';

import { useState, useEffect } from 'react';
import { Clock, MapPin, CheckCircle, XCircle, Calendar, User, Building, Coffee, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { format, isToday, startOfMonth, endOfMonth } from 'date-fns';
import { ko } from 'date-fns/locale';

interface AttendanceRecord {
  id: string;
  employee_id: string;
  schedule_date: string;
  scheduled_start: string;
  scheduled_end: string;
  actual_start: string | null;
  actual_end: string | null;
  status: string;
  check_in_location: any;
  check_out_location: any;
  employee_note?: string;
  total_hours?: number;
  employee: {
    name: string;
    employee_id: string;
  };
}

export default function ImprovedAttendancePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [todaySchedules, setTodaySchedules] = useState<AttendanceRecord[]>([]);
  const [monthlyRecords, setMonthlyRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [error, setError] = useState<string | null>(null);
  
  // 새로운 상태들
  const [dailyAttendance, setDailyAttendance] = useState<{
    isCheckedIn: boolean;
    checkInTime: string | null;
    checkOutTime: string | null;
    totalWorkTime: string | null;
    hasBreak: boolean;
  }>({
    isCheckedIn: false,
    checkInTime: null,
    checkOutTime: null,
    totalWorkTime: null,
    hasBreak: false
  });

  // getCurrentUser 함수 정의
  const getCurrentUser = async () => {
    try {
      if (typeof window !== 'undefined') {
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        const employeeData = localStorage.getItem('currentEmployee');
        
        if (isLoggedIn === 'true' && employeeData) {
          return JSON.parse(employeeData);
        }
      }
      return null;
    } catch (error) {
      console.error('사용자 정보 파싱 오류:', error);
      return null;
    }
  };

  // 일일 근무 시간 계산 함수
  const calculateDailyWorkHours = (schedules: AttendanceRecord[]) => {
    if (schedules.length === 0) return { totalHours: 0, totalMinutes: 0 };
    
    let totalMinutes = 0;
    
    schedules.forEach(schedule => {
      if (schedule.actual_start && schedule.actual_end) {
        const start = new Date(schedule.actual_start);
        const end = new Date(schedule.actual_end);
        const diffMs = end.getTime() - start.getTime();
        const diffMinutes = Math.floor(diffMs / (1000 * 60));
        totalMinutes += diffMinutes;
      }
    });
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return { totalHours: hours, totalMinutes: minutes };
  };

  // 일일 출근 상태 분석
  const analyzeDailyAttendance = (schedules: AttendanceRecord[]) => {
    const completedSchedules = schedules.filter(s => s.actual_start && s.actual_end);
    const inProgressSchedules = schedules.filter(s => s.actual_start && !s.actual_end);
    const pendingSchedules = schedules.filter(s => !s.actual_start);
    
    const hasCheckedIn = inProgressSchedules.length > 0 || completedSchedules.length > 0;
    const hasCheckedOut = completedSchedules.length > 0 && inProgressSchedules.length === 0;
    
    let checkInTime = null;
    let checkOutTime = null;
    
    if (schedules.length > 0) {
      const firstSchedule = schedules[0];
      if (firstSchedule.actual_start) {
        checkInTime = firstSchedule.actual_start;
      }
      
      const lastCompletedSchedule = completedSchedules[completedSchedules.length - 1];
      if (lastCompletedSchedule?.actual_end) {
        checkOutTime = lastCompletedSchedule.actual_end;
      }
    }
    
    return {
      hasCheckedIn,
      hasCheckedOut,
      checkInTime,
      checkOutTime,
      completedCount: completedSchedules.length,
      inProgressCount: inProgressSchedules.length,
      pendingCount: pendingSchedules.length
    };
  };

  // 컴포넌트 마운트 시 즉시 실행
  useEffect(() => {
    console.log('🚀 개선된 출근 관리 페이지 마운트됨');
    
    let isMounted = true;
    
    const loadData = async () => {
      try {
        setError(null);
        
        const user = await getCurrentUser();
        console.log('👤 사용자 정보:', user);
        
        if (!isMounted) return;
        
        if (!user) {
          console.log('❌ 사용자 정보 없음 - 로그인 페이지로 이동');
          router.push('/login');
          return;
        }
        
        console.log('✅ 사용자 정보 설정 완료:', user.id);
        setCurrentUser(user);
        
        // 스케줄 데이터 로딩
        const today = format(new Date(), 'yyyy-MM-dd');
        console.log('📅 오늘 날짜:', today, '사용자 ID:', user.id);
        
        const { data: todayData, error: todayError } = await supabase
          .from('schedules')
          .select('*')
          .eq('employee_id', user.id)
          .eq('schedule_date', today)
          .order('scheduled_start', { ascending: true });

        if (!isMounted) return;
        
        if (todayError) {
          console.error('❌ 오늘 스케줄 조회 오류:', todayError);
          setTodaySchedules([]);
        } else {
          console.log('✅ 오늘 스케줄 조회 성공:', todayData?.length || 0, '개');
          setTodaySchedules(todayData || []);
          
          // 일일 출근 상태 분석
          const attendanceAnalysis = analyzeDailyAttendance(todayData || []);
          setDailyAttendance(prev => ({
            ...prev,
            isCheckedIn: attendanceAnalysis.hasCheckedIn,
            checkInTime: attendanceAnalysis.checkInTime,
            checkOutTime: attendanceAnalysis.checkOutTime,
            hasBreak: attendanceAnalysis.completedCount > 0 && attendanceAnalysis.inProgressCount > 0
          }));
        }
        
        // 월간 기록 조회
        const startDate = startOfMonth(new Date());
        const endDate = endOfMonth(new Date());
        
        const { data: monthlyData, error: monthlyError } = await supabase
          .from('schedules')
          .select('*')
          .eq('employee_id', user.id)
          .gte('schedule_date', format(startDate, 'yyyy-MM-dd'))
          .lte('schedule_date', format(endDate, 'yyyy-MM-dd'))
          .not('actual_start', 'is', null);

        if (!isMounted) return;
        
        if (monthlyError) {
          console.error('❌ 월간 기록 조회 오류:', monthlyError);
          setMonthlyRecords([]);
        } else {
          console.log('✅ 월간 기록 조회 성공:', monthlyData?.length || 0, '개');
          setMonthlyRecords(monthlyData || []);
        }
        
        if (isMounted) {
          setLoading(false);
        }
        
      } catch (error: any) {
        console.error('❌ 전체 로딩 과정 실패:', error);
        if (isMounted) {
          setError(error.message || '데이터 로딩 중 오류가 발생했습니다.');
          setLoading(false);
        }
      }
    };
    
    loadData();

    const timer = setInterval(() => {
      if (isMounted) {
        setCurrentTime(new Date());
      }
    }, 1000);
    
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [router]);

  // 간단한 출근 체크
  const handleSimpleCheckIn = async () => {
    try {
      setCheckingIn(true);
      const now = new Date().toISOString();
      
      // 모든 오늘 스케줄에 출근 시간 기록
      const updates = todaySchedules.map(schedule => ({
        id: schedule.id,
        actual_start: now,
        status: 'in_progress'
      }));
      
      // 일괄 업데이트
      for (const update of updates) {
        const { error } = await supabase
          .from('schedules')
          .update(update)
          .eq('id', update.id);
        
        if (error) throw error;
      }
      
      setDailyAttendance(prev => ({
        ...prev,
        isCheckedIn: true,
        checkInTime: now
      }));
      
      alert('출근 체크가 완료되었습니다!');
      
      // 데이터 새로고침
      const { data: refreshedData } = await supabase
        .from('schedules')
        .select('*')
        .eq('employee_id', currentUser.id)
        .eq('schedule_date', format(new Date(), 'yyyy-MM-dd'))
        .order('scheduled_start', { ascending: true });
      
      setTodaySchedules(refreshedData || []);
      
    } catch (error: any) {
      console.error('출근 체크 오류:', error);
      alert(`출근 체크에 실패했습니다: ${error.message}`);
    } finally {
      setCheckingIn(false);
    }
  };

  // 간단한 퇴근 체크
  const handleSimpleCheckOut = async () => {
    try {
      setCheckingIn(true);
      const now = new Date().toISOString();
      
      // 모든 오늘 스케줄에 퇴근 시간 기록
      const updates = todaySchedules.map(schedule => ({
        id: schedule.id,
        actual_end: now,
        status: 'completed'
      }));
      
      // 일괄 업데이트
      for (const update of updates) {
        const { error } = await supabase
          .from('schedules')
          .update(update)
          .eq('id', update.id);
        
        if (error) throw error;
      }
      
      // 총 근무 시간 계산
      const checkInTime = dailyAttendance.checkInTime;
      if (checkInTime) {
        const start = new Date(checkInTime);
        const end = new Date(now);
        const diffMs = end.getTime() - start.getTime();
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const totalTime = `${hours}h ${minutes}m`;
        
        setDailyAttendance(prev => ({
          ...prev,
          isCheckedIn: false,
          checkOutTime: now,
          totalWorkTime: totalTime
        }));
      }
      
      alert('퇴근 체크가 완료되었습니다!');
      
      // 데이터 새로고침
      const { data: refreshedData } = await supabase
        .from('schedules')
        .select('*')
        .eq('employee_id', currentUser.id)
        .eq('schedule_date', format(new Date(), 'yyyy-MM-dd'))
        .order('scheduled_start', { ascending: true });
      
      setTodaySchedules(refreshedData || []);
      
    } catch (error: any) {
      console.error('퇴근 체크 오류:', error);
      alert(`퇴근 체크에 실패했습니다: ${error.message}`);
    } finally {
      setCheckingIn(false);
    }
  };

  // 중간 휴식 후 복귀 체크
  const handleBreakReturn = async () => {
    try {
      setCheckingIn(true);
      const now = new Date().toISOString();
      
      // 현재 진행 중인 스케줄에 퇴근 시간 기록
      const inProgressSchedules = todaySchedules.filter(s => 
        s.actual_start && !s.actual_end
      );
      
      for (const schedule of inProgressSchedules) {
        const { error } = await supabase
          .from('schedules')
          .update({
            actual_end: now,
            status: 'break',
            employee_note: '중간 휴식'
          })
          .eq('id', schedule.id);
        
        if (error) throw error;
      }
      
      // 새로운 근무 세션 시작
      const remainingSchedules = todaySchedules.filter(s => 
        !s.actual_start
      );
      
      for (const schedule of remainingSchedules) {
        const { error } = await supabase
          .from('schedules')
          .update({
            actual_start: now,
            status: 'in_progress'
          })
          .eq('id', schedule.id);
        
        if (error) throw error;
      }
      
      setDailyAttendance(prev => ({
        ...prev,
        hasBreak: true
      }));
      
      alert('휴식 후 복귀가 기록되었습니다!');
      
      // 데이터 새로고침
      const { data: refreshedData } = await supabase
        .from('schedules')
        .select('*')
        .eq('employee_id', currentUser.id)
        .eq('schedule_date', format(new Date(), 'yyyy-MM-dd'))
        .order('scheduled_start', { ascending: true });
      
      setTodaySchedules(refreshedData || []);
      
    } catch (error: any) {
      console.error('복귀 체크 오류:', error);
      alert(`복귀 체크에 실패했습니다: ${error.message}`);
    } finally {
      setCheckingIn(false);
    }
  };

  // 에러가 발생한 경우 에러 화면 표시
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">오류가 발생했습니다</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
          >
            페이지 새로고침
          </button>
        </div>
      </div>
    );
  }

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

  const { totalHours, totalMinutes } = calculateDailyWorkHours(todaySchedules);
  const attendanceAnalysis = analyzeDailyAttendance(todaySchedules);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 p-1 sm:p-2">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-2 sm:p-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
            <Clock className="h-5 w-5 sm:h-6 sm:w-6 mr-1 sm:mr-2 text-green-600" />
            출근 관리 (개선된 버전)
          </h1>
          
          <div className="text-right">
            <p className="text-xs text-gray-600">현재 시간</p>
            <p className="text-sm font-semibold text-gray-900">
              {format(currentTime, 'yyyy년 MM월 dd일 HH:mm:ss', { locale: ko })}
            </p>
          </div>
        </div>

        {/* 디버깅 정보 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-xs">
          <p><strong>디버깅 정보:</strong></p>
          <p>사용자 ID: {currentUser?.employee_id || '없음'}</p>
          <p>사용자 이름: {currentUser?.name || '없음'}</p>
          <p>오늘 스케줄 수: {todaySchedules.length}개</p>
          <p>월간 기록 수: {monthlyRecords.length}개</p>
          <p>로딩 상태: {loading ? '로딩 중' : '완료'}</p>
        </div>

        {/* 일일 근무 요약 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">📊 오늘 근무 요약</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-600">{totalHours}h {totalMinutes}m</div>
              <div className="text-sm text-blue-700">총 근무 시간</div>
            </div>
            
            <div>
              <div className="text-2xl font-bold text-green-600">{attendanceAnalysis.completedCount}</div>
              <div className="text-sm text-green-700">완료된 근무</div>
            </div>
            
            <div>
              <div className="text-2xl font-bold text-orange-600">{attendanceAnalysis.inProgressCount}</div>
              <div className="text-sm text-orange-700">진행 중</div>
            </div>
            
            <div>
              <div className="text-2xl font-bold text-gray-600">{attendanceAnalysis.pendingCount}</div>
              <div className="text-sm text-gray-700">대기 중</div>
            </div>
          </div>
        </div>

        {/* 단순화된 출근 관리 */}
        <div className="bg-white rounded-lg border p-6 shadow-sm mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🚀 간단한 출근 관리</h3>
          
          <div className="space-y-4">
            {/* 출근/퇴근 상태 표시 */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="font-medium">현재 상태: </span>
                <span className={`px-2 py-1 rounded-full text-sm ${
                  dailyAttendance.isCheckedIn && !dailyAttendance.checkOutTime 
                    ? 'bg-green-100 text-green-800' 
                    : dailyAttendance.checkOutTime 
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {dailyAttendance.isCheckedIn && !dailyAttendance.checkOutTime ? '근무 중' : 
                   dailyAttendance.checkOutTime ? '근무 완료' : '출근 전'}
                </span>
              </div>
              
              {dailyAttendance.checkInTime && (
                <div className="text-sm text-gray-600">
                  출근: {format(new Date(dailyAttendance.checkInTime), 'MM/dd HH:mm', { locale: ko })}
                </div>
              )}
            </div>
            
            {/* 출근/퇴근 버튼 */}
            <div className="flex space-x-4 justify-center">
              {!dailyAttendance.isCheckedIn && (
                <button
                  onClick={handleSimpleCheckIn}
                  disabled={checkingIn}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg text-lg font-medium disabled:opacity-50"
                >
                  <CheckCircle className="h-5 w-5 mr-2" />
                  {checkingIn ? '처리중...' : '출근 체크'}
                </button>
              )}
              
              {dailyAttendance.isCheckedIn && !dailyAttendance.checkOutTime && (
                <>
                  <button
                    onClick={handleBreakReturn}
                    disabled={checkingIn}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-3 rounded-lg text-lg font-medium disabled:opacity-50"
                  >
                    <Coffee className="h-5 w-5 mr-2" />
                    휴식 후 복귀
                  </button>
                  
                  <button
                    onClick={handleSimpleCheckOut}
                    disabled={checkingIn}
                    className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg text-lg font-medium disabled:opacity-50"
                  >
                    <XCircle className="h-5 w-5 mr-2" />
                    {checkingIn ? '처리중...' : '퇴근 체크'}
                  </button>
                </>
              )}
            </div>
            
            {/* 총 근무 시간 표시 */}
            {dailyAttendance.totalWorkTime && (
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <span className="font-medium text-blue-900">
                  오늘 총 근무 시간: {dailyAttendance.totalWorkTime}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 오늘의 스케줄 (상세 보기) */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-green-600" />
            오늘의 근무 스케줄 (상세)
          </h2>
          
          {todaySchedules.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>오늘 등록된 근무 스케줄이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todaySchedules.map((schedule, index) => {
                const status = schedule.status;
                const statusColor = {
                  'pending': 'text-gray-600 bg-gray-100',
                  'in_progress': 'text-blue-600 bg-blue-100',
                  'completed': 'text-green-600 bg-green-100',
                  'break': 'text-orange-600 bg-orange-100'
                }[status] || 'text-gray-600 bg-gray-100';
                
                const statusText = {
                  'pending': '대기',
                  'in_progress': '근무중',
                  'completed': '완료',
                  'break': '휴식'
                }[status] || '대기';
                
                return (
                  <div key={schedule.id} className="bg-white rounded-lg border p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="text-sm font-medium text-gray-900">
                            {index + 1}번째 시간대
                          </span>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
                            {statusText}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
                          {schedule.actual_start && (
                            <div className="flex items-center">
                              <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                              출근: {format(new Date(schedule.actual_start), 'MM/dd HH:mm', { locale: ko })}
                            </div>
                          )}
                          {schedule.actual_end && (
                            <div className="flex items-center">
                              <XCircle className="h-3 w-3 mr-1 text-red-500" />
                              퇴근: {format(new Date(schedule.actual_end), 'MM/dd HH:mm', { locale: ko })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 이번 달 출근 기록 */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <User className="h-5 w-5 mr-2 text-blue-600" />
            이번 달 출근 기록
          </h2>
          
          {monthlyRecords.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Building className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>이번 달 출근 기록이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {monthlyRecords.slice(0, 5).map((record) => (
                <div key={record.id} className="bg-white rounded p-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span>{format(new Date(record.schedule_date), 'MM/dd', { locale: ko })}</span>
                    <span className="text-gray-600">
                      {record.actual_start && record.actual_end ? '완료' : '진행중'}
                    </span>
                  </div>
                </div>
              ))}
              {monthlyRecords.length > 5 && (
                <div className="text-center text-sm text-gray-500">
                  외 {monthlyRecords.length - 5}개 기록...
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
