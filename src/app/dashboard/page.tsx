'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/supabase';
import { getUserAccessibleMenus, canAccessMenu } from '@/lib/permissions';

import { formatCurrency, getStatusColor, formatHours } from '@/utils/formatUtils';

import { formatDateKR, formatTimeKR, isToday } from '@/utils/dateUtils';

import { 
  TrendingUp, DollarSign, Users, Clock, Calendar, Target,
  Phone, ShoppingCart, Award, BarChart3, LogOut, Bell,
  ChevronUp, ChevronDown, Briefcase, UserPlus, Settings, User, Building2
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
    offlineSatisfaction: number;
    onlineSales: number;
    contentViews: number;
  };
  teamKPI: {
    totalSales: number;
    yoyGrowth: number;
    targetAchievement: number;
    teamMembers: number;
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [data, setData] = useState<DashboardData | null>(null);
  const [notifications, setNotifications] = useState<any[]>([]);

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
      
      // 현재 로그인한 사용자 정보 가져오기
      const currentUser = await auth.getCurrentUser();
      
      if (!currentUser) {
        router.push("/login");
        return;
      }
      
      if (!currentUser) {
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

      if (employeeError) throw employeeError;

      // 오늘의 스케줄 가져오기
      const today = new Date().toISOString().split('T')[0];
      const { data: scheduleData } = await supabase
        .from('schedules')
        .select('*')
        .eq('employee_id', currentUser.id)
        .eq('schedule_date', today)
        .single();

      // 월간 통계 (더미 데이터)
      const monthlyStats = {
        totalSales: 12500000,
        newConsultations: 45,
        targetAchievement: 87,
        totalWorkHours: 168
      };

      // 개인 KPI (더미 데이터)
      const personalKPI = {
        phoneSales: 12,
        offlineSatisfaction: 4.8,
        onlineSales: 8,
        contentViews: 1840
      };

      // 팀 KPI (더미 데이터)
      const teamKPI = {
        totalSales: 45000000,
        yoyGrowth: 15.2,
        targetAchievement: 92,
        teamMembers: 8
      };

      setData({
        employee: employeeData,
        todaySchedule: scheduleData,
        monthlyStats,
        personalKPI,
        teamKPI
      });

    } catch (error) {
      console.error('대시보드 데이터 로드 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
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
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">MASLABS 대시보드</h1>
              <p className="text-gray-600">
                {formatDateKR(currentTime)} {formatTimeKR(currentTime)}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">안녕하세요,</p>
                <p className="font-semibold text-gray-900">
                  {data?.employee?.nickname || data?.employee?.name}님
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-600 hover:text-red-600 transition-colors"
              >
                <LogOut className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* 상단 통계 카드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">콘텐츠 조회수</p>
                  <p className="text-2xl font-bold">{formatCurrency(data?.personalKPI?.contentViews || 0)}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">팀원 수</p>
                  <p className="text-2xl font-bold">{data?.teamKPI?.teamMembers || 0}명</p>
                </div>
                <Users className="h-8 w-8 text-green-200" />
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
              <h3 className="font-bold text-lg text-yellow-900 mb-2">업무 기록</h3>
              <p className="text-sm text-yellow-700">일일 업무 및 성과 기록</p>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

        {/* 알림 섹션 */}
        {notifications.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <Bell className="h-5 w-5 mr-2 text-yellow-600" />
              최근 알림
            </h3>
            <div className="space-y-3">
              {notifications.slice(0, 3).map((notification, index) => (
                <div key={index} className="flex items-center p-3 bg-yellow-50 rounded-lg">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mr-3"></div>
                  <p className="text-sm text-gray-700">{notification.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
