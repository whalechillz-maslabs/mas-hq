'use client';

import { useState, useEffect } from 'react';
import { Clock, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, XCircle, Coffee, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, addDays } from 'date-fns';
import { ko } from 'date-fns/locale';

interface AttendanceSummaryProps {
  employeeId: string;
  currentDate: string;
}

interface AttendanceData {
  date: string;
  scheduledHours: number;
  actualHours: number;
  checkInTime: string | null;
  checkOutTime: string | null;
  breakStartTime: string | null;
  breakEndTime: string | null;
  status: 'on-time' | 'late' | 'early-leave' | 'absent' | 'overtime';
  isWeekend: boolean;
}

export default function AttendanceSummary({ employeeId, currentDate }: AttendanceSummaryProps) {
  const [attendanceData, setAttendanceData] = useState<AttendanceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [summaryPeriod, setSummaryPeriod] = useState<'week' | 'month'>('week');

  useEffect(() => {
    loadAttendanceSummary();
  }, [employeeId, currentDate, summaryPeriod]);

  const loadAttendanceSummary = async () => {
    setLoading(true);
    try {
      let startDate, endDate;
      
      if (summaryPeriod === 'week') {
        startDate = startOfWeek(new Date(currentDate), { locale: ko, weekStartsOn: 0 });
        endDate = endOfWeek(new Date(currentDate), { locale: ko });
      } else {
        startDate = startOfMonth(new Date(currentDate));
        endDate = endOfMonth(new Date(currentDate));
      }

      // 1. 스케줄 데이터 조회
      const { data: schedules, error: scheduleError } = await supabase
        .from('schedules')
        .select('*')
        .eq('employee_id', employeeId)
        .gte('schedule_date', format(startDate, 'yyyy-MM-dd'))
        .lte('schedule_date', format(endDate, 'yyyy-MM-dd'))
        .in('status', ['approved', 'completed', 'in_progress']);

      if (scheduleError) throw scheduleError;

      // 2. 출근 기록 조회
      const { data: attendanceRecords, error: attendanceError } = await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', employeeId)
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'));

      if (attendanceError) throw attendanceError;

      // 3. 데이터 분석 및 통합
      const attendanceMap = new Map();
      attendanceRecords?.forEach(record => {
        attendanceMap.set(record.date, record);
      });

      const processedData: AttendanceData[] = [];
      
      // 기간 내 모든 날짜에 대해 데이터 생성
      for (let d = new Date(startDate); d <= endDate; d = addDays(d, 1)) {
        const dateStr = format(d, 'yyyy-MM-dd');
        const dayOfWeek = d.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        
        const schedule = schedules?.find(s => s.schedule_date === dateStr);
        const attendance = attendanceMap.get(dateStr);

        if (schedule) {
          // 스케줄이 있는 날
          const scheduledStart = new Date(`${dateStr}T${schedule.scheduled_start}:00`);
          const scheduledEnd = new Date(`${dateStr}T${schedule.scheduled_end}:00`);
          const scheduledHours = (scheduledEnd.getTime() - scheduledStart.getTime()) / (1000 * 60 * 60);

          let actualHours = 0;
          let status: AttendanceData['status'] = 'absent';

          if (attendance?.check_in_time && attendance?.check_out_time) {
            const checkIn = new Date(attendance.check_in_time);
            const checkOut = new Date(attendance.check_out_time);
            actualHours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);

            // 휴식 시간 제외
            if (attendance.break_start_time && attendance.break_end_time) {
              const breakStart = new Date(attendance.break_start_time);
              const breakEnd = new Date(attendance.break_end_time);
              const breakHours = (breakEnd.getTime() - breakStart.getTime()) / (1000 * 60 * 60);
              actualHours -= breakHours;
            }

            // 상태 판정
            const checkInDiff = (checkIn.getTime() - scheduledStart.getTime()) / (1000 * 60); // 분 단위
            const checkOutDiff = (checkOut.getTime() - scheduledEnd.getTime()) / (1000 * 60); // 분 단위

            if (checkInDiff > 10) { // 10분 이상 지각
              status = 'late';
            } else if (checkOutDiff < -10) { // 10분 이상 조퇴
              status = 'early-leave';
            } else if (actualHours > scheduledHours + 0.5) { // 30분 이상 초과근무
              status = 'overtime';
            } else {
              status = 'on-time';
            }
          }

          processedData.push({
            date: dateStr,
            scheduledHours,
            actualHours,
            checkInTime: attendance?.check_in_time ? format(new Date(attendance.check_in_time), 'HH:mm') : null,
            checkOutTime: attendance?.check_out_time ? format(new Date(attendance.check_out_time), 'HH:mm') : null,
            breakStartTime: attendance?.break_start_time ? format(new Date(attendance.break_start_time), 'HH:mm') : null,
            breakEndTime: attendance?.break_end_time ? format(new Date(attendance.break_end_time), 'HH:mm') : null,
            status,
            isWeekend
          });
        } else if (!isWeekend) {
          // 주말이 아닌데 스케줄이 없는 날 (결근으로 간주)
          processedData.push({
            date: dateStr,
            scheduledHours: 0,
            actualHours: 0,
            checkInTime: null,
            checkOutTime: null,
            breakStartTime: null,
            breakEndTime: null,
            status: 'absent',
            isWeekend: false
          });
        }
      }

      setAttendanceData(processedData);
    } catch (error) {
      console.error('근태 요약 로드 오류:', error);
      setAttendanceData([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: AttendanceData['status']) => {
    switch (status) {
      case 'on-time':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'late':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'early-leave':
        return <XCircle className="h-4 w-4 text-orange-500" />;
      case 'overtime':
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case 'absent':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: AttendanceData['status']) => {
    switch (status) {
      case 'on-time':
        return '정시';
      case 'late':
        return '지각';
      case 'early-leave':
        return '조퇴';
      case 'overtime':
        return '초과근무';
      case 'absent':
        return '결근';
      default:
        return '미확인';
    }
  };

  const getStatusColor = (status: AttendanceData['status']) => {
    switch (status) {
      case 'on-time':
        return 'bg-green-100 text-green-800';
      case 'late':
        return 'bg-yellow-100 text-yellow-800';
      case 'early-leave':
        return 'bg-orange-100 text-orange-800';
      case 'overtime':
        return 'bg-blue-100 text-blue-800';
      case 'absent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // 통계 계산
  const totalScheduledHours = attendanceData.reduce((sum, day) => sum + day.scheduledHours, 0);
  const totalActualHours = attendanceData.reduce((sum, day) => sum + day.actualHours, 0);
  const overtimeHours = Math.max(0, totalActualHours - totalScheduledHours);
  const lateCount = attendanceData.filter(day => day.status === 'late').length;
  const earlyLeaveCount = attendanceData.filter(day => day.status === 'early-leave').length;
  const absentCount = attendanceData.filter(day => day.status === 'absent').length;
  const onTimeCount = attendanceData.filter(day => day.status === 'on-time').length;

  if (loading) {
    return (
      <div className="bg-white rounded-lg border p-6 shadow-sm">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">근태 요약을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border p-6 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 flex items-center">
          <TrendingUp className="h-6 w-6 mr-2 text-blue-600" />
          근태 서머리
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setSummaryPeriod('week')}
            className={`px-3 py-1 text-sm rounded-md ${
              summaryPeriod === 'week' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            주간
          </button>
          <button
            onClick={() => setSummaryPeriod('month')}
            className={`px-3 py-1 text-sm rounded-md ${
              summaryPeriod === 'month' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            월간
          </button>
        </div>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-600">정시 출근</p>
              <p className="text-2xl font-bold text-green-800">{onTimeCount}일</p>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-yellow-600">지각</p>
              <p className="text-2xl font-bold text-yellow-800">{lateCount}일</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-600">초과근무</p>
              <p className="text-2xl font-bold text-blue-800">{overtimeHours.toFixed(1)}h</p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 rounded-lg p-4">
          <div className="flex items-center">
            <XCircle className="h-8 w-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-red-600">결근/조퇴</p>
              <p className="text-2xl font-bold text-red-800">{absentCount + earlyLeaveCount}일</p>
            </div>
          </div>
        </div>
      </div>

      {/* 시간 요약 */}
      <div className="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">시간 요약</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-sm text-gray-600">스케줄 시간</p>
            <p className="text-2xl font-bold text-gray-900">{totalScheduledHours.toFixed(1)}h</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">실제 근무</p>
            <p className="text-2xl font-bold text-gray-900">{totalActualHours.toFixed(1)}h</p>
          </div>
          <div className="text-center">
            <p className="text-sm text-gray-600">시간 차이</p>
            <p className={`text-2xl font-bold ${totalActualHours >= totalScheduledHours ? 'text-green-600' : 'text-red-600'}`}>
              {totalActualHours >= totalScheduledHours ? '+' : ''}{(totalActualHours - totalScheduledHours).toFixed(1)}h
            </p>
          </div>
        </div>
      </div>

      {/* 일별 상세 내역 */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">일별 상세 내역</h3>
        <div className="space-y-2">
          {attendanceData.map((day) => (
            <div key={day.date} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-900">
                  {format(new Date(day.date), 'MM/dd (E)', { locale: ko })}
                </span>
                {day.isWeekend && (
                  <span className="px-2 py-1 text-xs bg-purple-100 text-purple-800 rounded-full">
                    주말
                  </span>
                )}
              </div>
              
              <div className="flex items-center space-x-4">
                {day.checkInTime && day.checkOutTime ? (
                  <>
                    <div className="text-sm text-gray-600">
                      {day.checkInTime} - {day.checkOutTime}
                    </div>
                    {day.breakStartTime && day.breakEndTime && (
                      <div className="flex items-center text-sm text-orange-600">
                        <Coffee className="h-3 w-3 mr-1" />
                        {day.breakStartTime}-{day.breakEndTime}
                      </div>
                    )}
                    <div className="text-sm font-medium text-gray-900">
                      {day.actualHours.toFixed(1)}h
                    </div>
                  </>
                ) : (
                  <div className="text-sm text-gray-400">-</div>
                )}
                
                <div className={`px-2 py-1 text-xs rounded-full flex items-center space-x-1 ${getStatusColor(day.status)}`}>
                  {getStatusIcon(day.status)}
                  <span>{getStatusText(day.status)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
