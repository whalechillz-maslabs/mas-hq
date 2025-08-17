'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, auth, db } from '@/lib/supabase';
import { formatDateKR, formatDateISO } from '@/utils/dateUtils';
import { getStatusLabel, getStatusColor, getPriorityLabel, getPriorityColor } from '@/utils/formatUtils';
import { 
  BarChart3, Plus, ChevronLeft, Filter, Award, Target,
  Clock, CheckCircle, AlertCircle, TrendingUp, Edit, Trash2, Users, Eye
} from 'lucide-react';
import { 
  checkTaskPermission, 
  getAvailableOperationTypes, 
  canViewAllTasks, 
  canEditTasks, 
  canDeleteTasks,
  getTeamMembers 
} from '@/lib/permissions';

interface OperationType {
  id: string;
  code: string;
  name: string;
  category: string;
  points: number;
}

interface Task {
  id: string;
  employee_id: string;
  operation_type_id: string;
  task_date: string;
  task_name: string;
  description: string;
  quantity: number;
  points_earned: number;
  status: string;
  priority: string;
  employee_memo: string;
  manager_memo: string;
  created_at: string;
  updated_at: string;
  operation_type: OperationType;
  employee?: {
    name: string;
    employee_id: string;
  };
}

interface TeamMember {
  team_member_id: string;
  employee_name: string;
  employee_id: string;
  department_name: string;
}

