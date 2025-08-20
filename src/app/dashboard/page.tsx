'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/supabase';
import { getUserAccessibleMenus, canAccessMenu } from '@/lib/permissions';
import { formatCurrency, getStatusColor, formatHours } from '@/utils/formatUtils';
import { formatDateKR, formatTimeKR, isToday } from '@/utils/dateUtils';
import { Building2, 
  TrendingUp, DollarSign, Users, Clock, Calendar, Target,
  Phone, ShoppingCart, Award, BarChart3, LogOut, Bell,
  ChevronUp, ChevronDown, Briefcase, UserPlus, Settings, User
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

    const checkAutoLogout = () => {
      const lastActivity = localStorage.getItem('lastActivity');
      if (lastActivity) {
        const now = Date.now();
        const timeDiff = now - parseInt(lastActivity);
        const fiveMinutes = 5 * 60 * 1000;
        
        if (timeDiff > fiveMinutes) {
          auth.signOut();
          router.push('/login');
          alert('5분간 활동이 없어 자동 로그아웃되었습니다.');
        }
      }
    };

    const autoLogoutTimer = setInterval(checkAutoLogout, 30000);

    const updateActivity = () => {
      localStorage.setItem('lastActivity', Date.now().toString());
    };

    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keypress', updateActivity);
    window.addEventListener('click', updateActivity);
    window.addEventListener('scroll', updateActivity);

    return () => {
      clearInterval(timer);
      clearInterval(autoLogoutTimer);
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keypress', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('scroll', updateActivity);
    };
  }, [router]);

  const loadDashboardData = async () => {
    try {
      const employee = await auth.getCurrentUser();
      if (!employee) {
        router.push('/login');
        return;
      }

      setData({
        employee,
        todaySchedule: null,
        monthlyStats: {
          totalSales: 4080000,
          newConsultations: 12,
          targetAchievement: 68,
          totalWorkHours: 142
        },
        personalKPI: {
          phoneSales: 7,
          offlineSatisfaction: 92,
          onlineSales: 3,
          contentViews: 1840
        },
        teamKPI: {
          totalSales: 35000000,
          yoyGrowth: 12,
          targetAchievement: 78,
          teamMembers: 8
        }
      });

      setNotifications([]);
    } catch (error) {
      console.error('대시보드 데이터 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!data?.employee) return;
    
    try {
      let location;
      if (navigator.geolocation) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
      }

      await db.checkIn(data.employee.id, location);
      loadDashboardData();
    } catch (error) {
      console.error('출근 체크 실패:', error);
    }
  };

  const handleCheckOut = async () => {
    if (!data?.todaySchedule) return;
    
    try {
      await db.checkOut(data.todaySchedule.id);
      loadDashboardData();
    } catch (error) {
      console.error('퇴근 체크 실패:', error);
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* 상단바 */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-indigo-600">MASLABS</h1>
              <span className="ml-4 text-sm text-gray-500">직원 대시보드</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600 font-medium">
                {formatDateKR(currentTime)} {formatTimeKR(currentTime)}
              </div>
              
              <button className="relative p-2 text-gray-600 hover:text-gray-900">
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
                )}
              </button>
              
              <div className="flex items-center">
                <span className="text-sm text-gray-700 mr-2 font-medium">
                  {data?.employee?.name || '직원'}
                </span>
                <button
                  onClick={() => router.push('/profile')}
                  className="p-2 text-gray-600 hover:text-gray-900"
                  title="개인정보 관리"
                >
                  <User className="h-5 w-5" />
                </button>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-600 hover:text-gray-900"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 오늘의 미션 - MAS Golf 스타일 큰 카드 */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white mb-6">
          <h2 className="text-2xl font-bold mb-6 text-center">오늘의 미션</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/20 rounded-xl p-4 text-center">
              <Target className="h-10 w-10 mx-auto mb-3" />
              <p className="font-semibold text-lg">긍정적 사고</p>
              <p className="text-sm opacity-90">일관된 스윙, 정확한 타구</p>
            </div>
            <div className="bg-white/20 rounded-xl p-4 text-center">
              <Award className="h-10 w-10 mx-auto mb-3" />
              <p className="font-semibold text-lg">창의적 열정</p>
              <p className="text-sm opacity-90">강력한 임팩트, 긴 비거리</p>
            </div>
            <div className="bg-white/20 rounded-xl p-4 text-center">
              <Users className="h-10 w-10 mx-auto mb-3" />
              <p className="font-semibold text-lg">헌신</p>
              <p className="text-sm opacity-90">균형잡힌 플레이</p>
            </div>
          </div>
        </div>

        {/* 출퇴근 체크 - MAS Golf 스타일 큰 버튼 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="text-xl font-bold mb-4 text-gray-800">근무 상태</h3>
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <div className="text-center sm:text-left">
              {data?.todaySchedule ? (
                <div className="space-y-1">
                  <p className="text-sm text-gray-600">
                    출근: {data.todaySchedule.actual_start ? formatTimeKR(data.todaySchedule.actual_start) : '-'}
                  </p>
                  <p className="text-sm text-gray-600">
                    퇴근: {data.todaySchedule.actual_end ? formatTimeKR(data.todaySchedule.actual_end) : '-'}
                  </p>
                </div>
              ) : (
                <p className="text-gray-600 font-medium">오늘 근무 예정 없음</p>
              )}
            </div>
            <div className="space-x-3">
              {!data?.todaySchedule?.actual_start && (
                <button
                  onClick={handleCheckIn}
                  className="bg-green-600 text-white px-8 py-3 rounded-xl font-semibold text-lg hover:bg-green-700 transition-all duration-200 shadow-lg"
                >
                  출근 체크
                </button>
              )}
              {data?.todaySchedule?.actual_start && !data?.todaySchedule?.actual_end && (
                <button
                  onClick={handleCheckOut}
                  className="bg-red-600 text-white px-8 py-3 rounded-xl font-semibold text-lg hover:bg-red-700 transition-all duration-200 shadow-lg"
                >
                  퇴근 체크
                </button>
              )}
            </div>
          </div>
        </div>

        {/* KPI 하이라이트 - MAS Golf 스타일 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600 font-medium">오늘의 매출</span>
              <DollarSign className="h-6 w-6 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-gray-800">{formatCurrency(950000)}</p>
            <p className="text-sm text-green-600 mt-2 font-medium">
              <ChevronUp className="inline h-4 w-4" />
              전일 대비 +15%
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600 font-medium">월 누적 매출</span>
              <TrendingUp className="h-6 w-6 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-gray-800">{formatCurrency(data?.monthlyStats.totalSales || 0)}</p>
            <p className="text-sm text-gray-600 mt-2 font-medium">
              목표: {formatCurrency(6000000)}
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600 font-medium">신규 상담</span>
              <Phone className="h-6 w-6 text-purple-500" />
            </div>
            <p className="text-3xl font-bold text-gray-800">{data?.monthlyStats.newConsultations || 0}건</p>
            <p className="text-sm text-blue-600 mt-2 font-medium">
              이번 달 목표: 20건
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600 font-medium">목표 달성률</span>
              <Target className="h-6 w-6 text-indigo-500" />
            </div>
            <p className="text-3xl font-bold text-gray-800">{data?.monthlyStats.targetAchievement || 0}%</p>
            <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
              <div 
                className="bg-indigo-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${data?.monthlyStats.targetAchievement || 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* 개인 KPI와 팀 KPI - MAS Golf 스타일 카드 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
              <Briefcase className="h-6 w-6 mr-3 text-indigo-600" />
              개인 KPI
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700 font-medium">전화 판매 건수</span>
                <span className="font-bold text-lg text-indigo-600">{data?.personalKPI.phoneSales}건</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700 font-medium">오프라인 시타 만족도</span>
                <span className="font-bold text-lg text-green-600">{data?.personalKPI.offlineSatisfaction}%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700 font-medium">온라인 판매 성사</span>
                <span className="font-bold text-lg text-purple-600">{data?.personalKPI.onlineSales}건</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700 font-medium">콘텐츠 조회수</span>
                <span className="font-bold text-lg text-blue-600">{data?.personalKPI.contentViews?.toLocaleString()}회</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
              <Users className="h-6 w-6 mr-3 text-green-600" />
              팀 KPI
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700 font-medium">OP팀 전체 매출</span>
                <span className="font-bold text-lg text-green-600">{formatCurrency(data?.teamKPI.totalSales || 0)}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700 font-medium">YOY 성장률</span>
                <span className="font-bold text-lg text-green-600">+{data?.teamKPI.yoyGrowth}%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700 font-medium">팀 목표 달성률</span>
                <span className="font-bold text-lg text-blue-600">{data?.teamKPI.targetAchievement}%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-700 font-medium">팀원 수</span>
                <span className="font-bold text-lg text-purple-600">{data?.teamKPI.teamMembers}명</span>
              </div>
            </div>
          </div>
        </div>

        {/* 빠른 메뉴 - MAS Golf 스타일 큰 버튼 */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">빠른 메뉴</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {getUserAccessibleMenus(data?.employee?.role_id || 'employee')
              .filter(menu => ['/schedules', '/salary', '/tasks', '/organization'].includes(menu.path))
              .map((menu) => {
                const iconMap = {
                  Calendar,
                  DollarSign,
                  BarChart3,
                  Users
                };
                const IconComponent = iconMap[menu.icon as keyof typeof iconMap];
                
                const iconColors: Record<string, string> = {
                  Calendar: 'text-indigo-600',
                  DollarSign: 'text-green-600',
                  BarChart3: 'text-purple-600',
                  Users: 'text-orange-600'
                };
                
                return (
                  <button
                    key={menu.path}
                    onClick={() => router.push(menu.path)}
                    className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-200 text-center border border-gray-100"
                  >
                    {IconComponent && (
                      <IconComponent className={`h-10 w-10 mx-auto mb-3 ${iconColors[menu.icon] || 'text-gray-600'}`} />
                    )}
                    <span className="text-sm font-semibold text-gray-800">{menu.name}</span>
                  </button>
                );
              })}
          </div>
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
              <button onClick={() => router.push('/admin/department-management')} className="p-6 bg-purple-50 border-2 border-purple-200 rounded-2xl hover:bg-purple-100 transition-all duration-200 text-left">
                <Building2 className="h-10 w-10 text-purple-600 mb-3" />
                <h3 className="font-bold text-lg text-purple-900 mb-2">부서 관리</h3>
                <p className="text-sm text-purple-700">부서 추가/수정/삭제</p>
              </button>
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
                  <button onClick={() => router.push('/admin/department-management')} className="bg-white hover:bg-gray-50 p-6 rounded-2xl shadow-lg transition-all duration-200 transform hover:scale-105 border border-gray-200">
                    <Building2 className="h-10 w-10 text-purple-600 mb-3" />
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

        {/* 팀장 메뉴 - MAS Golf 스타일 큰 버튼 */}
        {(data?.employee?.role_id === 'team_lead' || data?.employee?.role?.name === 'team_lead') && (
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <Users className="h-6 w-6 mr-3 text-green-600" />
              팀장 기능
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
                <p className="text-sm text-purple-700">팀원 출근체크 확인</p>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
