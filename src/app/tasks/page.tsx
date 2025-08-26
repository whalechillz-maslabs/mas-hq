'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, auth, db } from '@/lib/supabase';
import { formatDateKR, formatDateISO } from '@/utils/dateUtils';
import { getStatusLabel, getStatusColor, getPriorityLabel, getPriorityColor } from '@/utils/formatUtils';
import { 
  BarChart3, Plus, ChevronLeft, Filter, Award, Target,
  Clock, CheckCircle, AlertCircle, TrendingUp, Edit, Trash2
} from 'lucide-react';

interface OperationType {
  id: string;
  code: string;
  name: string;
  category: string;
  points: number;
  target_roles?: string[];
}

interface Task {
  id: string;
  employee_id: string;
  operation_type_id: string;
  operation_type?: OperationType;
  title: string;
  notes?: string;
  quantity: number;
  memo?: string;
  created_at: string;
  updated_at: string;
  
  // 새로운 필드들
  task_date?: string;
  task_time?: string;
  customer_name?: string;
  sales_amount?: number;
  performer_id?: string;
  achievement_status?: string;
  task_priority?: string;
}

export default function TasksPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [operationTypes, setOperationTypes] = useState<OperationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [filter, setFilter] = useState('all');
  const [selectedOperationType, setSelectedOperationType] = useState<OperationType | null>(null);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundTargetTask, setRefundTargetTask] = useState<Task | null>(null);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    totalPoints: 0,
    pendingTasks: 0
  });

  useEffect(() => {
    loadTasksData();
  }, [selectedMonth, filter]);

  const loadTasksData = async () => {
    try {
      const user = await auth.getCurrentUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setCurrentUser(user);

      // 업무 유형 로드
      const { data: opTypes, error: opError } = await supabase
        .from('operation_types')
        .select('*')
        .eq('is_active', true)
        .order('code');

      if (opError) throw opError;

      // OP 순서를 올바르게 정렬 (OP1, OP2, OP3, ..., OP10)
      const sortedOpTypes = (opTypes || []).sort((a, b) => {
        const aNum = parseInt(a.code.replace('OP', ''));
        const bNum = parseInt(b.code.replace('OP', ''));
        return aNum - bNum;
      });

      setOperationTypes(sortedOpTypes);

      // 업무 기록 로드
      const startDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
      const endDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);

      let query = supabase
        .from('employee_tasks')
        .select(`
          *,
          operation_type:operation_types(code, name, category, points)
        `)
        .gte('created_at', formatDateISO(startDate))
        .lte('created_at', formatDateISO(endDate))
        .eq('employee_id', user.id)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('achievement_status', filter);
      }

      const { data: tasksData, error: tasksError } = await query;
      
      if (tasksError) throw tasksError;
      setTasks(tasksData || []);

      // 통계 계산
      const totalTasks = tasksData?.length || 0;
      const completedTasks = tasksData?.filter((t: Task) => t.achievement_status === 'completed').length || 0;
      const totalPoints = tasksData?.reduce((sum: number, t: Task) => {
        const opType = t.operation_type;
        return sum + ((opType?.points || 0) * (t.quantity || 1));
      }, 0) || 0;
      const pendingTasks = tasksData?.filter((t: Task) => t.achievement_status === 'pending').length || 0;

      setStats({ totalTasks, completedTasks, totalPoints, pendingTasks });
    } catch (error) {
      console.error('업무 데이터 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (taskData: any) => {
    try {
      const { data, error } = await supabase
        .from('employee_tasks')
        .insert({
          employee_id: currentUser.id,
          ...taskData,
          achievement_status: 'pending',
          task_priority: taskData.task_priority || 'normal',
          sales_amount: taskData.sales_amount || 0,
          created_at: taskData.task_date ? new Date(taskData.task_date).toISOString() : new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      
      setShowAddModal(false);
      loadTasksData();
    } catch (error) {
      console.error('업무 추가 실패:', error);
    }
  };

  const showOperationTypeDetails = (opType: OperationType) => {
    setSelectedOperationType(opType);
  };

  const getOperationTypeDescription = (code: string): string => {
    const descriptions: { [key: string]: string } = {
      'OP1': '신규 고객에게 전화로 제품을 설명하고 결제를 유도하는 업무입니다.',
      'OP2': '기존 고객의 재구매나 부품 구매를 전화로 처리하는 업무입니다.',
      'OP3': '신규 고객을 대상으로 오프라인에서 제품을 설명하고 구매를 성사시키는 업무입니다.',
      'OP4': '기존 고객의 재구매나 부품 구매를 오프라인에서 처리하는 업무입니다.',
      'OP5': '1. 오프라인 판매(시타 동반/보조): 매장 방문 고객 응대 보조, 팀장 리드하에 보조 참여<br/>2. 인트라넷 등록 업무: 거래 성사를 위한 팀장 연결 전까지 통화<br/>3. 프로모션 설명, 인트라넷/노션 정보 입력, 시타예약 입력',
      'OP6': '고급 A/S 처리 및 기술적 문제 해결 업무입니다.',
      'OP7': '고객의 환불 요청을 방어하고 유지하는 업무입니다.',
      'OP8': '환불 처리를 담당하는 업무입니다. 기존 판매 점수가 차감됩니다.',
      'OP9': '상품 관련 택배의 입고, 출고, 회수를 처리하는 업무입니다.',
      'OP10': '음료, 소모품, 선물 등 기타 택배 및 서비스를 처리하는 업무입니다.'
    };
    return descriptions[code] || '업무 설명이 없습니다.';
  };

  const getOperationTypePointsInfo = (code: string): string => {
    const pointsInfo: { [key: string]: string } = {
      'OP1': '건당 20점이 부여됩니다. 신규 고객 전화 판매 성공 시에만 인정됩니다.',
      'OP2': '건당 15점이 부여됩니다. 재구매/부품 전화 판매에 적용됩니다.',
      'OP3': '건당 40점이 부여됩니다. 신규 고객 오프라인 판매(시타 메인 or 단독판매) 성공 시에만 인정됩니다.',
      'OP4': '건당 30점이 부여됩니다. 재구매/부품 오프라인 판매(시타 메인 or 단독판매)에 적용됩니다.',
      'OP5': '건당 8점이 부여됩니다. 기본적인 고객 응대 업무입니다.',
      'OP6': '건당 15점이 부여됩니다. 고급 A/S 처리가 필요한 경우에만 인정됩니다.',
      'OP7': '건당 25점이 부여됩니다. 환불 방어 성공 시에만 인정됩니다.',
      'OP8': '기존 판매 점수가 그대로 차감됩니다. 환불 처리 담당자에게는 점수가 부여되지 않습니다.',
      'OP9': '건당 8점이 부여됩니다. 상품 관련 택배 처리 업무입니다.',
      'OP10': '건당 5점이 부여됩니다. 음료/소모품/선물 등 기타 택배 및 서비스 업무입니다.'
    };
    return pointsInfo[code] || '점수 정보가 없습니다.';
  };

  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    try {
      const updateData: any = { 
        achievement_status: newStatus,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('employee_tasks')
        .update(updateData)
        .eq('id', taskId);

      if (error) throw error;
      
      loadTasksData();
    } catch (error) {
      console.error('업무 상태 업데이트 실패:', error);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowEditModal(true);
  };

  const handleUpdateTask = async (taskData: any) => {
    try {
      const { error } = await supabase
        .from('employee_tasks')
        .update({
          ...taskData,
          updated_at: new Date().toISOString(),
          sales_amount: parseFloat((taskData.sales_amount as string).replace(/,/g, '')) || 0
        })
        .eq('id', editingTask?.id);

      if (error) throw error;
      
      setShowEditModal(false);
      setEditingTask(null);
      loadTasksData();
    } catch (error) {
      console.error('업무 수정 실패:', error);
    }
  };

  const handleRefundTask = (task: Task) => {
    setRefundTargetTask(task);
    setShowRefundModal(true);
  };

  const handleCreateRefund = async (refundData: any) => {
    try {
      if (!refundTargetTask) return;

      // 환불 처리 업무 생성 (OP8)
      const op8Type = operationTypes.find(op => op.code === 'OP8');
      if (!op8Type) {
        console.error('OP8 업무 유형을 찾을 수 없습니다.');
        return;
      }

      // 원본 업무의 점수를 음수로 변환
      const originalPoints = (refundTargetTask.operation_type?.points || 0) * (refundTargetTask.quantity || 1);
      const refundPoints = -originalPoints;

      const { error } = await supabase
        .from('employee_tasks')
        .insert({
          employee_id: currentUser.id,
          operation_type_id: op8Type.id,
          title: `환불 처리 - ${refundTargetTask.title}`,
          notes: `원본 업무: ${refundTargetTask.operation_type?.code} - ${refundTargetTask.operation_type?.name}\n${refundData.notes || ''}`,
          quantity: 1,
          memo: refundData.memo || '',
          task_time: refundData.task_time || null,
          customer_name: refundTargetTask.customer_name || '',
          sales_amount: -(refundTargetTask.sales_amount || 0), // 매출도 음수로
          task_priority: refundData.task_priority || 'normal',
          achievement_status: 'pending',
          task_date: refundData.task_date,
          created_at: refundData.task_date ? new Date(refundData.task_date).toISOString() : new Date().toISOString()
        });

      if (error) throw error;
      
      setShowRefundModal(false);
      setRefundTargetTask(null);
      loadTasksData();
    } catch (error) {
      console.error('환불 처리 실패:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('employee_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      loadTasksData();
    } catch (error) {
      console.error('업무 삭제 실패:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="mr-4"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h1 className="text-xl font-semibold">업무 기록</h1>
            </div>
            
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              업무 추가
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">총 업무</span>
              <BarChart3 className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold">{stats.totalTasks}건</p>
            <p className="text-sm text-gray-500 mt-1">이번 달</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">완료 업무</span>
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-green-600">{stats.completedTasks}건</p>
            <p className="text-sm text-gray-500 mt-1">
              달성률 {stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%
            </p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">획득 포인트</span>
              <Award className="h-5 w-5 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-purple-600">{stats.totalPoints}점</p>
            <p className="text-sm text-gray-500 mt-1">성과 포인트</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">대기 중</span>
              <Clock className="h-5 w-5 text-yellow-500" />
            </div>
            <p className="text-2xl font-bold text-yellow-600">{stats.pendingTasks}건</p>
            <p className="text-sm text-gray-500 mt-1">처리 대기</p>
          </div>
        </div>

        {/* 필터 */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-700">기간:</span>
              <input
                type="month"
                value={`${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}`}
                onChange={(e) => {
                  const [year, month] = e.target.value.split('-');
                  setSelectedMonth(new Date(parseInt(year), parseInt(month) - 1));
                }}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="h-5 w-5 text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-1 text-sm"
              >
                <option value="all">전체</option>
                <option value="pending">대기</option>
                <option value="in_progress">진행중</option>
                <option value="completed">완료</option>
                <option value="verified">검증됨</option>
              </select>
            </div>
          </div>
        </div>

        {/* 업무 목록 */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  날짜
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  업무 유형
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                  업무명
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  고객명
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-28">
                  매출
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                  수량
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  포인트
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  우선순위
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                  상태
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                  액션
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tasks.map((task) => (
                <tr key={task.id}>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {task.task_date ? formatDateKR(task.task_date) : formatDateKR(task.created_at)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {task.operation_type?.code}
                      </p>
                      <p className="text-sm text-gray-500">
                        {task.operation_type?.name}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {task.title || '-'}
                      </p>
                      {task.notes && (
                        <p className="text-sm text-gray-500 truncate max-w-xs">
                          {task.notes}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {task.customer_name || '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {task.sales_amount ? `${task.sales_amount.toLocaleString()}원` : '-'}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {task.quantity}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Award className="h-4 w-4 mr-1 text-purple-500" />
                      <span className="text-sm font-medium text-purple-600">
                        {(task.operation_type?.points || 0) * (task.quantity || 1)}점
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getPriorityColor(task.task_priority || 'normal')}`}>
                      {getPriorityLabel(task.task_priority || 'normal')}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(task.achievement_status || 'pending')}`}>
                      {getStatusLabel(task.achievement_status || 'pending')}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      {task.achievement_status === 'pending' && (
                        <button
                          onClick={() => handleUpdateStatus(task.id, 'completed')}
                          className="text-green-600 hover:text-green-900"
                          title="완료"
                        >
                          완료
                        </button>
                      )}
                      {task.achievement_status === 'pending' && (
                        <button
                          onClick={() => handleEditTask(task)}
                          className="text-blue-600 hover:text-blue-900"
                          title="수정"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                      )}
                      {/* 환불 처리는 완료된 업무에만 가능 */}
                      {task.achievement_status === 'completed' && task.operation_type?.code !== 'OP8' && (
                        <button
                          onClick={() => handleRefundTask(task)}
                          className="text-orange-600 hover:text-orange-900"
                          title="환불 처리"
                        >
                          환불
                        </button>
                      )}
                      {task.achievement_status === 'pending' && (
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-red-600 hover:text-red-900"
                          title="삭제"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
            </div>
        </div>

        {/* 업무 유형별 통계 */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">업무 유형별 분포</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {operationTypes.slice(0, 10).map((opType) => {
              const count = tasks.filter(t => t.operation_type_id === opType.id).length;
              const points = tasks
                .filter(t => t.operation_type_id === opType.id)
                .reduce((sum, t) => sum + ((t.operation_type?.points || 0) * (t.quantity || 1)), 0);
              
              return (
                <div 
                  key={opType.id} 
                  className="text-center p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer bg-gradient-to-br from-blue-50 to-indigo-50"
                  title={`${opType.name} - ${opType.points}점`}
                  onClick={() => showOperationTypeDetails(opType)}
                >
                  <div className="flex items-center justify-center mb-2">
                    <span className="text-xs bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full font-medium">
                      {opType.code}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-800 mb-1 leading-tight">
                    {opType.name}
                  </p>
                  <p className="text-xs text-gray-600 mb-2">
                    {opType.points}점
                  </p>
                  <div className="text-xs text-gray-500 bg-white rounded px-2 py-1">
                    {count}건 / {points}점
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* 업무 유형 상세 정보 모달 */}
          {selectedOperationType && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">업무 상세 정보</h3>
                  <button
                    onClick={() => setSelectedOperationType(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm bg-indigo-100 text-indigo-800 px-2 py-1 rounded font-medium">
                      {selectedOperationType.code}
                    </span>
                    <h4 className="text-lg font-semibold">{selectedOperationType.name}</h4>
                  </div>
                  
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>업무 설명:</strong>
                    </p>
                    <p 
                      className="text-sm text-gray-600"
                      dangerouslySetInnerHTML={{ 
                        __html: getOperationTypeDescription(selectedOperationType.code) 
                      }}
                    />
                  </div>
                  
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>점수 계산:</strong>
                    </p>
                    <p className="text-sm text-gray-600">
                      {getOperationTypePointsInfo(selectedOperationType.code)}
                    </p>
                  </div>
                  
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-700 mb-2">
                      <strong>대상 직급:</strong>
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedOperationType.target_roles?.join(', ') || '모든 직급'}
                    </p>
                  </div>
                  
                  <div className="text-center">
                    <button
                      onClick={() => {
                        setSelectedOperationType(null);
                        setShowAddModal(true);
                      }}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                    >
                      이 업무로 기록하기
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 업무 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">업무 추가</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleAddTask({
                  task_date: formData.get('task_date') as string,
                  operation_type_id: formData.get('operation_type_id'),
                  title: formData.get('title') || '',
                  notes: formData.get('notes') || '',
                  quantity: parseInt(formData.get('quantity') as string) || 1,
                  memo: formData.get('memo') || '',
                  task_time: formData.get('task_time') || null,
                  customer_name: formData.get('customer_name') || '',
                  sales_amount: parseFloat((formData.get('sales_amount') as string).replace(/,/g, '')) || 0,
                  task_priority: formData.get('task_priority') || 'normal'
                });
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    업무 날짜
                  </label>
                  <input
                    type="date"
                    name="task_date"
                    required
                    defaultValue={formatDateISO(new Date())}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    업무 유형
                  </label>
                  <select
                    name="operation_type_id"
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">선택하세요</option>
                    {operationTypes.map((opType) => (
                      <option key={opType.id} value={opType.id}>
                        {opType.code} - {opType.name} ({opType.points}점)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    업무명
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="업무 제목을 입력하세요"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    설명
                  </label>
                  <textarea
                    name="notes"
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="업무 내용 설명 (선택)"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      수량
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      min="1"
                      defaultValue="1"
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      우선순위
                    </label>
                    <select
                      name="task_priority"
                      defaultValue="normal"
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="low">낮음</option>
                      <option value="normal">보통</option>
                      <option value="high">높음</option>
                      <option value="urgent">긴급</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      업무 수행 시각
                    </label>
                    <input
                      type="time"
                      name="task_time"
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="09:00"
                      step="600"
                      defaultValue={(() => {
                        const now = new Date();
                        const minutes = Math.floor(now.getMinutes() / 10) * 10;
                        now.setMinutes(minutes, 0, 0);
                        return now.toTimeString().slice(0, 5);
                      })()}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      고객명
                    </label>
                    <input
                      type="text"
                      name="customer_name"
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="VIP0000 (선택)"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    매출 금액
                  </label>
                  <input
                    type="text"
                    name="sales_amount"
                    defaultValue="0"
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="판매 시에만 입력 (원)"
                    onChange={(e) => {
                      // 숫자와 쉼표만 허용
                      const value = e.target.value.replace(/[^\d,]/g, '');
                      // 쉼표 제거 후 숫자로 변환
                      const numValue = value.replace(/,/g, '');
                      if (numValue === '' || !isNaN(Number(numValue))) {
                        // 천단위 쉼표 추가
                        const formattedValue = numValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                        e.target.value = formattedValue;
                      }
                    }}
                    onBlur={(e) => {
                      // 포커스 아웃 시 숫자만 남기고 쉼표 제거
                      const numValue = e.target.value.replace(/,/g, '');
                      if (numValue === '') {
                        e.target.value = '0';
                      }
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    메모
                  </label>
                  <textarea
                    name="memo"
                    rows={2}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="추가 메모 (선택)"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  추가
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 업무 수정 모달 */}
      {showEditModal && editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">업무 수정</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleUpdateTask({
                  task_date: formData.get('task_date') as string,
                  operation_type_id: formData.get('operation_type_id'),
                  title: formData.get('title') || '',
                  notes: formData.get('notes') || '',
                  quantity: parseInt(formData.get('quantity') as string) || 1,
                  memo: formData.get('memo') || '',
                  task_time: formData.get('task_time') || null,
                  customer_name: formData.get('customer_name') || '',
                  sales_amount: formData.get('sales_amount') as string,
                  task_priority: formData.get('task_priority') || 'normal'
                });
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    업무 날짜
                  </label>
                  <input
                    type="date"
                    name="task_date"
                    required
                    defaultValue={editingTask.task_date || formatDateISO(new Date(editingTask.created_at))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    업무 유형
                  </label>
                  <select
                    name="operation_type_id"
                    required
                    defaultValue={editingTask.operation_type_id}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="">선택하세요</option>
                    {operationTypes.map((opType) => (
                      <option key={opType.id} value={opType.id}>
                        {opType.code} - {opType.name} ({opType.points}점)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    업무명
                  </label>
                  <input
                    type="text"
                    name="title"
                    required
                    defaultValue={editingTask.title}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="업무 제목을 입력하세요"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    설명
                  </label>
                  <textarea
                    name="notes"
                    rows={3}
                    defaultValue={editingTask.notes || ''}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="업무 내용 설명 (선택)"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      수량
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      min="1"
                      defaultValue={editingTask.quantity || 1}
                      required
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      우선순위
                    </label>
                    <select
                      name="task_priority"
                      defaultValue={editingTask.task_priority || 'normal'}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="low">낮음</option>
                      <option value="normal">보통</option>
                      <option value="high">높음</option>
                      <option value="urgent">긴급</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      업무 수행 시각
                    </label>
                    <input
                      type="time"
                      name="task_time"
                      defaultValue={editingTask.task_time || ''}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="09:00"
                      step="600"
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
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="VIP0000 (선택)"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    매출 금액
                  </label>
                  <input
                    type="text"
                    name="sales_amount"
                    defaultValue={editingTask.sales_amount ? editingTask.sales_amount.toLocaleString() : '0'}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="판매 시에만 입력 (원)"
                    onChange={(e) => {
                      // 숫자와 쉼표만 허용
                      const value = e.target.value.replace(/[^\d,]/g, '');
                      // 쉼표 제거 후 숫자로 변환
                      const numValue = value.replace(/,/g, '');
                      if (numValue === '' || !isNaN(Number(numValue))) {
                        // 천단위 쉼표 추가
                        const formattedValue = numValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                        e.target.value = formattedValue;
                      }
                    }}
                    onBlur={(e) => {
                      // 포커스 아웃 시 숫자만 남기고 쉼표 제거
                      const numValue = e.target.value.replace(/,/g, '');
                      if (numValue === '') {
                        e.target.value = '0';
                      }
                    }}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    메모
                  </label>
                  <textarea
                    name="memo"
                    rows={2}
                    defaultValue={editingTask.memo || ''}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="추가 메모 (선택)"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingTask(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  수정
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 환불 처리 모달 */}
      {showRefundModal && refundTargetTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">환불 처리</h3>
            
            {/* 원본 업무 정보 표시 */}
            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <h4 className="font-medium text-gray-800 mb-2">원본 업무 정보</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>업무:</strong> {refundTargetTask.operation_type?.code} - {refundTargetTask.operation_type?.name}</p>
                <p><strong>제목:</strong> {refundTargetTask.title}</p>
                <p><strong>고객:</strong> {refundTargetTask.customer_name || '-'}</p>
                <p><strong>매출:</strong> {refundTargetTask.sales_amount ? `${refundTargetTask.sales_amount.toLocaleString()}원` : '-'}</p>
                <p><strong>차감될 점수:</strong> <span className="text-red-600 font-medium">-{(refundTargetTask.operation_type?.points || 0) * (refundTargetTask.quantity || 1)}점</span></p>
              </div>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleCreateRefund({
                  task_date: formData.get('task_date') as string,
                  notes: formData.get('notes') || '',
                  memo: formData.get('memo') || '',
                  task_time: formData.get('task_time') || null,
                  task_priority: formData.get('task_priority') || 'normal'
                });
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    환불 날짜
                  </label>
                  <input
                    type="date"
                    name="task_date"
                    required
                    defaultValue={formatDateISO(new Date())}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    환불 사유
                  </label>
                  <textarea
                    name="notes"
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="환불 사유를 입력하세요 (필수)"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      환불 시각
                    </label>
                    <input
                      type="time"
                      name="task_time"
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="09:00"
                      step="600"
                      defaultValue={(() => {
                        const now = new Date();
                        const minutes = Math.floor(now.getMinutes() / 10) * 10;
                        now.setMinutes(minutes, 0, 0);
                        return now.toTimeString().slice(0, 5);
                      })()}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      우선순위
                    </label>
                    <select
                      name="task_priority"
                      defaultValue="high"
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    >
                      <option value="low">낮음</option>
                      <option value="normal">보통</option>
                      <option value="high">높음</option>
                      <option value="urgent">긴급</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    메모
                  </label>
                  <textarea
                    name="memo"
                    rows={2}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                    placeholder="추가 메모 (선택)"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowRefundModal(false);
                    setRefundTargetTask(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  환불 처리
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
