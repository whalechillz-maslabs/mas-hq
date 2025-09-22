'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Calendar, User, Clock, CheckCircle, XCircle, AlertCircle,
  Plus, Edit, Trash, Eye, Search, Filter, ArrowLeft, 
  CalendarDays, Users, TrendingUp, FileText
} from 'lucide-react';

interface Employee {
  id: string;
  name: string;
  employee_id: string;
  hire_date: string;
  employment_type: string;
}

interface LeaveBalance {
  id: string;
  employee_id: string;
  year: number;
  total_days: number;
  used_days: number;
  remaining_days: number;
  employees?: Employee;
}

interface LeaveRequest {
  id: string;
  employee_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  employees?: Employee;
}

export default function LeaveManagementPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveBalances, setLeaveBalances] = useState<LeaveBalance[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'balance' | 'requests' | 'statistics'>('balance');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // 연차 잔여 관리용 상태
  const [newBalance, setNewBalance] = useState({
    employee_id: '',
    year: new Date().getFullYear(),
    total_days: 11
  });

  // 연차 신청용 상태
  const [newRequest, setNewRequest] = useState({
    employee_id: '',
    start_date: '',
    end_date: '',
    reason: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  // 연차 일수 자동 계산 함수
  const calculateLeaveDays = (hireDate: string) => {
    const hire = new Date(hireDate);
    const currentYear = new Date().getFullYear();
    const yearsWorked = currentYear - hire.getFullYear();
    
    // 1년 미만: 0일, 1년 이상: 11일부터 시작
    if (yearsWorked < 1) return 0;
    if (yearsWorked < 2) return 11;
    if (yearsWorked < 3) return 12;
    if (yearsWorked < 4) return 14;
    if (yearsWorked < 5) return 15;
    if (yearsWorked < 6) return 16;
    return 20; // 6년 이상
  };

  const loadData = async () => {
    try {
      setIsLoading(true);

      // 직원 목록 로드
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('id, name, employee_id, hire_date, employment_type')
        .eq('status', 'active')
        .order('name');

      if (employeesError) throw employeesError;

      // 연차 잔여 로드 - 별도 쿼리로 해결
      const { data: balanceData, error: balanceError } = await supabase
        .from('leave_balance')
        .select('*')
        .eq('year', new Date().getFullYear())
        .order('remaining_days', { ascending: false });

      if (balanceError) throw balanceError;

      // 연차 신청 로드 - 별도 쿼리로 해결
      const { data: requestData, error: requestError } = await supabase
        .from('leave_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (requestError) throw requestError;

      // 자동 연차 생성 (입사일 기준)
      const currentYear = new Date().getFullYear();
      for (const employee of employeesData || []) {
        if (employee.hire_date) {
          const calculatedDays = calculateLeaveDays(employee.hire_date);
          
          // 해당 직원의 연차 데이터가 없으면 자동 생성
          const existingBalance = balanceData?.find(b => b.employee_id === employee.id);
          if (!existingBalance && calculatedDays > 0) {
            try {
              await supabase
                .from('leave_balance')
                .insert({
                  employee_id: employee.id,
                  year: currentYear,
                  total_days: calculatedDays,
                  used_days: 0
                });
            } catch (error) {
              console.error(`${employee.name} 연차 자동 생성 실패:`, error);
            }
          }
        }
      }

      // 연차 데이터 다시 로드 (자동 생성된 것 포함)
      const { data: updatedBalanceData, error: updatedBalanceError } = await supabase
        .from('leave_balance')
        .select('*')
        .eq('year', currentYear)
        .order('remaining_days', { ascending: false });

      if (updatedBalanceError) throw updatedBalanceError;

      // 직원 데이터와 연차 데이터를 조인
      const balancesWithEmployees = (updatedBalanceData || []).map(balance => ({
        ...balance,
        employees: employeesData?.find(emp => emp.id === balance.employee_id)
      }));

      const requestsWithEmployees = (requestData || []).map(request => ({
        ...request,
        employees: employeesData?.find(emp => emp.id === request.employee_id)
      }));

      setEmployees(employeesData || []);
      setLeaveBalances(balancesWithEmployees);
      setLeaveRequests(requestsWithEmployees);

    } catch (error) {
      console.error('데이터 로드 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBalance = async () => {
    try {
      const { error } = await supabase
        .from('leave_balance')
        .insert({
          employee_id: newBalance.employee_id,
          year: newBalance.year,
          total_days: newBalance.total_days,
          used_days: 0
        });

      if (error) throw error;

      alert('연차 잔여일이 추가되었습니다.');
      setShowAddModal(false);
      setNewBalance({ employee_id: '', year: new Date().getFullYear(), total_days: 11 });
      loadData();
    } catch (error) {
      console.error('연차 잔여일 추가 오류:', error);
      alert('연차 잔여일 추가에 실패했습니다.');
    }
  };

  const handleRequestLeave = async () => {
    try {
      const { error } = await supabase
        .from('leave_requests')
        .insert({
          employee_id: newRequest.employee_id,
          start_date: newRequest.start_date,
          end_date: newRequest.end_date,
          reason: newRequest.reason,
          status: 'pending'
        });

      if (error) throw error;

      alert('연차 신청이 완료되었습니다.');
      setShowRequestModal(false);
      setNewRequest({ employee_id: '', start_date: '', end_date: '', reason: '' });
      loadData();
    } catch (error) {
      console.error('연차 신청 오류:', error);
      alert('연차 신청에 실패했습니다.');
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      alert('연차 신청이 승인되었습니다.');
      loadData();
    } catch (error) {
      console.error('연차 승인 오류:', error);
      alert('연차 승인에 실패했습니다.');
    }
  };

  const handleRejectRequest = async (requestId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('leave_requests')
        .update({
          status: 'rejected',
          rejection_reason: reason,
          approved_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (error) throw error;

      alert('연차 신청이 반려되었습니다.');
      loadData();
    } catch (error) {
      console.error('연차 반려 오류:', error);
      alert('연차 반려에 실패했습니다.');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-100';
      case 'rejected': return 'text-red-600 bg-red-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved': return '승인';
      case 'rejected': return '반려';
      case 'pending': return '대기';
      default: return '알 수 없음';
    }
  };

  const filteredBalances = leaveBalances.filter(balance =>
    balance.employees?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    balance.employees?.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRequests = leaveRequests.filter(request =>
    request.employees?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.employees?.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">연차 관리 시스템을 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">연차 관리 시스템</h1>
                <p className="text-gray-600 mt-1">직원 연차 신청, 승인 및 잔여일 관리</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>연차 잔여일 추가</span>
              </button>
              <button
                onClick={() => setShowRequestModal(true)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Calendar className="h-4 w-4" />
                <span>연차 신청</span>
              </button>
            </div>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('balance')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'balance'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <CalendarDays className="h-4 w-4" />
                  <span>연차 잔여일</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('requests')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'requests'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>연차 신청</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('statistics')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'statistics'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4" />
                  <span>통계</span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* 검색 */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="직원명 또는 직원번호로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 연차 잔여일 탭 */}
        {activeTab === 'balance' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">연차 잔여일 현황</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        직원
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        직원번호
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        총 연차
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        사용 연차
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        잔여 연차
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        사용률
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredBalances.map((balance) => {
                      const usageRate = balance.total_days > 0 ? (balance.used_days / balance.total_days) * 100 : 0;
                      return (
                        <tr key={balance.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8">
                                <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                  <User className="h-4 w-4 text-blue-600" />
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {balance.employees?.name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {balance.employees?.employee_id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {balance.total_days}일
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {balance.used_days}일
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`text-sm font-medium ${
                              balance.remaining_days > 5 ? 'text-green-600' : 
                              balance.remaining_days > 2 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {balance.remaining_days}일
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                <div 
                                  className={`h-2 rounded-full ${
                                    usageRate > 80 ? 'bg-red-500' : 
                                    usageRate > 60 ? 'bg-yellow-500' : 'bg-green-500'
                                  }`}
                                  style={{ width: `${Math.min(usageRate, 100)}%` }}
                                ></div>
                              </div>
                              <span className="text-sm text-gray-600">{usageRate.toFixed(1)}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 연차 신청 탭 */}
        {activeTab === 'requests' && (
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">연차 신청 현황</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        직원
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        신청일
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        휴가 기간
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        사유
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
                    {filteredRequests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-8 w-8">
                              <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <User className="h-4 w-4 text-blue-600" />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {request.employees?.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {request.employees?.employee_id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(request.created_at).toLocaleDateString('ko-KR')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(request.start_date).toLocaleDateString('ko-KR')} ~ {new Date(request.end_date).toLocaleDateString('ko-KR')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                          {request.reason}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                            {getStatusText(request.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {request.status === 'pending' && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleApproveRequest(request.id)}
                                className="text-green-600 hover:text-green-900 flex items-center space-x-1"
                              >
                                <CheckCircle className="h-4 w-4" />
                                <span>승인</span>
                              </button>
                              <button
                                onClick={() => {
                                  const reason = prompt('반려 사유를 입력하세요:');
                                  if (reason) handleRejectRequest(request.id, reason);
                                }}
                                className="text-red-600 hover:text-red-900 flex items-center space-x-1"
                              >
                                <XCircle className="h-4 w-4" />
                                <span>반려</span>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 통계 탭 */}
        {activeTab === 'statistics' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">총 직원 수</p>
                  <p className="text-2xl font-semibold text-gray-900">{employees.length}명</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CalendarDays className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">총 연차 잔여일</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {leaveBalances.reduce((sum, balance) => sum + balance.remaining_days, 0)}일
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-8 w-8 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">대기 중인 신청</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {leaveRequests.filter(req => req.status === 'pending').length}건
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 연차 잔여일 추가 모달 */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">연차 잔여일 추가</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">직원 선택</label>
                  <select
                    value={newBalance.employee_id}
                    onChange={(e) => {
                      const selectedEmployee = employees.find(emp => emp.id === e.target.value);
                      const calculatedDays = selectedEmployee?.hire_date ? calculateLeaveDays(selectedEmployee.hire_date) : 11;
                      setNewBalance({ 
                        ...newBalance, 
                        employee_id: e.target.value,
                        total_days: calculatedDays
                      });
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">직원을 선택하세요</option>
                    {employees.map(employee => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} ({employee.employee_id}) - 입사: {employee.hire_date}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">연도</label>
                  <input
                    type="number"
                    value={newBalance.year}
                    onChange={(e) => setNewBalance({ ...newBalance, year: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">총 연차 일수</label>
                  <input
                    type="number"
                    value={newBalance.total_days}
                    onChange={(e) => setNewBalance({ ...newBalance, total_days: parseInt(e.target.value) })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {newBalance.employee_id && (() => {
                    const selectedEmployee = employees.find(emp => emp.id === newBalance.employee_id);
                    const calculatedDays = selectedEmployee?.hire_date ? calculateLeaveDays(selectedEmployee.hire_date) : 0;
                    return (
                      <p className="text-sm text-blue-600 mt-1">
                        💡 입사일 기준 자동 계산: {calculatedDays}일
                        {selectedEmployee?.hire_date && (
                          <span className="text-gray-500">
                            (입사: {selectedEmployee.hire_date})
                          </span>
                        )}
                      </p>
                    );
                  })()}
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={handleAddBalance}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  추가
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 연차 신청 모달 */}
        {showRequestModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">연차 신청</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">직원 선택</label>
                  <select
                    value={newRequest.employee_id}
                    onChange={(e) => setNewRequest({ ...newRequest, employee_id: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">직원을 선택하세요</option>
                    {employees.map(employee => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name} ({employee.employee_id})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">시작일</label>
                  <input
                    type="date"
                    value={newRequest.start_date}
                    onChange={(e) => setNewRequest({ ...newRequest, start_date: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">종료일</label>
                  <input
                    type="date"
                    value={newRequest.end_date}
                    onChange={(e) => setNewRequest({ ...newRequest, end_date: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">사유</label>
                  <textarea
                    value={newRequest.reason}
                    onChange={(e) => setNewRequest({ ...newRequest, reason: e.target.value })}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="연차 사용 사유를 입력하세요"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={handleRequestLeave}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  신청
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
