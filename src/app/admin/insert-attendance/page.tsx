'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, CheckCircle, XCircle, Search, Filter, Download, Coffee, Play } from 'lucide-react';
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

interface Schedule {
  id: string;
  employee_id: string;
  schedule_date: string;
  scheduled_start: string;
  scheduled_end: string;
  status: string;
  actual_start: string | null;
  actual_end: string | null;
  employee_note?: string;
  employee: {
    name: string;
    employee_id: string;
  };
}

interface AttendanceRecord {
  id?: string;
  employee_id: string;
  date: string;
  check_in_time: string | null;
  check_out_time: string | null;
  break_start_time: string | null;
  break_end_time: string | null;
  check_in_location: any;
  check_out_location: any;
}

// 스케줄 관리와 동일한 시간 정규화 함수
const normalizeTime = (timeStr: string) => {
  if (!timeStr || typeof timeStr !== 'string') return '';
  
  try {
    // ISO 형식인 경우 시간 부분만 추출
    if (timeStr.includes('T')) {
      const timePart = timeStr.split('T')[1];
      if (timePart) {
        timeStr = timePart; // HH:mm:ss.sssZ -> HH:mm:ss 부분만
      }
    }
    
    // "09:00:00" -> "09:00", "09:00" -> "09:00"
    const match = timeStr.match(/^(\d{1,2}):(\d{2})/);
    if (match) {
      const hours = match[1].padStart(2, '0');
      const minutes = match[2];
      return `${hours}:${minutes}`;
    }
    return '';
  } catch (error) {
    console.warn('normalizeTime 에러:', error, timeStr);
    return '';
  }
};

export default function InsertAttendanceEnhancedPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('no-attendance');
  const [selectedSchedules, setSelectedSchedules] = useState<string[]>([]);
  const [processing, setProcessing] = useState(false);
  const [collapsedEmployees, setCollapsedEmployees] = useState<Set<string>>(new Set());
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    checkInTime: '',
    checkOutTime: '',
    breakStartTime: '',
    breakEndTime: '',
    note: ''
  });

  useEffect(() => {
    loadEmployees();
    loadSchedules();
    loadAttendanceRecords();
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

  const loadSchedules = async () => {
    console.log('🔄 loadSchedules 시작');
    setLoading(true);
    
    // 강제로 loading을 false로 설정하는 타이머 (최대 10초)
    const timeoutId = setTimeout(() => {
      console.log('⏰ 타임아웃: 강제로 loading false 설정');
      setLoading(false);
    }, 10000);
    
    const { data, error } = await supabase
      .from('schedules')
      .select(`
        *,
        employee:employees!schedules_employee_id_fkey(name, employee_id)
      `)
      .eq('schedule_date', selectedDate)
      .in('status', ['approved', 'pending', 'completed', 'in_progress']);

    console.log('📊 쿼리 완료', { data: data?.length, error });
    
    clearTimeout(timeoutId);
    
    if (error) {
      console.error('❌ 에러:', error);
      setSchedules([]);
      setLoading(false);
      return;
    }

    // 직원 필터
    let filteredData = data || [];
    if (selectedEmployee !== 'all') {
      filteredData = filteredData.filter(s => s.employee_id === selectedEmployee);
    }

    // 상태 필터
    if (filterStatus === 'no-attendance') {
      filteredData = filteredData.filter(s => !s.actual_start);
    } else if (filterStatus === 'partial-attendance') {
      filteredData = filteredData.filter(s => s.actual_start && !s.actual_end);
    } else if (filterStatus === 'completed') {
      filteredData = filteredData.filter(s => s.actual_start && s.actual_end);
    }

    console.log('✅ 최종 결과', { count: filteredData.length });
    setSchedules(filteredData);
    setLoading(false);
    console.log('🏁 완료');
  };

  const loadAttendanceRecords = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('date', selectedDate);

      if (error) throw error;
      setAttendanceRecords(data || []);
    } catch (error) {
      console.error('출근 기록 로드 오류:', error);
      setAttendanceRecords([]);
    }
  };

  const handleSelectAll = () => {
    if (selectedSchedules.length === schedules.length) {
      setSelectedSchedules([]);
    } else {
      setSelectedSchedules(schedules.map(s => s.id));
    }
  };

  const handleSelectSchedule = (scheduleId: string) => {
    setSelectedSchedules(prev => 
      prev.includes(scheduleId) 
        ? prev.filter(id => id !== scheduleId)
        : [...prev, scheduleId]
    );
  };

  // 스케줄 기반 정시 출퇴근/휴식 자동 체크
  const handleAutoCheckIn = async (schedule: Schedule) => {
    if (!confirm(`${schedule.employee?.name}의 정시 출퇴근/휴식을 자동으로 체크하시겠습니까?`)) {
      return;
    }

    try {
      const scheduledStart = schedule.scheduled_start;
      const scheduledEnd = schedule.scheduled_end;
      
      // 시간 형식 정규화 (HH:mm:ss 형식으로 변환)
      const normalizeTime = (timeStr: string) => {
        if (!timeStr) return '';
        // 이미 HH:mm:ss 형식인 경우 그대로 사용
        if (timeStr.includes(':') && timeStr.split(':').length === 3) {
          return timeStr;
        }
        // HH:mm 형식인 경우 :00 추가
        if (timeStr.includes(':') && timeStr.split(':').length === 2) {
          return `${timeStr}:00`;
        }
        return timeStr;
      };
      
      const normalizedStart = normalizeTime(scheduledStart);
      const normalizedEnd = normalizeTime(scheduledEnd);
      
      // 정시 출근 (스케줄 시작 시간) - ISO 형식
      const checkInDateTime = new Date(`${selectedDate}T${normalizedStart}`).toISOString();
      
      // 정시 퇴근 (스케줄 종료 시간) - ISO 형식
      const checkOutDateTime = new Date(`${selectedDate}T${normalizedEnd}`).toISOString();

      // 1. schedules 테이블 업데이트 (ISO 형식 사용)
      const { error: scheduleError } = await supabase
        .from('schedules')
        .update({
          actual_start: checkInDateTime,
          actual_end: checkOutDateTime,
          status: 'completed',
          employee_note: '정시 출퇴근/휴식 자동 체크',
          updated_at: new Date().toISOString()
        })
        .eq('id', schedule.id);

      if (scheduleError) throw scheduleError;

      // 2. attendance 테이블 업데이트 또는 생성 (TIME 타입 필드에는 HH:mm:ss 형식)
      const attendanceData = {
        employee_id: schedule.employee_id,
        date: selectedDate,
        check_in_time: normalizedStart,  // HH:mm:ss 형식
        check_out_time: normalizedEnd,   // HH:mm:ss 형식
        break_start_time: '12:00:00',    // HH:mm:ss 형식
        break_end_time: '13:00:00',      // HH:mm:ss 형식
        updated_at: new Date().toISOString()
      };

      const { error: attendanceError } = await supabase
        .from('attendance')
        .upsert(attendanceData, { 
          onConflict: 'employee_id,date',
          ignoreDuplicates: false 
        });

      if (attendanceError) throw attendanceError;

      alert(`✅ ${schedule.employee?.name}의 정시 출퇴근/휴식이 자동 체크되었습니다!`);
      await loadSchedules();
      await loadAttendanceRecords();
    } catch (error: any) {
      console.error('자동 체크 오류:', error);
      alert(`자동 체크 실패: ${error.message}`);
    }
  };

  // 일괄 정시 출퇴근/휴식 자동 체크
  const handleBulkAutoCheck = async () => {
    if (selectedSchedules.length === 0) {
      alert('선택된 스케줄이 없습니다.');
      return;
    }

    if (!confirm(`선택된 ${selectedSchedules.length}개 스케줄에 정시 출퇴근/휴식을 자동 체크하시겠습니까?`)) {
      return;
    }

    setProcessing(true);
    try {
      const selectedScheduleData = schedules.filter(s => selectedSchedules.includes(s.id));
      
      // 시간 형식 정규화 함수
      const normalizeTime = (timeStr: string) => {
        if (!timeStr) return '';
        // 이미 HH:mm:ss 형식인 경우 그대로 사용
        if (timeStr.includes(':') && timeStr.split(':').length === 3) {
          return timeStr;
        }
        // HH:mm 형식인 경우 :00 추가
        if (timeStr.includes(':') && timeStr.split(':').length === 2) {
          return `${timeStr}:00`;
        }
        return timeStr;
      };
      
      for (const schedule of selectedScheduleData) {
        const scheduledStart = schedule.scheduled_start;
        const scheduledEnd = schedule.scheduled_end;
        
        const normalizedStart = normalizeTime(scheduledStart);
        const normalizedEnd = normalizeTime(scheduledEnd);
        
        const checkInTime = new Date(`${selectedDate}T${normalizedStart}`).toISOString();
        const checkOutTime = new Date(`${selectedDate}T${normalizedEnd}`).toISOString();
        const breakStart = new Date(`${selectedDate}T12:00:00`).toISOString();
        const breakEnd = new Date(`${selectedDate}T13:00:00`).toISOString();

        // schedules 테이블 업데이트
        await supabase
          .from('schedules')
          .update({
            actual_start: checkInTime,
            actual_end: checkOutTime,
            status: 'completed',
            employee_note: '일괄 정시 출퇴근/휴식 자동 체크',
            updated_at: new Date().toISOString()
          })
          .eq('id', schedule.id);

        // attendance 테이블 업데이트 (TIME 타입 필드에는 시간 부분만 전송)
        await supabase
          .from('attendance')
          .upsert({
            employee_id: schedule.employee_id,
            date: selectedDate,
            check_in_time: normalizedStart,  // HH:mm:ss 형식
            check_out_time: normalizedEnd,   // HH:mm:ss 형식
            break_start_time: '12:00:00',    // HH:mm:ss 형식
            break_end_time: '13:00:00',      // HH:mm:ss 형식
            updated_at: new Date().toISOString()
          }, { 
            onConflict: 'employee_id,date',
            ignoreDuplicates: false 
          });
      }

      alert(`✅ ${selectedSchedules.length}개 스케줄에 정시 출퇴근/휴식이 자동 체크되었습니다!`);
      setSelectedSchedules([]);
      await loadSchedules();
      await loadAttendanceRecords();
    } catch (error: any) {
      console.error('일괄 자동 체크 오류:', error);
      alert(`일괄 자동 체크 실패: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  // 개인 출근시간 수정 기능 (휴식 시간 포함)
  const handleEditAttendance = (schedule: Schedule) => {
    const attendance = attendanceRecords.find(record => 
      record.employee_id === schedule.employee_id && record.date === selectedDate
    );

    // 공통 normalizeTime 함수 사용

    setEditingSchedule(schedule);
    setEditForm({
      checkInTime: normalizeTime(schedule.actual_start || ''),
      checkOutTime: normalizeTime(schedule.actual_end || ''),
      breakStartTime: attendance?.break_start_time ? normalizeTime(attendance.break_start_time) : '',
      breakEndTime: attendance?.break_end_time ? normalizeTime(attendance.break_end_time) : '',
      note: schedule.employee_note || ''
    });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingSchedule) return;

    try {
      // 시간을 HH:mm:ss 형식으로 정규화 (타임존 변환 방지)
      const formatTimeForDB = (timeStr: string) => {
        if (!timeStr || timeStr.trim() === '' || timeStr === '') return null;
        // HH:mm 형식을 HH:mm:ss 형식으로 변환
        if (timeStr.includes(':') && timeStr.split(':').length === 2) {
          return `${timeStr}:00`;
        }
        return timeStr;
      };

      const checkInTime = formatTimeForDB(editForm.checkInTime);
      const checkOutTime = formatTimeForDB(editForm.checkOutTime);
      const breakStartTime = formatTimeForDB(editForm.breakStartTime);
      const breakEndTime = formatTimeForDB(editForm.breakEndTime);

      // schedules 테이블용 ISO 형식 (UTC로 명시적 저장하여 타임존 변환 방지)
      const checkInDateTime = checkInTime ? 
        `${selectedDate}T${checkInTime}Z` : null;
      const checkOutDateTime = checkOutTime ? 
        `${selectedDate}T${checkOutTime}Z` : null;

      if (editingSchedule.id === 'new') {
        // 새로운 스케줄 생성 (스케줄이 없는 직원)
        const { error: scheduleError } = await supabase
          .from('schedules')
          .insert({
            employee_id: editingSchedule.employee_id,
            schedule_date: selectedDate,
            scheduled_start: editForm.checkInTime || '09:00',
            scheduled_end: editForm.checkOutTime || '18:00',
            actual_start: checkInDateTime,
            actual_end: checkOutDateTime,
            employee_note: editForm.note,
            status: checkInDateTime && checkOutDateTime ? 'completed' : 
                    checkInDateTime ? 'in_progress' : 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (scheduleError) throw scheduleError;
      } else {
        // 기존 스케줄 업데이트
        const { error: scheduleError } = await supabase
          .from('schedules')
          .update({
            actual_start: checkInDateTime,
            actual_end: checkOutDateTime,
            employee_note: editForm.note,
            status: checkInDateTime && checkOutDateTime ? 'completed' : 
                    checkInDateTime ? 'in_progress' : 'pending',
            updated_at: new Date().toISOString()
          })
          .eq('id', editingSchedule.id);

        if (scheduleError) throw scheduleError;
      }

      // attendance 테이블 업데이트 또는 생성 (휴식 시간 포함)
      // TIME 타입 필드에는 직접 HH:mm:ss 형식으로 전송 (타임존 변환 방지)
      const attendanceData = {
        employee_id: editingSchedule.employee_id,
        date: selectedDate,
        check_in_time: checkInTime,  // 직접 HH:mm:ss 형식
        check_out_time: checkOutTime,  // 직접 HH:mm:ss 형식
        break_start_time: breakStartTime,  // 직접 HH:mm:ss 형식
        break_end_time: breakEndTime,  // 직접 HH:mm:ss 형식
        updated_at: new Date().toISOString()
      };

      const { error: attendanceError } = await supabase
        .from('attendance')
        .upsert(attendanceData, { 
          onConflict: 'employee_id,date',
          ignoreDuplicates: false 
        });

      if (attendanceError) throw attendanceError;

      alert('✅ 출근시간이 성공적으로 저장되었습니다!');
      setShowEditModal(false);
      setEditingSchedule(null);
      await loadSchedules();
      await loadAttendanceRecords();
    } catch (error: any) {
      console.error('출근시간 저장 오류:', error);
      alert(`출근시간 저장 실패: ${error.message}`);
    }
  };

  // 스케줄이 없는 직원의 출근시간 추가
  const handleAddAttendance = async (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return;

    setEditingSchedule({
      id: 'new',
      employee_id: employeeId,
      schedule_date: selectedDate,
      scheduled_start: '09:00',
      scheduled_end: '18:00',
      status: 'pending',
      actual_start: null,
      actual_end: null,
      employee: {
        name: employee.name,
        employee_id: employee.employee_id
      }
    });
    setEditForm({
      checkInTime: '',
      checkOutTime: '',
      breakStartTime: '',
      breakEndTime: '',
      note: '관리자가 추가한 출근 기록'
    });
    setShowEditModal(true);
  };

  const getStatusBadge = (schedule: Schedule) => {
    // 데이터베이스 상태를 우선적으로 확인
    if (schedule.status === 'completed') {
      return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">완료</span>;
    } else if (schedule.status === 'in_progress') {
      return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">근무중</span>;
    } else if (schedule.status === 'cancelled') {
      return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">취소</span>;
    } else if (schedule.status === 'approved' || schedule.status === 'pending') {
      // 승인/대기 상태에서 실제 출근 기록이 있는지 확인
      if (schedule.actual_start && schedule.actual_end) {
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">완료</span>;
      } else if (schedule.actual_start) {
        return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">근무중</span>;
      } else {
        return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">미출근</span>;
      }
    } else {
      // 기본값: 실제 출근 기록 기반
      if (schedule.actual_start && schedule.actual_end) {
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">완료</span>;
      } else if (schedule.actual_start) {
        return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">근무중</span>;
      } else {
        return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">미출근</span>;
      }
    }
  };

  const getAttendanceInfo = (schedule: Schedule) => {
    const attendance = attendanceRecords.find(record => 
      record.employee_id === schedule.employee_id && record.date === selectedDate
    );
    
    return {
      hasBreak: attendance?.break_start_time && attendance?.break_end_time,
      breakStart: attendance?.break_start_time ? format(new Date(attendance.break_start_time), 'HH:mm') : null,
      breakEnd: attendance?.break_end_time ? format(new Date(attendance.break_end_time), 'HH:mm') : null
    };
  };

  // 점심 휴식 빠른 설정 (모든 직원)
  const handleBulkLunchBreak = async () => {
    if (!confirm('모든 직원의 점심 휴식시간(12:00-13:00)을 설정하시겠습니까?')) {
      return;
    }

    try {
      const today = selectedDate;
      const lunchStart = '12:00:00';
      const lunchEnd = '13:00:00';

      // 해당 날짜에 스케줄이 있는 모든 직원 조회
      const uniqueEmployees = [...new Set(schedules.map(s => s.employee_id))];
      
      const attendanceUpdates = uniqueEmployees.map(employeeId => ({
        employee_id: employeeId,
        date: today,
        break_start_time: lunchStart, // 이미 HH:mm:ss 형식
        break_end_time: lunchEnd,     // 이미 HH:mm:ss 형식
        notes: '점심 휴식 (관리자 일괄 설정)'
      }));

      // attendance 테이블에 upsert
      const { error: attendanceError } = await supabase
        .from('attendance')
        .upsert(attendanceUpdates, { 
          onConflict: 'employee_id,date',
          ignoreDuplicates: false 
        });

      if (attendanceError) throw attendanceError;

      alert(`✅ ${uniqueEmployees.length}명의 직원 점심 휴식시간이 설정되었습니다!`);
      await loadAttendanceRecords();
    } catch (error: any) {
      console.error('점심 휴식 설정 오류:', error);
      alert(`점심 휴식 설정 실패: ${error.message}`);
    }
  };

  // 개별 직원 점심 휴식 설정
  const handleIndividualLunchBreak = async (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return;

    if (!confirm(`${employee.name}님의 점심 휴식시간(12:00-13:00)을 설정하시겠습니까?`)) {
      return;
    }

    try {
      const today = selectedDate;
      const lunchStart = '12:00:00';
      const lunchEnd = '13:00:00';

      const attendanceData = {
        employee_id: employeeId,
        date: today,
        break_start_time: lunchStart, // 이미 HH:mm:ss 형식
        break_end_time: lunchEnd,     // 이미 HH:mm:ss 형식
        notes: '점심 휴식 (관리자 설정)'
      };

      const { error: attendanceError } = await supabase
        .from('attendance')
        .upsert(attendanceData, { 
          onConflict: 'employee_id,date',
          ignoreDuplicates: false 
        });

      if (attendanceError) throw attendanceError;

      alert(`✅ ${employee.name}님의 점심 휴식시간이 설정되었습니다!`);
      await loadAttendanceRecords();
    } catch (error: any) {
      console.error('점심 휴식 설정 오류:', error);
      alert(`점심 휴식 설정 실패: ${error.message}`);
    }
  };

  // 직원별 스케줄 접고 펴기 토글
  const toggleEmployeeCollapse = (employeeId: string) => {
    const newCollapsed = new Set(collapsedEmployees);
    if (newCollapsed.has(employeeId)) {
      newCollapsed.delete(employeeId);
    } else {
      newCollapsed.add(employeeId);
    }
    setCollapsedEmployees(newCollapsed);
  };

  // 직원별 스케줄 그룹화
  const getGroupedSchedules = () => {
    const grouped = schedules.reduce((acc, schedule) => {
      const employeeId = schedule.employee_id;
      if (!acc[employeeId]) {
        acc[employeeId] = {
          employee: schedule.employee,
          schedules: []
        };
      }
      acc[employeeId].schedules.push(schedule);
      return acc;
    }, {} as Record<string, { employee: any; schedules: Schedule[] }>);

    // 각 직원의 스케줄을 시간순으로 정렬
    Object.values(grouped).forEach(group => {
      group.schedules.sort((a, b) => a.scheduled_start.localeCompare(b.scheduled_start));
    });

    return grouped;
  };

  // 직원별 일괄 정시 체크
  const handleEmployeeBulkCheck = async (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return;

    const employeeSchedules = schedules.filter(s => s.employee_id === employeeId);
    if (employeeSchedules.length === 0) return;

    if (!confirm(`${employee.name}님의 모든 스케줄(${employeeSchedules.length}개)을 정시 체크하시겠습니까?`)) {
      return;
    }

    setProcessing(true);
    try {
      const today = selectedDate;
      const attendanceUpdates = [];

      for (const schedule of employeeSchedules) {
        const attendanceData = {
          employee_id: employeeId,
          date: today,
          check_in_time: schedule.scheduled_start, // 이미 HH:mm:ss 형식
          check_out_time: schedule.scheduled_end,   // 이미 HH:mm:ss 형식
          notes: `정시 체크 (관리자 일괄 처리) - ${schedule.scheduled_start}~${schedule.scheduled_end}`
        };
        attendanceUpdates.push(attendanceData);
      }

      // attendance 테이블에 upsert
      const { error: attendanceError } = await supabase
        .from('attendance')
        .upsert(attendanceUpdates, { 
          onConflict: 'employee_id,date',
          ignoreDuplicates: false 
        });

      if (attendanceError) throw attendanceError;

      alert(`✅ ${employee.name}님의 모든 스케줄이 정시 체크되었습니다!`);
      await loadSchedules();
      await loadAttendanceRecords();
    } catch (error: any) {
      console.error('직원별 일괄 체크 오류:', error);
      alert(`직원별 일괄 체크 실패: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  // 시간대별 일괄 처리
  const handleTimeRangeBulkCheck = async (timeRange: string) => {
    let startTime = '';
    let endTime = '';
    let description = '';

    switch (timeRange) {
      case 'morning':
        startTime = '09:00';
        endTime = '12:00';
        description = '오전 (09:00-12:00)';
        break;
      case 'afternoon':
        startTime = '13:00';
        endTime = '18:00';
        description = '오후 (13:00-18:00)';
        break;
      case 'full':
        startTime = '09:00';
        endTime = '18:00';
        description = '전일 (09:00-18:00)';
        break;
      default:
        return;
    }

    const timeRangeSchedules = schedules.filter(s => 
      s.scheduled_start >= startTime && s.scheduled_end <= endTime
    );

    if (timeRangeSchedules.length === 0) {
      alert(`해당 시간대(${description})에 스케줄이 없습니다.`);
      return;
    }

    if (!confirm(`${description} 시간대의 모든 스케줄(${timeRangeSchedules.length}개)을 정시 체크하시겠습니까?`)) {
      return;
    }

    setProcessing(true);
    try {
      const today = selectedDate;
      const attendanceUpdates = [];

      for (const schedule of timeRangeSchedules) {
        const attendanceData = {
          employee_id: schedule.employee_id,
          date: today,
          check_in_time: schedule.scheduled_start, // 이미 HH:mm:ss 형식
          check_out_time: schedule.scheduled_end,   // 이미 HH:mm:ss 형식
          notes: `정시 체크 (관리자 시간대별 처리) - ${description}`
        };
        attendanceUpdates.push(attendanceData);
      }

      // attendance 테이블에 upsert
      const { error: attendanceError } = await supabase
        .from('attendance')
        .upsert(attendanceUpdates, { 
          onConflict: 'employee_id,date',
          ignoreDuplicates: false 
        });

      if (attendanceError) throw attendanceError;

      alert(`✅ ${description} 시간대의 모든 스케줄이 정시 체크되었습니다!`);
      await loadSchedules();
      await loadAttendanceRecords();
    } catch (error: any) {
      console.error('시간대별 일괄 체크 오류:', error);
      alert(`시간대별 일괄 체크 실패: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Users className="h-6 w-6 mr-2 text-blue-600" />
            출근 관리 (고급 기능)
          </h1>
          <p className="text-gray-600 mt-1">휴식 시간 수정 및 스케줄 기반 정시 출퇴근 자동 체크가 가능합니다.</p>
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
                <option value="no-attendance">미출근</option>
                <option value="partial-attendance">근무중</option>
                <option value="completed">완료</option>
                <option value="all">전체</option>
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={loadSchedules}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Search className="h-4 w-4 inline mr-2" />
                조회
              </button>
            </div>
          </div>
        </div>

        {/* 일괄 액션 버튼 */}
        {selectedSchedules.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-800">
                  {selectedSchedules.length}개 스케줄 선택됨
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleBulkAutoCheck}
                  disabled={processing}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                >
                  <Play className="h-4 w-4 inline mr-2" />
                  일괄 정시 체크
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 점심 휴식 빠른 설정 버튼 */}
        {schedules.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Coffee className="h-5 w-5 text-orange-600" />
                <span className="text-sm font-medium text-orange-800">
                  점심 휴식 빠른 설정
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={handleBulkLunchBreak}
                  disabled={processing}
                  className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50"
                >
                  <Coffee className="h-4 w-4 inline mr-2" />
                  전체 점심 휴식 설정
                </button>
              </div>
            </div>
            <p className="text-xs text-orange-600 mt-2">
              모든 직원의 점심 휴식시간(12:00-13:00)을 한번에 설정합니다.
            </p>
          </div>
        )}

        {/* 시간대별 일괄 처리 버튼 */}
        {schedules.length > 0 && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-purple-800">
                  시간대별 일괄 처리
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleTimeRangeBulkCheck('morning')}
                  disabled={processing}
                  className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 text-sm"
                >
                  오전 체크
                </button>
                <button
                  onClick={() => handleTimeRangeBulkCheck('afternoon')}
                  disabled={processing}
                  className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 text-sm"
                >
                  오후 체크
                </button>
                <button
                  onClick={() => handleTimeRangeBulkCheck('full')}
                  disabled={processing}
                  className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 text-sm"
                >
                  전일 체크
                </button>
              </div>
            </div>
            <p className="text-xs text-purple-600 mt-2">
              특정 시간대의 모든 스케줄을 정시 체크합니다. (오전: 09:00-12:00, 오후: 13:00-18:00, 전일: 09:00-18:00)
            </p>
          </div>
        )}

        {/* 스케줄이 없는 직원들 */}
        {selectedEmployee === 'all' && (
          <div className="bg-white rounded-lg shadow-sm border mb-6">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">스케줄이 없는 직원들</h2>
              <p className="text-sm text-gray-600 mt-1">해당 날짜에 스케줄이 없지만 출근 기록을 추가할 수 있습니다.</p>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {employees
                  .filter(emp => !schedules.some(s => s.employee_id === emp.id))
                  .map(employee => (
                    <div key={employee.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8">
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {employee.name.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {employee.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {employee.employee_id}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAddAttendance(employee.id)}
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        출근 추가
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* 스케줄 목록 */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">스케줄 목록</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  {selectedSchedules.length === schedules.length ? '전체 해제' : '전체 선택'}
                </button>
                <span className="text-sm text-gray-500">
                  총 {schedules.length}개
                </span>
              </div>
            </div>
          </div>

          {(() => {
            console.log('🎨 렌더링 상태', { loading, schedulesLength: schedules.length });
            return null;
          })()}
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">로딩 중...</p>
            </div>
          ) : schedules.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>해당 조건에 맞는 스케줄이 없습니다.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      선택
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      직원
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      스케줄 시간
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      실제 출근
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      실제 퇴근
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      휴식 시간
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      액션
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {Object.entries(getGroupedSchedules()).map(([employeeId, group]) => {
                    const isCollapsed = collapsedEmployees.has(employeeId);
                    const employeeSchedules = group.schedules;
                    const firstSchedule = employeeSchedules[0];
                    const attendanceInfo = getAttendanceInfo(firstSchedule);
                    
                    return (
                      <React.Fragment key={employeeId}>
                        {/* 직원 헤더 행 */}
                        <tr className="bg-blue-50 border-t-2 border-blue-200">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={employeeSchedules.every(s => selectedSchedules.includes(s.id))}
                              onChange={() => {
                                const allSelected = employeeSchedules.every(s => selectedSchedules.includes(s.id));
                                if (allSelected) {
                                  setSelectedSchedules(prev => prev.filter(id => !employeeSchedules.some(s => s.id === id)));
                                } else {
                                  setSelectedSchedules(prev => [...prev, ...employeeSchedules.map(s => s.id).filter(id => !prev.includes(id))]);
                                }
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <button
                                onClick={() => toggleEmployeeCollapse(employeeId)}
                                className="mr-2 text-blue-600 hover:text-blue-800"
                              >
                                {isCollapsed ? '▶' : '▼'}
                              </button>
                              <div className="flex-shrink-0 h-8 w-8">
                                <div className="h-8 w-8 rounded-full flex items-center justify-center bg-blue-200">
                                  <span className="text-sm font-medium text-blue-900">
                                    {group.employee?.name?.charAt(0) || '?'}
                                  </span>
                                </div>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-blue-900 font-semibold">
                                  {group.employee?.name || '알 수 없음'}
                                  <span className="ml-2 text-xs text-blue-600">
                                    ({employeeSchedules.length}개 스케줄)
                                  </span>
                                </div>
                                <div className="text-sm text-gray-500">
                                  {group.employee?.employee_id || 'N/A'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {isCollapsed ? (
                              <span className="text-gray-500">
                                {employeeSchedules[0]?.scheduled_start} - {employeeSchedules[employeeSchedules.length - 1]?.scheduled_end}
                              </span>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {isCollapsed && firstSchedule.actual_start ? (
                              (() => {
                                try {
                                  if (firstSchedule.actual_start.includes('T')) {
                                    const timePart = firstSchedule.actual_start.split('T')[1];
                                    return timePart ? timePart.substring(0, 8) : firstSchedule.actual_start;
                                  }
                                  return firstSchedule.actual_start.substring(0, 8);
                                } catch (error) {
                                  return firstSchedule.actual_start;
                                }
                              })()
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {isCollapsed && firstSchedule.actual_end ? (
                              (() => {
                                try {
                                  if (firstSchedule.actual_end.includes('T')) {
                                    const timePart = firstSchedule.actual_end.split('T')[1];
                                    return timePart ? timePart.substring(0, 8) : firstSchedule.actual_end;
                                  }
                                  return firstSchedule.actual_end.substring(0, 8);
                                } catch (error) {
                                  return firstSchedule.actual_end;
                                }
                              })()
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {isCollapsed && attendanceInfo.hasBreak ? (
                              <div className="flex items-center space-x-1">
                                <Coffee className="h-4 w-4 text-orange-500" />
                                <span>{attendanceInfo.breakStart} - {attendanceInfo.breakEnd}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isCollapsed ? getStatusBadge(firstSchedule) : <span className="text-gray-400">-</span>}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleEmployeeBulkCheck(employeeId)}
                                disabled={processing}
                                className="text-green-600 hover:text-green-800 text-sm font-medium disabled:opacity-50"
                                title="해당 직원의 모든 스케줄 정시 체크"
                              >
                                일괄체크
                              </button>
                              <button
                                onClick={() => handleIndividualLunchBreak(employeeId)}
                                className="text-orange-600 hover:text-orange-800 text-sm font-medium"
                                title="점심 휴식 설정 (12:00-13:00)"
                              >
                                점심휴식
                              </button>
                            </div>
                          </td>
                        </tr>
                        
                        {/* 개별 스케줄 행들 (접힌 상태가 아닐 때만 표시) */}
                        {!isCollapsed && employeeSchedules.map((schedule, index) => {
                          const scheduleAttendanceInfo = getAttendanceInfo(schedule);
                          return (
                            <tr key={schedule.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap">
                                <input
                                  type="checkbox"
                                  checked={selectedSchedules.includes(schedule.id)}
                                  onChange={() => handleSelectSchedule(schedule.id)}
                                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center ml-8">
                                  <div className="flex-shrink-0 h-6 w-6">
                                    <div className="h-6 w-6 rounded-full flex items-center justify-center bg-gray-100">
                                      <span className="text-xs font-medium text-gray-600">
                                        {index + 1}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="ml-3">
                                    <div className="text-sm font-medium text-gray-700">
                                      {schedule.scheduled_start} - {schedule.scheduled_end}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {schedule.scheduled_start} - {schedule.scheduled_end}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {(() => {
                                  try {
                                    return schedule.actual_start ? 
                                      normalizeTime(schedule.actual_start) : 
                                      <span className="text-gray-400">-</span>;
                                  } catch (error) {
                                    console.warn('actual_start 렌더링 에러:', error, schedule.actual_start);
                                    return <span className="text-red-400">에러</span>;
                                  }
                                })()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {(() => {
                                  try {
                                    return schedule.actual_end ? 
                                      normalizeTime(schedule.actual_end) : 
                                      <span className="text-gray-400">-</span>;
                                  } catch (error) {
                                    console.warn('actual_end 렌더링 에러:', error, schedule.actual_end);
                                    return <span className="text-red-400">에러</span>;
                                  }
                                })()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {scheduleAttendanceInfo.hasBreak ? (
                                  <div className="flex items-center space-x-1">
                                    <Coffee className="h-4 w-4 text-orange-500" />
                                    <span>{scheduleAttendanceInfo.breakStart} - {scheduleAttendanceInfo.breakEnd}</span>
                                  </div>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {getStatusBadge(schedule)}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex space-x-2">
                                  <button
                                    onClick={() => handleEditAttendance(schedule)}
                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                  >
                                    수정
                                  </button>
                                  <button
                                    onClick={() => handleAutoCheckIn(schedule)}
                                    className="text-green-600 hover:text-green-800 text-sm font-medium"
                                  >
                                    정시체크
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 출근시간 수정 모달 (휴식 시간 포함) */}
        {showEditModal && editingSchedule && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  출근시간 수정 - {editingSchedule.employee?.name}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      출근 시간
                    </label>
                    <input
                      type="time"
                      value={editForm.checkInTime}
                      onChange={(e) => setEditForm({...editForm, checkInTime: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      퇴근 시간
                    </label>
                    <input
                      type="time"
                      value={editForm.checkOutTime}
                      onChange={(e) => setEditForm({...editForm, checkOutTime: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      휴식 시작 시간
                    </label>
                    <input
                      type="time"
                      value={editForm.breakStartTime}
                      onChange={(e) => setEditForm({...editForm, breakStartTime: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      휴식 종료 시간
                    </label>
                    <input
                      type="time"
                      value={editForm.breakEndTime}
                      onChange={(e) => setEditForm({...editForm, breakEndTime: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      메모
                    </label>
                    <textarea
                      value={editForm.note}
                      onChange={(e) => setEditForm({...editForm, note: e.target.value})}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="출근 관련 메모를 입력하세요..."
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingSchedule(null);
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    저장
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
