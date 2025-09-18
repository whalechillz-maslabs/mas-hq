'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { auth } from '@/lib/supabase';
import { formatDateKR } from '@/utils/dateUtils';
import { 
  Users, Eye, Calendar, User, MessageSquare, 
  Phone, ShoppingCart, Headphones, Shield, Truck, Package,
  ArrowLeft, RefreshCw, Filter, Search, Edit, Trash2, X, Siren, CheckSquare, CheckCircle,
  ChevronUp, ChevronDown
} from 'lucide-react';

interface SharedTask {
  id: string;
  title: string;
  notes?: string;
  memo?: string;
  customer_name?: string;
  sales_amount?: number;
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

export default function SharedTasksAdminPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [sharedTasks, setSharedTasks] = useState<SharedTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [authorFilter, setAuthorFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTask, setEditingTask] = useState<SharedTask | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'urgent' | 'high' | 'medium' | 'low' | 'my' | 'pending' | 'all'>('all');
  const [expandedTabs, setExpandedTabs] = useState<{[key: string]: boolean}>({
    urgent: false,
    high: false,
    medium: false,
    low: false,
    my: false,
    pending: false,
    all: false
  });

  useEffect(() => {
    checkAuth();
    loadSharedTasks();
  }, []);

  const checkAuth = async () => {
    const user = await auth.getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setCurrentUser(user);
  };

  // 관리자 권한 확인 - 간단한 함수로 변경
  const isAdmin = () => {
    // 임시로 모든 사용자에게 권한 부여 (테스트용)
    return true;
  };

  // 탭별 업무 분류 함수
  const getTasksByTab = () => {
    const myTasks = sharedTasks.filter(task => task.employee?.employee_id === currentUser?.employee_id);
    const pendingTasks = sharedTasks.filter(task => task.achievement_status !== 'completed');
    
    return {
      urgent: sharedTasks.filter(task => task.task_priority === 'urgent'),
      high: sharedTasks.filter(task => task.task_priority === 'high'),
      medium: sharedTasks.filter(task => task.task_priority === 'medium'),
      low: sharedTasks.filter(task => task.task_priority === 'low'),
      my: myTasks,
      pending: pendingTasks,
      all: sharedTasks
    };
  };

  // 탭 토글 함수
  const toggleTabExpansion = (tab: string) => {
    setExpandedTabs(prev => ({
      ...prev,
      [tab]: !prev[tab]
    }));
  };

  // 필터링된 업무 목록 계산
  const getFilteredTasks = () => {
    const tasksByTab = getTasksByTab();
    let filtered = tasksByTab[activeTab];

    // 검색어 필터
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(task => 
        task.title?.toLowerCase().includes(term) ||
        task.notes?.toLowerCase().includes(term) ||
        task.employee?.name?.toLowerCase().includes(term) ||
        task.customer_name?.toLowerCase().includes(term)
      );
    }

