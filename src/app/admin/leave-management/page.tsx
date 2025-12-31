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
  leave_anniversary_date?: string; // 연차 기산일
}

interface LeaveBalance {
  id: string;
  employee_id: string;
  year: number;
  total_days: number;
  used_days: number;
  remaining_days: number;
  leave_anniversary_date?: string; // 연차 기산일
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
  leave_type?: 'annual' | 'monthly' | 'sick' | 'special' | 'other';
  leave_days?: number;
  is_special_leave?: boolean;
  is_monthly_leave?: boolean;
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
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedBalance, setSelectedBalance] = useState<LeaveBalance | null>(null);

  // 연차 잔여 관리용 상태
  const [newBalance, setNewBalance] = useState({
    employee_id: '',
    year: new Date().getFullYear(),
    total_days: 11,
    leave_anniversary_date: ''
  });

  // 연차 신청용 상태
  const [newRequest, setNewRequest] = useState({
    employee_id: '',
    start_date: '',
    end_date: '',
    reason: '',
    leave_type: 'annual' as 'annual' | 'monthly' | 'sick' | 'special' | 'other',
    is_special_leave: false,
    is_monthly_leave: false
  });

  useEffect(() => {
    loadData();
  }, []);

  // 연차 일수 자동 계산 함수 (근로기준법 기준)
  const calculateLeaveDays = (anniversaryDate: string, hireDate?: string, targetYear?: number): number => {
    if (!anniversaryDate) return 0;
    
    const anniversary = new Date(anniversaryDate);
    const currentYear = targetYear || new Date().getFullYear();
    const anniversaryYear = anniversary.getFullYear();
    
    // 입사 연도 (1년 미만)
    if (currentYear === anniversaryYear) {
      // 남은 개월 수만큼 발생 (최대 11일)
      const remainingMonths = 12 - anniversary.getMonth();
      return Math.min(remainingMonths, 11);
    }
    
    // 1년 이상 근로자
    const yearsWorked = currentYear - anniversaryYear;
    
    // 1년차: 15일
    if (yearsWorked === 1) return 15;
    
    // 2년차: 15일
    if (yearsWorked === 2) return 15;
    
    // 3년차부터 2년마다 1일씩 추가 (최대 25일)
    if (yearsWorked >= 3) {
      return Math.min(15 + Math.floor((yearsWorked - 1) / 2), 25);
    }
    
    return 0;
  };

  // 휴가 기간 일수 계산 함수
  const calculateRequestDays = (startDate: string, endDate: string): number => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const loadData = async () => {
    try {
      setIsLoading(true);

      // 직원 목록 로드
      const { data: employeesData, error: employeesError } = await supabase
        .from('employees')
        .select('id, name, employee_id, hire_date, employment_type, leave_anniversary_date')
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

      // 자동 연차 생성 (연차 기산일 기준) - 정직원만
      const currentYear = new Date().getFullYear();
      for (const employee of employeesData || []) {
        // 파트타임(알바) 직원은 연차 생성하지 않음
        if (employee.employment_type === 'part_time') {
          continue;
        }
        
        // 연차 기산일이 있으면 그것을 사용, 없으면 입사일 사용
        const anniversaryDate = employee.leave_anniversary_date || employee.hire_date;
        if (anniversaryDate) {
          const calculatedDays = calculateLeaveDays(anniversaryDate, employee.hire_date);
          
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
                  used_days: 0,
                  leave_anniversary_date: anniversaryDate
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
      if (isEditMode && selectedBalance) {
        // 수정 모드
        const { error } = await supabase
          .from('leave_balance')
          .update({
            total_days: newBalance.total_days,
            leave_anniversary_date: newBalance.leave_anniversary_date || null
          })
          .eq('id', selectedBalance.id);

        if (error) throw error;

        // 직원의 연차 기산일도 업데이트
        if (newBalance.leave_anniversary_date) {
          await supabase
            .from('employees')
            .update({ leave_anniversary_date: newBalance.leave_anniversary_date })
            .eq('id', newBalance.employee_id);
        }

        alert('연차 잔여일이 수정되었습니다.');
      } else {
        // 추가 모드 (UPSERT 사용 - 중복 시 업데이트)
        const { error } = await supabase
          .from('leave_balance')
          .upsert({
            employee_id: newBalance.employee_id,
            year: newBalance.year,
            total_days: newBalance.total_days,
            used_days: 0,
            leave_anniversary_date: newBalance.leave_anniversary_date || null
          }, {
            onConflict: 'employee_id,year'
          });

        if (error) throw error;

        // 직원의 연차 기산일도 업데이트
        if (newBalance.leave_anniversary_date) {
          await supabase
            .from('employees')
            .update({ leave_anniversary_date: newBalance.leave_anniversary_date })
            .eq('id', newBalance.employee_id);
        }

        alert('연차 잔여일이 추가되었습니다.');
      }

      setShowAddModal(false);
      setIsEditMode(false);
      setSelectedBalance(null);
      setNewBalance({ employee_id: '', year: new Date().getFullYear(), total_days: 11, leave_anniversary_date: '' });
      loadData();
    } catch (error) {
      console.error('연차 잔여일 처리 오류:', error);
      alert(isEditMode ? '연차 잔여일 수정에 실패했습니다.' : '연차 잔여일 추가에 실패했습니다.');
    }
  };

  const handleEditBalance = (balance: LeaveBalance) => {
    setSelectedBalance(balance);
    setIsEditMode(true);
    setNewBalance({
      employee_id: balance.employee_id,
      year: balance.year,
      total_days: balance.total_days,
      leave_anniversary_date: balance.leave_anniversary_date || ''
    });
    setShowAddModal(true);
  };

  const handleRequestLeave = async () => {
    try {
      // 사용 일수 계산
      const leaveDays = calculateRequestDays(newRequest.start_date, newRequest.end_date);

      const { error } = await supabase
        .from('leave_requests')
        .insert({
          employee_id: newRequest.employee_id,
          start_date: newRequest.start_date,
          end_date: newRequest.end_date,
          reason: newRequest.reason,
          leave_type: newRequest.leave_type,
          leave_days: leaveDays,
          is_special_leave: newRequest.is_special_leave,
          is_monthly_leave: newRequest.is_monthly_leave,
          status: 'pending'
        });

      if (error) throw error;

      alert('휴가 신청이 완료되었습니다.');
      setShowRequestModal(false);
      setNewRequest({ 
        employee_id: '', 
        start_date: '', 
        end_date: '', 
        reason: '',
        leave_type: 'annual',
        is_special_leave: false,
        is_monthly_leave: false
      });
      loadData();
    } catch (error) {
      console.error('휴가 신청 오류:', error);
      alert('휴가 신청에 실패했습니다.');
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      // 1. 신청 정보 조회
      const { data: request, error: fetchError } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (fetchError) throw fetchError;

      // 2. 사용 일수 계산
      const daysDiff = calculateRequestDays(request.start_date, request.end_date);

      // 3. 현재 사용자 정보 가져오기
      const { data: { user } } = await supabase.auth.getUser();
      const approvedBy = user?.id;

      // 4. 특별연차는 연차 잔여일에 차감하지 않음
      if (request.leave_type === 'special' || request.is_special_leave) {
        const { error: approveError } = await supabase
          .from('leave_requests')
          .update({
            status: 'approved',
            approved_at: new Date().toISOString(),
            approved_by: approvedBy,
            leave_days: daysDiff
          })
          .eq('id', requestId);

        if (approveError) throw approveError;
        alert('특별연차가 승인되었습니다. (연차 잔여일에 차감되지 않음)');
        loadData();
        return;
      }

      // 5. 월차는 연차 잔여일에 차감하지 않음
      if (request.leave_type === 'monthly' || request.is_monthly_leave) {
        const { error: approveError } = await supabase
          .from('leave_requests')
          .update({
            status: 'approved',
            approved_at: new Date().toISOString(),
            approved_by: approvedBy,
            leave_days: daysDiff
          })
          .eq('id', requestId);

        if (approveError) throw approveError;
        alert('월차가 승인되었습니다. (연차 잔여일에 차감되지 않음)');
        loadData();
        return;
      }

      // 6. 연차인 경우 잔여일 확인 및 차감
      const startDate = new Date(request.start_date);
      const { data: balance, error: balanceError } = await supabase
        .from('leave_balance')
        .select('*')
        .eq('employee_id', request.employee_id)
        .eq('year', startDate.getFullYear())
        .single();

      if (balanceError) throw balanceError;

      // 잔여일 부족 시 경고
      if (balance.remaining_days < daysDiff) {
        const confirm = window.confirm(
          `⚠️ 잔여 연차가 부족합니다.\n\n` +
          `잔여 연차: ${balance.remaining_days}일\n` +
          `신청 일수: ${daysDiff}일\n` +
          `부족: ${daysDiff - balance.remaining_days}일\n\n` +
          `그래도 승인하시겠습니까? (미사용 연차 발생 가능)`
        );
        if (!confirm) return;
      }

      // 7. 연차 잔여일 차감
      const { error: updateError } = await supabase
        .from('leave_balance')
        .update({ 
          used_days: balance.used_days + daysDiff 
        })
        .eq('id', balance.id);

      if (updateError) throw updateError;

      // 8. 신청 상태를 승인으로 변경
      const { error: approveError } = await supabase
        .from('leave_requests')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: approvedBy,
          leave_days: daysDiff
        })
        .eq('id', requestId);

      if (approveError) throw approveError;

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

  const getLeaveTypeText = (leaveType?: string) => {
    switch (leaveType) {
      case 'annual': return '연차';
      case 'monthly': return '월차';
      case 'sick': return '병가';
      case 'special': return '특별연차';
      case 'other': return '기타';
      default: return '연차';
    }
  };

  const getLeaveTypeColor = (leaveType?: string) => {
    switch (leaveType) {
      case 'annual': return 'bg-blue-100 text-blue-800';
      case 'monthly': return 'bg-purple-100 text-purple-800';
      case 'sick': return 'bg-red-100 text-red-800';
      case 'special': return 'bg-yellow-100 text-yellow-800';
      case 'other': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        액션
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => handleEditBalance(balance)}
                              className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                            >
                              <Edit className="h-4 w-4" />
                              <span>수정</span>
                            </button>
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
                        휴가 유형
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        일수
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
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLeaveTypeColor(request.leave_type)}`}>
                            {getLeaveTypeText(request.leave_type)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {request.leave_days || calculateRequestDays(request.start_date, request.end_date)}일
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

        {/* 연차 잔여일 추가/수정 모달 */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {isEditMode ? '연차 잔여일 수정' : '연차 잔여일 추가'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">직원 선택</label>
                  <select
                    value={newBalance.employee_id}
                    onChange={(e) => {
                      const selectedEmployee = employees.find(emp => emp.id === e.target.value);
                      const anniversaryDate = selectedEmployee?.leave_anniversary_date || selectedEmployee?.hire_date;
                      const calculatedDays = anniversaryDate ? calculateLeaveDays(anniversaryDate, selectedEmployee?.hire_date) : 11;
                      setNewBalance({ 
                        ...newBalance, 
                        employee_id: e.target.value,
                        total_days: calculatedDays,
                        leave_anniversary_date: anniversaryDate || ''
                      });
                    }}
                    disabled={isEditMode}
                    className={`w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''
                    }`}
                  >
                    <option value="">직원을 선택하세요</option>
                    {employees
                      .filter(employee => employee.employment_type !== 'part_time') // 파트타임 제외
                      .map(employee => (
                        <option key={employee.id} value={employee.id}>
                          {employee.name} ({employee.employee_id}) - 입사: {employee.hire_date}
                        </option>
                      ))}
                  </select>
                  {isEditMode && (
                    <p className="text-sm text-gray-500 mt-1">
                      💡 수정 모드에서는 직원을 변경할 수 없습니다.
                    </p>
                  )}
                </div>
                {isEditMode && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">연도</label>
                    <input
                      type="number"
                      value={newBalance.year}
                      disabled
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 cursor-not-allowed"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      💡 수정 모드에서는 연도를 변경할 수 없습니다.
                    </p>
                  </div>
                )}
                {!isEditMode && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">연도</label>
                    <input
                      type="number"
                      value={newBalance.year}
                      onChange={(e) => setNewBalance({ ...newBalance, year: parseInt(e.target.value) })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">연차 기산일</label>
                  <input
                    type="date"
                    value={newBalance.leave_anniversary_date}
                    onChange={(e) => {
                      const calculatedDays = e.target.value ? calculateLeaveDays(e.target.value) : 0;
                      setNewBalance({ 
                        ...newBalance, 
                        leave_anniversary_date: e.target.value,
                        total_days: calculatedDays
                      });
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    💡 알바→정직원 전환 시 연차 계산 기준일을 설정하세요
                  </p>
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
                    const anniversaryDate = newBalance.leave_anniversary_date || selectedEmployee?.leave_anniversary_date || selectedEmployee?.hire_date;
                    const calculatedDays = anniversaryDate ? calculateLeaveDays(anniversaryDate, selectedEmployee?.hire_date) : 0;
                    return (
                      <p className="text-sm text-blue-600 mt-1">
                        💡 연차 기산일 기준 자동 계산: {calculatedDays}일
                        {anniversaryDate && (
                          <span className="text-gray-500">
                            (기산일: {anniversaryDate})
                          </span>
                        )}
                      </p>
                    );
                  })()}
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setIsEditMode(false);
                    setSelectedBalance(null);
                    setNewBalance({ employee_id: '', year: new Date().getFullYear(), total_days: 11, leave_anniversary_date: '' });
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={handleAddBalance}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {isEditMode ? '수정' : '추가'}
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
                    {employees
                      .filter(employee => employee.employment_type !== 'part_time') // 파트타임 제외
                      .map(employee => (
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    휴가 유형 <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={newRequest.leave_type}
                    onChange={(e) => {
                      const leaveType = e.target.value as any;
                      setNewRequest({ 
                        ...newRequest, 
                        leave_type: leaveType,
                        is_special_leave: leaveType === 'special',
                        is_monthly_leave: leaveType === 'monthly'
                      });
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="annual">연차 (법정)</option>
                    <option value="monthly">월차 (복리후생)</option>
                    <option value="special">특별연차 (회사 재량)</option>
                    <option value="sick">병가</option>
                    <option value="other">기타</option>
                  </select>
                  {newRequest.leave_type === 'special' && (
                    <p className="text-sm text-blue-600 mt-1">
                      💡 특별연차는 연차 잔여일에 차감되지 않습니다. (예: 1월 1일 추가 휴가)
                    </p>
                  )}
                  {newRequest.leave_type === 'monthly' && (
                    <p className="text-sm text-purple-600 mt-1">
                      💡 월차는 연차와 별도로 관리됩니다.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">사유</label>
                  <textarea
                    value={newRequest.reason}
                    onChange={(e) => setNewRequest({ ...newRequest, reason: e.target.value })}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="휴가 사용 사유를 입력하세요"
                  />
                </div>
                {newRequest.start_date && newRequest.end_date && (
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-sm text-blue-700">
                      📅 신청 일수: <span className="font-semibold">{calculateRequestDays(newRequest.start_date, newRequest.end_date)}일</span>
                    </p>
                  </div>
                )}
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
