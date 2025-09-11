'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { format, addDays, subDays, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';
import { ko } from 'date-fns/locale';
import { Calendar, Download, Printer, FileText, CheckCircle } from 'lucide-react';

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
  const [showCalendar, setShowCalendar] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showSettlementDocument, setShowSettlementDocument] = useState(false);

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

  // 달력 입력으로 정산 기간 설정
  const handleCustomDateRange = () => {
    if (customStartDate && customEndDate) {
      setSelectedWeek(customStartDate);
      setShowCalendar(false);
      // 커스텀 기간으로 근무 기록 로드
      loadWorkRecordsForCustomRange(customStartDate, customEndDate);
    }
  };

  // 커스텀 기간 근무 기록 로드
  const loadWorkRecordsForCustomRange = async (startDate: string, endDate: string) => {
    if (!selectedEmployee) return;

    try {
      setLoading(true);
      
      const { data: schedules, error: scheduleError } = await supabase
        .from('schedules')
        .select(`
          schedule_date,
          scheduled_start,
          scheduled_end,
          actual_start,
          actual_end,
          status,
          total_hours
        `)
        .eq('employee_id', selectedEmployee)
        .gte('schedule_date', startDate)
        .lte('schedule_date', endDate)
        .order('schedule_date');

      if (scheduleError) throw scheduleError;

      const employee = employees.find(emp => emp.id === selectedEmployee);
      if (!employee) return;

      const records: DailyWorkRecord[] = [];
      const dailyRecords: { [key: string]: any[] } = {};

      schedules?.forEach(schedule => {
        const date = schedule.schedule_date;
        if (!dailyRecords[date]) {
          dailyRecords[date] = [];
        }
        dailyRecords[date].push(schedule);
      });

      Object.keys(dailyRecords).forEach(date => {
        const daySchedules = dailyRecords[date];
        const totalHours = daySchedules.reduce((sum, s) => sum + (s.total_hours || 0), 0);
        const dailyWage = Math.floor(totalHours * employee.hourly_rate);
        
        if (totalHours > 0) {
          records.push({
            date,
            start_time: daySchedules[0].scheduled_start?.substring(0, 5) || '09:00',
            end_time: daySchedules[daySchedules.length - 1].scheduled_end?.substring(0, 5) || '18:00',
            total_hours: totalHours,
            hourly_rate: employee.hourly_rate,
            daily_wage: dailyWage,
            status: 'pending'
          });
        }
      });

      setWorkRecords(records);

      const totalDays = records.length;
      const totalHours = records.reduce((sum, record) => sum + record.total_hours, 0);
      const totalWage = records.reduce((sum, record) => sum + record.daily_wage, 0);

      setWeeklySettlement({
        week_start: startDate,
        week_end: endDate,
        total_days: totalDays,
        total_hours: Math.round(totalHours * 10) / 10,
        total_wage: totalWage,
        status: 'pending',
        records: records
      });

    } catch (error) {
      console.error('커스텀 기간 근무 기록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 정산서 문서 생성 및 저장
  const generateSettlementDocument = () => {
    if (!weeklySettlement || !selectedEmployee) return;

    const employee = employees.find(emp => emp.id === selectedEmployee);
    if (!employee) return;

    const settlementDoc = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>파트타임 정산서 - ${employee.name}</title>
        <style>
          body { font-family: 'Malgun Gothic', sans-serif; margin: 0; padding: 20px; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .company { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
          .title { font-size: 20px; font-weight: bold; color: #333; }
          .info { margin: 20px 0; }
          .info-row { display: flex; margin: 10px 0; }
          .info-label { width: 120px; font-weight: bold; }
          .summary { background: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 8px; }
          .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
          .summary-item { text-align: center; }
          .summary-value { font-size: 24px; font-weight: bold; color: #2563eb; }
          .summary-label { font-size: 14px; color: #666; margin-top: 5px; }
          .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .table th, .table td { border: 1px solid #ddd; padding: 12px; text-align: center; }
          .table th { background: #f8f9fa; font-weight: bold; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
          @media print { body { margin: 0; } .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company">MASGOLF</div>
          <div class="title">파트타임 정산서</div>
        </div>
        
        <div class="info">
          <div class="info-row">
            <span class="info-label">정산일:</span>
            <span>${format(new Date(), 'yyyy년 MM월 dd일', { locale: ko })}</span>
          </div>
          <div class="info-row">
            <span class="info-label">근로자명:</span>
            <span>${employee.name}</span>
          </div>
          <div class="info-row">
            <span class="info-label">직원번호:</span>
            <span>${employee.employee_id}</span>
          </div>
          <div class="info-row">
            <span class="info-label">정산 기간:</span>
            <span>${formatDate(weeklySettlement.week_start)} ~ ${formatDate(weeklySettlement.week_end)}</span>
          </div>
          <div class="info-row">
            <span class="info-label">시급:</span>
            <span>${formatCurrency(employee.hourly_rate)}원</span>
          </div>
        </div>

        <div class="summary">
          <div class="summary-grid">
            <div class="summary-item">
              <div class="summary-value">${weeklySettlement.total_days}</div>
              <div class="summary-label">근무일수</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${weeklySettlement.total_hours}</div>
              <div class="summary-label">총 근무시간</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${formatCurrency(employee.hourly_rate)}</div>
              <div class="summary-label">시급</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${formatCurrency(weeklySettlement.total_wage)}</div>
              <div class="summary-label">총 지급액</div>
            </div>
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th>날짜</th>
              <th>요일</th>
              <th>근무시간</th>
              <th>시간</th>
              <th>일급</th>
              <th>비고</th>
            </tr>
          </thead>
          <tbody>
            ${weeklySettlement.records.map(record => `
              <tr>
                <td>${format(new Date(record.date), 'MM/dd')}</td>
                <td>${format(new Date(record.date), 'E', { locale: ko })}</td>
                <td>${record.start_time}-${record.end_time}</td>
                <td>${record.total_hours}시간</td>
                <td>${formatCurrency(record.daily_wage)}원</td>
                <td>${record.total_hours >= 8 ? '정상근무' : record.total_hours >= 7 ? '단축근무' : '부분근무'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          <p>위 금액을 정산서에 따라 지급합니다.</p>
          <p>정산일: ${format(new Date(), 'yyyy년 MM월 dd일', { locale: ko })}</p>
        </div>
      </body>
      </html>
    `;

    // 새 창에서 정산서 표시
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(settlementDoc);
      printWindow.document.close();
      setShowSettlementDocument(true);
    }
  };

  // 정산서 PDF 다운로드
  const downloadSettlementPDF = () => {
    generateSettlementDocument();
    // 실제 PDF 다운로드는 브라우저의 인쇄 기능을 통해 PDF로 저장
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
          
          {/* 달력 입력 옵션 */}
          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-md font-medium text-gray-900">커스텀 기간 설정</h3>
              <button
                onClick={() => setShowCalendar(!showCalendar)}
                className="flex items-center px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Calendar className="h-4 w-4 mr-2" />
                {showCalendar ? '닫기' : '달력으로 입력'}
              </button>
            </div>
            
            {showCalendar && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    시작일
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    종료일
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleCustomDateRange}
                    disabled={!customStartDate || !customEndDate}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    기간 적용
                  </button>
                </div>
              </div>
            )}
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

            <div className="flex justify-between items-center">
              <div className="flex space-x-3">
                <button
                  onClick={generateSettlementDocument}
                  disabled={weeklySettlement.total_days === 0}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  정산서 보기
                </button>
                <button
                  onClick={downloadSettlementPDF}
                  disabled={weeklySettlement.total_days === 0}
                  className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <Download className="h-4 w-4 mr-2" />
                  PDF 다운로드
                </button>
                <button
                  onClick={generateSettlementDocument}
                  disabled={weeklySettlement.total_days === 0}
                  className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  <Printer className="h-4 w-4 mr-2" />
                  인쇄
                </button>
              </div>
              <button
                onClick={generateWeeklySettlement}
                disabled={generating || weeklySettlement.total_days === 0}
                className="flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                {generating ? '정산 생성 중...' : '정산 확인 및 저장'}
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
