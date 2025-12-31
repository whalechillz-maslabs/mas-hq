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
  Star, TrendingDown, CheckCircle, AlertCircle, Trophy, Zap, Menu, FileText, Calculator,
  Package, Eye, Siren, CheckSquare, Edit, X, CalendarDays
} from 'lucide-react';

interface SharedTask {
  id: string;
  title: string;
  notes?: string;
  customer_name?: string;
  task_date: string;
  created_at: string;
  task_priority?: string;
  achievement_status?: string;
  sita_booking?: boolean;
  visit_booking_date?: string;
  visit_booking_time?: string;
  operation_type?: {
    code: string;
    name: string;
    points: number;
  };
  employee?: {
    name: string;
    employee_id: string;
  };
}

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
    storeSales: number;
    csResponse: number;
    visitBookings: number;
    masgolfPoints: number;
    masgolfCount: number;
    singsingolfPoints: number;
    singsingolfCount: number;
    totalPoints: number;
    totalTasks: number;
  };
  teamKPI: {
    totalSales: number;
    yoyGrowth: number | string;
    targetAchievement: number | string;
    teamMembers: number;
  };
  collaborationStats: {
    masgolf: {
      sales: number;
      points: number;
      tasks: number;
      participants: number;
      newConsultations: number; // 신규 상담 건수 추가
      sitaBookings: number; // 시타 예약 건수 추가
    };
    singsingolf: {
      sales: number;
      points: number;
      tasks: number;
      participants: number;
      newConsultations: number; // 신규 상담 건수 추가
      sitaBookings: number; // 시타 예약 건수 추가
    };
    total: {
      sales: number;
      points: number;
      tasks: number;
      newConsultations: number; // 신규 상담 건수 추가
      sitaBookings: number; // 시타 예약 건수 추가
    };
  };
  recentSharedTasks: SharedTask[]; // 최근 공유 업무 추가
  myTasks: SharedTask[]; // 내 업무 추가
  teamRankings?: {
    sales: { name: string; sales: number; points: number; tasks: number }[];
    points: { name: string; sales: number; points: number; tasks: number }[];
    tasks: { name: string; sales: number; points: number; tasks: number }[];
  } | null;
  todaySales: number;
  todayPoints: number;
  weeklySales: number;
  weeklyPoints: number;
  weeklyTaskCount: number;
}

