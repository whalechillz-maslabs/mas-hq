'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Users, ChevronLeft, ChevronRight, Plus, List, CalendarDays } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { format, addDays, startOfWeek, endOfWeek, isSameDay, parseISO } from 'date-fns';
import { ko } from 'date-fns/locale';

interface Schedule {
  id: string;
  employee_id: string;
  schedule_date: string;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  employee_note?: string;
  employees: {
    name: string;
    employee_id: string;
  };
}

export default function SchedulesPage() {
  const router = useRouter();
  const [currentWeek, setCurrentWeek] = useState(startOfWeek(new Date(), { locale: ko }));
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const fetchUserAndSchedules = async () => {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setCurrentUser(user);
      fetchSchedules(currentWeek);
    };
    fetchUserAndSchedules();
  }, [currentWeek, router]);

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

  const fetchSchedules = async (weekStart: Date) => {
    setLoading(true);
    const weekEnd = endOfWeek(weekStart, { locale: ko });
    
    try {
      const { data, error } = await supabase
        .from('schedules')
        .select(`
          *,
          employees(name, employee_id)
        `)
        .gte('schedule_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('schedule_date', format(weekEnd, 'yyyy-MM-dd'))
        .order('schedule_date', { ascending: true })
        .order('scheduled_start', { ascending: true });

      if (error) {
        console.error('Error fetching schedules:', error);
        setSchedules([]);
      } else {
        setSchedules(data || []);
      }
    } catch (error) {
      console.error('Error fetching schedules:', error);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  const daysInWeek = Array.from({ length: 7 }).map((_, i) => addDays(currentWeek, i));

  const handlePrevWeek = () => setCurrentWeek(addDays(currentWeek, -7));
  const handleNextWeek = () => setCurrentWeek(addDays(currentWeek, 7));

  const getSchedulesForDate = (date: Date) => {
    return schedules.filter(s => isSameDay(parseISO(s.schedule_date), date));
  };

  const handleAddSchedule = () => {
    router.push('/schedules/add');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-3xl shadow-xl p-6 sm:p-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center">
            <Calendar className="h-8 w-8 mr-3 text-blue-600" />
            근무 스케줄
          </h1>
          
          {/* 스케줄 추가 버튼 */}
          <button
            onClick={handleAddSchedule}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg flex items-center transition-all duration-200 transform hover:scale-105"
          >
            <Plus className="h-5 w-5 mr-2" />
            스케줄 추가
          </button>
        </div>

        {/* 주간 네비게이션 */}
        <div className="flex items-center justify-between mb-6 bg-gray-50 p-3 rounded-xl shadow-sm">
          <button 
            onClick={handlePrevWeek} 
            className="p-2 rounded-full hover:bg-gray-200 transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h2 className="text-xl font-semibold text-gray-800">
            {format(currentWeek, 'yyyy년 MM월 dd일', { locale: ko })} - {format(endOfWeek(currentWeek, { locale: ko }), 'yyyy년 MM월 dd일', { locale: ko })}
          </h2>
          <button 
            onClick={handleNextWeek} 
            className="p-2 rounded-full hover:bg-gray-200 transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-gray-700" />
          </button>
        </div>

        {/* 뷰 모드 토글 */}
        <div className="flex justify-center mb-6">
          <div className="flex space-x-2 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('calendar')}
              className={`p-3 rounded-xl transition-all duration-200 flex items-center ${
                viewMode === 'calendar' 
                  ? 'bg-white text-blue-600 shadow-md' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Calendar className="w-5 h-5 mr-2" />
              달력
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-3 rounded-xl transition-all duration-200 flex items-center ${
                viewMode === 'list' 
                  ? 'bg-white text-blue-600 shadow-md' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <List className="w-5 h-5 mr-2" />
              리스트
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">스케줄을 불러오는 중...</p>
          </div>
        ) : (
          <>
            {viewMode === 'calendar' ? (
              // 달력 뷰
              <div className="grid grid-cols-7 gap-2 text-center">
                {['일', '월', '화', '수', '목', '금', '토'].map(day => (
                  <div key={day} className="font-bold text-gray-700 text-sm mb-2 p-2">
                    {day}
                  </div>
                ))}
                {daysInWeek.map(date => (
                  <div
                    key={format(date, 'yyyy-MM-dd')}
                    className={`p-2 rounded-lg min-h-[120px] ${
                      isSameDay(date, new Date()) 
                        ? 'bg-blue-100 border-2 border-blue-500' 
                        : 'bg-gray-50'
                    }`}
                  >
                    <div className="font-semibold text-lg mb-1">
                      {format(date, 'd')}
                    </div>
                    {getSchedulesForDate(date).map(schedule => (
                      <div 
                        key={schedule.id} 
                        className="text-xs bg-blue-200 text-blue-800 rounded-md px-1 py-0.5 mb-0.5 truncate"
                      >
                        {schedule.employees?.name} ({schedule.scheduled_start?.substring(0, 5)}~{schedule.scheduled_end?.substring(0, 5)})
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              // 리스트 뷰
              <div className="space-y-4">
                {daysInWeek.map(date => (
                  <div key={format(date, 'yyyy-MM-dd')} className="bg-gray-50 rounded-xl p-4">
                    <h3 className={`text-lg font-bold mb-3 ${
                      isSameDay(date, new Date()) ? 'text-blue-600' : 'text-gray-800'
                    }`}>
                      {format(date, 'yyyy년 MM월 dd일 (EEE)', { locale: ko })}
                      {isSameDay(date, new Date()) && (
                        <span className="ml-2 text-sm text-blue-500">(오늘)</span>
                      )}
                    </h3>
                    {getSchedulesForDate(date).length > 0 ? (
                      <ul className="space-y-2">
                        {getSchedulesForDate(date).map(schedule => (
                          <li key={schedule.id} className="flex items-center justify-between bg-white p-3 rounded-lg shadow-sm">
                            <div>
                              <p className="font-semibold text-gray-900">
                                {schedule.employees?.name}
                              </p>
                              <p className="text-sm text-gray-600">
                                {schedule.scheduled_start?.substring(0, 5)} - {schedule.scheduled_end?.substring(0, 5)}
                                {schedule.employee_note && ` (${schedule.employee_note})`}
                              </p>
                            </div>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              schedule.status === 'approved' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {schedule.status === 'approved' ? '승인됨' : '대기중'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 text-sm">스케줄 없음</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
