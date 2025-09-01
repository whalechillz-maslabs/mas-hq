'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { 
  Phone, 
  ShoppingCart, 
  Store, 
  Headphones, 
  Shield, 
  Truck, 
  Package, 
  Coffee, 
  Plus, 
  Check, 
  X, 
  TrendingUp,
  Target,
  Award,
  DollarSign,
  Clock
} from 'lucide-react';

interface OperationType {
  id: string;
  code: string;
  name: string;
  points: number;
}

interface QuickTaskData {
  operation_type_id: string;
  title: string;
  customer_name: string;
  sales_amount: number;
  notes: string;
}

export default function QuickTaskPage() {
  const router = useRouter();
  const [operationTypes, setOperationTypes] = useState<OperationType[]>([]);
  const [selectedOperationType, setSelectedOperationType] = useState<OperationType | null>(null);
  const [taskData, setTaskData] = useState<QuickTaskData>({
    operation_type_id: '',
    title: '',
    customer_name: '',
    sales_amount: 0,
    notes: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [todayStats, setTodayStats] = useState({
    totalSales: 0,
    totalPoints: 0,
    taskCount: 0
  });

  // 사용자 확인 및 데이터 로드
  useEffect(() => {
    const checkUser = async () => {
      const user = await auth.getCurrentUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setCurrentUser(user);
      loadOperationTypes();
      loadTodayStats(user.id);
    };
    checkUser();
  }, [router]);

  const loadOperationTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('operation_types')
        .select('*')
        .order('code');

      if (error) throw error;
      setOperationTypes(data || []);
    } catch (error) {
      console.error('업무 유형 로드 실패:', error);
    }
  };

  const loadTodayStats = async (userId: string) => {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

      const { data, error } = await supabase
        .from('employee_tasks')
        .select(`
          *,
          operation_types (
            points
          )
        `)
        .eq('employee_id', userId)
        .gte('created_at', startOfDay)
        .lt('created_at', endOfDay);

      if (error) throw error;

      const totalSales = data?.reduce((sum, task) => sum + (task.sales_amount || 0), 0) || 0;
      const totalPoints = data?.reduce((sum, task) => sum + (task.operation_types?.points || 0), 0) || 0;
      const taskCount = data?.length || 0;

      setTodayStats({ totalSales, totalPoints, taskCount });
    } catch (error) {
      console.error('오늘 통계 로드 실패:', error);
    }
  };

  const handleOperationTypeSelect = (opType: OperationType) => {
    setSelectedOperationType(opType);
    setTaskData(prev => ({
      ...prev,
      operation_type_id: opType.id,
      title: getDefaultTitle(opType.code)
    }));
  };

  const getDefaultTitle = (code: string): string => {
    const titles: { [key: string]: string } = {
      'OP1': '전화 판매',
      'OP2': '재구매/부품',
      'OP3': '오프라인 판매',
      'OP4': '오프라인 재구매',
      'OP5': 'CS 응대',
      'OP6': 'A/S 처리',
      'OP7': '환불 방어',
      'OP9': '택배 처리',
      'OP10': '기타 서비스'
    };
    return titles[code] || '업무';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOperationType || !currentUser) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('employee_tasks')
        .insert({
          employee_id: currentUser.employee_id,
          operation_type_id: selectedOperationType.id,
          title: taskData.title,
          notes: taskData.notes,
          task_time: new Date().toTimeString().slice(0, 5),
          customer_name: taskData.customer_name,
          sales_amount: taskData.sales_amount,
          task_priority: 'normal',
          achievement_status: 'completed', // 바로 완료 상태로
          task_date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      setShowSuccess(true);
      setTaskData({
        operation_type_id: '',
        title: '',
        customer_name: '',
        sales_amount: 0,
        notes: ''
      });
      // setSelectedOperationType(null); // 폼 유지

      // 통계 업데이트
      await loadTodayStats(currentUser.id);

      // 2초 후 성공 메시지 숨김
      setTimeout(() => setShowSuccess(false), 2000);
    } catch (error) {
      console.error('업무 추가 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getOperationIcon = (code: string) => {
    const icons: { [key: string]: any } = {
      'OP1': Phone,
      'OP2': Phone,
      'OP3': Store,
      'OP4': Store,
      'OP5': Headphones,
      'OP6': Shield,
      'OP7': Shield,
      'OP9': Truck,
      'OP10': Package
    };
    return icons[code] || Package;
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* 헤더 */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">오늘 업무</h1>
            </div>
            <button
              onClick={() => router.push('/tasks')}
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              상세 보기
            </button>
          </div>
        </div>
      </div>

      {/* 오늘 성과 요약 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 text-green-600 mr-2" />
              <div>
                <p className="text-xs text-gray-500">오늘 매출</p>
                <p className="text-lg font-bold text-green-600">
                  {todayStats.totalSales.toLocaleString()}원
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center">
              <Award className="h-5 w-5 text-purple-600 mr-2" />
              <div>
                <p className="text-xs text-gray-500">오늘 포인트</p>
                <p className="text-lg font-bold text-purple-600">
                  {todayStats.totalPoints}점
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <div className="flex items-center">
              <Target className="h-5 w-5 text-blue-600 mr-2" />
              <div>
                <p className="text-xs text-gray-500">업무 건수</p>
                <p className="text-lg font-bold text-blue-600">
                  {todayStats.taskCount}건
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 업무 유형 선택 */}
        <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">업무 유형 선택</h2>
          <div className="grid grid-cols-2 gap-4">
            {operationTypes
              .filter(opType => opType.code !== 'OP8')
              .map((opType) => {
              const Icon = getOperationIcon(opType.code);
              const isSelected = selectedOperationType?.id === opType.id;
              
              return (
                <button
                  key={opType.id}
                  onClick={() => handleOperationTypeSelect(opType)}
                  className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-25'
                  }`}
                >
                  <div className="flex items-center mb-2">
                    <Icon className="h-6 w-6 mr-2" />
                    <span className="text-sm font-medium">{opType.code}</span>
                  </div>
                  <p className="text-sm font-semibold mb-1">{opType.name}</p>
                  <p className="text-xs text-gray-500">{opType.points}점</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 업무 입력 폼 */}
        {selectedOperationType && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">업무 입력</h2>
              <button
                onClick={() => setSelectedOperationType(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 업무명 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  업무명
                </label>
                <input
                  type="text"
                  value={taskData.title}
                  onChange={(e) => setTaskData(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="업무 제목을 입력하세요"
                  required
                />
              </div>

              {/* 고객명 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  고객명
                </label>
                <input
                  type="text"
                  value={taskData.customer_name}
                  onChange={(e) => setTaskData(prev => ({ ...prev, customer_name: e.target.value }))}
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="고객명 (선택)"
                />
              </div>

              {/* 매출 금액 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  매출 금액
                </label>
                <input
                  type="number"
                  value={taskData.sales_amount || ''}
                  onChange={(e) => setTaskData(prev => ({ ...prev, sales_amount: parseInt(e.target.value) || 0 }))}
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="0"
                  min="0"
                />
              </div>

              {/* 업무 내용 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  업무 내용
                </label>
                <textarea
                  value={taskData.notes}
                  onChange={(e) => setTaskData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="업무 내용을 입력하세요 (선택)"
                />
              </div>

              {/* 제출 버튼 */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-lg font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-2"></div>
                    처리 중...
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <Check className="h-6 w-6 mr-2" />
                    업무 완료
                  </div>
                )}
              </button>
            </form>
          </div>
        )}

        {/* 성공 메시지 */}
        {showSuccess && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg">
            <div className="flex items-center">
              <Check className="h-5 w-5 mr-2" />
              업무가 성공적으로 등록되었습니다!
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