export default function TasksPageWithPermissions() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [operationTypes, setOperationTypes] = useState<OperationType[]>([]);
  const [availableOperationTypes, setAvailableOperationTypes] = useState<OperationType[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [filter, setFilter] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'my' | 'team' | 'all'>('my');
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    totalPoints: 0,
    pendingTasks: 0
  });

  useEffect(() => {
    loadTasksData();
  }, [selectedMonth, filter, selectedEmployee, viewMode]);

  const loadTasksData = async () => {
    try {
      const user = await auth.getCurrentUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setCurrentUser(user);

      // 사용 가능한 업무 유형 로드
      const availableTypes = await getAvailableOperationTypes(user.id);
      setAvailableOperationTypes(availableTypes);

      // 모든 업무 유형 로드 (관리자용)
      const { data: opTypes, error: opError } = await supabase
        .from('operation_types')
        .select('*')
        .eq('is_active', true)
        .order('code');

      if (opError) throw opError;
      setOperationTypes(opTypes || []);

      // 팀원 목록 로드 (팀장/매니저용)
      if (canViewAllTasks(user.role_id)) {
        const teamMembersList = await getTeamMembers(user.id);
        setTeamMembers(teamMembersList);
      }

      // 업무 기록 로드
      const startDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 1);
      const endDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0);

      let query = supabase
        .from('employee_tasks')
        .select(`
          *,
          operation_type:operation_types(code, name, category, points),
          employee:employees(name, employee_id)
        `)
        .gte('task_date', formatDateISO(startDate))
        .lte('task_date', formatDateISO(endDate))
        .order('task_date', { ascending: false });

      // 권한에 따른 필터링
      if (viewMode === 'my' || !canViewAllTasks(user.role_id)) {
        // 본인 업무만
        query = query.eq('employee_id', user.id);
      } else if (viewMode === 'team' && canViewAllTasks(user.role_id)) {
        // 팀원 업무
        const teamMemberIds = teamMembers.map(member => member.team_member_id);
        if (teamMemberIds.length > 0) {
          query = query.in('employee_id', [user.id, ...teamMemberIds]);
        } else {
          query = query.eq('employee_id', user.id);
        }
      }
      // viewMode === 'all'이면 모든 업무 (관리자만)

      if (selectedEmployee !== 'all') {
        query = query.eq('employee_id', selectedEmployee);
      }

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data: tasksData, error: tasksError } = await query;
      
      if (tasksError) throw tasksError;
      setTasks(tasksData || []);

      // 통계 계산
      const totalTasks = tasksData?.length || 0;
      const completedTasks = tasksData?.filter((t: Task) => t.status === 'completed' || t.status === 'verified').length || 0;
      const totalPoints = tasksData?.reduce((sum: number, t: Task) => sum + t.points_earned, 0) || 0;
      const pendingTasks = tasksData?.filter((t: Task) => t.status === 'pending').length || 0;

      setStats({ totalTasks, completedTasks, totalPoints, pendingTasks });
    } catch (error) {
      console.error('업무 데이터 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTask = async (taskData: any) => {
    try {
      // 권한 확인
      const hasPermission = await checkOperationTypePermission(
        currentUser.id,
        taskData.operation_type_id,
        'create'
      );

      if (!hasPermission) {
        alert('해당 업무 유형을 추가할 권한이 없습니다.');
        return;
      }

      const operationType = operationTypes.find(op => op.id === taskData.operation_type_id);
      const pointsEarned = (operationType?.points || 0) * taskData.quantity;

      const { data, error } = await supabase
        .from('employee_tasks')
        .insert({
          employee_id: currentUser.id,
          ...taskData,
          points_earned: pointsEarned,
          status: 'pending'
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

  const handleUpdateStatus = async (taskId: string, newStatus: string) => {
    try {
      // 권한 확인
      const hasPermission = await checkTaskPermission(
        currentUser.id,
        taskId,
        'update'
      );

      if (!hasPermission) {
        alert('해당 업무를 수정할 권한이 없습니다.');
        return;
      }

      const updateData: any = { status: newStatus };
      
      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('employee_tasks')
        .update(updateData)
        .eq('id', taskId);

      if (error) throw error;
      loadTasksData();
    } catch (error) {
      console.error('상태 업데이트 실패:', error);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      // 권한 확인
      const hasPermission = await checkTaskPermission(
        currentUser.id,
        taskId,
        'delete'
      );

      if (!hasPermission) {
        alert('해당 업무를 삭제할 권한이 없습니다.');
        return;
      }

      if (!confirm('정말로 이 업무를 삭제하시겠습니까?')) {
        return;
      }

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

  const getDisplayOperationTypes = () => {
    // 관리자는 모든 업무 유형, 다른 사용자는 권한이 있는 것만
    if (currentUser?.role_id === 'admin') {
      return operationTypes;
    }
    return availableOperationTypes;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="flex items-center text-gray-600 hover:text-gray-900"
              >
                <ChevronLeft className="h-5 w-5 mr-1" />
                업무 기록
              </button>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* 권한에 따른 뷰 모드 선택 */}
              {canViewAllTasks(currentUser?.role_id) && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setViewMode('my')}
                    className={`px-3 py-1 rounded-md text-sm ${
                      viewMode === 'my' 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    내 업무
                  </button>
                  <button
                    onClick={() => setViewMode('team')}
                    className={`px-3 py-1 rounded-md text-sm ${
                      viewMode === 'team' 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    팀 업무
                  </button>
                  {currentUser?.role_id === 'admin' && (
                    <button
                      onClick={() => setViewMode('all')}
                      className={`px-3 py-1 rounded-md text-sm ${
                        viewMode === 'all' 
                          ? 'bg-indigo-600 text-white' 
                          : 'bg-gray-200 text-gray-700'
                      }`}
                    >
                      전체 업무
                    </button>
                  )}
                </div>
              )}
              
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                업무 추가
              </button>
            </div>
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
              
              {/* 직원 필터 (팀장/매니저/관리자만) */}
              {canViewAllTasks(currentUser?.role_id) && (
                <>
                  <span className="text-sm font-medium text-gray-700">직원:</span>
                  <select
                    value={selectedEmployee}
                    onChange={(e) => setSelectedEmployee(e.target.value)}
                    className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                  >
                    <option value="all">전체</option>
                    {teamMembers.map((member) => (
                      <option key={member.team_member_id} value={member.team_member_id}>
                        {member.employee_name} ({member.employee_id})
                      </option>
                    ))}
                  </select>
                </>
              )}
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
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  날짜
                </th>
                {canViewAllTasks(currentUser?.role_id) && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    담당자
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  업무 유형
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  업무명
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  포인트
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
              {tasks.map((task) => (
                <tr key={task.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDateKR(new Date(task.task_date))}
                  </td>
                  {canViewAllTasks(currentUser?.role_id) && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {task.employee?.name || '알 수 없음'}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {task.operation_type?.code} - {task.operation_type?.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {task.task_name || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className={`font-medium ${
                      task.points_earned > 0 ? 'text-green-600' : 
                      task.points_earned < 0 ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {task.points_earned}점
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                      {getStatusLabel(task.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {canEditTasks(currentUser?.role_id) && task.status !== 'completed' && (
                        <button
                          onClick={() => handleUpdateStatus(task.id, 'completed')}
                          className="text-green-600 hover:text-green-900"
                        >
                          완료
                        </button>
                      )}
                      {canDeleteTasks(currentUser?.role_id) && (
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="text-red-600 hover:text-red-900"
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
      </main>

      {/* 업무 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">업무 추가</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleAddTask({
                  task_date: formData.get('task_date'),
                  operation_type_id: formData.get('operation_type_id'),
                  task_name: formData.get('task_name'),
                  description: formData.get('description'),
                  quantity: parseInt(formData.get('quantity') as string) || 1,
                  employee_memo: formData.get('employee_memo')
                });
              }}>
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
                      {getDisplayOperationTypes().map((opType) => (
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
                      name="task_name"
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="업무 제목 (선택)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      설명
                    </label>
                    <textarea
                      name="description"
                      rows={3}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="업무 상세 설명"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      수량
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      min="1"
                      defaultValue="1"
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      메모
                    </label>
                    <textarea
                      name="employee_memo"
                      rows={2}
                      className="w-full border border-gray-300 rounded-md px-3 py-2"
                      placeholder="개인 메모"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
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
        </div>
      )}
    </div>
  );
}
