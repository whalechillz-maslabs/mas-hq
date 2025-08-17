'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db, Employee, Schedule } from '@/lib/supabase';
import { formatCurrency, formatPercentage, getStatusColor } from '@/utils/formatUtils';
import { formatDateKR, formatTimeKR, isToday } from '@/utils/dateUtils';
import {
  TrendingUp,
  Target,
  Phone,
  Users,
  Calendar,
  Clock,
  Award,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  Bell,
  User,
  LogOut,
  Settings,
  BarChart3,
  Activity,
  DollarSign,
  Coffee,
  Zap,
  Heart
} from 'lucide-react';

interface DashboardData {
  todayRevenue: number;
  monthlyRevenue: number;
  newConsultations: number;
  targetAchievement: number;
  phoneCallsSold: number;
  offlineSatisfaction: number;
  onlineSales: number;
  teamRevenue: number;
  yoyGrowth: number;
  teamTargetAchievement: number;
}

export default function EmployeeDashboard() {
  const router = useRouter();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [todaySchedule, setTodaySchedule] = useState<Schedule | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    todayRevenue: 950000,
    monthlyRevenue: 4080000,
    newConsultations: 0,
    targetAchievement: 33,
    phoneCallsSold: 7,
    offlineSatisfaction: 92,
    onlineSales: 3,
    teamRevenue: 35000000,
    yoyGrowth: 12,
    teamTargetAchievement: 78
  });

  // 도널드 밀러식 핵심 행동 메시지
  const coreMissions = [
    { icon: Zap, text: '긍정적 사고', color: 'text-yellow-600 bg-yellow-100' },
    { icon: Heart, text: '창의적 열정', color: 'text-red-600 bg-red-100' },
    { icon: Coffee, text: '헌신', color: 'text-purple-600 bg-purple-100' }
  ];

  useEffect(() => {
    loadDashboardData();
    // 시계 업데이트
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const loadDashboardData = async () => {
    try {
      const currentUser = await auth.getCurrentUser();
      if (!currentUser) {
        router.push('/login');
        return;
      }
      setEmployee(currentUser);

      // 오늘 스케줄 가져오기
      const schedule = await db.getTodaySchedule(currentUser.id);
      setTodaySchedule(schedule);

      // 실제 API에서 대시보드 데이터 가져오기
      // const data = await fetchDashboardData(currentUser.id);
      // setDashboardData(data);
    } catch (error) {
      console.error('대시보드 데이터 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!employee) return;

    try {
      // 위치 권한 요청 (선택적)
      let location;
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });
          location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
        } catch (err) {
          console.log('위치 정보를 가져올 수 없습니다.');
        }
      }

      const schedule = await db.checkIn(employee.id, location);
      setTodaySchedule(schedule);
      alert('출근 체크되었습니다!');
    } catch (error) {
      console.error('출근 체크 실패:', error);
      alert('출근 체크에 실패했습니다.');
    }
  };

  const handleCheckOut = async () => {
    if (!employee || !todaySchedule) return;

    try {
      let location;
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });
          location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
        } catch (err) {
          console.log('위치 정보를 가져올 수 없습니다.');
        }
      }

      const schedule = await db.checkOut(todaySchedule.id, location);
      setTodaySchedule(schedule);
      alert('퇴근 체크되었습니다!');
    } catch (error) {
      console.error('퇴근 체크 실패:', error);
      alert('퇴근 체크에 실패했습니다.');
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const getAchievementColor = (percentage: number) => {
    if (percentage >= 100) return 'text-green-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">M</span>
              </div>
              <h1 className="ml-3 text-xl font-bold text-gray-900">MASGOLF</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {formatDateKR(currentTime)} {formatTimeKR(currentTime)}
              </div>
              
              <button className="relative p-2 text-gray-600 hover:text-gray-900">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{employee?.name}</div>
                  <div className="text-xs text-gray-500">{employee?.employee_id}</div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="p-2 text-gray-600 hover:text-red-600"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 오늘의 미션 - 도널드 밀러식 핵심 행동 카드 */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">오늘의 미션</h2>
          <div className="grid grid-cols-3 gap-4">
            {coreMissions.map((mission, index) => (
              <div
                key={index}
                className={`${mission.color} rounded-lg p-4 flex items-center space-x-3`}
              >
                <mission.icon className="w-8 h-8" />
                <span className="font-medium">{mission.text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 출퇴근 체크 섹션 */}
        <section className="mb-8 bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900">근무 상태</h3>
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-gray-500" />
              <span className="text-sm text-gray-600">
                {todaySchedule?.actual_start 
                  ? `출근: ${formatTimeKR(todaySchedule.actual_start)}`
                  : '미출근'}
              </span>
            </div>
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={handleCheckIn}
              disabled={!!todaySchedule?.actual_start}
              className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
                todaySchedule?.actual_start
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-green-600 text-white hover:bg-green-700'
              }`}
            >
              출근하기
            </button>
            <button
              onClick={handleCheckOut}
              disabled={!todaySchedule?.actual_start || !!todaySchedule?.actual_end}
              className={`flex-1 py-3 px-6 rounded-lg font-medium transition-colors ${
                !todaySchedule?.actual_start || todaySchedule?.actual_end
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              퇴근하기
            </button>
          </div>
        </section>

        {/* KPI 하이라이트 */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">KPI 하이라이트</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 오늘의 매출 */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-3">
                <DollarSign className="w-8 h-8 text-green-600" />
                <span className="text-xs text-green-600">+15%</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(dashboardData.todayRevenue)}
              </div>
              <div className="text-sm text-gray-600 mt-1">오늘의 매출</div>
            </div>

            {/* 월 누적 매출 */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-3">
                <BarChart3 className="w-8 h-8 text-blue-600" />
                <span className="text-xs text-blue-600">+8%</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(dashboardData.monthlyRevenue)}
              </div>
              <div className="text-sm text-gray-600 mt-1">월 누적 매출</div>
            </div>

            {/* 신규 상담 */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-3">
                <Users className="w-8 h-8 text-purple-600" />
                <span className="text-xs text-gray-600">0</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {dashboardData.newConsultations}건
              </div>
              <div className="text-sm text-gray-600 mt-1">신규 상담</div>
            </div>

            {/* 목표 달성률 */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-3">
                <Target className="w-8 h-8 text-orange-600" />
                <span className={`text-xs ${getAchievementColor(dashboardData.targetAchievement)}`}>
                  {dashboardData.targetAchievement}%
                </span>
              </div>
              <div className="relative pt-1">
                <div className="flex mb-2 items-center justify-between">
                  <div className="text-2xl font-bold text-gray-900">
                    {dashboardData.targetAchievement}%
                  </div>
                </div>
                <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                  <div
                    style={{ width: `${dashboardData.targetAchievement}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-orange-600"
                  />
                </div>
              </div>
              <div className="text-sm text-gray-600 mt-1">목표 달성률</div>
            </div>
          </div>
        </section>

        {/* 개인 KPI & 팀 KPI */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* 개인 KPI */}
          <section className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">개인 KPI</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Phone className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-700">전화 판매 건수</span>
                </div>
                <span className="font-bold text-gray-900">{dashboardData.phoneCallsSold}건</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Activity className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-700">오프라인 시타 만족도</span>
                </div>
                <span className="font-bold text-gray-900">{dashboardData.offlineSatisfaction}%</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-700">온라인 판매 성사</span>
                </div>
                <span className="font-bold text-gray-900">{dashboardData.onlineSales}건</span>
              </div>
            </div>

            {/* 개인 성과 배지 */}
            <div className="mt-6 pt-6 border-t">
              <h4 className="text-sm font-medium text-gray-700 mb-3">이번 달 획득 배지</h4>
              <div className="flex space-x-2">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <Award className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="w-12 h-12 bg-silver-100 rounded-full flex items-center justify-center">
                  <Award className="w-6 h-6 text-gray-600" />
                </div>
              </div>
            </div>
          </section>

          {/* 팀 KPI */}
          <section className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">팀 KPI</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <DollarSign className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-700">OP팀 전체 매출</span>
                </div>
                <span className="font-bold text-gray-900">
                  {formatCurrency(dashboardData.teamRevenue)}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <ChevronUp className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">YOY 성장률</span>
                </div>
                <span className="font-bold text-green-600">
                  +{dashboardData.yoyGrowth}%
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Target className="w-5 h-5 text-gray-500" />
                  <span className="text-gray-700">팀 목표 달성률</span>
                </div>
                <span className="font-bold text-gray-900">
                  {dashboardData.teamTargetAchievement}%
                </span>
              </div>
            </div>

            {/* 팀 순위 */}
            <div className="mt-6 pt-6 border-t">
              <h4 className="text-sm font-medium text-gray-700 mb-3">팀 내 순위</h4>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">매출 기준</span>
                <span className="text-2xl font-bold text-green-600">3위</span>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                전체 12명 중
              </div>
            </div>
          </section>
        </div>

        {/* 빠른 메뉴 */}
        <section className="mt-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">빠른 메뉴</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => router.push('/schedules')}
              className="bg-white rounded-lg p-4 hover:shadow-md transition-shadow flex flex-col items-center space-y-2"
            >
              <Calendar className="w-8 h-8 text-blue-600" />
              <span className="text-sm font-medium text-gray-700">근무 스케줄</span>
            </button>
            
            <button
              onClick={() => router.push('/salaries')}
              className="bg-white rounded-lg p-4 hover:shadow-md transition-shadow flex flex-col items-center space-y-2"
            >
              <DollarSign className="w-8 h-8 text-green-600" />
              <span className="text-sm font-medium text-gray-700">급여 조회</span>
            </button>
            
            <button
              onClick={() => router.push('/tasks')}
              className="bg-white rounded-lg p-4 hover:shadow-md transition-shadow flex flex-col items-center space-y-2"
            >
              <Activity className="w-8 h-8 text-purple-600" />
              <span className="text-sm font-medium text-gray-700">업무 기록</span>
            </button>
            
            <button
              onClick={() => router.push('/profile')}
              className="bg-white rounded-lg p-4 hover:shadow-md transition-shadow flex flex-col items-center space-y-2"
            >
              <Settings className="w-8 h-8 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">내 정보</span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
