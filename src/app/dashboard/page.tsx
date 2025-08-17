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
    
    // 실시간 시계
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const loadDashboardData = async () => {
    try {
      const employee = await auth.getCurrentUser();
      if (!employee) {
        router.push('/login');
        return;
      }

      // 더미 데이터 (실제로는 DB에서 가져옴)
      setData({
        employee,
        todaySchedule: null, // 임시로 null 설정
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

      setNotifications([]); // 임시로 빈 배열 설정
    } catch (error) {
      console.error('대시보드 데이터 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    if (!data?.employee) return;
    
    try {
      // 위치 정보 가져오기 (선택적)
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">대시보드 로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단바 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-indigo-600">MASLABS</h1>
              <span className="ml-4 text-sm text-gray-500">직원 대시보드</span>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* 실시간 시계 */}
              <div className="text-sm text-gray-600">
                {formatDateKR(currentTime)} {formatTimeKR(currentTime)}
              </div>
              
              {/* 알림 */}
              <button className="relative p-2 text-gray-600 hover:text-gray-900">
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
                )}
              </button>
              
              {/* 프로필 */}
              <div className="flex items-center">
                <span className="text-sm text-gray-700 mr-2">
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 오늘의 미션 */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 text-white mb-8">
          <h2 className="text-2xl font-bold mb-4">오늘의 미션</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="bg-white/20 rounded-lg p-3">
                <Target className="h-8 w-8 mx-auto mb-2" />
                <p className="font-semibold">긍정적 사고</p>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-white/20 rounded-lg p-3">
                <Award className="h-8 w-8 mx-auto mb-2" />
                <p className="font-semibold">창의적 열정</p>
              </div>
            </div>
            <div className="text-center">
              <div className="bg-white/20 rounded-lg p-3">
                <Users className="h-8 w-8 mx-auto mb-2" />
                <p className="font-semibold">헌신</p>
              </div>
            </div>
          </div>
        </div>

        {/* 출퇴근 체크 */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">근무 상태</h3>
          <div className="flex items-center justify-between">
            <div>
              {data?.todaySchedule ? (
                <div>
                  <p className="text-sm text-gray-600">
                    출근: {data.todaySchedule.actual_start ? formatTimeKR(data.todaySchedule.actual_start) : '-'}
                  </p>
                  <p className="text-sm text-gray-600">
                    퇴근: {data.todaySchedule.actual_end ? formatTimeKR(data.todaySchedule.actual_end) : '-'}
                  </p>
                </div>
              ) : (
                <p className="text-gray-600">오늘 근무 예정 없음</p>
              )}
            </div>
            <div className="space-x-2">
              {!data?.todaySchedule?.actual_start && (
                <button
                  onClick={handleCheckIn}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  출근 체크
                </button>
              )}
              {data?.todaySchedule?.actual_start && !data?.todaySchedule?.actual_end && (
                <button
                  onClick={handleCheckOut}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  퇴근 체크
                </button>
              )}
            </div>
          </div>
        </div>

        {/* KPI 하이라이트 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">오늘의 매출</span>
              <DollarSign className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold">{formatCurrency(950000)}</p>
            <p className="text-sm text-green-600 mt-2">
              <ChevronUp className="inline h-4 w-4" />
              전일 대비 +15%
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">월 누적 매출</span>
              <TrendingUp className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold">{formatCurrency(data?.monthlyStats.totalSales || 0)}</p>
            <p className="text-sm text-gray-600 mt-2">
              목표: {formatCurrency(6000000)}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">신규 상담</span>
              <Phone className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold">{data?.monthlyStats.newConsultations || 0}건</p>
            <p className="text-sm text-blue-600 mt-2">
              이번 달 목표: 20건
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">목표 달성률</span>
              <Target className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold">{data?.monthlyStats.targetAchievement || 0}%</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div 
                className="bg-indigo-600 h-2 rounded-full"
                style={{ width: `${data?.monthlyStats.targetAchievement || 0}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* 개인 KPI와 팀 KPI */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 개인 KPI */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Briefcase className="h-5 w-5 mr-2" />
              개인 KPI
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">전화 판매 건수</span>
                <span className="font-semibold">{data?.personalKPI.phoneSales}건</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">오프라인 시타 만족도</span>
                <span className="font-semibold">{data?.personalKPI.offlineSatisfaction}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">온라인 판매 성사</span>
                <span className="font-semibold">{data?.personalKPI.onlineSales}건</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">콘텐츠 조회수</span>
                <span className="font-semibold">{data?.personalKPI.contentViews?.toLocaleString()}회</span>
              </div>
            </div>
          </div>

          {/* 팀 KPI */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Users className="h-5 w-5 mr-2" />
              팀 KPI
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">OP팀 전체 매출</span>
                <span className="font-semibold">{formatCurrency(data?.teamKPI.totalSales || 0)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">YOY 성장률</span>
                <span className="font-semibold text-green-600">+{data?.teamKPI.yoyGrowth}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">팀 목표 달성률</span>
                <span className="font-semibold">{data?.teamKPI.targetAchievement}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">팀원 수</span>
                <span className="font-semibold">{data?.teamKPI.teamMembers}명</span>
              </div>
            </div>
          </div>
        </div>

        {/* 권한 기반 빠른 메뉴 */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">빠른 메뉴</h3>
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
                    className="bg-white rounded-lg shadow p-4 hover:shadow-lg transition-shadow text-center"
                  >
                    {IconComponent && (
                      <IconComponent className={`h-8 w-8 mx-auto mb-2 ${iconColors[menu.icon] || 'text-gray-600'}`} />
                    )}
                    <span className="text-sm font-medium">{menu.name}</span>
                  </button>
                );
              })}
          </div>
        </div>

        {/* 관리자 메뉴 (개발 중 - 모든 사용자에게 표시) */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Award className="h-5 w-5 mr-2" />
            관리자 기능 (개발 모드)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button 
              onClick={() => router.push('/admin/hr-policy')}
              className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <Award className="h-8 w-8 text-indigo-600 mb-2" />
              <h3 className="font-semibold text-indigo-900">인사정책 관리</h3>
              <p className="text-sm text-indigo-700">성과급 체계 및 KPI 관리</p>
            </button>
            <button 
              onClick={() => router.push('/admin/team-management')}
              className="p-4 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <Users className="h-8 w-8 text-orange-600 mb-2" />
              <h3 className="font-semibold text-orange-900">OP 팀장 설정</h3>
              <p className="text-sm text-orange-700">팀장 지정 및 팀 구조 관리</p>
            </button>
            <button 
              onClick={() => router.push('/admin/employee-management')}
              className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <UserPlus className="h-8 w-8 text-blue-600 mb-2" />
              <h3 className="font-semibold text-blue-900">직원 관리</h3>
              <p className="text-sm text-blue-700">직원 정보 및 권한 관리</p>
            </button>
            <button 
              onClick={() => router.push('/admin/team-evaluation')}
              className="p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
            >
              <Users className="h-8 w-8 text-green-600 mb-2" />
              <h3 className="font-semibold text-green-900">팀원 평가</h3>
              <p className="text-sm text-green-700">팀원 KPI 측정 및 평가</p>
            </button>
            <button 
              onClick={() => router.push('/admin/attendance-management')}
              className="p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <Clock className="h-8 w-8 text-purple-600 mb-2" />
              <h3 className="font-semibold text-purple-900">출근 관리</h3>
              <p className="text-sm text-purple-700">직원 출근체크 위치/시간 확인</p>
            </button>
            <button 
              onClick={() => router.push('/admin/system-settings')}
              className="p-4 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Settings className="h-8 w-8 text-gray-600 mb-2" />
              <h3 className="font-semibold text-gray-900">시스템 설정</h3>
              <p className="text-sm text-gray-700">시스템 전반 설정 관리</p>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