export default function DashboardPage() {
  console.log('=== Dashboard 컴포넌트 렌더링 시작 ===');
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [data, setData] = useState<DashboardData | null>(null);
  
  console.log('Dashboard 컴포넌트 상태:', { data: !!data, loading, currentTime });
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showAllSharedTasks, setShowAllSharedTasks] = useState(false);
  const [activePriorityTab, setActivePriorityTab] = useState<'urgent' | 'high' | 'normal' | 'low' | 'my'>('urgent');
  const [expandedTabs, setExpandedTabs] = useState<{[key: string]: boolean}>({
    urgent: false,
    high: false,
    normal: false,
    low: false,
    my: false
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState<SharedTask | null>(null);
  const [readTasks, setReadTasks] = useState<Set<string>>(new Set());
  const [showUrgentTasks, setShowUrgentTasks] = useState(false);
  const [showSalesDetailModal, setShowSalesDetailModal] = useState(false);
  const [showMarketingDetailModal, setShowMarketingDetailModal] = useState(false);
  const [salesDetailData, setSalesDetailData] = useState<any>(null);
  const [marketingDetailData, setMarketingDetailData] = useState<any>(null);
  const [selectedMarketingBrand, setSelectedMarketingBrand] = useState<'masgolf' | 'singsingolf' | 'all'>('all');
  const [leaveBalance, setLeaveBalance] = useState<any>(null);
  const [welfareLeaves, setWelfareLeaves] = useState<any[]>([]);
  const [specialWorks, setSpecialWorks] = useState<any[]>([]);

  useEffect(() => {
    console.log('=== useEffect 훅 실행 ===');
    console.log('loadDashboardData 함수 호출 시작');
    loadDashboardData();
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    // 자동 리로드 기능 제거됨

    return () => {
      clearInterval(timer);
    };
  }, []);

  // 매출 상세 데이터 가져오기
  const loadSalesDetailData = async (period: 'today' | 'week' | 'month' | 'quarter' | 'year' = 'month') => {
    try {
      let startDate, endDate;
      const today = new Date();
      const koreaOffset = 9 * 60; // UTC+9 (분 단위)
      const koreaTime = new Date(today.getTime() + (koreaOffset * 60 * 1000));
      
      if (period === 'today') {
        // 오늘 날짜만
        const year = koreaTime.getUTCFullYear();
        const month = koreaTime.getUTCMonth();
        const day = koreaTime.getUTCDate();
        startDate = new Date(Date.UTC(year, month, day));
        endDate = new Date(Date.UTC(year, month, day));
      } else if (period === 'week') {
        // 이번 주 (월요일 ~ 일요일)
        const dayOfWeek = koreaTime.getUTCDay(); // 0 (일요일) ~ 6 (토요일)
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // 월요일까지의 일수
        const year = koreaTime.getUTCFullYear();
        const month = koreaTime.getUTCMonth();
        const day = koreaTime.getUTCDate();
        const monday = new Date(Date.UTC(year, month, day + mondayOffset));
        startDate = monday;
        endDate = new Date(Date.UTC(year, month, day)); // 오늘까지
      } else if (period === 'month') {
        // 한국 시간 기준으로 이번 달 1일부터 마지막 날까지 계산
        const year = koreaTime.getUTCFullYear();
        const month = koreaTime.getUTCMonth();
        startDate = new Date(Date.UTC(year, month, 1));
        endDate = new Date(Date.UTC(year, month + 1, 0));
      } else if (period === 'quarter') {
        const quarter = Math.floor(koreaTime.getUTCMonth() / 3);
        startDate = new Date(Date.UTC(koreaTime.getUTCFullYear(), quarter * 3, 1));
        endDate = new Date(Date.UTC(koreaTime.getUTCFullYear(), quarter * 3 + 3, 0));
      } else {
        startDate = new Date(Date.UTC(koreaTime.getUTCFullYear(), 0, 1));
        endDate = new Date(Date.UTC(koreaTime.getUTCFullYear(), 11, 31));
      }

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      // 모든 팀원의 매출 데이터 가져오기
      const { data: allTasks } = await supabase
        .from('employee_tasks')
        .select(`
          *,
          operation_type:operation_types(code, name, points),
          employee:employees(name, employee_id)
        `)
        .gte('task_date', startDateStr)
        .lte('task_date', endDateStr)
        .not('sales_amount', 'is', null)
        .gt('sales_amount', 0);

      if (!allTasks) return null;

      // 고객별 매출 분석
      const customerSales: { [key: string]: { name: string, total: number, count: number, tasks: any[] } } = {};
      
      // 업무 유형별 매출 분석
      const operationSales: { [key: string]: { code: string, name: string, total: number, count: number } } = {};
      
      // 직원별 매출 분석
      const employeeSales: { [key: string]: { name: string, total: number, count: number } } = {};

      allTasks.forEach(task => {
        const customerName = task.customer_name || '고객명 없음';
        const operationCode = task.operation_type?.code || 'Unknown';
        const operationName = task.operation_type?.name || 'Unknown';
        const employeeName = task.employee?.name || '알 수 없음';
        const salesAmount = task.sales_amount || 0;

        // 고객별 집계
        if (!customerSales[customerName]) {
          customerSales[customerName] = { name: customerName, total: 0, count: 0, tasks: [] };
        }
        customerSales[customerName].total += salesAmount;
        customerSales[customerName].count += 1;
        customerSales[customerName].tasks.push(task);

        // 업무 유형별 집계
        if (!operationSales[operationCode]) {
          operationSales[operationCode] = { code: operationCode, name: operationName, total: 0, count: 0 };
        }
        operationSales[operationCode].total += salesAmount;
        operationSales[operationCode].count += 1;

        // 직원별 집계
        if (!employeeSales[employeeName]) {
          employeeSales[employeeName] = { name: employeeName, total: 0, count: 0 };
        }
        employeeSales[employeeName].total += salesAmount;
        employeeSales[employeeName].count += 1;
      });

      // 정렬
      const sortedCustomerSales = Object.values(customerSales)
        .sort((a, b) => b.total - a.total);
      
      const sortedOperationSales = Object.values(operationSales)
        .sort((a, b) => b.total - a.total);
      
      const sortedEmployeeSales = Object.values(employeeSales)
        .sort((a, b) => b.total - a.total);

      return {
        period,
        startDate: startDateStr,
        endDate: endDateStr,
        totalSales: allTasks.reduce((sum, task) => sum + (task.sales_amount || 0), 0),
        totalTasks: allTasks.length,
        customerSales: sortedCustomerSales,
        operationSales: sortedOperationSales,
        employeeSales: sortedEmployeeSales,
        rawTasks: allTasks
      };
    } catch (error) {
      console.error('매출 상세 데이터 로딩 오류:', error);
      return null;
    }
  };

  // 마케팅 유입 상세 데이터 가져오기
  const loadMarketingDetailData = async (period: 'today' | 'week' | 'month' | 'quarter' | 'year' = 'month', brand: 'masgolf' | 'singsingolf' | 'all' = 'all') => {
    try {
      let startDate, endDate;
      const today = new Date();
      const koreaOffset = 9 * 60; // UTC+9 (분 단위)
      const koreaTime = new Date(today.getTime() + (koreaOffset * 60 * 1000));
      
      if (period === 'today') {
        // 오늘 날짜만
        const year = koreaTime.getUTCFullYear();
        const month = koreaTime.getUTCMonth();
        const day = koreaTime.getUTCDate();
        startDate = new Date(Date.UTC(year, month, day));
        endDate = new Date(Date.UTC(year, month, day));
      } else if (period === 'week') {
        // 이번 주 (월요일 ~ 일요일)
        const dayOfWeek = koreaTime.getUTCDay(); // 0 (일요일) ~ 6 (토요일)
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // 월요일까지의 일수
        const year = koreaTime.getUTCFullYear();
        const month = koreaTime.getUTCMonth();
        const day = koreaTime.getUTCDate();
        const monday = new Date(Date.UTC(year, month, day + mondayOffset));
        startDate = monday;
        endDate = new Date(Date.UTC(year, month, day)); // 오늘까지
      } else if (period === 'month') {
        // 한국 시간 기준으로 이번 달 1일부터 마지막 날까지 계산
        const year = koreaTime.getUTCFullYear();
        const month = koreaTime.getUTCMonth();
        startDate = new Date(Date.UTC(year, month, 1));
        endDate = new Date(Date.UTC(year, month + 1, 0));
      } else if (period === 'quarter') {
        const quarter = Math.floor(koreaTime.getUTCMonth() / 3);
        startDate = new Date(Date.UTC(koreaTime.getUTCFullYear(), quarter * 3, 1));
        endDate = new Date(Date.UTC(koreaTime.getUTCFullYear(), quarter * 3 + 3, 0));
      } else {
        startDate = new Date(Date.UTC(koreaTime.getUTCFullYear(), 0, 1));
        endDate = new Date(Date.UTC(koreaTime.getUTCFullYear(), 11, 31));
      }

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      console.log('마케팅 상세 데이터 날짜 계산:', {
        today: today.toISOString().split('T')[0],
        period,
        startDate: startDateStr,
        endDate: endDateStr
      });

      // 브랜드별 업무 코드 결정
      let operationCodes = [];
      if (brand === 'masgolf') {
        operationCodes = ['OP5']; // 마스골프 마케팅
      } else if (brand === 'singsingolf') {
        operationCodes = ['OP12']; // 싱싱골프 마케팅
      } else {
        operationCodes = ['OP5', 'OP12']; // 전체
      }

      // 해당 브랜드의 마케팅 업무 가져오기
      const { data: marketingTasks } = await supabase
        .from('employee_tasks')
        .select(`
          *,
          operation_type:operation_types(code, name, points),
          employee:employees(name, employee_id)
        `)
        .in('operation_type_id', 
          (await supabase.from('operation_types').select('id').in('code', operationCodes)).data?.map(op => op.id) || []
        )
        .gte('task_date', startDateStr)
        .lte('task_date', endDateStr);

      if (!marketingTasks) return null;

      // 채널별 분석
      const channelAnalysis: { [key: string]: { new: number, existing: number, total: number } } = {
        phone: { new: 0, existing: 0, total: 0 },
        kakao: { new: 0, existing: 0, total: 0 },
        smartstore: { new: 0, existing: 0, total: 0 },
        official_website: { new: 0, existing: 0, total: 0 }
      };

      // 고객 유형별 분석
      const customerTypeAnalysis = {
        new: { total: 0, sales: 0, tasks: [] as any[] },
        existing: { total: 0, sales: 0, tasks: [] as any[] }
      };

      marketingTasks.forEach(task => {
        const channel = task.consultation_channel || 'unknown';
        const customerType = task.customer_type || 'unknown';
        const salesAmount = task.sales_amount || 0;

        // 채널별 분석
        if (channelAnalysis[channel]) {
          channelAnalysis[channel].total += 1;
          if (customerType === 'new') {
            channelAnalysis[channel].new += 1;
          } else if (customerType === 'existing') {
            channelAnalysis[channel].existing += 1;
          }
        }

        // 고객 유형별 분석
        if (customerType === 'new') {
          customerTypeAnalysis.new.total += 1;
          customerTypeAnalysis.new.sales += salesAmount;
          customerTypeAnalysis.new.tasks.push(task);
        } else if (customerType === 'existing') {
          customerTypeAnalysis.existing.total += 1;
          customerTypeAnalysis.existing.sales += salesAmount;
          customerTypeAnalysis.existing.tasks.push(task);
        }
      });

      // 전환율 계산 (매출이 있는 업무 / 전체 업무)
      const totalTasks = marketingTasks.length;
      const convertedTasks = marketingTasks.filter(task => (task.sales_amount || 0) > 0).length;
      const conversionRate = totalTasks > 0 ? (convertedTasks / totalTasks * 100) : 0;

      return {
        period,
        brand,
        startDate: startDateStr,
        endDate: endDateStr,
        totalTasks,
        convertedTasks,
        conversionRate,
        channelAnalysis,
        customerTypeAnalysis,
        rawTasks: marketingTasks
      };
    } catch (error) {
      console.error('마케팅 상세 데이터 로딩 오류:', error);
      return null;
    }
  };

  // 팀원 순위 계산 함수
  const calculateTeamRankings = async (startDate: string, endDate: string) => {
    try {
      // 모든 팀원의 이번 달 업무 데이터 가져오기
      const { data: allTeamTasks } = await supabase
        .from('employee_tasks')
        .select(`
          *,
          operation_type:operation_types(code, name, points),
          employee:employees(name, employee_id)
        `)
        .gte('created_at', startDate + 'T00:00:00')
        .lte('created_at', endDate + 'T23:59:59');

      if (!allTeamTasks) return null;

      // 직원별로 데이터 그룹화
      const employeeStats: { [key: string]: { name: string, sales: number, points: number, tasks: number } } = {};

      allTeamTasks.forEach(task => {
        const employeeId = task.employee_id;
        const employeeName = task.employee?.name || '알 수 없음';
        
        if (!employeeStats[employeeId]) {
          employeeStats[employeeId] = {
            name: employeeName,
            sales: 0,
            points: 0,
            tasks: 0
          };
        }

        // 매출 합계
        if (task.sales_amount) {
          employeeStats[employeeId].sales += task.sales_amount;
        }

        // 포인트 합계
        if (task.operation_type?.points) {
          employeeStats[employeeId].points += task.operation_type.points;
        }

        // 업무 건수
        employeeStats[employeeId].tasks += 1;
      });

      // 배열로 변환하고 정렬
      const salesRanking = Object.values(employeeStats)
        .sort((a, b) => b.sales - a.sales)
        .slice(0, 3);

      const pointsRanking = Object.values(employeeStats)
        .sort((a, b) => b.points - a.points)
        .slice(0, 3);

      const tasksRanking = Object.values(employeeStats)
        .sort((a, b) => b.tasks - a.tasks)
        .slice(0, 3);

      return {
        sales: salesRanking,
        points: pointsRanking,
        tasks: tasksRanking
      };
    } catch (error) {
      console.error('팀원 순위 계산 오류:', error);
      return null;
    }
  };

  const loadDashboardData = async () => {
    try {
      console.log('=== loadDashboardData 함수 시작 ===');
      setLoading(true);
      
      // 현재 로그인한 사용자 정보 가져오기 (auth.getCurrentUser 사용)
      const currentUser = await auth.getCurrentUser();
      
      console.log('현재 사용자:', currentUser);
      
      if (!currentUser) {
        console.log('사용자 정보가 없습니다. 로그인 페이지로 이동합니다.');
        router.push('/login');
        return;
      }

      // 직원 정보 가져오기 (기본 정보만)
      console.log('직원 정보 조회 시작, 사용자 ID:', currentUser.id);
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      console.log('직원 정보 조회 결과:', { employeeData, employeeError });
      if (employeeError) {
        console.error('직원 정보 조회 오류:', employeeError);
      }

      // 오늘 날짜와 이번 달 날짜 범위 계산
      const today = new Date();
      const koreaOffset = 9 * 60; // UTC+9 (분 단위)
      const koreaTime = new Date(today.getTime() + (koreaOffset * 60 * 1000));
      const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      
      // 이번 주 계산 (월요일 ~ 일요일)
      // 한국 시간 기준으로 날짜 계산
      const koreaYear = koreaTime.getUTCFullYear();
      const koreaMonth = koreaTime.getUTCMonth();
      const koreaDate = koreaTime.getUTCDate();
      const koreaDayOfWeek = koreaTime.getUTCDay(); // 0 (일요일) ~ 6 (토요일)
      const mondayOffset = koreaDayOfWeek === 0 ? -6 : 1 - koreaDayOfWeek; // 월요일까지의 일수
      
      const mondayDate = new Date(Date.UTC(koreaYear, koreaMonth, koreaDate + mondayOffset));
      mondayDate.setUTCHours(0, 0, 0, 0);
      
      const todayStr = today.toISOString().split('T')[0];
      const startOfMonthStr = startOfMonth.toISOString().split('T')[0];
      const endOfMonthStr = endOfMonth.toISOString().split('T')[0];
      const startOfWeekStr = mondayDate.toISOString().split('T')[0];

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

      // 오늘의 업무 데이터 가져오기 (task_date 기준)
      const { data: todayTasks } = await supabase
        .from('employee_tasks')
        .select(`
          *,
          operation_type:operation_types(code, name, points)
        `)
        .eq('task_date', todayStr)
        .eq('employee_id', currentUser.id);

      // 이번 주 업무 데이터 가져오기 (task_date 기준)
      const { data: weeklyTasks } = await supabase
        .from('employee_tasks')
        .select(`
          *,
          operation_type:operation_types(code, name, points)
        `)
        .gte('task_date', startOfWeekStr)
        .lte('task_date', todayStr)
        .eq('employee_id', currentUser.id);

      // 이번 달 업무 데이터 가져오기 (task_date 기준)
      const { data: monthlyTasks } = await supabase
        .from('employee_tasks')
        .select(`
          *,
          operation_type:operation_types(code, name, points)
        `)
        .gte('task_date', startOfMonthStr)
        .lte('task_date', endOfMonthStr)
        .eq('employee_id', currentUser.id);

      // 오늘의 매출 계산 (OP5 제외)
      const todaySales = todayTasks?.reduce((sum, task) => {
        // OP5는 개인매출에서 제외
        if (task.operation_type?.code === 'OP5') {
          return sum;
        }
        return sum + (task.sales_amount || 0);
      }, 0) || 0;

      // 이번 주 매출 계산 (OP5 제외)
      const weeklySales = weeklyTasks?.reduce((sum, task) => {
        // OP5는 개인매출에서 제외
        if (task.operation_type?.code === 'OP5') {
          return sum;
        }
        return sum + (task.sales_amount || 0);
      }, 0) || 0;

      // 오늘의 포인트 계산
      const todayPoints = todayTasks?.reduce((sum, task) => sum + (task.operation_type?.points || 0), 0) || 0;

      // 이번 주 포인트 계산
      const weeklyPoints = weeklyTasks?.reduce((sum, task) => sum + (task.operation_type?.points || 0), 0) || 0;

      // 이번 주 업무 건수
      const weeklyTaskCount = weeklyTasks?.length || 0;

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
        (task.operation_type?.code === 'OP1' || task.operation_type?.code === 'OP2') && 
        !task.title?.includes('[환불]')
      ).length || 0;

      const storeSales = monthlyTasks?.filter(task => 
        (task.operation_type?.code === 'OP3' || task.operation_type?.code === 'OP4') && 
        !task.title?.includes('[환불]')
      ).length || 0;

      const csResponse = monthlyTasks?.filter(task => 
        task.operation_type?.code === 'OP5' && 
        !task.title?.includes('[환불]')
      ).length || 0;

      const visitBookings = monthlyTasks?.filter(task => 
        task.operation_type?.code === 'OP5' && 
        task.sita_booking === true &&
        !task.title?.includes('[환불]')
      ).length || 0;

      // 마스골프 개인 성과 계산 (OP1-OP10 중 마스골프 관련)
      const masgolfPersonalTasks = monthlyTasks?.filter(task => {
        const code = task.operation_type?.code;
        return code && ['OP1', 'OP2', 'OP3', 'OP4', 'OP5', 'OP6', 'OP7', 'OP8', 'OP9', 'OP10'].includes(code) &&
               (task.op10Category === 'masgolf' || !task.op10Category); // op10Category가 없으면 마스골프로 간주
      }) || [];
      
      const masgolfPersonalPoints = masgolfPersonalTasks.reduce((sum, task) => sum + (task.operation_type?.points || 0), 0);
      const masgolfPersonalCount = masgolfPersonalTasks.length;

      // 싱싱골프 개인 성과 계산 (OP11-OP12 + OP10 중 싱싱골프 관련)
      const singsingolfPersonalTasks = monthlyTasks?.filter(task => {
        const code = task.operation_type?.code;
        return (code && ['OP11', 'OP12'].includes(code)) || 
               (code === 'OP10' && task.op10Category === 'singsingolf');
      }) || [];
      
      const singsingolfPersonalPoints = singsingolfPersonalTasks.reduce((sum, task) => sum + (task.operation_type?.points || 0), 0);
      const singsingolfPersonalCount = singsingolfPersonalTasks.length;

      const personalKPI = {
        phoneSales: phoneSales,
        storeSales: storeSales,
        csResponse: csResponse,
        visitBookings: visitBookings,
        masgolfPoints: masgolfPersonalPoints,
        masgolfCount: masgolfPersonalCount,
        singsingolfPoints: singsingolfPersonalPoints,
        singsingolfCount: singsingolfPersonalCount,
        totalPoints: masgolfPersonalPoints + singsingolfPersonalPoints,
        totalTasks: masgolfPersonalCount + singsingolfPersonalCount
      };

      // 전체 팀의 이번 달 업무 데이터 가져오기 (협업 성과 계산용)
      const { data: allTeamTasks } = await supabase
        .from('employee_tasks')
        .select(`
          *,
          operation_type:operation_types(code, name, points),
          employee:employees(name, employee_id)
        `)
        .gte('created_at', startOfMonthStr + 'T00:00:00')
        .lte('created_at', endOfMonthStr + 'T23:59:59');

      // 마스골프 성과 계산 (OP1-OP10)
      const masgolfTasks = allTeamTasks?.filter(task => {
        const code = task.operation_type?.code;
        return code && ['OP1', 'OP2', 'OP3', 'OP4', 'OP5', 'OP6', 'OP7', 'OP8', 'OP9', 'OP10'].includes(code);
      }) || [];

      const masgolfSales = masgolfTasks.reduce((sum, task) => sum + (task.sales_amount || 0), 0);
      const masgolfPoints = masgolfTasks.reduce((sum, task) => sum + (task.operation_type?.points || 0), 0);
      const masgolfTaskCount = masgolfTasks.length;
      const masgolfParticipants = new Set(masgolfTasks.map(task => task.employee_id)).size;
      
      // 마스골프 신규 상담 건수 (OP5에서 customer_type이 'new'인 경우)
      const masgolfNewConsultations = masgolfTasks.filter(task => 
        task.operation_type?.code === 'OP5' && 
        task.customer_type === 'new'
      ).length;

      // 마스골프 시타 예약 건수 (OP5에서 sita_booking이 true인 경우)
      const masgolfSitaBookings = masgolfTasks.filter(task => 
        task.operation_type?.code === 'OP5' && 
        task.sita_booking === true
      ).length;


      // 싱싱골프 성과 계산 (OP11-OP12)
      const singsingolfTasks = allTeamTasks?.filter(task => {
        const code = task.operation_type?.code;
        return code && ['OP11', 'OP12'].includes(code);
      }) || [];

      const singsingolfSales = singsingolfTasks.reduce((sum, task) => sum + (task.sales_amount || 0), 0);
      const singsingolfPoints = singsingolfTasks.reduce((sum, task) => sum + (task.operation_type?.points || 0), 0);
      const singsingolfTaskCount = singsingolfTasks.length;
      const singsingolfParticipants = new Set(singsingolfTasks.map(task => task.employee_id)).size;
      
      // 싱싱골프 신규 상담 건수 (OP12에서 customer_type이 'new'인 경우)
      const singsingolfNewConsultations = singsingolfTasks.filter(task => 
        task.operation_type?.code === 'OP12' && 
        task.customer_type === 'new'
      ).length;

      // 싱싱골프는 방문 예약이 없음 (OP12는 시타 예약 없음)
      const singsingolfSitaBookings = 0;


      // 전체 성과 계산
      const totalSales = masgolfSales + singsingolfSales;
      const totalPoints = masgolfPoints + singsingolfPoints;
      const totalTasks = masgolfTaskCount + singsingolfTaskCount;
      const totalNewConsultations = masgolfNewConsultations + singsingolfNewConsultations;
      const totalSitaBookings = masgolfSitaBookings + singsingolfSitaBookings;


      // 협업 성과 데이터
      const collaborationStats = {
        masgolf: {
          sales: masgolfSales,
          points: masgolfPoints,
          tasks: masgolfTaskCount,
          participants: masgolfParticipants,
          newConsultations: masgolfNewConsultations,
          sitaBookings: masgolfSitaBookings
        },
        singsingolf: {
          sales: singsingolfSales,
          points: singsingolfPoints,
          tasks: singsingolfTaskCount,
          participants: singsingolfParticipants,
          newConsultations: singsingolfNewConsultations,
          sitaBookings: singsingolfSitaBookings
        },
        total: {
          sales: totalSales,
          points: totalPoints,
          tasks: totalTasks,
          newConsultations: totalNewConsultations,
          sitaBookings: totalSitaBookings
        }
      };

      // 팀 KPI (실제 데이터)
      const teamKPI = {
        totalSales: totalSales,
        yoyGrowth: 'Na',
        targetAchievement: 'Na',
        teamMembers: totalEmployees || 8
      };


      // 최근 공유 업무 (모든 업무 유형) 가져오기
      console.log('operation_types 조회 시작');
      const { data: operationTypesData, error: operationTypesError } = await supabase
        .from('operation_types')
        .select('id, code')
        .in('code', ['OP1', 'OP2', 'OP3', 'OP4', 'OP5', 'OP6', 'OP7', 'OP8', 'OP9', 'OP10', 'OP11', 'OP12']);
      
      console.log('operation_types 조회 결과:', { operationTypesData, operationTypesError });

      let recentSharedTasks: SharedTask[] = [];
      console.log('recentSharedTasks 초기화, operationTypesData 존재:', !!operationTypesData);
      if (operationTypesData && operationTypesData.length > 0) {
        const operationTypeIds = operationTypesData.map(op => op.id);
        console.log('operationTypeIds:', operationTypeIds);
        console.log('recentSharedTasks 쿼리 실행 시작');
        
        const { data: sharedTasksData, error: sharedTasksError } = await supabase
          .from('employee_tasks')
          .select(`
            id,
            title,
            notes,
            customer_name,
            task_date,
            created_at,
            task_priority,
            achievement_status,
            sita_booking,
            visit_booking_date,
            visit_booking_time,
            operation_type:operation_types(code, name, points),
            employee:employees(name, employee_id)
          `)
          .in('operation_type_id', operationTypeIds)
          .in('task_priority', ['urgent', 'high', 'normal', 'low'])
          .order('created_at', { ascending: false })
          .limit(50); // 더 많은 업무를 가져오도록 수정

        // 상세한 디버깅 로그 추가
        console.log('=== recentSharedTasks 쿼리 디버깅 ===');
        console.log('operationTypeIds:', operationTypeIds);
        console.log('sharedTasksError:', sharedTasksError);
        console.log('sharedTasksData 개수:', sharedTasksData?.length || 0);
        console.log('sharedTasksData:', sharedTasksData);
        
        if (sharedTasksData && sharedTasksData.length > 0) {
          console.log('첫 번째 업무:', sharedTasksData[0]);
          console.log('모든 업무의 고객명:', sharedTasksData.map(task => task.customer_name));
          console.log('모든 업무의 우선순위:', sharedTasksData.map(task => task.task_priority));
          console.log('모든 업무의 완료상태:', sharedTasksData.map(task => task.achievement_status));
          
          // 김상돈 업무 찾기
          const kimSangDonTask = sharedTasksData.find(task => 
            task.customer_name && task.customer_name.includes('김상돈')
          );
          console.log('김상돈 업무 찾기 결과:', kimSangDonTask);
        }

        recentSharedTasks = (sharedTasksData || []) as unknown as SharedTask[];
      }

      // 내 업무 가져오기 (모든 업무 유형)
      let myTasks: SharedTask[] = [];
      if (operationTypesData && operationTypesData.length > 0) {
        const operationTypeIds = operationTypesData.map(op => op.id);
        
        const { data: myTasksData } = await supabase
          .from('employee_tasks')
          .select(`
            id,
            title,
            notes,
            customer_name,
            task_date,
            created_at,
            task_priority,
            achievement_status,
            operation_type:operation_types(code, name, points),
            employee:employees(name, employee_id)
          `)
          .in('operation_type_id', operationTypeIds)
          .eq('employee_id', currentUser.id)
          .eq('achievement_status', 'pending')
          .order('created_at', { ascending: false })
          .limit(20);

        myTasks = (myTasksData || []) as unknown as SharedTask[];
      }

      // 팀원 순위 계산
      console.log('팀원 순위 계산 시작');
      const teamRankings = await calculateTeamRankings(startOfMonthStr, endOfMonthStr);
      console.log('팀원 순위 계산 완료:', teamRankings);

      console.log('setData 호출 시작, recentSharedTasks 개수:', recentSharedTasks.length);
      setData({
        employee: employeeData || currentUser,
        todaySchedule: scheduleData,
        monthlyStats,
        personalKPI,
        teamKPI,
        collaborationStats,
        recentSharedTasks,
        myTasks,
        teamRankings,
        todaySales: todaySales,
        todayPoints: todayPoints,
        weeklySales: weeklySales,
        weeklyPoints: weeklyPoints,
        weeklyTaskCount: weeklyTaskCount
      });

    } catch (error) {
      console.error('=== 대시보드 데이터 로드 오류 ===');
      console.error('오류 상세:', error);
      console.error('오류 스택:', error instanceof Error ? error.stack : 'No stack trace');
      // 에러가 있어도 기본 데이터 설정
      console.log('기본 데이터 설정 시작');
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
          storeSales: 3,
          csResponse: 2,
          visitBookings: 0,
          masgolfPoints: 0,
          masgolfCount: 0,
          singsingolfPoints: 0,
          singsingolfCount: 0,
          totalPoints: 0,
          totalTasks: 0
        },
        teamKPI: {
          totalSales: 35000000,
          yoyGrowth: 'Na',
          targetAchievement: 'Na',
          teamMembers: 8
        },
        collaborationStats: {
          masgolf: {
            sales: 25000000,
            points: 1250,
            tasks: 85,
            participants: 5,
            newConsultations: 25,
            sitaBookings: 0
          },
          singsingolf: {
            sales: 10000000,
            points: 420,
            tasks: 35,
            participants: 3,
            newConsultations: 15,
            sitaBookings: 0
          },
          total: {
            sales: 35000000,
            points: 1670,
            tasks: 120,
            newConsultations: 40,
            sitaBookings: 0
          }
        },
        recentSharedTasks: [],
        myTasks: [],
        todaySales: 0,
        todayPoints: 0,
        weeklySales: 0,
        weeklyPoints: 0,
        weeklyTaskCount: 0
      });
      
      // 연차 정보 로드
      const currentYear = new Date().getFullYear();
      const { data: balance } = await supabase
        .from('leave_balance')
        .select('*')
        .eq('employee_id', currentUser.id)
        .eq('year', currentYear)
        .maybeSingle();
      
      setLeaveBalance(balance);
      
      // 특별연차(복지 연차) 정보 로드 (작년부터 조회하여 지나간 날짜도 표시)
      const { data: welfareData } = await supabase
        .from('welfare_leave_policy')
        .select('*')
        .gte('year', currentYear - 1) // 작년부터 조회
        .eq('is_active', true)
        .order('date', { ascending: true });
      
      setWelfareLeaves(welfareData || []);
      
      // 특별 근무 내역 로드 (휴무일 시타 근무) - 최근 3개월 조회
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      const startDateStr = threeMonthsAgo.toISOString().split('T')[0];
      const todayStr = new Date().toISOString().split('T')[0];
      
      // 최근 3개월 업무 중 시타 예약이 있는 업무 가져오기 (최대 10개)
      try {
        const { data: tasksWithSita, error: tasksError } = await supabase
          .from('employee_tasks')
          .select('*')
          .eq('employee_id', currentUser.id)
          .eq('sita_booking', true)
          .gte('task_date', startDateStr)
          .lte('task_date', todayStr)
          .order('task_date', { ascending: false })
          .limit(10);
        
        if (tasksError) {
          console.error('특별 근무 조회 오류:', tasksError);
          setSpecialWorks([]);
        } else if (tasksWithSita && tasksWithSita.length > 0) {
        // 각 업무 날짜에 스케줄이 있는지 확인
        const specialWorksList = [];
        
        for (const task of tasksWithSita) {
          const taskDate = task.task_date;
          const dayOfWeek = new Date(taskDate).getDay(); // 0=일요일, 6=토요일
          
          // 해당 날짜의 스케줄 확인
          const { data: schedule } = await supabase
            .from('schedules')
            .select('*')
            .eq('employee_id', currentUser.id)
            .eq('schedule_date', taskDate)
            .maybeSingle();
          
          // 스케줄이 없거나 주말이면 특별 근무로 간주
          if (!schedule || dayOfWeek === 0 || dayOfWeek === 6) {
            specialWorksList.push({
              id: task.id,
              date: taskDate,
              task_title: task.title,
              customer_name: task.customer_name,
              visit_booking_date: task.visit_booking_date,
              visit_booking_time: task.visit_booking_time,
              is_weekend: dayOfWeek === 0 || dayOfWeek === 6,
              is_day_off: !schedule
            });
          }
        }
        
          setSpecialWorks(specialWorksList);
        } else {
          console.log('특별 근무 데이터 없음');
          setSpecialWorks([]);
        }
      } catch (error) {
        console.error('특별 근무 조회 예외:', error);
        setSpecialWorks([]);
      }
    } finally {
      console.log('=== loadDashboardData 함수 완료 ===');
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

  // 우선순위별 업무 분류 함수
  const getTasksByPriority = (tasks: SharedTask[]) => {
    return {
      urgent: tasks.filter(task => task.task_priority === 'urgent'),
      high: tasks.filter(task => task.task_priority === 'high'),
      normal: tasks.filter(task => task.task_priority === 'normal'),
      low: tasks.filter(task => task.task_priority === 'low'),
      my: data?.myTasks || []
    };
  };

  // 탭 토글 함수
  const toggleTabExpansion = (priority: string) => {
    setExpandedTabs(prev => ({
      ...prev,
      [priority]: !prev[priority]
    }));
  };

  // 관리자 권한 확인 함수
  const isAdmin = () => {
    if (!data?.employee) return false;
    
    // 관리자 권한 확인 (role_id로 확인)
    // 김탁수의 role_id: 559a26b3-e977-43b3-92d1-21e9d610217c (admin)
    const adminRoleId = '559a26b3-e977-43b3-92d1-21e9d610217c';
    return data.employee.role_id === adminRoleId;
  };

  // 매니저 권한 확인 함수
  const isManager = () => {
    if (!data?.employee) return false;
    
    // 매니저 권한 확인 (role_id로 확인)
    const adminRoleId = '559a26b3-e977-43b3-92d1-21e9d610217c'; // admin
    const managerRoleId = 'c0676341-e5d6-4b64-b03d-7cb37b2e70ab'; // manager
    return data.employee.role_id === adminRoleId || data.employee.role_id === managerRoleId;
  };

  // 팀 리더 권한 확인 함수
  const isTeamLead = () => {
    if (!data?.employee) return false;
    
    const userRole = data.employee.role?.name || data.employee.role_id;
    return userRole === 'team_lead' || userRole === 'manager' || userRole === 'admin';
  };

  // 업무 수정 권한 확인 함수
  const canEditTask = (task: SharedTask) => {
    if (!data?.employee) return false;
    
    // 관리자는 모든 업무 수정 가능
    if (isAdmin()) return true;
    
    // 본인이 작성한 업무만 수정 가능
    return task.employee?.employee_id === data.employee.id;
  };

  // 업무 수정 함수
  const handleEditTask = (task: SharedTask) => {
    setEditingTask(task);
    setShowEditModal(true);
  };

  // 매출 상세 모달 열기
  const handleOpenSalesDetail = async (period: 'today' | 'week' | 'month' | 'quarter' | 'year' = 'month') => {
    setShowSalesDetailModal(true);
    const detailData = await loadSalesDetailData(period);
    setSalesDetailData(detailData);
  };

  // 마케팅 상세 모달 열기
  const handleOpenMarketingDetail = async (period: 'today' | 'week' | 'month' | 'quarter' | 'year' = 'month', brand: 'masgolf' | 'singsingolf' | 'all' = 'all') => {
    setShowMarketingDetailModal(true);
    setSelectedMarketingBrand(brand);
    const detailData = await loadMarketingDetailData(period, brand);
    setMarketingDetailData(detailData);
  };

  // 긴급 업무 읽음 처리 함수
  const handleReadUrgentTask = (taskId: string) => {
    setReadTasks(prev => new Set([...prev, taskId]));
  };

  // 긴급 업무 토글 함수
  const toggleUrgentTasks = () => {
    setShowUrgentTasks(!showUrgentTasks);
  };

  // 업무 수정 저장 함수
  const handleSaveEdit = async (formData: FormData) => {
    if (!editingTask) return;

    try {
      const updateData: any = {
        title: formData.get('title') as string,
        notes: formData.get('notes') as string,
        customer_name: formData.get('customer_name') as string,
        task_priority: formData.get('task_priority') as string,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('employee_tasks')
        .update(updateData)
        .eq('id', editingTask.id);

      if (error) throw error;

      // 목록에서 해당 업무 업데이트
      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          recentSharedTasks: prev.recentSharedTasks.map(task => 
            task.id === editingTask.id 
              ? { ...task, ...updateData }
              : task
          )
        };
      });

      setShowEditModal(false);
      setEditingTask(null);
      alert('업무가 성공적으로 수정되었습니다.');
    } catch (error) {
      console.error('업무 수정 실패:', error);
      alert('업무 수정에 실패했습니다.');
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('employee_tasks')
        .update({ 
          achievement_status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (error) throw error;

      // 목록에서 해당 업무 제거 (완료된 업무는 대시보드에서 숨김)
      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          recentSharedTasks: prev.recentSharedTasks.filter(task => task.id !== taskId)
        };
      });

      alert('업무가 완료 처리되었습니다.');
    } catch (error) {
      console.error('업무 완료 처리 실패:', error);
      alert('업무 완료 처리에 실패했습니다.');
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
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl shadow-xl p-6 mb-6 text-white">
          <div className="flex items-center justify-between">
            {/* 로고 영역 */}
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                <Building2 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">MASLABS</h1>
              </div>
            </div>
            
            {/* 중앙 날짜/시간 영역 - 데스크톱에서만 표시 */}
            <div className="hidden md:block text-center">
              <div className="text-sm text-white/90 whitespace-pre-line font-medium">
                {formatDateTime(currentTime)}
              </div>
              </div>
              
            {/* 우측 사용자 영역 */}
            <div className="flex items-center space-x-2 md:space-x-4">
              {/* 알림 아이콘 - 알림 개수 뱃지 추가 */}
              <button 
                onClick={() => router.push('/notifications')}
                className="p-2 text-white/80 hover:text-yellow-300 transition-colors relative"
                title="알림 설정"
              >
                <Bell className="h-5 w-5 md:h-6 md:w-6" />
                {notifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 md:h-5 md:w-5 flex items-center justify-center font-bold">
                    {notifications.length > 9 ? '9+' : notifications.length}
                  </span>
                )}
              </button>
              
              {/* 사용자 정보 - 모바일에서 축약 */}
              <div className="hidden sm:block text-right">
                <p className="text-xs md:text-sm text-blue-200">안녕하세요,</p>
                <p className="text-sm md:text-base font-semibold text-white truncate max-w-24 md:max-w-32">
                  {data?.employee?.name || 'User'}
                </p>
              </div>
              
              {/* 모바일에서 사용자 이름만 표시 */}
              <div className="sm:hidden text-right">
                <p className="text-sm font-semibold text-white truncate max-w-16">
                  {data?.employee?.name || 'User'}
                </p>
              </div>
              

              
              {/* 로그아웃 버튼 */}
              <button
                onClick={handleLogout}
                className="p-2 text-white/80 hover:text-red-300 transition-colors"
                title="로그아웃"
              >
                <LogOut className="h-5 w-5 md:h-6 md:w-6" />
              </button>
              
              {/* 모바일 메뉴 버튼 */}
                <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="md:hidden p-2 text-white/80 hover:text-blue-300 transition-colors"
                title="메뉴"
              >
                <Menu className="h-5 w-5" />
              </button>
            </div>
          </div>
          
          {/* 모바일 날짜/시간 - 상단바 아래에 표시 */}
          <div className="md:hidden mt-3 text-center">
            <div className="text-sm text-white/90 whitespace-pre-line font-medium">
              {formatDateTime(currentTime)}
            </div>
          </div>
          
          {/* 모바일 메뉴 드롭다운 */}
          {showMobileMenu && (
            <div className="md:hidden mt-3 pt-3 border-t border-white/20">
              <div className="flex flex-col space-y-2">
                <button 
                  onClick={() => router.push('/profile')}
                  className="text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  프로필 설정
                </button>
                <button 
                  onClick={() => router.push('/notifications')}
                  className="text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
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


        {/* 긴급 업무 섹션 (메인 화면) */}
        {(() => {
          const tasksByPriority = data?.recentSharedTasks ? getTasksByPriority(data.recentSharedTasks) : { urgent: [], high: [], normal: [], low: [], my: [] };
          const urgentTasks = tasksByPriority.urgent;
          const hasUrgentTasks = urgentTasks.length > 0;
          

          return (
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800 flex items-center">
                  <Package className="h-6 w-6 mr-3 text-red-600" />
                  긴급 업무
                  {hasUrgentTasks && (
                    <span className="ml-2 px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                      {urgentTasks.length}
                    </span>
                  )}
          </h2>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => router.push('/tasks')}
                    className="flex items-center text-green-600 hover:text-green-800 text-sm font-medium"
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    업무 기록
                  </button>
                  <button
                    onClick={() => router.push('/shared-tasks-admin')}
                    className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    전체 보기
                  </button>
                </div>
              </div>


              {/* 긴급 업무 토글 버튼 */}
              <div className="mb-4">
                <button
                  onClick={toggleUrgentTasks}
                  className="flex items-center justify-center w-full py-3 px-4 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                >
                  {showUrgentTasks ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-2 text-red-600" />
                      <span className="text-red-600 font-medium">긴급 업무 숨기기</span>
                    </>
                ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-2 text-red-600" />
                      <span className="text-red-600 font-medium">
                        긴급 업무 보기 {hasUrgentTasks && `(${urgentTasks.length}건)`}
                      </span>
                    </>
                )}
                </button>
              </div>

              {/* 긴급 업무 목록 */}
              {showUrgentTasks && (
                <div className="space-y-3">
                  {urgentTasks.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                      <p>긴급 업무가 없습니다.</p>
            </div>
                  ) : (
                    urgentTasks.map((task) => {
                      const isOverdue = new Date().getTime() - new Date(task.created_at).getTime() > 24 * 60 * 60 * 1000;
                      const isRead = readTasks.has(task.id);
                      
                      return (
                        <div 
                          key={task.id} 
                          className={`border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer ${
                            isRead ? 'border-gray-200 bg-gray-50' : 'border-red-200 bg-red-50'
                          }`}
                          onClick={() => handleReadUrgentTask(task.id)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className={`font-semibold ${isRead ? 'text-gray-600' : 'text-gray-900'}`}>
                                  {task.title}
                                </h3>
                                {!isRead && (
                                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                    새 업무
                                  </span>
                                )}
                                {/* 금일 시타 뱃지 추가 */}
                                {(() => {
                                  // 오늘 시타 예약이 있는지 확인
                                  const now = new Date();
                                  const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000));
                                  const today = koreaTime.toISOString().split('T')[0];
                                  const todayFormatted = today.replace(/-/g, '.');
                                  
                                  const hasTodaySita = task.sita_booking && (
                                    task.visit_booking_date === today || 
                                    task.visit_booking_date === todayFormatted
                                  );
                                  
                                  return hasTodaySita ? (
                                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                                      금일 시타
                                    </span>
                                  ) : null;
                                })()}
                                {isOverdue && (
                                  <Siren className="h-4 w-4 text-red-500 animate-pulse" />
                )}
              </div>
                              <div className="flex items-center text-sm text-gray-500 mb-2">
                                <User className="h-4 w-4 mr-1" />
                                {task.employee?.name}
                                <span className="mx-2">•</span>
                                <Calendar className="h-4 w-4 mr-1" />
                                {formatDateKR(new Date(task.task_date))}
            </div>
                              {task.notes && (
                                <p className={`text-sm line-clamp-2 ${isRead ? 'text-gray-500' : 'text-gray-700'}`}>
                                  {task.notes}
                                </p>
                              )}
                              {task.customer_name && task.customer_name.trim() && (
                                <p className="text-sm text-gray-500 mt-1">
                                  <span className="font-medium">고객:</span> {task.customer_name.trim().replace(/0/g, '')}
                                </p>
                              )}
                </div>
                            <div className="ml-4 flex flex-col items-end space-y-2">
                              <div className="flex items-center space-x-2">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  긴급
                                </span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {task.operation_type?.code} - {task.operation_type?.points}점
                                </span>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCompleteTask(task.id);
                                  }}
                                  className="flex items-center px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                >
                                  <CheckSquare className="h-3 w-3 mr-1" />
                                  완료
                                </button>
                                {canEditTask(task) && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleEditTask(task);
                                    }}
                                    className="flex items-center px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                    title="업무 수정"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </button>
              )}
            </div>
            </div>
          </div>
        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })()}


        {/* KPI 하이라이트 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <BarChart3 className="h-6 w-6 mr-3 text-blue-600" />
            KPI 하이라이트
          </h2>
            <button
              onClick={() => handleOpenSalesDetail('month')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              매출 상세보기
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">오늘의 매출</p>
                  <p className="text-2xl font-bold">{formatCurrency(data?.todaySales || 0)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cyan-100 text-sm">이번 주 매출</p>
                  <p className="text-2xl font-bold">{formatCurrency(data?.weeklySales || 0)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-cyan-200" />
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
                  <p className="text-purple-100 text-sm">오늘 포인트</p>
                  <p className="text-2xl font-bold">{data?.todayPoints || 0}점</p>
                </div>
                <Target className="h-8 w-8 text-purple-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-pink-500 to-pink-600 text-white p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-pink-100 text-sm">이번 주 포인트</p>
                  <p className="text-2xl font-bold">{data?.weeklyPoints || 0}점</p>
                </div>
                <Target className="h-8 w-8 text-pink-200" />
          </div>
            </div>
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">이번 주 업무 건수</p>
                  <p className="text-2xl font-bold">{data?.weeklyTaskCount || 0}건</p>
          </div>
                <Phone className="h-8 w-8 text-orange-200" />
            </div>
            </div>
          </div>
        </div>

          {/* 개인 KPI */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <User className="h-6 w-6 mr-3 text-indigo-600" />
              개인 KPI ({new Date().getFullYear()}년 {new Date().getMonth() + 1}월)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Phone className="h-6 w-6 text-blue-600 mr-2" />
                <span className="text-sm font-medium text-blue-800">전화 판매 건수</span>
                </div>
              <p className="text-2xl font-bold text-blue-600">
                {data?.personalKPI?.phoneSales || 0}건
              </p>
              <p className="text-xs text-blue-500 mt-1">OP1, OP2 합계</p>
              </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <ShoppingCart className="h-6 w-6 text-green-600 mr-2" />
                <span className="text-sm font-medium text-green-800">매장 판매 건수</span>
            </div>
              <p className="text-2xl font-bold text-green-600">
                {data?.personalKPI?.storeSales || 0}건
              </p>
              <p className="text-xs text-green-500 mt-1">OP3, OP4 합계</p>
                </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <BarChart3 className="h-6 w-6 text-purple-600 mr-2" />
                <span className="text-sm font-medium text-purple-800">CS 응대</span>
              </div>
              <p className="text-2xl font-bold text-purple-600">
                {data?.personalKPI?.csResponse || 0}건
              </p>
              <p className="text-xs text-purple-500 mt-1">OP5</p>
            </div>

            <div className="text-center p-4 bg-teal-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Calendar className="h-6 w-6 text-teal-600 mr-2" />
                <span className="text-sm font-medium text-teal-800">방문 예약 건수</span>
              </div>
              <p className="text-2xl font-bold text-teal-600">
                {data?.personalKPI?.visitBookings || 0}건
              </p>
              <p className="text-xs text-teal-500 mt-1">OP5</p>
            </div>

            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Award className="h-6 w-6 text-orange-600 mr-2" />
                <span className="text-sm font-medium text-orange-800">마스골프</span>
              </div>
              <p className="text-lg font-bold text-orange-600">
                {data?.personalKPI?.masgolfPoints || 0}점
              </p>
              <p className="text-xs text-orange-500 mt-1">{data?.personalKPI?.masgolfCount || 0}건</p>
            </div>

            <div className="text-center p-4 bg-pink-50 rounded-lg">
              <div className="flex items-center justify-center mb-2">
                <Trophy className="h-6 w-6 text-pink-600 mr-2" />
                <span className="text-sm font-medium text-pink-800">싱싱골프</span>
              </div>
              <p className="text-lg font-bold text-pink-600">
                {data?.personalKPI?.singsingolfPoints || 0}점
              </p>
              <p className="text-xs text-pink-500 mt-1">{data?.personalKPI?.singsingolfCount || 0}건</p>
            </div>
          </div>
          </div>

          {/* 🏆 실시간 순위 */}
          {data?.teamRankings && (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <Trophy className="h-6 w-6 mr-3 text-yellow-600" />
                🏆 실시간 순위
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* 매출 순위 */}
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4">
                  <div className="flex items-center mb-3">
                    <DollarSign className="h-5 w-5 text-yellow-600 mr-2" />
                    <h3 className="font-semibold text-yellow-800">매출 1위</h3>
                  </div>
                  {data.teamRankings.sales.length > 0 ? (
                    <div className="space-y-2">
              <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-yellow-700">
                          🥇 {data.teamRankings.sales[0].name}
                        </span>
                        <span className="text-sm text-yellow-600">
                          {formatCurrency(data.teamRankings.sales[0].sales)}
                        </span>
                </div>
                      {data.teamRankings.sales[1] && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">🥈 {data.teamRankings.sales[1].name}</span>
                          <span className="text-gray-500">{formatCurrency(data.teamRankings.sales[1].sales)}</span>
              </div>
                      )}
            </div>
                  ) : (
                    <p className="text-gray-500 text-sm">데이터 없음</p>
                  )}
                </div>

                {/* 포인트 순위 */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                  <div className="flex items-center mb-3">
                    <Award className="h-5 w-5 text-blue-600 mr-2" />
                    <h3 className="font-semibold text-blue-800">포인트 1위</h3>
                  </div>
                  {data.teamRankings.points.length > 0 ? (
                    <div className="space-y-2">
              <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-blue-700">
                          🥇 {data.teamRankings.points[0].name}
                        </span>
                        <span className="text-sm text-blue-600">
                          {data.teamRankings.points[0].points}점
                        </span>
                </div>
                      {data.teamRankings.points[1] && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">🥈 {data.teamRankings.points[1].name}</span>
                          <span className="text-gray-500">{data.teamRankings.points[1].points}점</span>
              </div>
                      )}
              </div>
                  ) : (
                    <p className="text-gray-500 text-sm">데이터 없음</p>
                  )}
            </div>

                {/* 업무 건수 순위 */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
                  <div className="flex items-center mb-3">
                    <Target className="h-5 w-5 text-green-600 mr-2" />
                    <h3 className="font-semibold text-green-800">업무 건수 1위</h3>
          </div>
                  {data.teamRankings.tasks.length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-green-700">
                          🥇 {data.teamRankings.tasks[0].name}
                        </span>
                        <span className="text-sm text-green-600">
                          {data.teamRankings.tasks[0].tasks}건
                        </span>
                      </div>
                      {data.teamRankings.tasks[1] && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">🥈 {data.teamRankings.tasks[1].name}</span>
                          <span className="text-gray-500">{data.teamRankings.tasks[1].tasks}건</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">데이터 없음</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 협업 성과 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <Users className="h-6 w-6 mr-3 text-green-600" />
            협업 성과
          </h2>
            <button
              onClick={() => handleOpenMarketingDetail('month')}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              마케팅 상세보기
            </button>
          </div>
          
          {/* 마스골프 성과 */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
              <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
              마스골프 성과
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">마스골프 매출</p>
                    <p className="text-3xl font-bold text-blue-900">{formatCurrency(data?.collaborationStats?.masgolf?.sales || 0)}</p>
                  </div>
                  <DollarSign className="h-10 w-10 text-blue-600" />
                </div>
                <div className="text-xs text-blue-500">
                  OP1-10 업무 매출
                </div>
              </div>
              
              <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">마스골프 포인트</p>
                    <p className="text-3xl font-bold text-blue-900">{data?.collaborationStats?.masgolf?.points?.toLocaleString() || 0}점</p>
                  </div>
                  <Award className="h-10 w-10 text-blue-600" />
                </div>
                <div className="text-xs text-blue-500">
                  OP1-10 업무 포인트
                </div>
              </div>
              
              <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">마스골프 업무</p>
                    <p className="text-3xl font-bold text-blue-900">{data?.collaborationStats?.masgolf?.tasks || 0}건</p>
                  </div>
                  <Target className="h-10 w-10 text-blue-600" />
                </div>
                <div className="text-xs text-blue-500">
                  OP1-10 업무 건수
                </div>
              </div>

              <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl border border-purple-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-purple-600 font-medium">전체 방문 예약</p>
                    <p className="text-3xl font-bold text-purple-900">{data?.collaborationStats?.total?.sitaBookings || 0}건</p>
                  </div>
                  <Calendar className="h-10 w-10 text-purple-600" />
                </div>
                <div className="text-xs text-purple-500">
                  OP5 방문 예약 건수
                </div>
              </div>

            </div>
          </div>

          {/* 싱싱골프 성과 */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
              <span className="w-3 h-3 bg-pink-500 rounded-full mr-2"></span>
              싱싱골프 성과
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="p-6 bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl border border-pink-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-pink-600 font-medium">싱싱골프 매출</p>
                    <p className="text-3xl font-bold text-pink-900">{formatCurrency(data?.collaborationStats?.singsingolf?.sales || 0)}</p>
                  </div>
                  <DollarSign className="h-10 w-10 text-pink-600" />
                </div>
                <div className="text-xs text-pink-500">
                  OP11-12 업무 매출
                </div>
              </div>
              
              <div className="p-6 bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl border border-pink-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-pink-600 font-medium">싱싱골프 포인트</p>
                    <p className="text-3xl font-bold text-pink-900">{data?.collaborationStats?.singsingolf?.points?.toLocaleString() || 0}점</p>
                  </div>
                  <Award className="h-10 w-10 text-pink-600" />
                </div>
                <div className="text-xs text-pink-500">
                  OP11-12 업무 포인트
                </div>
              </div>
              
              <div className="p-6 bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl border border-pink-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-pink-600 font-medium">싱싱골프 업무</p>
                    <p className="text-3xl font-bold text-pink-900">{data?.collaborationStats?.singsingolf?.tasks || 0}건</p>
                  </div>
                  <Target className="h-10 w-10 text-pink-600" />
                </div>
                <div className="text-xs text-pink-500">
                  OP11-12 업무 건수
            </div>
          </div>


                </div>
              </div>
              
          
          {/* 업무 유형별 참여 현황 */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
              <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
              업무 유형별 참여 현황
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600 font-medium">마스골프 참여</p>
                    <p className="text-2xl font-bold text-blue-900">{data?.collaborationStats?.masgolf?.participants || 0}명</p>
                    <p className="text-xs text-blue-500 mt-1">OP1-10 업무 참여자</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold">MAS</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-pink-50 rounded-xl border border-pink-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-pink-600 font-medium">싱싱골프 참여</p>
                    <p className="text-2xl font-bold text-pink-900">{data?.collaborationStats?.singsingolf?.participants || 0}명</p>
                    <p className="text-xs text-pink-500 mt-1">OP11-12 업무 참여자</p>
                  </div>
                  <div className="w-12 h-12 bg-pink-100 rounded-full flex items-center justify-center">
                    <span className="text-pink-600 font-bold">SS</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>


        {/* 특별연차 및 특별 근무 카드 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 flex items-center">
              <CalendarDays className="h-6 w-6 mr-3 text-blue-600" />
              특별연차 및 특별 근무
            </h2>
            <button
              onClick={() => router.push('/leave')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              연차 신청하기
            </button>
          </div>
          
          {/* 특별연차(복지 연차) 표시 */}
          {welfareLeaves.length > 0 && (() => {
            const currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);
            
            const upcomingLeaves = welfareLeaves.filter(w => {
              const welfareDate = new Date(w.date);
              welfareDate.setHours(0, 0, 0, 0);
              return welfareDate >= currentDate;
            });
            
            const pastLeaves = welfareLeaves.filter(w => {
              const welfareDate = new Date(w.date);
              welfareDate.setHours(0, 0, 0, 0);
              return welfareDate < currentDate;
            });
            
            // 최근 특별연차 2개만 표시 (미래 날짜 우선, 없으면 과거 날짜)
            const recentWelfareLeaves = [...upcomingLeaves, ...pastLeaves].slice(0, 2);
            
            return (
              <div className="mb-4">
                {recentWelfareLeaves.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-yellow-600" />
                      최근 특별연차
                    </h3>
                    <div className="space-y-2">
                      {recentWelfareLeaves.map((welfare) => {
                        const welfareDate = new Date(welfare.date);
                        welfareDate.setHours(0, 0, 0, 0);
                        const isPast = welfareDate < currentDate;
                        
                        // 날짜 형식: 2026년 1월 1일(목)
                        const dateStr = new Date(welfare.date).toLocaleDateString('ko-KR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          weekday: 'short'
                        });
                        
                        return (
                          <div
                            key={welfare.id}
                            className={`px-4 py-3 rounded-lg ${
                              isPast 
                                ? 'bg-gray-50 border border-gray-200' 
                                : 'bg-yellow-50 border border-yellow-200'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className={`font-semibold text-sm ${isPast ? 'text-gray-700' : 'text-yellow-800'}`}>
                                {dateStr}
                              </span>
                              <span className={`text-xs font-medium ${isPast ? 'text-gray-500' : 'text-yellow-700'}`}>
                                일수: 1일
                              </span>
                            </div>
                            {welfare.description && (
                              <div className={`text-xs mt-1 ${isPast ? 'text-gray-500' : 'text-yellow-600'}`}>
                                사유: {welfare.description}
                              </div>
                            )}
                            {isPast && (
                              <span className="text-xs text-gray-400 mt-1 inline-block">(지남)</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
          
          {/* 특별 근무 표시 - 최근 2개만 */}
          {specialWorks.length > 0 && (
            <div className={welfareLeaves.length > 0 ? "mt-4 pt-4 border-t border-gray-200" : ""}>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                <Clock className="h-4 w-4 mr-2 text-green-600" />
                최근 특별 근무
              </h3>
              <div className="space-y-2">
                {specialWorks.slice(0, 2).map((work) => {
                  const workDate = new Date(work.date);
                  
                  // 날짜 형식: 2025년 11월 22일(토)
                  const dateStr = workDate.toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    weekday: 'short'
                  });
                  
                  // 시간 범위 포맷팅 (예: "09:00" -> "9시", "09:00-10:00" -> "9-10시")
                  let timeRange = '';
                  if (work.visit_booking_time) {
                    const timeStr = work.visit_booking_time;
                    // "09:00" 형식인 경우
                    if (timeStr.includes(':')) {
                      const [hour, minute] = timeStr.split(':');
                      const hourNum = parseInt(hour, 10);
                      if (minute === '00') {
                        timeRange = `${hourNum}시`;
                      } else {
                        timeRange = `${hourNum}:${minute}`;
                      }
                    } else {
                      timeRange = timeStr;
                    }
                  }
                  
                  // 사유: task_title 또는 customer_name
                  const reason = work.task_title || work.customer_name || '특별 근무';
                  
                  return (
                    <div
                      key={work.id}
                      className="px-4 py-3 bg-green-50 border border-green-200 rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm text-green-800">
                          {dateStr}
                        </span>
                        {timeRange && (
                          <span className="text-xs font-medium text-green-700">
                            {timeRange}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        {work.is_weekend && (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">
                            주말
                          </span>
                        )}
                        {work.is_day_off && !work.is_weekend && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                            휴무일
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        사유: {reason}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {welfareLeaves.length === 0 && specialWorks.length === 0 && (
            <div className="text-center py-4 text-gray-500 text-sm">
              특별연차 및 특별 근무 내역이 없습니다.
            </div>
          )}
        </div>

        {/* 빠른 메뉴 */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">빠른 메뉴</h2>
          
          {/* 모든 직원 메뉴 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
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
              onClick={() => router.push('/leave')}
              className="p-6 bg-pink-50 border-2 border-pink-200 rounded-2xl hover:bg-pink-100 transition-all duration-200 text-left"
            >
              <CalendarDays className="h-10 w-10 text-pink-600 mb-3" />
              <h3 className="font-bold text-lg text-pink-900 mb-2">연차 신청</h3>
              <p className="text-sm text-pink-700">연차 신청 및 잔여일 조회</p>
            </button>
            
                  <button
              onClick={() => router.push('/profile')}
              className="p-6 bg-gray-50 border-2 border-gray-200 rounded-2xl hover:bg-gray-100 transition-all duration-200 text-left"
            >
              <User className="h-10 w-10 text-pink-600 mb-3" />
              <h3 className="font-bold text-lg text-pink-900 mb-2">개인정보 관리</h3>
              <p className="text-sm text-pink-700">프로필 및 설정 관리</p>
                  </button>

            <button 
              onClick={() => router.push('/contracts')}
              className="p-6 bg-orange-50 border-2 border-orange-200 rounded-2xl hover:bg-orange-100 transition-all duration-200 text-left"
            >
              <FileText className="h-10 w-10 text-orange-600 mb-3" />
              <h3 className="font-bold text-lg text-orange-900 mb-2">계약서 조회</h3>
              <p className="text-sm text-orange-700">근로계약서 확인 및 다운로드</p>
                  </button>
          </div>

          {/* 관리자 전용 메뉴 */}
          {isAdmin() && (
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
                <Award className="h-6 w-6 mr-3 text-indigo-600" />
                관리자 전용 기능
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* 브랜드 포트폴리오 버튼 */}
                <button 
                  onClick={() => router.push('/admin/brand')}
                  className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-300 rounded-2xl hover:bg-purple-200 hover:shadow-md transition-all duration-200 text-left"
                >
                  <Package className="h-10 w-10 text-purple-600 mb-3" />
                  <h3 className="font-bold text-lg text-purple-900 mb-2">브랜드 포트폴리오</h3>
                  <p className="text-sm text-purple-700">제품 원가 분석 및 주문 관리</p>
                </button>
                
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

          {/* 관리자 + 매니저 기능 */}
          {isManager() && (
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
              <button 
                onClick={() => router.push('/admin/payslip-generator')}
                  className="p-6 bg-green-50 border-2 border-green-200 rounded-2xl hover:bg-green-100 transition-all duration-200 text-left"
              >
                  <FileText className="h-10 w-10 text-green-600 mb-3" />
                  <h3 className="font-bold text-lg text-green-900 mb-2">급여 명세서 생성</h3>
                <p className="text-sm text-green-700">직원 급여 명세서 생성 및 발행</p>
              </button>

              <button 
                onClick={() => router.push('/admin/leave-management')}
                  className="p-6 bg-purple-50 border-2 border-purple-200 rounded-2xl hover:bg-purple-100 transition-all duration-200 text-left"
              >
                  <Calendar className="h-10 w-10 text-purple-600 mb-3" />
                  <h3 className="font-bold text-lg text-purple-900 mb-2">연차 관리 시스템</h3>
                <p className="text-sm text-purple-700">직원 연차 신청, 승인 및 잔여일 관리</p>
              </button>

              <button 
                onClick={() => router.push('/admin/contract-management')}
                  className="p-6 bg-indigo-50 border-2 border-indigo-200 rounded-2xl hover:bg-indigo-100 transition-all duration-200 text-left"
              >
                  <FileText className="h-10 w-10 text-indigo-600 mb-3" />
                  <h3 className="font-bold text-lg text-indigo-900 mb-2">근로계약서 관리</h3>
                <p className="text-sm text-indigo-700">근로계약서 생성, 서명 및 서류 관리</p>
              </button>
            </div>
          </div>
        )}

          {/* 팀 관리 기능 */}
          {isTeamLead() && (
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

      {/* 업무 수정 모달 */}
      {showEditModal && editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">업무 수정</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form action={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  업무명
                </label>
                <input
                  type="text"
                  name="title"
                  defaultValue={editingTask.title}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  내용
                </label>
                <textarea
                  name="notes"
                  defaultValue={editingTask.notes || ''}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  고객명
                </label>
                <input
                  type="text"
                  name="customer_name"
                  defaultValue={editingTask.customer_name || ''}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  우선순위
                </label>
                <select
                  name="task_priority"
                  defaultValue={editingTask.task_priority || 'normal'}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="urgent">긴급</option>
                  <option value="high">높음</option>
                  <option value="medium">보통</option>
                  <option value="low">낮음</option>
                </select>
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                >
                  수정
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

        {/* 매출 상세 모달 */}
        {showSalesDetailModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-2xl font-bold text-gray-800">매출 상세 분석</h3>
                <div className="flex items-center space-x-2">
                  <select
                    onChange={(e) => handleOpenSalesDetail(e.target.value as 'today' | 'week' | 'month' | 'quarter' | 'year')}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    defaultValue="month"
                  >
                    <option value="today">오늘</option>
                    <option value="week">이번 주</option>
                    <option value="month">이번 달</option>
                    <option value="quarter">이번 분기</option>
                    <option value="year">올해</option>
                  </select>
                  <button
                    onClick={() => setShowSalesDetailModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-6 w-6 text-gray-500" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {salesDetailData ? (
                  <div className="space-y-8">
                    {/* 요약 정보 */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-blue-50 p-6 rounded-xl">
                        <h4 className="text-lg font-semibold text-blue-800 mb-2">총 매출</h4>
                        <p className="text-3xl font-bold text-blue-900">
                          {formatCurrency(salesDetailData.totalSales)}
                        </p>
                        <p className="text-sm text-blue-600 mt-1">
                          {salesDetailData.startDate} ~ {salesDetailData.endDate}
                        </p>
                      </div>
                      <div className="bg-green-50 p-6 rounded-xl">
                        <h4 className="text-lg font-semibold text-green-800 mb-2">총 업무 건수</h4>
                        <p className="text-3xl font-bold text-green-900">
                          {salesDetailData.totalTasks}건
                        </p>
                        <p className="text-sm text-green-600 mt-1">
                          평균 {formatCurrency(salesDetailData.totalSales / salesDetailData.totalTasks)}/건
                        </p>
                      </div>
                      <div className="bg-purple-50 p-6 rounded-xl">
                        <h4 className="text-lg font-semibold text-purple-800 mb-2">고객 수</h4>
                        <p className="text-3xl font-bold text-purple-900">
                          {salesDetailData.customerSales.length}명
                        </p>
                        <p className="text-sm text-purple-600 mt-1">
                          평균 {formatCurrency(salesDetailData.totalSales / salesDetailData.customerSales.length)}/고객
                        </p>
                      </div>
                    </div>

                    {/* 고객별 매출 TOP 10 */}
                    <div>
                      <h4 className="text-xl font-bold text-gray-800 mb-4">고객별 매출 TOP 10</h4>
                      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">순위</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">고객명</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">매출액</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">업무 건수</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">평균 단가</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {salesDetailData.customerSales.slice(0, 10).map((customer: any, index: number) => (
                                <tr key={customer.name} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {index + 1}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {customer.name}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                                    {formatCurrency(customer.total)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {customer.count}건
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {formatCurrency(customer.total / customer.count)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* 업무 유형별 매출 */}
                    <div>
                      <h4 className="text-xl font-bold text-gray-800 mb-4">업무 유형별 매출</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {salesDetailData.operationSales.map((operation: any) => (
                          <div key={operation.code} className="bg-white border border-gray-200 rounded-xl p-6">
                            <div className="flex items-center justify-between mb-4">
                              <h5 className="text-lg font-semibold text-gray-800">
                                {operation.code} - {operation.name}
                              </h5>
                              <span className="text-sm text-gray-500">{operation.count}건</span>
                            </div>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">총 매출</span>
                                <span className="font-semibold text-green-600">
                                  {formatCurrency(operation.total)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-gray-600">평균 단가</span>
                                <span className="text-sm text-gray-900">
                                  {formatCurrency(operation.total / operation.count)}
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ 
                                    width: `${(operation.total / salesDetailData.totalSales) * 100}%` 
                                  }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 직원별 매출 */}
                    <div>
                      <h4 className="text-xl font-bold text-gray-800 mb-4">직원별 매출</h4>
                      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">직원명</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">매출액</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">업무 건수</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">평균 단가</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">비율</th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {salesDetailData.employeeSales.map((employee: any) => (
                                <tr key={employee.name} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {employee.name}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                                    {formatCurrency(employee.total)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {employee.count}건
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {formatCurrency(employee.total / employee.count)}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {((employee.total / salesDetailData.totalSales) * 100).toFixed(1)}%
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <p className="text-gray-500">데이터를 불러오는 중...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 마케팅 상세 모달 */}
        {showMarketingDetailModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-2xl font-bold text-gray-800">
                  마케팅 유입 분석 {selectedMarketingBrand === 'masgolf' ? '(마스골프)' : selectedMarketingBrand === 'singsingolf' ? '(싱싱골프)' : '(전체)'}
                </h3>
                <div className="flex items-center space-x-2">
                  <select
                    value={selectedMarketingBrand}
                    onChange={(e) => {
                      const brand = e.target.value as 'masgolf' | 'singsingolf' | 'all';
                      setSelectedMarketingBrand(brand);
                      handleOpenMarketingDetail('month', brand);
                    }}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="all">전체</option>
                    <option value="masgolf">마스골프</option>
                    <option value="singsingolf">싱싱골프</option>
                  </select>
                  <select
                    onChange={(e) => handleOpenMarketingDetail(e.target.value as 'today' | 'week' | 'month' | 'quarter' | 'year', selectedMarketingBrand)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    defaultValue="month"
                  >
                    <option value="today">오늘</option>
                    <option value="week">이번 주</option>
                    <option value="month">이번 달</option>
                    <option value="quarter">이번 분기</option>
                    <option value="year">올해</option>
                  </select>
                  <button
                    onClick={() => setShowMarketingDetailModal(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-6 w-6 text-gray-500" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                {marketingDetailData ? (
                  <div className="space-y-8">
                    {/* 요약 정보 */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <div className="bg-blue-50 p-6 rounded-xl">
                        <h4 className="text-lg font-semibold text-blue-800 mb-2">총 상담 건수</h4>
                        <p className="text-3xl font-bold text-blue-900">
                          {marketingDetailData.totalTasks}건
                        </p>
                        <p className="text-sm text-blue-600 mt-1">
                          {marketingDetailData.startDate} ~ {marketingDetailData.endDate}
                        </p>
                      </div>
                      <div className="bg-green-50 p-6 rounded-xl">
                        <h4 className="text-lg font-semibold text-green-800 mb-2">전환 건수</h4>
                        <p className="text-3xl font-bold text-green-900">
                          {marketingDetailData.convertedTasks}건
                        </p>
                        <p className="text-sm text-green-600 mt-1">
                          매출 발생 업무
                        </p>
                      </div>
                      <div className="bg-purple-50 p-6 rounded-xl">
                        <h4 className="text-lg font-semibold text-purple-800 mb-2">전환율</h4>
                        <p className="text-3xl font-bold text-purple-900">
                          {marketingDetailData.conversionRate.toFixed(1)}%
                        </p>
                        <p className="text-sm text-purple-600 mt-1">
                          상담 → 매출 전환
                        </p>
                      </div>
                      <div className="bg-orange-50 p-6 rounded-xl">
                        <h4 className="text-lg font-semibold text-orange-800 mb-2">신규 고객</h4>
                        <p className="text-3xl font-bold text-orange-900">
                          {marketingDetailData.customerTypeAnalysis.new.total}건
                        </p>
                        <p className="text-sm text-orange-600 mt-1">
                          {((marketingDetailData.customerTypeAnalysis.new.total / marketingDetailData.totalTasks) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>

                    {/* 채널별 분석 */}
                    <div>
                      <h4 className="text-xl font-bold text-gray-800 mb-4">채널별 유입 분석</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Object.entries(marketingDetailData.channelAnalysis).map(([channel, data]: [string, any]) => (
                          <div key={channel} className="bg-white border border-gray-200 rounded-xl p-6">
                            <div className="flex items-center justify-between mb-4">
                              <h5 className="text-lg font-semibold text-gray-800 capitalize">
                                {channel === 'phone' ? '전화' : 
                                 channel === 'kakao' ? '카카오톡' :
                                 channel === 'smartstore' ? '스마트스토어' :
                                 channel === 'official_website' ? '공식 웹사이트' : channel}
                              </h5>
                              <span className="text-sm text-gray-500">{data.total}건</span>
                            </div>
                            <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">신규 고객</span>
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-semibold text-blue-600">{data.new}건</span>
                                  <div className="w-16 bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-blue-600 h-2 rounded-full" 
                                      style={{ width: `${data.total > 0 ? (data.new / data.total) * 100 : 0}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">기존 고객</span>
                                <div className="flex items-center space-x-2">
                                  <span className="text-sm font-semibold text-green-600">{data.existing}건</span>
                                  <div className="w-16 bg-gray-200 rounded-full h-2">
                                    <div 
                                      className="bg-green-600 h-2 rounded-full" 
                                      style={{ width: `${data.total > 0 ? (data.existing / data.total) * 100 : 0}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 고객 유형별 분석 */}
                    <div>
                      <h4 className="text-xl font-bold text-gray-800 mb-4">고객 유형별 분석</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
                          <h5 className="text-lg font-semibold text-blue-800 mb-4">신규 고객</h5>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-sm text-blue-600">상담 건수</span>
                              <span className="font-semibold text-blue-800">
                                {marketingDetailData.customerTypeAnalysis.new.total}건
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-blue-600">매출액</span>
                              <span className="font-semibold text-blue-800">
                                {formatCurrency(marketingDetailData.customerTypeAnalysis.new.sales)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-blue-600">비율</span>
                              <span className="font-semibold text-blue-800">
                                {((marketingDetailData.customerTypeAnalysis.new.total / marketingDetailData.totalTasks) * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-xl p-6">
                          <h5 className="text-lg font-semibold text-green-800 mb-4">기존 고객</h5>
                          <div className="space-y-3">
                            <div className="flex justify-between">
                              <span className="text-sm text-green-600">상담 건수</span>
                              <span className="font-semibold text-green-800">
                                {marketingDetailData.customerTypeAnalysis.existing.total}건
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-green-600">매출액</span>
                              <span className="font-semibold text-green-800">
                                {formatCurrency(marketingDetailData.customerTypeAnalysis.existing.sales)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm text-green-600">비율</span>
                              <span className="font-semibold text-green-800">
                                {((marketingDetailData.customerTypeAnalysis.existing.total / marketingDetailData.totalTasks) * 100).toFixed(1)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                      <p className="text-gray-500">데이터를 불러오는 중...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

    </div>
  );
}
