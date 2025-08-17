"use client";

import { useState, useEffect } from "react";
import { 
  Clock, Calendar, Users, TrendingUp, 
  CheckCircle, XCircle, AlertCircle, Coffee,
  User, MapPin, Smartphone, Activity
} from "lucide-react";

// 타입 정의
type AttendanceStatus = 'not_checked' | 'checked_in' | 'checked_out';

interface TodayAttendance {
  status: AttendanceStatus;
  checkInTime?: string;
  checkOutTime?: string;
  workHours?: number;
  overtimeHours?: number;
}

interface AttendanceSummary {
  totalDays: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  leaveDays: number;
  overtimeHours: number;
}

interface LeaveBalance {
  annual: number;
  sick: number;
  used: number;
  remaining: number;
}

interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  employeeId: string;
  profileImage?: string;
}

export default function EmployeeDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [todayAttendance, setTodayAttendance] = useState<TodayAttendance>({
    status: 'not_checked'
  });
  const [employee, setEmployee] = useState<Employee>({
    id: '1',
    name: '홍길동',
    email: 'hong@maslabs.com',
    department: '개발팀',
    position: '과장',
    employeeId: 'EMP001'
  });
  const [monthSummary, setMonthSummary] = useState<AttendanceSummary>({
    totalDays: 22,
    presentDays: 18,
    lateDays: 2,
    absentDays: 0,
    leaveDays: 2,
    overtimeHours: 12.5
  });
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance>({
    annual: 15,
    sick: 3,
    used: 5,
    remaining: 13
  });
  const [loading, setLoading] = useState(false);

  // 시계 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 출근 처리
  const handleCheckIn = async () => {
    setLoading(true);
    try {
      // 위치 정보 가져오기 (선택적)
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const location = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            };
            // API 호출
            console.log('출근 처리 with location:', location);
          },
          (error) => {
            console.log('위치 정보 없이 출근 처리');
          }
        );
      }

      // 출근 시간 설정
      const now = new Date();
      setTodayAttendance({
        status: 'checked_in',
        checkInTime: now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })
      });

      alert('출근 처리되었습니다!');
    } catch (error) {
      alert('출근 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 퇴근 처리
  const handleCheckOut = async () => {
    if (!confirm('퇴근하시겠습니까?')) return;
    
    setLoading(true);
    try {
      const now = new Date();
      const checkIn = todayAttendance.checkInTime;
      
      // 근무 시간 계산
      if (checkIn) {
        const [hours, minutes] = checkIn.split(':').map(Number);
        const checkInDate = new Date();
        checkInDate.setHours(hours, minutes, 0);
        
        const workMillis = now.getTime() - checkInDate.getTime();
        const workHours = Math.round((workMillis / (1000 * 60 * 60)) * 10) / 10;
        const overtimeHours = Math.max(0, workHours - 8);

        setTodayAttendance({
          ...todayAttendance,
          status: 'checked_out',
          checkOutTime: now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
          workHours,
          overtimeHours
        });
      }

      alert('퇴근 처리되었습니다!');
    } catch (error) {
      alert('퇴근 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 근태 상태에 따른 버튼 표시
  const renderAttendanceButton = () => {
    switch (todayAttendance.status) {
      case 'not_checked':
        return (
          <button
            onClick={handleCheckIn}
            disabled={loading}
            className="w-full bg-blue-600 text-white py-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-lg font-semibold disabled:opacity-50"
          >
            <CheckCircle className="w-6 h-6" />
            출근하기
          </button>
        );
      case 'checked_in':
        return (
          <button
            onClick={handleCheckOut}
            disabled={loading}
            className="w-full bg-red-600 text-white py-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 text-lg font-semibold disabled:opacity-50"
          >
            <XCircle className="w-6 h-6" />
            퇴근하기
          </button>
        );
      case 'checked_out':
        return (
          <div className="w-full bg-gray-100 py-4 rounded-lg flex items-center justify-center gap-2 text-lg text-gray-600">
            <CheckCircle className="w-6 h-6 text-green-600" />
            오늘의 근무 완료
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">직원 대시보드</h1>
        <p className="text-gray-600 mt-1">
          {currentTime.toLocaleDateString('ko-KR', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric', 
            weekday: 'long' 
          })}
        </p>
      </div>

      {/* 프로필 카드 */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-10 h-10 text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900">{employee.name}</h2>
            <p className="text-gray-600">{employee.position} · {employee.department}</p>
            <p className="text-sm text-gray-500">사번: {employee.employeeId}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-900">
              {currentTime.toLocaleTimeString('ko-KR', { 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit' 
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 출퇴근 섹션 */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">오늘의 근태</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-sm">출근 시간</span>
            </div>
            <p className="text-2xl font-semibold text-gray-900">
              {todayAttendance.checkInTime || '--:--'}
            </p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-gray-600 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-sm">퇴근 시간</span>
            </div>
            <p className="text-2xl font-semibold text-gray-900">
              {todayAttendance.checkOutTime || '--:--'}
            </p>
          </div>
        </div>

        {renderAttendanceButton()}

        {todayAttendance.status === 'checked_out' && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-gray-700">총 근무시간</span>
              <span className="font-semibold">{todayAttendance.workHours}시간</span>
            </div>
            {todayAttendance.overtimeHours! > 0 && (
              <div className="flex justify-between items-center mt-2">
                <span className="text-gray-700">연장 근무</span>
                <span className="font-semibold text-orange-600">
                  +{todayAttendance.overtimeHours}시간
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 통계 카드들 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* 이번 달 근태 현황 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">이번 달 근태</h3>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">출근일</span>
              <span className="font-semibold">{monthSummary.presentDays}일</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">지각</span>
              <span className="font-semibold text-yellow-600">{monthSummary.lateDays}일</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">휴가</span>
              <span className="font-semibold text-blue-600">{monthSummary.leaveDays}일</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">연장근무</span>
              <span className="font-semibold text-orange-600">{monthSummary.overtimeHours}시간</span>
            </div>
          </div>
        </div>

        {/* 휴가 잔여 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">휴가 현황</h3>
            <Coffee className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">연차</span>
              <span className="font-semibold">{leaveBalance.annual}일</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">병가</span>
              <span className="font-semibold">{leaveBalance.sick}일</span>
            </div>
            <div className="pt-3 border-t">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">사용</span>
                <span className="font-semibold text-red-600">-{leaveBalance.used}일</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-gray-900 font-medium">잔여</span>
                <span className="font-bold text-green-600">{leaveBalance.remaining}일</span>
              </div>
            </div>
          </div>
        </div>

        {/* 이번 주 근무 시간 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">주간 근무</h3>
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">월</span>
              <span className="font-semibold">8.5h</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">화</span>
              <span className="font-semibold">9.0h</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">수</span>
              <span className="font-semibold">8.0h</span>
            </div>
            <div className="flex justify-between items-center text-blue-600">
              <span>목 (오늘)</span>
              <span className="font-semibold">
                {todayAttendance.workHours ? `${todayAttendance.workHours}h` : '-'}
              </span>
            </div>
            <div className="flex justify-between items-center text-gray-400">
              <span>금</span>
              <span>-</span>
            </div>
          </div>
        </div>
      </div>

      {/* 빠른 메뉴 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">빠른 메뉴</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-center">
            <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <span className="text-sm text-gray-700">휴가 신청</span>
          </button>
          <button className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-center">
            <Clock className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <span className="text-sm text-gray-700">근태 조회</span>
          </button>
          <button className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-center">
            <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <span className="text-sm text-gray-700">팀원 현황</span>
          </button>
          <button className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors text-center">
            <Activity className="w-8 h-8 text-orange-600 mx-auto mb-2" />
            <span className="text-sm text-gray-700">통계 보기</span>
          </button>
        </div>
      </div>
    </div>
  );
}
