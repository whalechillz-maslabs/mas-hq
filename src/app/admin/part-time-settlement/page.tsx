'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { format, addDays, subDays, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { ko } from 'date-fns/locale';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface PartTimeEmployee {
  id: string;
  name: string;
  employee_id: string;
  department: string;
  position: string;
  hourly_rate: number;
  employment_type: string;
}

interface DailyWorkRecord {
  date: string;
  start_time: string;
  end_time: string;
  total_hours: number;
  hourly_rate: number;
  daily_wage: number;
  status: 'pending' | 'approved' | 'paid';
}

interface WeeklySettlement {
  week_start: string;
  week_end: string;
  total_days: number;
  total_hours: number;
  total_wage: number;
  status: 'pending' | 'approved' | 'paid';
  records: DailyWorkRecord[];
}

export default function PartTimeSettlement() {
  const router = useRouter();
  const [employees, setEmployees] = useState<PartTimeEmployee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [selectedWeek, setSelectedWeek] = useState<string>('');
  const [workRecords, setWorkRecords] = useState<DailyWorkRecord[]>([]);
  const [weeklySettlement, setWeeklySettlement] = useState<WeeklySettlement | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadPartTimeEmployees();
    setSelectedWeek(getCurrentWeek());
  }, []);

  useEffect(() => {
    if (selectedEmployee && selectedWeek) {
      loadWorkRecords();
    }
  }, [selectedEmployee, selectedWeek]);

  const loadPartTimeEmployees = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('employees')
        .select(`
          id,
          name,
          employee_id,
          department,
          position,
          hourly_rate,
          employment_type
        `)
        .eq('employment_type', 'part_time')
        .order('name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('파트타임 직원 목록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentWeek = () => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // 월요일 시작
    return format(weekStart, 'yyyy-MM-dd');
  };

  const getWeekDates = (weekStart: string) => {
    const start = new Date(weekStart);
    const end = endOfWeek(start, { weekStartsOn: 1 });
    return {
      start: format(start, 'yyyy-MM-dd'),
      end: format(end, 'yyyy-MM-dd')
    };
  };

  const loadWorkRecords = async () => {
    if (!selectedEmployee || !selectedWeek) return;

    try {
      setLoading(true);
      const weekDates = getWeekDates(selectedWeek);
      
      // 해당 주의 스케줄 데이터 조회
      const { data: schedules, error: scheduleError } = await supabase
        .from('schedules')
        .select(`
          schedule_date,
          scheduled_start,
          scheduled_end,
          actual_start,
          actual_end,
          status
        `)
        .eq('employee_id', selectedEmployee)
        .gte('schedule_date', weekDates.start)
        .lte('schedule_date', weekDates.end)
        .order('schedule_date');

      if (scheduleError) throw scheduleError;

      // 직원 정보 조회
      const employee = employees.find(emp => emp.id === selectedEmployee);
      if (!employee) return;

      // 일자별 근무 기록 생성
      const records: DailyWorkRecord[] = [];
      const dailyRecords: { [key: string]: any[] } = {};

      // 같은 날짜의 스케줄들을 그룹화
      schedules?.forEach(schedule => {
        const date = schedule.schedule_date;
        if (!dailyRecords[date]) {
          dailyRecords[date] = [];
        }
        dailyRecords[date].push(schedule);
      });

      // 일자별로 근무 시간 계산
      Object.keys(dailyRecords).forEach(date => {
        const daySchedules = dailyRecords[date];
        const firstSchedule = daySchedules[0];
        const lastSchedule = daySchedules[daySchedules.length - 1];
        
        const startTime = firstSchedule.actual_start || firstSchedule.scheduled_start;
        const endTime = lastSchedule.actual_end || lastSchedule.scheduled_end;
        
        if (startTime && endTime) {
          const start = new Date(`${date} ${startTime}`);
          const end = new Date(`${date} ${endTime}`);
          const totalHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          
          // 점심시간 제외 (12:00-13:00)
          const lunchBreak = 1;
          const actualHours = Math.max(0, totalHours - lunchBreak);
          
          const dailyWage = Math.floor(actualHours * employee.hourly_rate);
          
          records.push({
            date,
            start_time: startTime.substring(0, 5),
            end_time: endTime.substring(0, 5),
            total_hours: Math.round(actualHours * 10) / 10,
            hourly_rate: employee.hourly_rate,
            daily_wage: dailyWage,
            status: 'pending'
          });
        }
      });

      setWorkRecords(records);

      // 주간 정산 계산
      const totalDays = records.length;
      const totalHours = records.reduce((sum, record) => sum + record.total_hours, 0);
      const totalWage = records.reduce((sum, record) => sum + record.daily_wage, 0);

      setWeeklySettlement({
        week_start: weekDates.start,
        week_end: weekDates.end,
        total_days: totalDays,
        total_hours: Math.round(totalHours * 10) / 10,
        total_wage: totalWage,
        status: 'pending',
        records: records
      });

    } catch (error) {
      console.error('근무 기록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateWeeklySettlement = async () => {
    if (!weeklySettlement || !selectedEmployee) return;

    try {
      setGenerating(true);
      
      // 주간 정산 데이터를 데이터베이스에 저장
      const { error: settlementError } = await supabase
        .from('weekly_settlements')
        .insert({
          employee_id: selectedEmployee,
          week_start: weeklySettlement.week_start,
          week_end: weeklySettlement.week_end,
          total_days: weeklySettlement.total_days,
          total_hours: weeklySettlement.total_hours,
          total_wage: weeklySettlement.total_wage,
          status: 'approved'
        });

      if (settlementError) throw settlementError;

      // 일자별 근무 기록도 저장
      const dailyRecords = weeklySettlement.records.map(record => ({
        employee_id: selectedEmployee,
        work_date: record.date,
        start_time: record.start_time,
        end_time: record.end_time,
        total_hours: record.total_hours,
        hourly_rate: record.hourly_rate,
        daily_wage: record.daily_wage,
        status: 'approved'
      }));

      const { error: recordsError } = await supabase
        .from('daily_work_records')
        .insert(dailyRecords);

      if (recordsError) throw recordsError;

      alert('주간 정산이 성공적으로 생성되었습니다!');
      loadWorkRecords(); // 데이터 새로고침
    } catch (error) {
      console.error('주간 정산 생성 실패:', error);
      alert('주간 정산 생성에 실패했습니다.');
    } finally {
      setGenerating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'yyyy년 MM월 dd일 (E)', { locale: ko });
  };

  const getWeekOptions = () => {
    const options = [];
    const today = new Date();
    
    // 최근 8주간의 주차 옵션 생성
    for (let i = 0; i < 8; i++) {
      const weekStart = startOfWeek(subDays(today, i * 7), { weekStartsOn: 1 });
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');
      const weekEndStr = format(weekEnd, 'yyyy-MM-dd');
      
      options.push({
        value: weekStartStr,
        label: `${format(weekStart, 'MM/dd')} ~ ${format(weekEnd, 'MM/dd')}`
      });
    }
    
    return options;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">파트타임 일자별 정산</h1>
              <p className="text-gray-600 mt-1">파트타임 직원의 일자별 근무 기록 및 주간 정산 관리</p>
            </div>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              뒤로가기
            </button>
          </div>
        </div>

        {/* 직원 및 주차 선택 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">정산 대상 선택</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                파트타임 직원 선택
              </label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              >
                <option value="">직원을 선택하세요</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} ({employee.employee_id}) - {employee.department}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                정산 주차 선택
              </label>
              <select
                value={selectedWeek}
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {getWeekOptions().map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 주간 정산 요약 */}
        {weeklySettlement && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">주간 정산 요약</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <div className="text-sm text-blue-600">정산 기간</div>
                <div className="text-lg font-bold text-blue-900">
                  {formatDate(weeklySettlement.week_start)} ~ {formatDate(weeklySettlement.week_end)}
                </div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="text-sm text-green-600">근무 일수</div>
                <div className="text-2xl font-bold text-green-900">
                  {weeklySettlement.total_days}일
                </div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <div className="text-sm text-purple-600">총 근무시간</div>
                <div className="text-2xl font-bold text-purple-900">
                  {weeklySettlement.total_hours}시간
                </div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <div className="text-sm text-orange-600">총 급여</div>
                <div className="text-2xl font-bold text-orange-900">
                  {formatCurrency(weeklySettlement.total_wage)}원
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={generateWeeklySettlement}
                disabled={generating || weeklySettlement.total_days === 0}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {generating ? '정산 생성 중...' : '주간 정산 생성'}
              </button>
            </div>
          </div>
        )}

        {/* 일자별 근무 기록 */}
        {workRecords.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">일자별 근무 기록</h2>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      날짜
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      근무시간
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      시급
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      일급
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {workRecords.map((record, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatDate(record.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.start_time} ~ {record.end_time} ({record.total_hours}시간)
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(record.hourly_rate)}원
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                        {formatCurrency(record.daily_wage)}원
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          record.status === 'paid' 
                            ? 'bg-green-100 text-green-800'
                            : record.status === 'approved'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {record.status === 'paid' ? '지급완료' : 
                           record.status === 'approved' ? '승인됨' : '대기중'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {workRecords.length === 0 && selectedEmployee && selectedWeek && !loading && (
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <div className="text-gray-500 text-lg">선택한 주차에 근무 기록이 없습니다.</div>
          </div>
        )}
      </div>
    </div>
  );
}
