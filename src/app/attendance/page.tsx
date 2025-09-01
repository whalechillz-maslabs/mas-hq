'use client';

import { useState, useEffect } from 'react';
import { Clock, MapPin, CheckCircle, XCircle, Calendar, User, Building } from 'lucide-react';
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

export default function AttendancePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [todaySchedules, setTodaySchedules] = useState<AttendanceRecord[]>([]);
  const [monthlyRecords, setMonthlyRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // 컴포넌트 마운트 시 즉시 실행
  useEffect(() => {
    console.log('🚀 개인별 출근 관리 페이지 마운트됨');
    
    // 즉시 실행되는 함수
    const loadData = async () => {
      try {
        const user = await getCurrentUser();
        console.log('👤 사용자 정보:', user);
        
        if (!user) {
          console.log('❌ 사용자 정보 없음 - 로그인 페이지로 이동');
          router.push('/login');
          return;
        }
        
        console.log('✅ 사용자 정보 설정 완료:', user.id);
        setCurrentUser(user);
        
        // 스케줄 데이터 로딩
        console.log('📅 오늘 스케줄 조회 시작...');
        const today = format(new Date(), 'yyyy-MM-dd');
        console.log('📅 오늘 날짜:', today, '사용자 ID:', user.id);
        
        const { data: todayData, error: todayError } = await supabase
          .from('schedules')
          .select('*')
          .eq('employee_id', user.id)
          .eq('schedule_date', today);

        if (todayError) {
          console.error('❌ 오늘 스케줄 조회 오류:', todayError);
          setTodaySchedules([]);
        } else {
          console.log('✅ 오늘 스케줄 조회 성공:', todayData?.length || 0, '개');
          console.log('📊 스케줄 데이터:', todayData);
          setTodaySchedules(todayData || []);
        }
        
        console.log('📊 월간 기록 조회 시작...');
        const startDate = startOfMonth(new Date());
        const endDate = endOfMonth(new Date());
        
        console.log('📅 월간 조회 기간:', format(startDate, 'yyyy-MM-dd'), '~', format(endDate, 'yyyy-MM-dd'));
        
        const { data: monthlyData, error: monthlyError } = await supabase
          .from('schedules')
          .select('*')
          .eq('employee_id', user.id)
          .gte('schedule_date', format(startDate, 'yyyy-MM-dd'))
          .lte('schedule_date', format(endDate, 'yyyy-MM-dd'))
          .not('actual_start', 'is', null);

        if (monthlyError) {
          console.error('❌ 월간 기록 조회 오류:', monthlyError);
          setMonthlyRecords([]);
        } else {
          console.log('✅ 월간 기록 조회 성공:', monthlyData?.length || 0, '개');
          console.log('📊 월간 데이터:', monthlyData);
          setMonthlyRecords(monthlyData || []);
        }
        
        console.log('🔄 로딩 상태 해제');
        setLoading(false);
        console.log('✅ 모든 데이터 로딩 완료');
        
      } catch (error) {
        console.error('❌ 전체 로딩 과정 실패:', error);
        setLoading(false);
        // 에러 발생 시 기본값 설정
        setTodaySchedules([]);
        setMonthlyRecords([]);
      }
    };
    
    // 즉시 실행
    loadData();

    // 시간 업데이트
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getCurrentUser = async () => {
    try {
      // localStorage 기반 인증 사용
      if (typeof window !== 'undefined') {
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        const employeeData = localStorage.getItem('currentEmployee');
        
        if (isLoggedIn === 'true' && employeeData) {
          const employee = JSON.parse(employeeData);
          console.log('🔍 개인별 출근 관리 - 현재 사용자:', employee);
          return employee;
        }
      }
    } catch (error) {
      console.error('사용자 인증 오류:', error);
    }
    return null;
  };

  const fetchTodaySchedules = async (user: any) => {
    if (!user?.id) {
      console.log('❌ fetchTodaySchedules: 사용자 ID 없음');
      setTodaySchedules([]);
      return;
    }

    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      console.log('📅 오늘 날짜:', today, '사용자 ID:', user.id);
      
      // 단순한 쿼리로 테스트
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('employee_id', user.id)
        .eq('schedule_date', today);

      if (error) {
        console.error('❌ 오늘 스케줄 조회 오류:', error);
        setTodaySchedules([]);
      } else {
        console.log('✅ 오늘 스케줄 조회 성공:', data?.length || 0, '개');
        console.log('📊 스케줄 데이터:', data);
        setTodaySchedules(data || []);
      }
    } catch (error) {
      console.error('❌ 오늘 스케줄 조회 예외:', error);
      setTodaySchedules([]);
    }
  };

  const fetchMonthlyRecords = async (user: any) => {
    if (!user?.id) {
      console.log('❌ fetchMonthlyRecords: 사용자 ID 없음');
      setMonthlyRecords([]);
      setLoading(false);
      return;
    }

    try {
      const startDate = startOfMonth(new Date());
      const endDate = endOfMonth(new Date());
      
      console.log('📅 월간 조회 기간:', format(startDate, 'yyyy-MM-dd'), '~', format(endDate, 'yyyy-MM-dd'));
      
      // 단순한 쿼리로 테스트
      const { data, error } = await supabase
        .from('schedules')
        .select('*')
        .eq('employee_id', user.id)
        .gte('schedule_date', format(startDate, 'yyyy-MM-dd'))
        .lte('schedule_date', format(endDate, 'yyyy-MM-dd'))
        .not('actual_start', 'is', null);

      if (error) {
        console.error('❌ 월간 기록 조회 오류:', error);
        setMonthlyRecords([]);
      } else {
        console.log('✅ 월간 기록 조회 성공:', data?.length || 0, '개');
        console.log('📊 월간 데이터:', data);
        setMonthlyRecords(data || []);
      }
    } catch (error) {
      console.error('❌ 월간 기록 조회 예외:', error);
      setMonthlyRecords([]);
    } finally {
      console.log('🔄 로딩 상태 해제');
      setLoading(false);
    }
  };

  const getCurrentLocation = (): Promise<GeolocationPosition> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('위치 서비스가 지원되지 않습니다.'));
      }

      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      });
    });
  };

  const handleCheckIn = async (scheduleId: string) => {
    setCheckingIn(true);

    try {
      let location = null;
      
      try {
        const position = await getCurrentLocation();
        location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString()
        };
      } catch (locationError) {
        console.warn('위치 정보를 가져올 수 없습니다:', locationError);
        // 위치 정보 없이도 출근 체크 가능
      }

      const { error } = await supabase
        .from('schedules')
        .update({
          actual_start: new Date().toISOString(),
          check_in_location: location,
          status: 'in_progress'
        })
        .eq('id', scheduleId);

      if (error) {
        console.error('Check-in error:', error);
        throw error;
      }

      alert('출근 체크가 완료되었습니다!');
      await fetchTodaySchedules(currentUser);
      await fetchMonthlyRecords(currentUser);
    } catch (error: any) {
      console.error('출근 체크 오류:', error);
      alert(`출근 체크에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setCheckingIn(false);
    }
  };

  const handleCheckOut = async (scheduleId: string) => {
    setCheckingIn(true);

    try {
      let location = null;
      
      try {
        const position = await getCurrentLocation();
        location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString()
        };
      } catch (locationError) {
        console.warn('위치 정보를 가져올 수 없습니다:', locationError);
      }

      const { error } = await supabase
        .from('schedules')
        .update({
          actual_end: new Date().toISOString(),
          check_out_location: location,
          status: 'completed'
        })
        .eq('id', scheduleId);

      if (error) {
        console.error('Check-out error:', error);
        throw error;
      }

      alert('퇴근 체크가 완료되었습니다!');
      await fetchTodaySchedules(currentUser);
      await fetchMonthlyRecords(currentUser);
    } catch (error: any) {
      console.error('퇴근 체크 오류:', error);
      alert(`퇴근 체크에 실패했습니다: ${error.message || '알 수 없는 오류'}`);
    } finally {
      setCheckingIn(false);
    }
  };

  const getAttendanceStatus = (schedule: AttendanceRecord) => {
    if (schedule.actual_start && schedule.actual_end) {
      return { status: 'completed', text: '완료', color: 'text-green-600 bg-green-100' };
    } else if (schedule.actual_start) {
      return { status: 'in_progress', text: '근무중', color: 'text-blue-600 bg-blue-100' };
    } else {
      return { status: 'pending', text: '대기', color: 'text-gray-600 bg-gray-100' };
    }
  };

  const formatTime = (timeString: string) => {
    return format(new Date(timeString), 'HH:mm', { locale: ko });
  };

  const formatDateTime = (dateTimeString: string) => {
    return format(new Date(dateTimeString), 'MM/dd HH:mm', { locale: ko });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 p-1 sm:p-2">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-2 sm:p-4">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center">
            <Clock className="h-5 w-5 sm:h-6 sm:w-6 mr-1 sm:mr-2 text-green-600" />
            출근 관리
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

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
            <p className="text-gray-600">로딩 중...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 오늘의 스케줄 */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-green-600" />
                오늘의 근무 스케줄
              </h2>
              
              {todaySchedules.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>오늘 등록된 근무 스케줄이 없습니다.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {todaySchedules.map((schedule) => {
                    const status = getAttendanceStatus(schedule);
                    const canCheckIn = !schedule.actual_start;
                    const canCheckOut = schedule.actual_start && !schedule.actual_end;
                    
                    return (
                      <div key={schedule.id} className="bg-white rounded-lg border p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <span className="text-sm font-medium text-gray-900">
                                {formatTime(schedule.scheduled_start)} - {formatTime(schedule.scheduled_end)}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                                {status.text}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600">
                              {schedule.actual_start && (
                                <div className="flex items-center">
                                  <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                                  출근: {formatDateTime(schedule.actual_start)}
                                </div>
                              )}
                              {schedule.actual_end && (
                                <div className="flex items-center">
                                  <XCircle className="h-3 w-3 mr-1 text-red-500" />
                                  퇴근: {formatDateTime(schedule.actual_end)}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex space-x-2">
                            {canCheckIn && (
                              <button
                                onClick={() => handleCheckIn(schedule.id)}
                                disabled={checkingIn}
                                className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                {checkingIn ? '처리중...' : '출근'}
                              </button>
                            )}
                            
                            {canCheckOut && (
                              <button
                                onClick={() => handleCheckOut(schedule.id)}
                                disabled={checkingIn}
                                className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                {checkingIn ? '처리중...' : '퇴근'}
                              </button>
                            )}
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
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {monthlyRecords.map((record) => {
                    const status = getAttendanceStatus(record);
                    
                    return (
                      <div key={record.id} className="bg-white rounded-lg border p-3 text-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="font-medium text-gray-900">
                              {format(new Date(record.schedule_date), 'MM/dd (EEE)', { locale: ko })}
                            </span>
                            <span className="text-gray-600">
                              {formatTime(record.scheduled_start)} - {formatTime(record.scheduled_end)}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                              {status.text}
                            </span>
                          </div>
                          
                          <div className="text-xs text-gray-500">
                            {record.actual_start && record.actual_end && (
                              <span>
                                {formatTime(record.actual_start)} - {formatTime(record.actual_end)}
                              </span>
                            )}
                          </div>
                        </div>
                        
                        {record.check_in_location && (
                          <div className="mt-1 flex items-center text-xs text-gray-500">
                            <MapPin className="h-3 w-3 mr-1" />
                            위치 정보 기록됨
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
