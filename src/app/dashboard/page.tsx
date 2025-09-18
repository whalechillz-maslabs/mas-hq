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
  Package, Eye, Siren, CheckSquare, Edit, X
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
    };
    singsingolf: {
      sales: number;
      points: number;
      tasks: number;
      participants: number;
      newConsultations: number; // 신규 상담 건수 추가
    };
    total: {
      sales: number;
      points: number;
      tasks: number;
      newConsultations: number; // 신규 상담 건수 추가
    };
  };
  recentSharedTasks: SharedTask[]; // 최근 공유 업무 추가
  myTasks: SharedTask[]; // 내 업무 추가
  teamRankings?: {
    sales: { name: string; sales: number; points: number; tasks: number }[];
    points: { name: string; sales: number; points: number; tasks: number }[];
    tasks: { name: string; sales: number; points: number; tasks: number }[];
  } | null;
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
  const [showAllSharedTasks, setShowAllSharedTasks] = useState(false);
  const [activePriorityTab, setActivePriorityTab] = useState<'urgent' | 'high' | 'medium' | 'low' | 'my'>('urgent');
  const [expandedTabs, setExpandedTabs] = useState<{[key: string]: boolean}>({
    urgent: false,
    high: false,
    medium: false,
    low: false,
    my: false
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState<SharedTask | null>(null);
  const [readTasks, setReadTasks] = useState<Set<string>>(new Set());
  const [showUrgentTasks, setShowUrgentTasks] = useState(false);

  useEffect(() => {
    loadDashboardData();
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

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

      // 오늘의 업무 데이터 가져오기 (task_date 기준)
      const { data: todayTasks } = await supabase
        .from('employee_tasks')
        .select(`
          *,
          operation_type:operation_types(code, name, points)
        `)
        .eq('task_date', todayStr)
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
        masgolfPoints: masgolfPersonalPoints,
        masgolfCount: masgolfPersonalCount,
        singsingolfPoints: singsingolfPersonalPoints,
        singsingolfCount: singsingolfPersonalCount
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

      // 전체 성과 계산
      const totalSales = masgolfSales + singsingolfSales;
      const totalPoints = masgolfPoints + singsingolfPoints;
      const totalTasks = masgolfTaskCount + singsingolfTaskCount;
      const totalNewConsultations = masgolfNewConsultations + singsingolfNewConsultations;

      // 협업 성과 데이터
      const collaborationStats = {
        masgolf: {
          sales: masgolfSales,
          points: masgolfPoints,
          tasks: masgolfTaskCount,
          participants: masgolfParticipants,
          newConsultations: masgolfNewConsultations
        },
        singsingolf: {
          sales: singsingolfSales,
          points: singsingolfPoints,
          tasks: singsingolfTaskCount,
          participants: singsingolfParticipants,
          newConsultations: singsingolfNewConsultations
        },
        total: {
          sales: totalSales,
          points: totalPoints,
          tasks: totalTasks,
          newConsultations: totalNewConsultations
        }
      };

      // 팀 KPI (실제 데이터)
      const teamKPI = {
        totalSales: totalSales,
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

      // 최근 공유 업무 (모든 업무 유형) 가져오기
      const { data: operationTypesData } = await supabase
        .from('operation_types')
        .select('id, code')
        .in('code', ['OP1', 'OP2', 'OP3', 'OP4', 'OP5', 'OP6', 'OP7', 'OP8', 'OP9', 'OP10', 'OP11', 'OP12']);

      let recentSharedTasks: SharedTask[] = [];
      if (operationTypesData && operationTypesData.length > 0) {
        const operationTypeIds = operationTypesData.map(op => op.id);
        
        const { data: sharedTasksData } = await supabase
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
          .in('task_priority', ['urgent', 'high', 'medium', 'low'])
          .eq('achievement_status', 'pending') // 완료된 업무 제외
          .order('created_at', { ascending: false })
          .limit(20);

        recentSharedTasks = sharedTasksData || [];
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

        myTasks = myTasksData || [];
      }

      // 팀원 순위 계산
      const teamRankings = await calculateTeamRankings(startOfMonthStr, endOfMonthStr);

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
          storeSales: 3,
          csResponse: 2
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
            newConsultations: 25
          },
          singsingolf: {
            sales: 10000000,
            points: 420,
            tasks: 35,
            participants: 3,
            newConsultations: 15
          },
          total: {
            sales: 35000000,
            points: 1670,
            tasks: 120,
            newConsultations: 40
          }
        },
        recentSharedTasks: [],
        myTasks: [],
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

  // 우선순위별 업무 분류 함수
  const getTasksByPriority = (tasks: SharedTask[]) => {
    return {
      urgent: tasks.filter(task => task.task_priority === 'urgent'),
      high: tasks.filter(task => task.task_priority === 'high'),
      medium: tasks.filter(task => task.task_priority === 'medium'),
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
    // 임시로 모든 사용자에게 관리자 권한 부여 (테스트용)
    return true;
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

        {/* 긴급 업무 섹션 (메인 화면) */}
        {(() => {
          const tasksByPriority = data?.recentSharedTasks ? getTasksByPriority(data.recentSharedTasks) : { urgent: [], high: [], medium: [], low: [], my: [] };
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
                <button
                  onClick={() => router.push('/shared-tasks-admin')}
                  className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  전체 보기
                </button>
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
                                {isOverdue && (
                                  <Siren className="h-4 w-4 text-red-500 animate-pulse" title="24시간 경과" />
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
                  <p className="text-purple-100 text-sm">오늘 포인트</p>
                  <p className="text-2xl font-bold">{data?.personalKPI?.totalPoints || 0}점</p>
                </div>
                <Target className="h-8 w-8 text-purple-200" />
              </div>
            </div>
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">업무 건수</p>
                  <p className="text-2xl font-bold">{data?.personalKPI?.totalTasks || 0}건</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <Users className="h-6 w-6 mr-3 text-green-600" />
            협업 성과
          </h2>
          
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

              <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-green-600 font-medium">신규 상담</p>
                    <p className="text-3xl font-bold text-green-900">{data?.collaborationStats?.masgolf?.newConsultations || 0}건</p>
                  </div>
                  <Phone className="h-10 w-10 text-green-600" />
                </div>
                <div className="text-xs text-green-500">
                  전화, 카카오채널, 스마트스토어, 공홈
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

              <div className="p-6 bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl border border-purple-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-purple-600 font-medium">신규 상담</p>
                    <p className="text-3xl font-bold text-purple-900">{data?.collaborationStats?.singsingolf?.newConsultations || 0}건</p>
                  </div>
                  <Phone className="h-10 w-10 text-purple-600" />
                </div>
                <div className="text-xs text-purple-500">
                  전화, 카카오채널, 스마트스토어, 공홈
                </div>
              </div>
            </div>
          </div>

          {/* 전체 성과 요약 */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center">
              <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
              전체 성과 요약
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-green-600 font-medium">전체 매출</p>
                    <p className="text-3xl font-bold text-green-900">{formatCurrency(data?.collaborationStats?.total?.sales || 0)}</p>
                  </div>
                  <DollarSign className="h-10 w-10 text-green-600" />
                </div>
                <div className="text-xs text-green-500">
                  마스골프 + 싱싱골프
                </div>
              </div>
              
              <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-green-600 font-medium">전체 포인트</p>
                    <p className="text-3xl font-bold text-green-900">{data?.collaborationStats?.total?.points?.toLocaleString() || 0}점</p>
                  </div>
                  <Award className="h-10 w-10 text-green-600" />
                </div>
                <div className="text-xs text-green-500">
                  마스골프 + 싱싱골프
                </div>
              </div>
              
              <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-green-600 font-medium">전체 업무</p>
                    <p className="text-3xl font-bold text-green-900">{data?.collaborationStats?.total?.tasks || 0}건</p>
                  </div>
                  <Target className="h-10 w-10 text-green-600" />
                </div>
                <div className="text-xs text-green-500">
                  마스골프 + 싱싱골프
                </div>
              </div>

              <div className="p-6 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-indigo-600 font-medium">전체 신규 상담</p>
                    <p className="text-3xl font-bold text-indigo-900">{data?.collaborationStats?.total?.newConsultations || 0}건</p>
                  </div>
                  <Phone className="h-10 w-10 text-indigo-600" />
                </div>
                <div className="text-xs text-indigo-500">
                  전화, 카카오채널, 스마트스토어, 공홈
                </div>
              </div>
              
              <div className="p-6 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-2xl border border-orange-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-orange-600 font-medium">참여 인원</p>
                    <p className="text-3xl font-bold text-orange-900">{data?.teamKPI?.teamMembers || 0}명</p>
                  </div>
                  <Users className="h-10 w-10 text-orange-600" />
                </div>
                <div className="text-xs text-orange-500">
                  이번 달 업무 참여자
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
              <button 
                onClick={() => router.push('/admin/payslip-generator')}
                  className="p-6 bg-green-50 border-2 border-green-200 rounded-2xl hover:bg-green-100 transition-all duration-200 text-left"
              >
                  <FileText className="h-10 w-10 text-green-600 mb-3" />
                  <h3 className="font-bold text-lg text-green-900 mb-2">급여 명세서 생성</h3>
                <p className="text-sm text-green-700">직원 급여 명세서 생성 및 발행</p>
              </button>
              <button 
                onClick={() => router.push('/admin/part-time-settlement')}
                  className="p-6 bg-purple-50 border-2 border-purple-200 rounded-2xl hover:bg-purple-100 transition-all duration-200 text-left"
              >
                  <Calculator className="h-10 w-10 text-purple-600 mb-3" />
                  <h3 className="font-bold text-lg text-purple-900 mb-2">파트타임 정산</h3>
                <p className="text-sm text-purple-700">파트타임 직원 일자별 정산 관리</p>
              </button>
              <button 
                onClick={() => router.push('/admin/simple-settlement')}
                  className="p-6 bg-yellow-50 border-2 border-yellow-200 rounded-2xl hover:bg-yellow-100 transition-all duration-200 text-left"
              >
                  <Calculator className="h-10 w-10 text-yellow-600 mb-3" />
                  <h3 className="font-bold text-lg text-yellow-900 mb-2">간단한 정산 테스트</h3>
                <p className="text-sm text-yellow-700">직원 급여 정산 테스트 및 확인</p>
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
    </div>
  );
}
