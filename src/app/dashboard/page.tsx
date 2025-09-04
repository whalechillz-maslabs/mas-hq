'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

import { formatCurrency, getStatusColor, formatHours } from '@/utils/formatUtils';
import { formatDateKR, formatTimeKR, isToday } from '@/utils/dateUtils';

import { 
  TrendingUp, DollarSign, Users, Clock, Calendar, Target,
  Phone, ShoppingCart, Award, BarChart3, LogOut, Bell,
  ChevronUp, ChevronDown, Briefcase, UserPlus, Settings, User, Building2,
  Star, TrendingDown, CheckCircle, AlertCircle, Trophy, Zap, Menu
} from 'lucide-react';

interface DashboardData {
  employee: any;
  todaySchedule: any;
  monthlyStats: {
    totalSales: number;
    newConsultations: number;
    targetAchievement: number;
    totalWorkHours: number;
  };
  personalKPI: {
    phoneSales: number;
    offlineSatisfaction: number | string;
    onlineSales: number;
    contentViews: number | string;
  };
  teamKPI: {
    totalSales: number;
    yoyGrowth: number | string;
    targetAchievement: number | string;
    teamMembers: number;
  };
  todayMission: {
    positiveThinking: boolean;
    creativePassion: boolean;
    dedication: boolean;
  };
  todaySales: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [data, setData] = useState<DashboardData | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  useEffect(() => {
    loadDashboardData();
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // 현재 로그인한 사용자 정보 가져오기 (로컬 스토리지에서)
      let currentUser = null;
      if (typeof window !== 'undefined') {
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        const employeeData = localStorage.getItem('currentEmployee');
        
        if (isLoggedIn === 'true' && employeeData) {
          currentUser = JSON.parse(employeeData);
        }
      }
      
      if (!currentUser) {
        console.log('사용자 정보가 없습니다. 로그인 페이지로 이동합니다.');
        router.push('/login');
        return;
      }

      // 직원 정보와 관련 데이터 가져오기
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select(`
          *,
          department:departments(name),
          position:positions(name),
          role:roles(name)
        `)
        .eq('id', currentUser.id)
        .single();

      if (employeeError) {
        console.error('직원 정보 조회 오류:', employeeError);
      }

      // 오늘 날짜와 이번 달 날짜 범위 계산
      const today = new Date();
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      const todayStr = today.toISOString().split('T')[0];
      const startOfMonthStr = startOfMonth.toISOString().split('T')[0];
      const endOfMonthStr = endOfMonth.toISOString().split('T')[0];

      // 오늘의 스케줄 가져오기
      const { data: scheduleData } = await supabase
        .from('schedules')
        .select('*')
        .eq('employee_id', currentUser.id)
        .eq('schedule_date', todayStr)
        .single();

      // 전체 직원 수 가져오기
      const { count: totalEmployees } = await supabase
        .from('employees')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // 오늘의 업무 데이터 가져오기
      const { data: todayTasks } = await supabase
        .from('employee_tasks')
        .select(`
          *,
          operation_type:operation_types(code, name, points)
        `)
        .gte('created_at', todayStr + 'T00:00:00')
        .lte('created_at', todayStr + 'T23:59:59')
        .eq('employee_id', currentUser.id);

      // 이번 달 업무 데이터 가져오기
      const { data: monthlyTasks } = await supabase
        .from('employee_tasks')
        .select(`
          *,
          operation_type:operation_types(code, name, points)
        `)
        .gte('created_at', startOfMonthStr + 'T00:00:00')
        .lte('created_at', endOfMonthStr + 'T23:59:59')
        .eq('employee_id', currentUser.id);

      // 오늘의 매출 계산 (OP5 제외)
      const todaySales = todayTasks?.reduce((sum, task) => {
        // OP5는 개인매출에서 제외
        if (task.operation_type?.code === 'OP5') {
          return sum;
        }
        return sum + (task.sales_amount || 0);
      }, 0) || 0;

      // 이번 달 매출 계산 (OP5 제외)
      const monthlySales = monthlyTasks?.reduce((sum, task) => {
        // OP5는 개인매출에서 제외
        if (task.operation_type?.code === 'OP5') {
          return sum;
        }
        return sum + (task.sales_amount || 0);
      }, 0) || 0;

      // 신규 상담 건수 계산 (OP1, OP3 - 신규 고객 관련 업무)
      const newConsultations = monthlyTasks?.filter(task => 
        task.operation_type?.code === 'OP1' || task.operation_type?.code === 'OP3'
      ).length || 0;

      // 월간 통계 (실제 데이터)
      const monthlyStats = {
        totalSales: monthlySales,
        newConsultations: newConsultations,
        targetAchievement: Math.round((monthlySales / 5000000) * 100), // 목표 500만원 기준
        totalWorkHours: 168
      };

      // 오늘의 매출 데이터
      const todaySalesData = todaySales;

      // 개인 KPI (실제 데이터)
      const phoneSales = monthlyTasks?.filter(task => 
        task.operation_type?.code === 'OP1' || task.operation_type?.code === 'OP2'
      ).length || 0;

      const offlineSales = monthlyTasks?.filter(task => 
        task.operation_type?.code === 'OP3' || task.operation_type?.code === 'OP4'
      ).length || 0;

      const personalKPI = {
        phoneSales: phoneSales,
        offlineSatisfaction: 'Na', // 만족도는 별도 데이터 필요
        onlineSales: offlineSales,
        contentViews: 'Na' // 콘텐츠 조회수는 별도 데이터 필요
      };

      // 팀 KPI (실제 데이터 + 더미 데이터)
      const teamKPI = {
        totalSales: 35000000,
        yoyGrowth: 'Na',
        targetAchievement: 'Na',
        teamMembers: totalEmployees || 8
      };

      // 오늘의 미션 (도널드 밀러식 핵심 행동)
      const todayMission = {
        positiveThinking: Math.random() > 0.3,
        creativePassion: Math.random() > 0.4,
        dedication: Math.random() > 0.2
      };

      setData({
        employee: employeeData || currentUser,
        todaySchedule: scheduleData,
        monthlyStats,
        personalKPI,
        teamKPI,
        todayMission,
        todaySales: todaySales
      });

    } catch (error) {
      console.error('대시보드 데이터 로드 오류:', error);
      // 에러가 있어도 기본 데이터 설정
      setData({
        employee: null,
        todaySchedule: null,
        monthlyStats: {
          totalSales: 4080000,
          newConsultations: 45,
          targetAchievement: 33,
          totalWorkHours: 168
        },
        personalKPI: {
          phoneSales: 7,
          offlineSatisfaction: 'Na',
          onlineSales: 3,
          contentViews: 'Na'
        },
        teamKPI: {
          totalSales: 35000000,
          yoyGrowth: 'Na',
          targetAchievement: 'Na',
          teamMembers: 8
        },
        todayMission: {
          positiveThinking: true,
          creativePassion: true,
          dedication: true
        },
        todaySales: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('currentEmployee');
        localStorage.removeItem('isLoggedIn');
      }
      router.push('/login');
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  };

  // 새로운 시간 형식 함수
  const formatDateTime = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekday = weekdays[date.getDay()];
    
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
    
    return `${year}년 ${month}월 ${day}일(${weekday})\n${ampm}${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">대시보드를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* 개선된 상단바 */}
        <div className="bg-white rounded-2xl shadow-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            {/* 로고 영역 */}
            <div className="flex items-center space-x-4">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">MASLABS</h1>
            </div>
            
            {/* 중앙 날짜/시간 영역 - 데스크톱에서만 표시 */}
            <div className="hidden md:block text-center">
              <div className="text-sm text-gray-600 whitespace-pre-line font-medium">
                {formatDateTime(currentTime)}
              </div>
              </div>
              
            {/* 우측 사용자 영역 */}
            <div className="flex items-center space-x-2 md:space-x-4">
              {/* 알림 아이콘 - 알림 개수 뱃지 추가 */}
              <button className="p-2 text-gray-600 hover:text-yellow-600 transition-colors relative">
                <Bell className="h-5 w-5 md:h-6 md:w-6" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 md:h-5 md:w-5 flex items-center justify-center font-bold">
                    {notifications.length > 9 ? '9+' : notifications.length}
                  </span>
                )}
              </button>
              
              {/* 사용자 정보 - 모바일에서 축약 */}
              <div className="hidden sm:block text-right">
                <p className="text-xs md:text-sm text-gray-600">Hi,</p>
                <p className="text-sm md:text-base font-semibold text-gray-900 truncate max-w-24 md:max-w-32">
                  {data?.employee?.nickname || data?.employee?.name || '사용자'}님
                </p>
              </div>
              
              {/* 모바일에서 사용자 이름만 표시 */}
              <div className="sm:hidden text-right">
                <p className="text-sm font-semibold text-gray-900 truncate max-w-16">
                  {data?.employee?.nickname || data?.employee?.name || '사용자'}
                </p>
              </div>
              

              
              {/* 로그아웃 버튼 */}
              <button
                onClick={handleLogout}
                className="p-2 text-gray-600 hover:text-red-600 transition-colors"
                title="로그아웃"
              >
                <LogOut className="h-5 w-5 md:h-6 md:w-6" />
              </button>
              
              {/* 모바일 메뉴 버튼 */}
                <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 text-gray-600 hover:text-blue-600 transition-colors"
                title="메뉴"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {/* 모바일 날짜/시간 - 상단바 아래에 표시 */}
          <div className="md:hidden mt-3 text-center">
            <div className="text-sm text-gray-600 whitespace-pre-line font-medium">
              {formatDateTime(currentTime)}
            </div>
          </div>
          
          {/* 모바일 메뉴 드롭다운 */}
          {showMobileMenu && (
            <div className="md:hidden mt-3 pt-3 border-t border-gray-200">
              <div className="flex flex-col space-y-2">
                <button className="text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  프로필 설정
                </button>
                <button className="text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                  알림 설정
                </button>
                <button
                  onClick={handleLogout}
                  className="text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  로그아웃
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 오늘의 미션 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <Trophy className="h-6 w-6 mr-3 text-yellow-600" />
            오늘의 미션
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className={`p-4 rounded-xl border-2 ${data?.todayMission?.positiveThinking ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">긍정적 사고</h3>
                  <p className="text-sm text-gray-600">도널드 밀러식 핵심 행동</p>
                </div>
                {data?.todayMission?.positiveThinking ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-gray-400" />
                )}
              </div>
            </div>
            <div className={`p-4 rounded-xl border-2 ${data?.todayMission?.creativePassion ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">창의적 열정</h3>
                  <p className="text-sm text-gray-600">도널드 밀러식 핵심 행동</p>
              </div>
                {data?.todayMission?.creativePassion ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <AlertCircle className="h-6 w-6 text-gray-400" />
                )}
              </div>
            </div>
            <div className={`p-4 rounded-xl border-2 ${data?.todayMission?.dedication ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
          <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">헌신</h3>
                  <p className="text-sm text-gray-600">도널드 밀러식 핵심 행동</p>
                </div>
                {data?.todayMission?.dedication ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
              ) : (
                  <AlertCircle className="h-6 w-6 text-gray-400" />
              )}
            </div>
            </div>
          </div>
        </div>

        {/* KPI 하이라이트 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <BarChart3 className="h-6 w-6 mr-3 text-blue-600" />
            KPI 하이라이트
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">오늘의 매출</p>
                  <p className="text-2xl font-bold">{formatCurrency(data?.todaySales || 0)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">월 누적 매출</p>
                  <p className="text-2xl font-bold">{formatCurrency(data?.monthlyStats?.totalSales || 0)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-200" />
          </div>
            </div>
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">신규 상담</p>
                  <p className="text-2xl font-bold">{data?.monthlyStats?.newConsultations || 0}건</p>
                </div>
                <Phone className="h-8 w-8 text-purple-200" />
          </div>
            </div>
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">목표 달성률</p>
                  <p className="text-2xl font-bold">{data?.monthlyStats?.targetAchievement || 0}%</p>
          </div>
                <Target className="h-8 w-8 text-orange-200" />
            </div>
            </div>
          </div>
        </div>

          {/* 개인 KPI */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <User className="h-6 w-6 mr-3 text-indigo-600" />
              개인 KPI
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-indigo-600">전화 판매 건수</p>
                  <p className="text-2xl font-bold text-indigo-900">{data?.personalKPI?.phoneSales || 0}건</p>
                </div>
                <Phone className="h-8 w-8 text-indigo-600" />
              </div>
            </div>
            <div className="p-4 bg-green-50 rounded-xl border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600">오프라인 시타 만족도</p>
                  <p className="text-2xl font-bold text-green-900">
                  {typeof data?.personalKPI?.offlineSatisfaction === 'number' 
                    ? `${data.personalKPI.offlineSatisfaction}%` 
                    : data?.personalKPI?.offlineSatisfaction || 'Na'}
                </p>
                </div>
                <Star className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600">온라인 판매 성사</p>
                  <p className="text-2xl font-bold text-blue-900">{data?.personalKPI?.onlineSales || 0}건</p>
                </div>
                <ShoppingCart className="h-8 w-8 text-blue-600" />
              </div>
            </div>
            <div className="p-4 bg-purple-50 rounded-xl border border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-600">콘텐츠 조회수</p>
                  <p className="text-2xl font-bold text-purple-900">
                  {typeof data?.personalKPI?.contentViews === 'number' 
                    ? formatCurrency(data.personalKPI.contentViews) 
                    : data?.personalKPI?.contentViews || 'Na'}
                </p>
                </div>
                <BarChart3 className="h-8 w-8 text-purple-600" />
              </div>
              </div>
            </div>
          </div>

          {/* 팀별 KPI */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <Users className="h-6 w-6 mr-3 text-green-600" />
            팀별 KPI
          </h2>
          
          {/* 마스팀 KPI */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
              <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
              마스팀 (MAS Team)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600">마스팀 매출</p>
                    <p className="text-2xl font-bold text-blue-900">{formatCurrency(25000000)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600">마스팀 포인트</p>
                    <p className="text-2xl font-bold text-blue-900">1,250점</p>
                  </div>
                  <Award className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600">마스팀 업무</p>
                    <p className="text-2xl font-bold text-blue-900">85건</p>
                  </div>
                  <Target className="h-8 w-8 text-blue-600" />
                </div>
              </div>
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600">마스팀원 수</p>
                    <p className="text-2xl font-bold text-blue-900">5명</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          {/* 싱싱팀 KPI */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
              <span className="w-3 h-3 bg-pink-500 rounded-full mr-2"></span>
              싱싱팀 (Singsing Team)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-pink-50 rounded-xl border border-pink-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-pink-600">싱싱팀 매출</p>
                    <p className="text-2xl font-bold text-pink-900">{formatCurrency(10000000)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-pink-600" />
                </div>
              </div>
              <div className="p-4 bg-pink-50 rounded-xl border border-pink-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-pink-600">싱싱팀 포인트</p>
                    <p className="text-2xl font-bold text-pink-900">420점</p>
                  </div>
                  <Award className="h-8 w-8 text-pink-600" />
                </div>
              </div>
              <div className="p-4 bg-pink-50 rounded-xl border border-pink-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-pink-600">싱싱팀 업무</p>
                    <p className="text-2xl font-bold text-pink-900">35건</p>
                  </div>
                  <Target className="h-8 w-8 text-pink-600" />
                </div>
              </div>
              <div className="p-4 bg-pink-50 rounded-xl border border-pink-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-pink-600">싱싱팀원 수</p>
                    <p className="text-2xl font-bold text-pink-900">3명</p>
                  </div>
                  <Users className="h-8 w-8 text-pink-600" />
                </div>
              </div>
            </div>
          </div>

          {/* 전체 KPI */}
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
              전체 KPI
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600">전체 매출</p>
                    <p className="text-2xl font-bold text-green-900">{formatCurrency(data?.teamKPI?.totalSales || 0)}</p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600">전체 포인트</p>
                    <p className="text-2xl font-bold text-green-900">1,670점</p>
                  </div>
                  <Award className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600">전체 업무</p>
                    <p className="text-2xl font-bold text-green-900">120건</p>
                  </div>
                  <Target className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <div className="p-4 bg-green-50 rounded-xl border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600">전체 팀원 수</p>
                    <p className="text-2xl font-bold text-green-900">{data?.teamKPI?.teamMembers || 0}명</p>
                  </div>
                  <Users className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 빠른 메뉴 */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">빠른 메뉴</h2>
          
          {/* 모든 직원 메뉴 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-6">
            <button 
              onClick={() => router.push('/schedules')}
              className="p-6 bg-blue-50 border-2 border-blue-200 rounded-2xl hover:bg-blue-100 transition-all duration-200 text-left"
            >
              <Calendar className="h-10 w-10 text-blue-600 mb-3" />
              <h3 className="font-bold text-lg text-blue-900 mb-2">근무 스케줄</h3>
              <p className="text-sm text-blue-700">근무 시간 확인 및 관리</p>
            </button>
            
            <button 
              onClick={() => router.push('/salary')}
              className="p-6 bg-green-50 border-2 border-green-200 rounded-2xl hover:bg-green-100 transition-all duration-200 text-left"
            >
              <DollarSign className="h-10 w-10 text-green-600 mb-3" />
              <h3 className="font-bold text-lg text-green-900 mb-2">급여 조회</h3>
              <p className="text-sm text-green-700">급여 및 수당 확인</p>
            </button>
            
            <button 
              onClick={() => router.push('/tasks')}
              className="p-6 bg-yellow-50 border-2 border-yellow-200 rounded-2xl hover:bg-yellow-100 transition-all duration-200 text-left"
            >
              <Target className="h-10 w-10 text-yellow-600 mb-3" />
              <h3 className="font-bold text-lg text-yellow-900 mb-2">업무 추가</h3>
              <p className="text-sm text-yellow-700">빠른 업무 입력 및 기록 관리</p>
            </button>
            
            <button 
              onClick={() => router.push('/organization')}
              className="p-6 bg-purple-50 border-2 border-purple-200 rounded-2xl hover:bg-purple-100 transition-all duration-200 text-left"
            >
              <Users className="h-10 w-10 text-purple-600 mb-3" />
              <h3 className="font-bold text-lg text-purple-900 mb-2">조직도</h3>
              <p className="text-sm text-purple-700">조직 구조 및 팀원 정보</p>
            </button>

            <button 
              onClick={() => router.push('/attendance')}
              className="p-6 bg-indigo-50 border-2 border-indigo-200 rounded-2xl hover:bg-indigo-100 transition-all duration-200 text-left"
            >
              <Clock className="h-10 w-10 text-indigo-600 mb-3" />
              <h3 className="font-bold text-lg text-indigo-900 mb-2">출근 체크</h3>
              <p className="text-sm text-indigo-700">출근 체크 및 근무 기록</p>
            </button>
            
                  <button
              onClick={() => router.push('/profile')}
              className="p-6 bg-pink-50 border-2 border-pink-200 rounded-2xl hover:bg-pink-100 transition-all duration-200 text-left"
            >
              <User className="h-10 w-10 text-pink-600 mb-3" />
              <h3 className="font-bold text-lg text-pink-900 mb-2">개인정보 관리</h3>
              <p className="text-sm text-pink-700">프로필 및 설정 관리</p>
                  </button>
          </div>

          {/* 관리자 전용 메뉴 */}
          {(data?.employee?.role_id === 'admin' || data?.employee?.role?.name === 'admin') && (
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <Award className="h-6 w-6 mr-3 text-indigo-600" />
                관리자 전용 기능
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <button 
                  onClick={() => router.push('/admin/system-settings')}
                  className="p-6 bg-gray-50 border-2 border-gray-200 rounded-2xl hover:bg-gray-100 transition-all duration-200 text-left"
                >
                  <Settings className="h-10 w-10 text-gray-600 mb-3" />
                  <h3 className="font-bold text-lg text-gray-900 mb-2">시스템 설정</h3>
                  <p className="text-sm text-gray-700">시스템 전반 설정 관리</p>
                </button>
                <button 
                  onClick={() => router.push('/admin/employee-migration')}
                  className="p-6 bg-red-50 border-2 border-red-200 rounded-2xl hover:bg-red-100 transition-all duration-200 text-left"
                >
                  <UserPlus className="h-10 w-10 text-red-600 mb-3" />
                  <h3 className="font-bold text-lg text-red-900 mb-2">직원 데이터 관리</h3>
                  <p className="text-sm text-red-700">직원 데이터 마이그레이션</p>
                </button>
                <button 
                  onClick={() => router.push('/admin/department-management')}
                  className="p-6 bg-purple-50 border-2 border-purple-200 rounded-2xl hover:bg-purple-100 transition-all duration-200 text-left"
                >
                  <Building2 className="h-10 w-10 text-purple-600 mb-3" />
                  <h3 className="font-bold text-lg text-purple-900 mb-2">부서 관리</h3>
                  <p className="text-sm text-purple-700">부서 추가/수정/삭제</p>
                </button>
                <button 
                  onClick={() => router.push('/admin/employee-schedules')}
                  className="p-6 bg-teal-50 border-2 border-teal-200 rounded-2xl hover:bg-teal-100 transition-all duration-200 text-left"
                >
                  <Calendar className="h-10 w-10 text-teal-600 mb-3" />
                  <h3 className="font-bold text-lg text-teal-900 mb-2">직원별 스케줄 관리</h3>
                  <p className="text-sm text-teal-700">모든 직원의 스케줄 관리</p>
                </button>
                
                <button 
                  onClick={() => router.push('/admin/hourly-wages')}
                  className="p-6 bg-yellow-50 border-2 border-yellow-200 rounded-2xl hover:bg-yellow-100 transition-all duration-200 text-left"
                >
                  <DollarSign className="h-10 w-10 text-yellow-600 mb-3" />
                  <h3 className="font-bold text-lg text-yellow-900 mb-2">시급 관리</h3>
                  <p className="text-sm text-yellow-700">직원별 시급 및 가중치 설정</p>
                </button>
                
                <button 
                  onClick={() => router.push('/admin/insert-attendance')}
                  className="p-6 bg-pink-50 border-2 border-pink-200 rounded-2xl hover:bg-pink-100 transition-all duration-200 text-left"
                >
                  <Clock className="h-10 w-10 text-pink-600 mb-3" />
                  <h3 className="font-bold text-lg text-pink-900 mb-2">출근 데이터 입력</h3>
                  <p className="text-sm text-pink-700">정확한 출근 데이터 수동 입력</p>
                </button>
          </div>
        </div>
          )}

          {/* 관리자 + 매니저 메뉴 */}
          {((data?.employee?.role_id === 'admin' || data?.employee?.role?.name === 'admin') ||
            (data?.employee?.role_id === 'manager' || data?.employee?.role?.name === 'manager')) && (
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <Award className="h-6 w-6 mr-3 text-blue-600" />
                관리자 + 매니저 기능
            </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <button 
                onClick={() => router.push('/admin/hr-policy')}
                  className="p-6 bg-indigo-50 border-2 border-indigo-200 rounded-2xl hover:bg-indigo-100 transition-all duration-200 text-left"
              >
                  <Award className="h-10 w-10 text-indigo-600 mb-3" />
                  <h3 className="font-bold text-lg text-indigo-900 mb-2">인사정책 관리</h3>
                <p className="text-sm text-indigo-700">성과급 체계 및 KPI 관리</p>
              </button>
              <button 
                onClick={() => router.push('/admin/team-management')}
                  className="p-6 bg-orange-50 border-2 border-orange-200 rounded-2xl hover:bg-orange-100 transition-all duration-200 text-left"
              >
                  <Users className="h-10 w-10 text-orange-600 mb-3" />
                  <h3 className="font-bold text-lg text-orange-900 mb-2">OP 팀장 설정</h3>
                <p className="text-sm text-orange-700">팀장 지정 및 팀 구조 관리</p>
              </button>
              <button 
                onClick={() => router.push('/admin/employee-management')}
                  className="p-6 bg-blue-50 border-2 border-blue-200 rounded-2xl hover:bg-blue-100 transition-all duration-200 text-left"
              >
                  <UserPlus className="h-10 w-10 text-blue-600 mb-3" />
                  <h3 className="font-bold text-lg text-blue-900 mb-2">직원 관리</h3>
                <p className="text-sm text-blue-700">직원 정보 및 권한 관리</p>
              </button>
              </div>
          </div>
        )}

          {/* 관리자 + 매니저 + 팀장 메뉴 */}
          {((data?.employee?.role_id === 'admin' || data?.employee?.role?.name === 'admin') ||
            (data?.employee?.role_id === 'manager' || data?.employee?.role?.name === 'manager') ||
            (data?.employee?.role_id === 'team_lead' || data?.employee?.role?.name === 'team_lead')) && (
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <Users className="h-6 w-6 mr-3 text-green-600" />
                팀 관리 기능
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={() => router.push('/admin/team-evaluation')}
                  className="p-6 bg-green-50 border-2 border-green-200 rounded-2xl hover:bg-green-100 transition-all duration-200 text-left"
              >
                  <Users className="h-10 w-10 text-green-600 mb-3" />
                  <h3 className="font-bold text-lg text-green-900 mb-2">팀원 평가</h3>
                <p className="text-sm text-green-700">팀원 KPI 측정 및 평가</p>
              </button>
              <button 
                onClick={() => router.push('/admin/attendance-management')}
                  className="p-6 bg-purple-50 border-2 border-purple-200 rounded-2xl hover:bg-purple-100 transition-all duration-200 text-left"
                >
                  <Clock className="h-10 w-10 text-purple-600 mb-3" />
                  <h3 className="font-bold text-lg text-purple-900 mb-2">출근 관리</h3>
                  <p className="text-sm text-purple-700">직원 출근체크 위치/시간 확인</p>
              </button>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}
