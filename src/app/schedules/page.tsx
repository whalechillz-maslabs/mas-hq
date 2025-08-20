'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Users, ChevronLeft, ChevronRight, Plus, List, CalendarDays } from 'lucide-react';
import { createClient } from '@/lib/supabase';

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
    nickname?: string;
  };
}

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState<Date[]>([]);

  const supabase = createClient();

  // 현재 주의 날짜들 계산
  useEffect(() => {
    const week = [];
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    setCurrentWeek(week);
  }, [currentDate]);

  // 스케줄 데이터 로드
  useEffect(() => {
    loadSchedules();
  }, [currentDate]);

  const loadSchedules = async () => {
    try {
      setLoading(true);
      
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      const { data, error } = await supabase
        .from('schedules')
        .select(`
          id,
          employee_id,
          schedule_date,
          scheduled_start,
          scheduled_end,
          status,
          employee_note,
          employee:employees(name, nickname)
        `)
        .gte('schedule_date', startOfWeek.toISOString().split('T')[0])
        .lte('schedule_date', endOfWeek.toISOString().split('T')[0])
        .order('schedule_date', { ascending: true });

      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      console.error('스케줄 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (time: string) => {
    return time.substring(0, 5);
  };

  const getSchedulesForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return schedules.filter(schedule => schedule.schedule_date === dateStr);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return '승인됨';
      case 'pending': return '대기중';
      case 'rejected': return '거부됨';
      default: return status;
    }
  };

  const prevWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const nextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const today = new Date();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Calendar className="h-8 w-8 mr-3 text-blue-600" />
              근무 스케줄
            </h1>
            <div className="flex space-x-2">
              <button
                onClick={() => setViewMode('calendar')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'calendar' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                <CalendarDays className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-lg transition-colors ${
                  viewMode === 'list' 
                    ? 'bg-blue-100 text-blue-600' 
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                <List className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* 주간 네비게이션 */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prevWeek}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-semibold text-gray-800">
              {currentWeek[0]?.toLocaleDateString('ko-KR', { month: 'long', year: 'numeric' })} 
              {currentWeek[0]?.toLocaleDateString('ko-KR', { day: 'numeric' })} - 
              {currentWeek[6]?.toLocaleDateString('ko-KR', { day: 'numeric' })}주
            </h2>
            <button
              onClick={nextWeek}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">스케줄을 불러오는 중...</p>
          </div>
        ) : viewMode === 'calendar' ? (
          /* 달력 뷰 */
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            {/* 요일 헤더 */}
            <div className="grid grid-cols-7 bg-gray-50 border-b">
              {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
                <div key={day} className="p-4 text-center font-semibold text-gray-700">
                  {day}
                </div>
              ))}
            </div>
            
            {/* 날짜 그리드 */}
            <div className="grid grid-cols-7">
              {currentWeek.map((date, index) => {
                const daySchedules = getSchedulesForDate(date);
                const isToday = date.toDateString() === today.toDateString();
                
                return (
                  <div
                    key={index}
                    className={`min-h-32 border-r border-b border-gray-200 p-2 ${
                      isToday ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className={`text-sm font-medium mb-2 ${
                      isToday ? 'text-blue-600' : 'text-gray-700'
                    }`}>
                      {date.getDate()}
                    </div>
                    
                    <div className="space-y-1">
                      {daySchedules.map((schedule) => (
                        <div
                          key={schedule.id}
                          className="text-xs p-1 rounded bg-blue-100 text-blue-800 truncate"
                        >
                          <div className="font-medium">
                            {schedule.employee.nickname || schedule.employee.name}
                          </div>
                          <div className="text-blue-600">
                            {formatTime(schedule.scheduled_start)} - {formatTime(schedule.scheduled_end)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* 리스트 뷰 */
          <div className="space-y-4">
            {currentWeek.map((date) => {
              const daySchedules = getSchedulesForDate(date);
              const isToday = date.toDateString() === today.toDateString();
              
              return (
                <div
                  key={date.toISOString()}
                  className={`bg-white rounded-2xl shadow-lg p-6 ${
                    isToday ? 'ring-2 ring-blue-500' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className={`text-lg font-semibold ${
                      isToday ? 'text-blue-600' : 'text-gray-800'
                    }`}>
                      {date.toLocaleDateString('ko-KR', { 
                        month: 'long', 
                        day: 'numeric', 
                        weekday: 'long' 
                      })}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      isToday ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {daySchedules.length}명 출근
                    </span>
                  </div>
                  
                  {daySchedules.length > 0 ? (
                    <div className="space-y-3">
                      {daySchedules.map((schedule) => (
                        <div
                          key={schedule.id}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">
                                {schedule.employee.nickname || schedule.employee.name}
                              </div>
                              <div className="text-sm text-gray-600">
                                {schedule.employee_note || '정상 근무'}
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                              <Clock className="h-4 w-4" />
                              <span>
                                {formatTime(schedule.scheduled_start)} - {formatTime(schedule.scheduled_end)}
                              </span>
                            </div>
                            <div className={`mt-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(schedule.status)}`}>
                              {getStatusText(schedule.status)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>해당 날짜에 출근 예정인 직원이 없습니다.</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