    return filtered;
  };

  // 업무 수정 함수
  const handleEditTask = (task: SharedTask) => {
    setEditingTask(task);
    setShowEditModal(true);
  };

  // 업무 삭제 함수
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('정말로 이 업무를 삭제하시겠습니까?')) {
      return;
    }

    setIsDeleting(taskId);
    try {
      const { error } = await supabase
        .from('employee_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      // 목록에서 제거
      setSharedTasks(prev => prev.filter(task => task.id !== taskId));
      alert('업무가 성공적으로 삭제되었습니다.');
    } catch (error) {
      console.error('업무 삭제 실패:', error);
      alert('업무 삭제에 실패했습니다.');
    } finally {
      setIsDeleting(null);
    }
  };

  // 업무 수정 저장 함수
  const handleSaveEdit = async (formData: FormData) => {
    if (!editingTask) return;

    try {
      const updateData = {
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

      // 목록 업데이트
      setSharedTasks(prev => prev.map(task => 
        task.id === editingTask.id 
          ? { ...task, ...updateData }
          : task
      ));

      setShowEditModal(false);
      setEditingTask(null);
      alert('업무가 성공적으로 수정되었습니다.');
    } catch (error) {
      console.error('업무 수정 실패:', error);
      alert('업무 수정에 실패했습니다.');
    }
  };

  // 업무 완료 상태 토글 함수
  const handleToggleTaskStatus = async (taskId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
      
      const { error } = await supabase
        .from('employee_tasks')
        .update({ 
          achievement_status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', taskId);

      if (error) throw error;

      // 목록에서 해당 업무의 상태 업데이트
      setSharedTasks(prev => prev.map(task => 
        task.id === taskId 
          ? { ...task, achievement_status: newStatus }
          : task
      ));

      const statusText = newStatus === 'completed' ? '완료' : '미완료';
      alert(`업무가 ${statusText} 상태로 변경되었습니다.`);
    } catch (error) {
      console.error('업무 상태 변경 실패:', error);
      alert('업무 상태 변경에 실패했습니다.');
    }
  };

  const loadSharedTasks = async () => {
    try {
      // 모든 업무 유형 가져오기 - OP1~OP12
      const { data: operationTypesData } = await supabase
        .from('operation_types')
        .select('id, code')
        .in('code', ['OP1', 'OP2', 'OP3', 'OP4', 'OP5', 'OP6', 'OP7', 'OP8', 'OP9', 'OP10', 'OP11', 'OP12']);

      if (operationTypesData && operationTypesData.length > 0) {
        const operationTypeIds = operationTypesData.map(op => op.id);
        
        const { data, error } = await supabase
          .from('employee_tasks')
          .select(`
            id,
            title,
            notes,
            memo,
            customer_name,
            sales_amount,
            task_date,
            created_at,
            task_priority,
            achievement_status,
            operation_type:operation_types(code, name, points),
            employee:employees(name, employee_id)
          `)
          .in('operation_type_id', operationTypeIds)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setSharedTasks(data || []);
      } else {
        setSharedTasks([]);
      }
    } catch (error) {
      console.error('공유 업무 로드 실패:', error);
      setSharedTasks([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getOperationIcon = (code: string) => {
    const iconMap: { [key: string]: any } = {
      'OP10': Package
    };
    return iconMap[code] || Package;
  };

  const filteredTasks = sharedTasks.filter(task => {
    const matchesType = filterType === 'all' || task.operation_type?.code === filterType;
    const matchesSearch = searchTerm === '' || 
      task.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesType && matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="mr-4 p-2 rounded-lg hover:bg-gray-100 flex items-center"
              >
                <ArrowLeft className="h-5 w-5 mr-1" />
                뒤로가기
              </button>
              <div>
            <h1 className="text-2xl font-bold text-gray-900">공유 업무 관리</h1>
            <p className="text-gray-600">모든 업무 유형(OP1~OP12) 공유 업무 관리 - 우선순위별 탭 구조</p>
              </div>
            </div>
            <button
              onClick={loadSharedTasks}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              새로고침
            </button>
          </div>
        </div>
      </div>

      {/* 탭 및 검색 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          {/* 탭 헤더 */}
          {(() => {
            const tasksByTab = getTasksByTab();
            const tabs = [
              { key: 'urgent', label: '긴급', color: 'bg-red-100 text-red-800', count: tasksByTab.urgent.length },
              { key: 'high', label: '높음', color: 'bg-orange-100 text-orange-800', count: tasksByTab.high.length },
              { key: 'medium', label: '보통', color: 'bg-yellow-100 text-yellow-800', count: tasksByTab.medium.length },
              { key: 'low', label: '낮음', color: 'bg-gray-100 text-gray-800', count: tasksByTab.low.length },
              { key: 'my', label: '내 업무', color: 'bg-blue-100 text-blue-800', count: tasksByTab.my.length },
              { key: 'pending', label: '미완료', color: 'bg-green-100 text-green-800', count: tasksByTab.pending.length },
              { key: 'all', label: '전체', color: 'bg-indigo-100 text-indigo-800', count: tasksByTab.all.length }
            ];

            return (
              <div className="flex space-x-1 mb-4 bg-gray-100 p-1 rounded-lg">
                {tabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === tab.key
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {tab.label}
                    {tab.count > 0 && (
                      <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${tab.color}`}>
                        {tab.count}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            );
          })()}

          {/* 검색 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="업무명, 내용, 작성자로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* 업무 목록 */}
        <div className="space-y-4">
          {(() => {
            const filteredTasks = getFilteredTasks();
            const displayTasks = expandedTabs[activeTab] ? filteredTasks : filteredTasks.slice(0, 5);
            
            if (filteredTasks.length === 0) {
              return (
                <div className="bg-white rounded-lg shadow p-8 text-center">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">해당 탭의 업무가 없습니다</h3>
                  <p className="text-gray-500">다른 탭을 확인해보세요.</p>
                </div>
              );
            }

            return (
              <>
                {displayTasks.map((task) => {
              const IconComponent = getOperationIcon(task.operation_type?.code || '');
              const isOverdue = new Date().getTime() - new Date(task.created_at).getTime() > 24 * 60 * 60 * 1000;
              const isCompleted = task.achievement_status === 'completed';
              const priorityColor = task.task_priority === 'urgent' ? 'bg-red-100 text-red-800' : 
                                   task.task_priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                   task.task_priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                   'bg-gray-100 text-gray-800';
              
              return (
                <div key={task.id} className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 text-lg">{task.title}</h3>
                        {isOverdue && !isCompleted && (
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
                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">{task.notes}</p>
                      )}
                      {task.customer_name && task.customer_name.trim() && (
                        <p className="text-sm text-gray-500">
                          <span className="font-medium">고객:</span> {task.customer_name.trim().replace(/0/g, '')}
                        </p>
                      )}
                    </div>
                    <div className="ml-4 flex flex-col items-end space-y-2">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${priorityColor}`}>
                          {task.task_priority === 'urgent' ? '긴급' : 
                           task.task_priority === 'high' ? '높음' :
                           task.task_priority === 'medium' ? '보통' : '낮음'}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {task.operation_type?.code} - {task.operation_type?.points}점
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleToggleTaskStatus(task.id, task.achievement_status || 'pending')}
                          className={`flex items-center px-2 py-1 text-xs rounded transition-colors ${
                            isCompleted 
                              ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' 
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          {isCompleted ? (
                            <>
                              <CheckCircle className="h-3 w-3 mr-1" />
                              완료됨
                            </>
                          ) : (
                            <>
                              <CheckSquare className="h-3 w-3 mr-1" />
                              완료
                            </>
                          )}
                        </button>
                        {isAdmin() && (
                          <>
                            <button
                              onClick={() => handleEditTask(task)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="수정"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTask(task.id)}
                              disabled={isDeleting === task.id}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                              title="삭제"
                            >
                              {isDeleting === task.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* 더보기/접기 버튼 */}
            {filteredTasks.length > 5 && (
              <div className="text-center pt-4">
                <button
                  onClick={() => toggleTabExpansion(activeTab)}
                  className="flex items-center justify-center mx-auto text-gray-600 hover:text-gray-800 text-sm font-medium"
                >
                  {expandedTabs[activeTab] ? (
                    <>
                      <ChevronUp className="h-4 w-4 mr-1" />
                      접기
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4 mr-1" />
                      더보기 ({filteredTasks.length - 5}개 더)
                    </>
                  )}
                </button>
              </div>
            )}
              </>
            );
          })()}
        </div>
      </div>

      {/* 수정 모달 */}
      {showEditModal && editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">업무 수정</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingTask(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleSaveEdit(formData);
              }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    업무명
                  </label>
                  <input
                    type="text"
                    name="title"
                    defaultValue={editingTask.title}
                    required
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    업무 내용
                  </label>
                  <textarea
                    name="notes"
                    rows={3}
                    defaultValue={editingTask.notes || ''}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
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
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    우선순위
                  </label>
                  <select
                    name="task_priority"
                    defaultValue={editingTask.task_priority || 'medium'}
                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                  >
                    <option value="urgent">긴급</option>
                    <option value="high">높음</option>
                    <option value="medium">보통</option>
                    <option value="low">낮음</option>
                  </select>
                </div>


                <div className="text-sm text-gray-500">
                  <p><strong>작성자:</strong> {editingTask.employee?.name}</p>
                  <p><strong>작성일:</strong> {formatDateKR(new Date(editingTask.created_at))}</p>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingTask(null);
                  }}
                  className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  저장
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
