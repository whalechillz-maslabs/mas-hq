'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { auth } from '@/lib/supabase';
import { formatDateKR } from '@/utils/dateUtils';
import { 
  Users, Eye, Calendar, User, MessageSquare, 
  Phone, ShoppingCart, Headphones, Shield, Truck, Package,
  ArrowLeft, RefreshCw, Filter, Search
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

export default function SharedTasksPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [sharedTasks, setSharedTasks] = useState<SharedTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

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

  const loadSharedTasks = async () => {
    try {
      // 먼저 OP10의 ID를 가져옵니다
      const { data: op10Data, error: op10Error } = await supabase
        .from('operation_types')
        .select('id')
        .eq('code', 'OP10')
        .single();

      if (op10Error || !op10Data) {
        console.error('OP10 업무 유형을 찾을 수 없습니다:', op10Error);
        setSharedTasks([]);
        setIsLoading(false);
        return;
      }

      // OP10 업무만 가져옵니다
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
          operation_type:operation_types(code, name, points),
          employee:employees(name, employee_id)
        `)
        .eq('operation_type_id', op10Data.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSharedTasks(data || []);
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
                onClick={() => router.push('/tasks')}
                className="mr-4 p-2 rounded-lg hover:bg-gray-100 flex items-center"
              >
                <ArrowLeft className="h-5 w-5 mr-1" />
                뒤로가기
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">공유 업무</h1>
                <p className="text-gray-600">팀원들의 내부전달, 택배, 환경개선 업무 참조</p>
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

      {/* 필터 및 검색 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
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
            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">전체</option>
                <option value="OP10">OP10 - 내부전달, 택배, 환경개선</option>
              </select>
            </div>
          </div>
        </div>

        {/* 업무 목록 */}
        <div className="space-y-4">
          {filteredTasks.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">공유된 업무가 없습니다</h3>
              <p className="text-gray-500">팀원들이 OP10 업무를 등록하면 여기에 표시됩니다.</p>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const IconComponent = getOperationIcon(task.operation_type?.code || '');
              
              return (
                <div key={task.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg mr-3">
                          <IconComponent className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{task.title}</h3>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <User className="h-4 w-4 mr-1" />
                            {task.employee?.name}
                            <span className="mx-2">•</span>
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDateKR(new Date(task.task_date))}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {task.operation_type?.code} - {task.operation_type?.points}점
                        </span>
                      </div>
                    </div>

                    {task.notes && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">업무 내용</h4>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-gray-800 whitespace-pre-wrap">{task.notes}</p>
                        </div>
                      </div>
                    )}

                    {task.memo && (
                      <div className="mb-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">메모</h4>
                        <div className="bg-yellow-50 rounded-lg p-4">
                          <p className="text-gray-800 whitespace-pre-wrap">{task.memo}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        {task.customer_name && task.customer_name.trim() && (
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            고객: {task.customer_name.trim().replace(/0+$/, '')}
                          </div>
                        )}
                        {task.sales_amount && task.sales_amount > 0 && (
                          <div className="flex items-center">
                            <span className="font-medium text-green-600">
                              매출: {task.sales_amount.toLocaleString()}원
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-gray-400">
                        등록: {formatDateKR(new Date(task.created_at))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
