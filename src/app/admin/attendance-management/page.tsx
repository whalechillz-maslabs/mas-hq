'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, supabase } from '@/lib/supabase';
import { 
  Clock, MapPin, Users, Calendar, Filter, Download,
  Search, Eye, CheckCircle, XCircle, AlertCircle,
  TrendingUp, BarChart3, Download as DownloadIcon,
  Coffee
} from 'lucide-react';

interface AttendanceRecord {
  id: string;
  employee_id: string;
  employee_name: string;
  employee_id_code: string;
  employment_type: string;
  schedule_date: string;
  
  // 스케줄 정보 (업무 예정 시간)
  scheduled_start: string;
  scheduled_end: string;
  
  // 실제 출근 기록
  actual_start: string;
  actual_end: string;
  
  // 점심 휴식 정보
  break_minutes?: number;
  
  // 근무 시간 계산
  total_hours: number;
  overtime_hours: number;
  
  // 상태 정보
  status: 'confirmed' | 'completed' | 'pending';
  
  // 위치 정보
  check_in_location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  check_out_location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  
  // 메모
  employee_note?: string;
  manager_note?: string;
  
  // 스케줄 정보
  schedule_count?: number;
  first_schedule_start?: string;
  last_schedule_end?: string;
}

export default function AttendanceManagementPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // 한국 시간 기준으로 오늘 날짜 설정
  const getKoreaToday = () => {
    const now = new Date();
    const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
    return koreaTime.toISOString().split('T')[0];
  };
  
  const [selectedDate, setSelectedDate] = useState(getKoreaToday());
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    checkAuth();
    loadData();
  }, [selectedDate, selectedDepartment]);

  const checkAuth = async () => {
    const user = await auth.getCurrentUser();
    console.log('Current user:', user); // 디버깅용
    console.log('User ID:', user?.id);
    console.log('User employee_id:', user?.employee_id);
    console.log('User name:', user?.name);
    console.log('User role_id:', user?.role_id);
    
    if (!user) {
      router.push('/login');
      return;
    }
    
    // 관리자/매니저 권한 확인
    const isManager = user.role_id === 'admin' || 
                     user.role_id === 'manager' ||
                     user.employee_id === 'MASLABS-001' ||
                     user.name === '시스템 관리자' ||
                     user.name === '김탁수' ||
                     user.employee_id === 'WHA';
    
    if (!isManager) {
      alert('관리자 또는 매니저 권한이 필요합니다.');
      router.push('/dashboard');
      return;
    }
    
    setCurrentUser(user);
  };

  // 자동 퇴근 처리 함수
  const processAutoCheckout = async (employeeId: string, date: string) => {
    try {
      console.log(`🔄 자동 퇴근 처리 시작: ${employeeId}, ${date}`);
      
      // 1. 현재 attendance 데이터 조회
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('date', date)
        .single();
      
      if (!attendanceData || attendanceData.check_out_time) {
        console.log('자동 퇴근 처리 불필요: 출근 기록 없음 또는 이미 퇴근함');
        return;
      }
      
      // 2. 스케줄 데이터 조회
      const { data: scheduleData } = await supabase
        .from('schedules')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('schedule_date', date)
        .order('scheduled_start', { ascending: true });
      
      const now = new Date();
      const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
      const currentTime = koreaTime.toTimeString().split(' ')[0]; // HH:MM:SS
      
      let expectedEndTime = null;
      let totalHours = 0;
      let overtimeHours = 0;
      
      if (scheduleData && scheduleData.length > 0) {
        // 스케줄이 있는 경우
        const lastSchedule = scheduleData[scheduleData.length - 1];
        expectedEndTime = lastSchedule.scheduled_end;
        
        // 기본 근무 시간 계산 (스케줄 기준)
        const scheduledStart = new Date(`2000-01-01T${scheduleData[0].scheduled_start}`);
        const scheduledEnd = new Date(`2000-01-01T${lastSchedule.scheduled_end}`);
        const scheduledDuration = (scheduledEnd.getTime() - scheduledStart.getTime()) / (1000 * 60 * 60);
        totalHours = scheduledDuration;
        
        // 초과 근무 시간 계산
        const expectedEnd = new Date(`2000-01-01T${expectedEndTime}`);
        const current = new Date(`2000-01-01T${currentTime}`);
        if (current > expectedEnd) {
          overtimeHours = (current.getTime() - expectedEnd.getTime()) / (1000 * 60 * 60);
        }
      } else {
        // 스케줄이 없는 경우 - 기본 8시간 근무
        const checkInTime = new Date(`2000-01-01T${attendanceData.check_in_time}`);
        const defaultEndTime = new Date(checkInTime.getTime() + (8 * 60 * 60 * 1000));
        expectedEndTime = defaultEndTime.toTimeString().split(' ')[0];
        totalHours = 8;
        
        // 초과 근무 시간 계산
        const expectedEnd = new Date(`2000-01-01T${expectedEndTime}`);
        const current = new Date(`2000-01-01T${currentTime}`);
        if (current > expectedEnd) {
          overtimeHours = (current.getTime() - expectedEnd.getTime()) / (1000 * 60 * 60);
        }
      }
      
      // 3. 자동 퇴근 조건 확인 (예상 종료 시간 + 30분 후)
      const expectedEndDate = new Date(`2000-01-01T${expectedEndTime}`);
      const currentDate = new Date(`2000-01-01T${currentTime}`);
      const autoCheckoutTime = new Date(expectedEndDate.getTime() + (30 * 60 * 1000)); // 30분 후
      
      if (currentDate > autoCheckoutTime) {
        console.log(`✅ 자동 퇴근 처리 실행: ${expectedEndTime}`);
        
        // 4. 자동 퇴근 처리
        const { error: updateError } = await supabase
          .from('attendance')
          .update({
            check_out_time: expectedEndTime,
            total_hours: totalHours,
            overtime_hours: overtimeHours,
            status: 'completed',
            auto_checkout: true,
            auto_checkout_reason: '근무 시간 종료 후 자동 퇴근 처리'
          })
          .eq('employee_id', employeeId)
          .eq('date', date);
        
        if (updateError) {
          console.error('자동 퇴근 처리 오류:', updateError);
        } else {
          console.log('✅ 자동 퇴근 처리 완료');
        }
      } else {
        console.log('자동 퇴근 처리 대기 중:', {
          expectedEndTime,
          currentTime,
          autoCheckoutTime: autoCheckoutTime.toTimeString().split(' ')[0]
        });
      }
      
    } catch (error) {
      console.error('자동 퇴근 처리 중 오류:', error);
    }
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      console.log("출근 데이터 로딩 시작...", { selectedDate });
      
      // 디버그 정보 초기화
      const debugData = {
        selectedDate,
        normalizedDate: selectedDate.split('T')[0],
        schedulesCount: 0,
        employeesCount: 0,
        recordsCount: 0,
        errors: [],
        steps: []
      };
      
      // 날짜 형식 정규화 (YYYY-MM-DD)
      const normalizedDate = selectedDate.split('T')[0];
      console.log("정규화된 날짜:", normalizedDate);
      
      // 1. 먼저 해당 날짜에 스케줄이 있는 모든 직원 데이터 가져오기
      let { data: schedules, error: schedulesError } = await supabase
        .from("schedules")
        .select(`
          id,
          employee_id,
          schedule_date,
          scheduled_start,
          scheduled_end,
          actual_start,
          actual_end,
          break_minutes,
          total_hours,
          overtime_hours,
          status,
          employee_note
        `)
        .eq("schedule_date", normalizedDate);
      
      console.log("스케줄 데이터 결과:", { schedules, schedulesError, normalizedDate });
      
      // 디버그 정보 업데이트
      debugData.schedulesCount = schedules?.length || 0;
      debugData.steps.push(`스케줄 조회 완료: ${debugData.schedulesCount}개`);
      setDebugInfo({...debugData}); // 디버그 정보 즉시 업데이트
      
      if (schedulesError) {
        console.error("스케줄 데이터 로딩 오류:", schedulesError);
        debugData.errors.push(`스케줄 조회 오류: ${schedulesError.message}`);
        setDebugInfo(debugData);
        setAttendanceRecords([]);
        return;
      }
      
      // 2. attendance 테이블에서도 출근 기록 조회 (스케줄 없이 출근한 경우)
        const { data: attendanceData, error: attendanceError } = await supabase
          .from("attendance")
          .select(`
            id,
            employee_id,
            date,
            check_in_time,
            check_out_time,
            total_hours,
            overtime_hours,
            status,
            location
          `)
          .eq("date", normalizedDate);
      
      console.log("attendance 데이터 결과:", { attendanceData, attendanceError });
      
      // 위치 정보 디버깅
      if (attendanceData && attendanceData.length > 0) {
        attendanceData.forEach((att, index) => {
          console.log(`🔍 attendance[${index}] 위치 정보 상세:`, {
            employee_id: att.employee_id,
            date: att.date,
            check_in_time: att.check_in_time,
            check_out_time: att.check_out_time,
            location: att.location,
            location_type: typeof att.location,
            location_keys: att.location ? Object.keys(att.location) : 'null',
            location_stringified: JSON.stringify(att.location, null, 2)
          });
        });
      }
      
      // 디버그 정보 업데이트
      debugData.steps.push(`attendance 조회 완료: ${attendanceData?.length || 0}개`);
      setDebugInfo({...debugData}); // 디버그 정보 즉시 업데이트
      
      if (attendanceError) {
        console.error("attendance 데이터 로딩 오류:", attendanceError);
        debugData.errors.push(`attendance 조회 오류: ${attendanceError.message}`);
        setDebugInfo({...debugData});
      }
      
      // 3. schedules와 attendance 데이터 통합
      let allRecords = [];
      
      // schedules 데이터 추가
      if (schedules && schedules.length > 0) {
        allRecords = [...schedules];
      }
      
      // attendance 데이터 추가 (중복 제거)
      if (attendanceData && attendanceData.length > 0) {
        attendanceData.forEach(att => {
          // 이미 schedules에 있는 직원인지 확인
          const existingRecord = allRecords.find(record => record.employee_id === att.employee_id);
          
          if (!existingRecord) {
            // attendance 데이터를 schedules 형식으로 변환
            const convertedRecord = {
              id: att.id,
              employee_id: att.employee_id,
              schedule_date: att.date,
              scheduled_start: null,
              scheduled_end: null,
              actual_start: att.check_in_time ? `${att.date}T${att.check_in_time}` : null,
              actual_end: att.check_out_time ? `${att.date}T${att.check_out_time}` : null,
              break_minutes: 0,
              total_hours: att.total_hours || 0,
              overtime_hours: att.overtime_hours || 0,
              status: att.status || 'pending',
              employee_note: null,
            // 위치 정보 추가 (attendance 테이블의 location 필드 사용)
            check_in_location: att.location ? {
              latitude: att.location.latitude,
              longitude: att.location.longitude,
              accuracy: att.location.accuracy,
              timestamp: att.location.timestamp,
              note: att.location.note,
              address: att.location.address
            } : null,
            check_out_location: null
            };
            
            // 위치 정보 변환 디버깅
            console.log(`🔄 attendance 데이터 변환:`, {
              employee_id: att.employee_id,
              original_location: att.location,
              converted_check_in_location: convertedRecord.check_in_location,
              converted_check_out_location: convertedRecord.check_out_location
            });
            
            allRecords.push(convertedRecord);
          }
        });
      }
      
      if (allRecords.length === 0) {
        console.log("해당 날짜에 출근 기록이 없습니다.");
        setAttendanceRecords([]);
        return;
      }
      
      schedules = allRecords;
      console.log("통합된 schedules:", schedules);
      console.log("통합된 schedules 개수:", schedules.length);
      
      // 디버그 정보 업데이트
      debugData.recordsCount = schedules.length;
      debugData.steps.push(`데이터 통합 완료: ${schedules.length}개`);
      setDebugInfo({...debugData}); // 디버그 정보 즉시 업데이트
      
      // schedules가 null이 아닌지 확인
      if (!schedules || schedules.length === 0) {
        console.log("최종적으로 데이터가 없습니다.");
        
        // 3. 데이터베이스에 실제로 어떤 데이터가 있는지 확인
        console.log("데이터베이스 상태 진단 시작...");
        
        // 전체 schedules 테이블의 최근 데이터 확인
        const { data: recentSchedules, error: recentError } = await supabase
          .from("schedules")
          .select("schedule_date, employee_id, actual_start")
          .order("schedule_date", { ascending: false })
          .limit(10);
        
        if (recentError) {
          console.error("최근 스케줄 조회 오류:", recentError);
        } else {
          console.log("최근 10개 스케줄:", recentSchedules);
        }
        
        // 해당 날짜 범위의 데이터 확인
        const { data: dateRangeSchedules, error: dateRangeError } = await supabase
          .from("schedules")
          .select("schedule_date, employee_id, actual_start")
          .gte("schedule_date", "2025-09-01")
          .lte("schedule_date", "2025-09-05");
        
        if (dateRangeError) {
          console.error("날짜 범위 조회 오류:", dateRangeError);
        } else {
          console.log("9월 1-5일 스케줄:", dateRangeSchedules);
        }
        
        setAttendanceRecords([]);
        return;
      }
      
      // 직원 정보 가져오기 (중복 제거)
      const uniqueEmployeeIds = [...new Set(schedules.map(s => s.employee_id))];
      console.log("고유 직원 ID 목록:", uniqueEmployeeIds);
      
      const { data: employees, error: employeesError } = await supabase
        .from("employees")
        .select(`
          id,
          name,
          employee_id,
          employment_type
        `)
        .in("id", uniqueEmployeeIds);
      
      console.log("직원 데이터 결과:", { employees, employeesError });
      console.log("직원 데이터 개수:", employees?.length || 0);
      
      // 디버그 정보 업데이트
      debugData.employeesCount = employees?.length || 0;
      debugData.steps.push(`직원 조회 완료: ${debugData.employeesCount}명`);
      setDebugInfo({...debugData}); // 디버그 정보 즉시 업데이트
      
      if (employeesError) {
        console.error("직원 데이터 로딩 오류:", employeesError);
        debugData.errors.push(`직원 조회 오류: ${employeesError.message}`);
        setDebugInfo(debugData);
        setAttendanceRecords([]);
        return;
      }
      
      if (!employees || employees.length === 0) {
        console.error("직원 데이터가 없습니다.");
        debugData.errors.push("직원 데이터가 없습니다.");
        setDebugInfo(debugData);
        setAttendanceRecords([]);
        return;
      }
      
      // 직원별로 스케줄을 그룹화하여 중복 제거
      const employeeScheduleMap = new Map();
      
      console.log("스케줄 데이터 처리 시작:", schedules.length, "개");
      
      schedules.forEach((schedule, index) => {
        console.log(`스케줄 ${index + 1}:`, {
          id: schedule.id,
          employee_id: schedule.employee_id,
          schedule_date: schedule.schedule_date,
          actual_start: schedule.actual_start,
          actual_end: schedule.actual_end,
          status: schedule.status
        });
        
        const employee = employees?.find(emp => emp.id === schedule.employee_id);
        if (!employee) {
          console.log(`  ❌ 직원 정보를 찾을 수 없음: ${schedule.employee_id}`);
          return;
        }
        
        console.log(`  ✅ 직원 정보 찾음: ${employee.name} (${employee.employee_id})`);
        
        const employeeKey = schedule.employee_id;
        
        if (!employeeScheduleMap.has(employeeKey)) {
          // 새로운 직원의 첫 번째 스케줄
          const record = {
            id: schedule.id,
            employee_id: schedule.employee_id,
            employee_name: employee.name,
            employee_id_code: employee.employee_id,
            employment_type: employee.employment_type || "미지정",
            schedule_date: schedule.schedule_date,
            scheduled_start: schedule.scheduled_start,
            scheduled_end: schedule.scheduled_end,
            actual_start: schedule.actual_start ? schedule.actual_start : 
                         schedule.scheduled_start ? `${selectedDate}T${schedule.scheduled_start}` : null,
            actual_end: schedule.actual_end ? schedule.actual_end : 
                       schedule.scheduled_end ? `${selectedDate}T${schedule.scheduled_end}` : null,
            break_minutes: schedule.break_minutes,
            total_hours: schedule.actual_start && schedule.actual_end ? 
              calculateActualHours(schedule.actual_start, schedule.actual_end, schedule.break_minutes || 0) : 
              schedule.scheduled_start && schedule.scheduled_end ?
              calculateHours(schedule.scheduled_start, schedule.scheduled_end) : 0,
            overtime_hours: 0,
            status: schedule.status === "checked_out" ? "completed" : 
                    schedule.status === "checked_in" ? "confirmed" : "pending",
            employee_note: schedule.employee_note || "",
            schedule_count: 1, // 스케줄 개수
            first_schedule_start: schedule.scheduled_start,
            last_schedule_end: schedule.scheduled_end
          };
          
          employeeScheduleMap.set(employeeKey, record);
          console.log(`  ✅ 새 직원 기록 생성: ${employee.name}`);
        } else {
          // 기존 직원의 추가 스케줄 - 스케줄 개수만 증가 (실제 근무시간은 중복 계산 방지)
          const existingRecord = employeeScheduleMap.get(employeeKey);
          
          // 실제 출근/퇴근 시간이 같다면 중복 계산하지 않음
          if (schedule.actual_start !== existingRecord.actual_start || 
              schedule.actual_end !== existingRecord.actual_end) {
            const currentHours = schedule.actual_start && schedule.actual_end ? 
              calculateActualHours(schedule.actual_start, schedule.actual_end, schedule.break_minutes || 0) : 
              schedule.scheduled_start && schedule.scheduled_end ?
              calculateHours(schedule.scheduled_start, schedule.scheduled_end) : 0;
            
            existingRecord.total_hours += currentHours;
          }
          
          existingRecord.schedule_count += 1;
          
          // 마지막 스케줄 시간 업데이트
          existingRecord.last_schedule_end = schedule.scheduled_end;
          
          // 첫 번째 스케줄 시간은 변경하지 않음 (가장 이른 시간 유지)
          
          // 상태 우선순위: completed > confirmed > pending
          if (schedule.status === "checked_out" || existingRecord.status === "completed") {
            existingRecord.status = "completed";
          } else if (schedule.status === "checked_in" || existingRecord.status === "confirmed") {
            existingRecord.status = "confirmed";
          }
          
          // 노트가 있으면 추가
          if (schedule.employee_note) {
            existingRecord.employee_note += existingRecord.employee_note ? ` | ${schedule.employee_note}` : schedule.employee_note;
          }
        }
      });
      
      // Map을 배열로 변환
      const attendanceRecords: AttendanceRecord[] = Array.from(employeeScheduleMap.values());
      
      console.log("중복 제거된 출근 기록:", attendanceRecords);
      
      // 디버그 정보 최종 업데이트
      debugData.recordsCount = attendanceRecords.length;
      debugData.steps.push(`출근 기록 생성 완료: ${debugData.recordsCount}명`);
      setDebugInfo(debugData);
      
      setAttendanceRecords(attendanceRecords);
      // 자동 퇴근 처리 실행
      console.log('🔄 자동 퇴근 처리 시작...');
      const autoCheckoutEmployeeIds = [...new Set(convertedRecords.map(record => record.employee_id))];
      
      for (const employeeId of autoCheckoutEmployeeIds) {
        await processAutoCheckout(employeeId, normalizedDate);
      }
      
      console.log('✅ 자동 퇴근 처리 완료');
      
    } catch (error) {
      console.error("출근 데이터 로딩 중 오류:", error);
      debugData.errors.push(`전체 오류: ${error}`);
      setDebugInfo(debugData);
      setAttendanceRecords([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 시간 계산 함수 추가
  const calculateHours = (startTime: string, endTime: string): number => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const diffMs = end.getTime() - start.getTime();
    return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
  };

  // 실제 근무 시간 계산 함수 (휴식 시간 제외)
  const calculateActualHours = (startTime: string, endTime: string, breakMinutes: number): number => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - start.getTime();
    const totalMinutes = diffMs / (1000 * 60);
    
    // 점심시간(12:00-13:00) 자동 제외
    let lunchBreakMinutes = 0;
    const lunchStart = new Date(start);
    lunchStart.setHours(12, 0, 0, 0);
    const lunchEnd = new Date(start);
    lunchEnd.setHours(13, 0, 0, 0);
    
    // 점심시간과 근무시간이 겹치는 경우
    if (start < lunchEnd && end > lunchStart) {
      const overlapStart = start > lunchStart ? start : lunchStart;
      const overlapEnd = end < lunchEnd ? end : lunchEnd;
      lunchBreakMinutes = (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60);
    }
    
    const workMinutes = totalMinutes - breakMinutes - lunchBreakMinutes;
    // 소수점 2자리까지 반올림
    return Math.round((workMinutes / 60) * 100) / 100;
  };

  // 스케줄 시간을 h m 형식으로 변환하는 함수
  const formatScheduleDuration = (startTime: string, endTime: string): string => {
    if (!startTime || !endTime) return '';
    
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const diffMs = end.getTime() - start.getTime();
    const totalMinutes = Math.round(diffMs / (1000 * 60));
    
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}m`;
    }
  };

  const formatTime = (timeString: string | null) => {
    if (!timeString) return '-';
    
    // 시간만 있는 경우 (HH:MM:SS 형식)
    if (timeString.match(/^\d{2}:\d{2}:\d{2}$/)) {
      return timeString.substring(0, 5); // HH:MM만 반환
    }
    
    // ISO 날짜 형식인 경우 - 한국 시간으로 변환
    try {
      const date = new Date(timeString);
      
      // UTC 시간을 한국 시간(UTC+9)으로 변환
      const koreaTime = new Date(date.getTime() + (9 * 60 * 60 * 1000));
      
      // 시간만 추출 (HH:MM 형식)
      const hours = koreaTime.getHours().toString().padStart(2, '0');
      const minutes = koreaTime.getMinutes().toString().padStart(2, '0');
      
      return `${hours}:${minutes}`;
    } catch (error) {
      console.error('시간 변환 오류:', error, timeString);
      return timeString; // 파싱 실패 시 원본 반환
    }
  };
  const formatWorkTime = (hours: number) => {
    const wholeHours = Math.floor(hours);
    const minutes = Math.round((hours - wholeHours) * 60);
    return `${wholeHours}h ${minutes}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'confirmed': return 'text-blue-600 bg-blue-100';
      case 'break': return 'text-orange-600 bg-orange-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'confirmed': return <Clock className="w-4 h-4" />;
      case 'break': return <Coffee className="w-4 h-4" />;
      case 'pending': return <AlertCircle className="w-4 h-4" />;
      default: return <XCircle className="w-4 h-4" />;
    }
  };

  // 실제 출근/퇴근 시간을 기반으로 상태를 판정하는 함수
  const getActualStatus = (record: AttendanceRecord) => {
    console.log(`🔍 getActualStatus 호출: ${record.employee_name}`);
    console.log(`  - actual_start: ${record.actual_start}`);
    console.log(`  - actual_end: ${record.actual_end}`);
    console.log(`  - status: ${record.status}`);
    console.log(`  - employee_note: ${record.employee_note}`);
    
    // 휴식 상태 확인 (schedules 테이블의 status가 'break'인 경우)
    if (record.status === 'break') {
      console.log(`  ✅ 휴식 상태 감지 → 'break' 반환`);
      return 'break';
    }
    
    // 휴식 메모 확인 (employee_note에 '휴식' 관련 내용이 있는 경우)
    // 단, '휴식 후 복귀'는 휴식이 끝났다는 의미이므로 제외
    if (record.employee_note && (
      record.employee_note.includes('휴식 시작') || 
      record.employee_note.includes('중간 휴식') ||
      record.employee_note.includes('break')
    ) && !record.employee_note.includes('휴식 후 복귀')) {
      console.log(`  ✅ 휴식 메모 감지 → 'break' 반환`);
      return 'break';
    }
    
    // 출근 시간과 퇴근 시간이 모두 있는 경우
    if (record.actual_start && record.actual_end) {
      const startTime = new Date(record.actual_start);
      const endTime = new Date(record.actual_end);
      
      // 현재 시간
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // 출근 날짜와 퇴근 날짜 확인
      const startDate = new Date(startTime.getFullYear(), startTime.getMonth(), startTime.getDate());
      const endDate = new Date(endTime.getFullYear(), endTime.getMonth(), endTime.getDate());
      
      console.log(`  - startDate: ${startDate.toLocaleDateString()}`);
      console.log(`  - endDate: ${endDate.toLocaleDateString()}`);
      console.log(`  - today: ${today.toLocaleDateString()}`);
      
      // 출근과 퇴근이 모두 오늘이 아닌 경우 (과거 근무)
      if (startDate.getTime() !== today.getTime() && endDate.getTime() !== today.getTime()) {
        console.log(`  ✅ 과거 근무 → 'completed' 반환`);
        return 'completed'; // 완료된 근무
      }
      
      // 오늘 출근한 경우
      if (startDate.getTime() === today.getTime()) {
        if (endTime < now) {
          console.log(`  ✅ 오늘 출근, 퇴근 완료 → 'completed' 반환`);
          return 'completed'; // 퇴근 완료
        } else {
          console.log(`  ✅ 오늘 출근, 근무 중 → 'confirmed' 반환`);
          return 'confirmed'; // 근무 중
        }
      }
      
      // 오늘 퇴근한 경우 (어제 출근, 오늘 퇴근)
      if (endDate.getTime() === today.getTime()) {
        if (endTime < now) {
          console.log(`  ✅ 오늘 퇴근, 퇴근 완료 → 'completed' 반환`);
          return 'completed'; // 퇴근 완료
        } else {
          console.log(`  ✅ 오늘 퇴근, 근무 중 → 'confirmed' 반환`);
          return 'confirmed'; // 근무 중
        }
      }
      
      // 기본적으로 완료된 근무로 처리
      console.log(`  ✅ 기본값 → 'completed' 반환`);
      return 'completed';
    }
    
    // 출근 시간만 있고 퇴근 시간이 없는 경우
    if (record.actual_start && !record.actual_end) {
      console.log(`  ✅ 출근만 있음 → 'confirmed' 반환`);
      return 'confirmed'; // 근무 중
    }
    
    // 출근 시간이 없는 경우
    if (!record.actual_start) {
      console.log(`  ✅ 출근 시간 없음 → 'pending' 반환`);
      return 'pending'; // 미출근
    }
    
    // 기본값
    console.log(`  ✅ 기본값 → 'pending' 반환`);
    return 'pending';
  };

  // 상태 텍스트를 한글로 변환하는 함수
  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return '완료';
      case 'confirmed': return '근무중';
      case 'break': return '휴식중';
      case 'pending': return '미출근';
      default: return '미출근';
    }
  };

  const filteredRecords = attendanceRecords.filter(record => {
    const matchesSearch = record.employee_name.includes(searchTerm) || 
                         record.employee_id_code.includes(searchTerm);
    const matchesDepartment = selectedDepartment === 'all' || 
                             record.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="mr-4 p-2 rounded-lg hover:bg-gray-100 flex items-center"
              >
                <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                뒤로가기
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">출근 관리</h1>
                <p className="text-gray-600">직원들의 출근체크 위치/시간 확인 및 관리</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={() => setShowDebug(!showDebug)}
                className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 flex items-center"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {showDebug ? '디버그 숨기기' : '디버그 보기'}
              </button>
              <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center">
                <DownloadIcon className="w-4 h-4 mr-2" />
                엑셀 다운로드
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 필터 및 검색 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">날짜</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">부서</label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">전체 부서</option>
                <option value="개발팀">개발팀</option>
                <option value="디자인팀">디자인팀</option>
                <option value="마케팅팀">마케팅팀</option>
                <option value="본사">본사</option>
                <option value="경영지원팀">경영지원팀</option>
                <option value="마스운영팀">마스운영팀</option>
                <option value="싱싱운영팀">싱싱운영팀</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">검색</label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="이름 또는 사번"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
            <div className="flex items-end">
              <button
                onClick={loadData}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                <Filter className="w-4 h-4 inline mr-2" />
                필터 적용
              </button>
            </div>
          </div>
        </div>

        {/* 디버그 정보 */}
        {debugInfo && showDebug && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-3">🔍 디버그 정보</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-yellow-700 mb-2">기본 정보</h4>
                <ul className="text-sm text-yellow-600 space-y-1">
                  <li>선택된 날짜: {debugInfo.selectedDate}</li>
                  <li>정규화된 날짜: {debugInfo.normalizedDate}</li>
                  <li>스케줄 개수: {debugInfo.schedulesCount}</li>
                  <li>직원 개수: {debugInfo.employeesCount}</li>
                  <li>출근 기록 개수: {debugInfo.recordsCount}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-yellow-700 mb-2">처리 단계</h4>
                <ul className="text-sm text-yellow-600 space-y-1">
                  {debugInfo.steps.map((step: string, index: number) => (
                    <li key={index}>{index + 1}. {step}</li>
                  ))}
                </ul>
              </div>
            </div>
            {debugInfo.errors.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium text-red-700 mb-2">오류 정보</h4>
                <ul className="text-sm text-red-600 space-y-1">
                  {debugInfo.errors.map((error: string, index: number) => (
                    <li key={index}>❌ {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* 통계 요약 */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">출근 완료</p>
                <p className="text-2xl font-bold text-green-600">
                  {filteredRecords.filter(r => getActualStatus(r) === 'completed').length}명
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">근무 중</p>
                <p className="text-2xl font-bold text-blue-600">
                  {filteredRecords.filter(r => getActualStatus(r) === 'confirmed').length}명
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <Coffee className="h-8 w-8 text-orange-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">휴식 중</p>
                <p className="text-2xl font-bold text-orange-600">
                  {filteredRecords.filter(r => getActualStatus(r) === 'break').length}명
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">미출근</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {filteredRecords.filter(r => getActualStatus(r) === 'pending').length}명
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-gray-600">평균 근무시간</p>
                <p className="text-2xl font-bold text-purple-600">
                  {(() => {
                    const avgHours = filteredRecords.reduce((sum, r) => sum + r.total_hours, 0) / Math.max(filteredRecords.length, 1);
                    return avgHours > 0 ? formatWorkTime(avgHours) : '0h 0m';
                  })()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 출근 기록 테이블 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">출근 기록</h3>
            <p className="text-sm text-gray-600 mt-1">총 {filteredRecords.length}명의 기록</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    직원 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    스케줄
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    실제 출근
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    점심 휴식
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    실제 퇴근
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    근무 시간
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    위치
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
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-indigo-600">
                              {record.employee_name.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{record.employee_name}</div>
                          <div className="text-sm text-gray-500">{record.employee_id_code}</div>
                          <div className="text-sm text-gray-500">{record.employment_type}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">스케줄</div>
                        <div className="text-xs text-gray-500">
                          {formatTime(record.first_schedule_start || null)} - {formatTime(record.last_schedule_end || null)}
                          {record.first_schedule_start && record.last_schedule_end && (
                            <span className="ml-2 text-blue-600">
                              ({formatScheduleDuration(record.first_schedule_start || '', record.last_schedule_end || '')})
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">실제 출근</div>
                        <div className="text-xs text-gray-500">
                          {formatTime(record.actual_start || null)}
                        </div>
                        <span className="text-xs text-gray-500">위치 없음</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div className="font-medium">실제 퇴근</div>
                        <div className="text-xs text-gray-500">
                          {formatTime(record.actual_end || null)}
                        </div>
                        <span className="text-xs text-gray-500">위치 없음</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {record.total_hours > 0 ? formatWorkTime(record.total_hours) : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs text-gray-500">위치 없음</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {(() => {
                        const actualStatus = getActualStatus(record);
                        const statusText = getStatusText(actualStatus);
                        console.log(`🎯 ${record.employee_name} 최종 상태: ${actualStatus} → ${statusText}`);
                        return (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(actualStatus)}`}>
                            {getStatusIcon(actualStatus)}
                        <span className="ml-1">
                              {statusText}
                        </span>
                      </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-indigo-600 hover:text-indigo-900 mr-3">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        <BarChart3 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
