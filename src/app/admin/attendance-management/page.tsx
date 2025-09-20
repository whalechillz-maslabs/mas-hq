'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, Users, CheckCircle, XCircle, Search, Filter, Download, Eye, Coffee } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { format, startOfMonth, endOfMonth, addDays, subDays } from 'date-fns';
import { ko } from 'date-fns/locale';

interface Employee {
  id: string;
  name: string;
  employee_id: string;
  role?: {
    name: string;
  };
}

interface ConsolidatedSchedule {
  employee_id: string;
  employee_name: string;
  employee_code: string;
  date: string;
  workBlocks: {
    start: string;
    end: string;
    duration: number; // 분 단위
    status: 'completed' | 'in-progress' | 'no-attendance';
    checkIn: string | null;
    checkOut: string | null;
    location: string | null;
  }[];
  totalScheduledHours: number;
  totalActualHours: number;
  overallStatus: 'completed' | 'partial' | 'no-attendance';
}

export default function AttendanceManagementImprovedPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [consolidatedSchedules, setConsolidatedSchedules] = useState<ConsolidatedSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadEmployees();
    loadConsolidatedSchedules();
  }, [selectedDate, selectedEmployee, filterStatus]);

  const loadEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('직원 목록 로드 오류:', error);
    }
  };

  const loadConsolidatedSchedules = async () => {
    setLoading(true);
    try {
      // 1. 해당 날짜의 모든 스케줄 조회
      let query = supabase
        .from('schedules')
        .select(`
          *,
          employee:employees!schedules_employee_id_fkey(name, employee_id)
        `)
        .eq('schedule_date', selectedDate)
        .in('status', ['approved', 'pending', 'completed', 'in_progress']);

      if (selectedEmployee !== 'all') {
        query = query.eq('employee_id', selectedEmployee);
      }

      const { data: schedules, error: scheduleError } = await query;

      if (scheduleError) throw scheduleError;

      // 2. attendance 테이블에서 실제 출근 기록 조회
      const { data: attendanceRecords, error: attendanceError } = await supabase
        .from('attendance')
        .select('*')
        .eq('date', selectedDate);

      if (attendanceError) throw attendanceError;

      // 3. 스케줄을 직원별로 그룹화하고 연속된 시간대를 통합
      const employeeGroups = new Map<string, any[]>();
      
      (schedules || []).forEach(schedule => {
        const empId = schedule.employee_id;
        if (!employeeGroups.has(empId)) {
          employeeGroups.set(empId, []);
        }
        employeeGroups.get(empId)!.push(schedule);
      });

      const consolidated: ConsolidatedSchedule[] = [];

      employeeGroups.forEach((empSchedules, empId) => {
        // 직원 정보
        const employee = empSchedules[0].employee;
        const attendance = attendanceRecords?.find(record => 
          record.employee_id === empId && record.date === selectedDate
        );

        // 스케줄을 시간순으로 정렬
        empSchedules.sort((a, b) => a.scheduled_start.localeCompare(b.scheduled_start));

        // 연속된 시간대를 통합하여 workBlocks 생성
        const workBlocks: any[] = [];
        let currentBlock: any = null;

        empSchedules.forEach(schedule => {
          const startTime = schedule.scheduled_start;
          const endTime = schedule.scheduled_end;
          
          if (!currentBlock) {
            // 첫 번째 블록 시작
            currentBlock = {
              start: startTime,
              end: endTime,
              schedules: [schedule],
              status: getScheduleStatus(schedule, attendance)
            };
          } else {
            // 연속된 시간대인지 확인 (30분 간격)
            const currentEnd = new Date(`2000-01-01T${currentBlock.end}`);
            const nextStart = new Date(`2000-01-01T${startTime}`);
            const timeDiff = (nextStart.getTime() - currentEnd.getTime()) / (1000 * 60); // 분 단위

            if (timeDiff <= 30) {
              // 연속된 시간대 - 블록 확장
              currentBlock.end = endTime;
              currentBlock.schedules.push(schedule);
            } else {
              // 새로운 블록 시작
              workBlocks.push(createWorkBlock(currentBlock, attendance));
              currentBlock = {
                start: startTime,
                end: endTime,
                schedules: [schedule],
                status: getScheduleStatus(schedule, attendance)
              };
            }
          }
        });

        // 마지막 블록 추가
        if (currentBlock) {
          workBlocks.push(createWorkBlock(currentBlock, attendance));
        }

        // 총 시간 계산
        const totalScheduledMinutes = workBlocks.reduce((total, block) => total + block.duration, 0);
        const totalScheduledHours = totalScheduledMinutes / 60;
        
        // 실제 근무 시간 계산 (attendance 기록 기반)
        let totalActualHours = 0;
        if (attendance?.check_in_time && attendance?.check_out_time) {
          const checkIn = new Date(attendance.check_in_time);
          const checkOut = new Date(attendance.check_out_time);
          totalActualHours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
        }

        // 전체 상태 결정
        let overallStatus: 'completed' | 'partial' | 'no-attendance' = 'no-attendance';
        if (attendance?.check_in_time && attendance?.check_out_time) {
          overallStatus = 'completed';
        } else if (attendance?.check_in_time) {
          overallStatus = 'partial';
        }

        consolidated.push({
          employee_id: empId,
          employee_name: employee?.name || '알 수 없음',
          employee_code: employee?.employee_id || 'N/A',
          date: selectedDate,
          workBlocks,
          totalScheduledHours,
          totalActualHours,
          overallStatus
        });
      });

      // 필터 적용
      let filtered = consolidated;
      if (filterStatus === 'no-attendance') {
        filtered = consolidated.filter(emp => emp.overallStatus === 'no-attendance');
      } else if (filterStatus === 'partial') {
        filtered = consolidated.filter(emp => emp.overallStatus === 'partial');
      } else if (filterStatus === 'completed') {
        filtered = consolidated.filter(emp => emp.overallStatus === 'completed');
      }

      setConsolidatedSchedules(filtered);
    } catch (error) {
      console.error('통합 스케줄 로드 오류:', error);
      setConsolidatedSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  const getScheduleStatus = (schedule: any, attendance: any) => {
    if (attendance?.check_in_time && attendance?.check_out_time) {
      return 'completed';
    } else if (attendance?.check_in_time) {
      return 'in-progress';
    } else {
      return 'no-attendance';
    }
  };

  const createWorkBlock = (block: any, attendance: any) => {
    const startTime = new Date(`2000-01-01T${block.start}`);
    const endTime = new Date(`2000-01-01T${block.end}`);
    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60); // 분 단위

    return {
      start: block.start,
      end: block.end,
      duration,
      status: block.status,
      checkIn: attendance?.check_in_time ? format(new Date(attendance.check_in_time), 'HH:mm') : null,
      checkOut: attendance?.check_out_time ? format(new Date(attendance.check_out_time), 'HH:mm') : null,
      location: attendance?.check_in_location ? '위치 기록됨' : '위치 없음',
      scheduleCount: block.schedules.length
    };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">완료</span>;
      case 'partial':
        return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">근무중</span>;
      case 'no-attendance':
        return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">미출근</span>;
      default:
        return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">알 수 없음</span>;
    }
  };

  const getWorkBlockStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">완료</span>;
      case 'in-progress':
        return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">근무중</span>;
      case 'no-attendance':
        return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">미출근</span>;
      default:
        return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">알 수 없음</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Users className="h-6 w-6 mr-2 text-blue-600" />
            출근 관리 (개선된 버전)
          </h1>
          <p className="text-gray-600 mt-1">30분 단위 분할을 통합하여 직관적으로 표시합니다.</p>
        </div>

        {/* 필터 섹션 */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">날짜</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">직원</label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">전체 직원</option>
                {employees.map(employee => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} ({employee.employee_id})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">상태</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">전체</option>
                <option value="no-attendance">미출근</option>
                <option value="partial">근무중</option>
                <option value="completed">완료</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={loadConsolidatedSchedules}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Search className="h-4 w-4 inline mr-2" />
                조회
              </button>
            </div>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">완료</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {consolidatedSchedules.filter(emp => emp.overallStatus === 'completed').length}명
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">근무중</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {consolidatedSchedules.filter(emp => emp.overallStatus === 'partial').length}명
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <XCircle className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">미출근</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {consolidatedSchedules.filter(emp => emp.overallStatus === 'no-attendance').length}명
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">총 직원</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {consolidatedSchedules.length}명
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 통합된 스케줄 목록 */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-gray-900">통합된 출근 기록</h2>
            <p className="text-sm text-gray-600 mt-1">30분 단위 분할을 연속된 근무 블록으로 통합하여 표시</p>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">로딩 중...</p>
            </div>
          ) : consolidatedSchedules.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>해당 조건에 맞는 출근 기록이 없습니다.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {consolidatedSchedules.map((employee) => (
                <div key={employee.employee_id} className="p-6">
                  {/* 직원 헤더 */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-800">
                            {employee.employee_name.charAt(0)}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <h3 className="text-lg font-medium text-gray-900">
                          {employee.employee_name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {employee.employee_code} • {format(new Date(employee.date), 'yyyy년 MM월 dd일', { locale: ko })}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      {getStatusBadge(employee.overallStatus)}
                      <div className="text-right">
                        <p className="text-sm text-gray-500">스케줄 시간</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {employee.totalScheduledHours.toFixed(1)}h
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">실제 시간</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {employee.totalActualHours.toFixed(1)}h
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 근무 블록들 */}
                  <div className="space-y-3">
                    {employee.workBlocks.map((block, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <div className="text-sm font-medium text-gray-900">
                              {block.start} - {block.end}
                            </div>
                            <div className="text-sm text-gray-500">
                              ({block.duration}분, {block.scheduleCount}개 스케줄)
                            </div>
                            {getWorkBlockStatusBadge(block.status)}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div>
                              <span className="font-medium">출근:</span> {block.checkIn || '-'}
                            </div>
                            <div>
                              <span className="font-medium">퇴근:</span> {block.checkOut || '-'}
                            </div>
                            <div>
                              <span className="font-medium">위치:</span> {block.location}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
