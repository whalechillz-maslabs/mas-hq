'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, auth } from '@/lib/supabase';
import { 
  Calendar, CalendarDays, CheckCircle, XCircle, AlertCircle,
  Plus, ArrowLeft, Clock, TrendingUp, Edit
} from 'lucide-react';

interface LeaveBalance {
  id: string;
  employee_id: string;
  year: number;
  total_days: number;
  used_days: number;
  remaining_days: number;
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
}

export default function LeaveRequestPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [welfareLeaves, setWelfareLeaves] = useState<any[]>([]);
  const [specialWorks, setSpecialWorks] = useState<any[]>([]);
  const [newRequest, setNewRequest] = useState({
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

  // 휴가 유형 옵션을 고용 형태에 따라 필터링
  const getAvailableLeaveTypes = () => {
    if (!currentUser) return [];
    
    const baseTypes = [
      { value: 'sick', label: '병가' },
      { value: 'other', label: '기타' }
    ];
    
    // 정규직: 연차, 병가, 기타
    if (currentUser.employment_type === 'full_time') {
      return [
        { value: 'annual', label: '연차 (법정)' },
        ...baseTypes
      ];
    }
    
    // 파트타임: 월차, 병가, 기타
    if (currentUser.employment_type === 'part_time') {
      return [
        { value: 'monthly', label: '월차 (복리후생)' },
        ...baseTypes
      ];
    }
    
    // 기타 고용 형태: 기본값으로 연차 포함
    return [
      { value: 'annual', label: '연차 (법정)' },
      ...baseTypes
    ];
  };

  // 고용 형태에 따라 기본값 설정
  useEffect(() => {
    if (currentUser) {
      const defaultType = currentUser.employment_type === 'full_time' 
        ? 'annual' 
        : currentUser.employment_type === 'part_time' 
          ? 'monthly' 
          : 'annual';
      
      setNewRequest(prev => ({
        ...prev,
        leave_type: defaultType as any,
        is_special_leave: false,
        is_monthly_leave: defaultType === 'monthly'
      }));
    }
  }, [currentUser]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // 현재 사용자 정보 가져오기 (localStorage 기반)
      const user = await auth.getCurrentUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // 직원 정보는 이미 getCurrentUser에서 가져옴
      setCurrentUser(user);

      // 연차 잔여일 가져오기
      const currentYear = new Date().getFullYear();
      const { data: balance, error: balanceError } = await supabase
        .from('leave_balance')
        .select('*')
        .eq('employee_id', user.id)
        .eq('year', currentYear)
        .maybeSingle();

      if (balanceError && balanceError.code !== 'PGRST116') {
        throw balanceError;
      }
      setLeaveBalance(balance);

      // 특별연차(복지 연차) 개수 계산 (현재 연도 활성화된 것만)
      const { count: welfareCount } = await supabase
        .from('welfare_leave_policy')
        .select('*', { count: 'exact', head: true })
        .eq('year', currentYear)
        .eq('is_active', true);
      
      setWelfareLeaveCount(welfareCount || 0);

      // 내 연차 신청 내역 가져오기
      const { data: requests, error: requestError } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('employee_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (requestError) throw requestError;
      setLeaveRequests(requests || []);

    } catch (error) {
      console.error('데이터 로드 오류:', error);
      alert('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateRequestDays = (startDate: string, endDate: string): number => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  // 복지 연차 확인 함수
  const checkWelfareLeave = async (date: string): Promise<{ isWelfare: boolean; description?: string }> => {
    if (!date) return { isWelfare: false };
    
    const dateObj = new Date(date);
    const year = dateObj.getFullYear();
    
    try {
      const { data } = await supabase
        .from('welfare_leave_policy')
        .select('*')
        .eq('year', year)
        .eq('date', date)
        .eq('is_active', true)
        .maybeSingle();
      
      if (data) {
        return { isWelfare: true, description: data.description };
      }
    } catch (error) {
      console.error('복지 연차 확인 오류:', error);
    }
    
    return { isWelfare: false };
  };

  const handleEditRequest = (request: any) => {
    setEditingRequestId(request.id);
    setIsEditMode(true);
    setNewRequest({
      start_date: request.start_date,
      end_date: request.end_date,
      reason: request.reason || '',
      leave_type: request.leave_type || 'annual',
      is_special_leave: request.is_special_leave || false,
      is_monthly_leave: request.is_monthly_leave || false
    });
    setShowRequestModal(true);
  };

  const handleRequestLeave = async () => {
    try {
      if (!currentUser) {
        alert('직원 정보를 불러올 수 없습니다.');
        return;
      }

      if (!newRequest.start_date || !newRequest.end_date) {
        alert('시작일과 종료일을 입력해주세요.');
        return;
      }

      if (!newRequest.reason) {
        alert('사유를 입력해주세요.');
        return;
      }

      const leaveDays = calculateRequestDays(newRequest.start_date, newRequest.end_date);

      // 연차인 경우 잔여일 확인
      if (newRequest.leave_type === 'annual' && leaveBalance) {
        if (leaveBalance.remaining_days < leaveDays) {
          const confirm = window.confirm(
            `⚠️ 잔여 연차가 부족합니다.\n\n` +
            `잔여 연차: ${leaveBalance.remaining_days}일\n` +
            `신청 일수: ${leaveDays}일\n` +
            `부족: ${leaveDays - leaveBalance.remaining_days}일\n\n` +
            `그래도 신청하시겠습니까?`
          );
          if (!confirm) return;
        }
      }

      // 수정 모드인 경우
      if (isEditMode && editingRequestId) {
        const { error } = await supabase
          .from('leave_requests')
          .update({
            start_date: newRequest.start_date,
            end_date: newRequest.end_date,
            reason: newRequest.reason,
            leave_type: newRequest.leave_type,
            leave_days: leaveDays,
            is_special_leave: newRequest.is_special_leave,
            is_monthly_leave: newRequest.is_monthly_leave,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingRequestId);

        if (error) throw error;

        alert('연차 신청이 수정되었습니다.');
        setShowRequestModal(false);
        setIsEditMode(false);
        setEditingRequestId(null);
        setNewRequest({
          start_date: '',
          end_date: '',
          reason: '',
          leave_type: 'annual',
          is_special_leave: false,
          is_monthly_leave: false
        });
        loadData();
        return;
      }

      // 신규 신청인 경우
      // 한국 시간 기준으로 현재 시간 계산 (UTC+9)
      const koreaTime = new Date(new Date().getTime() + (9 * 60 * 60 * 1000));
      const koreaDateTime = koreaTime.toISOString();

      const { error } = await supabase
        .from('leave_requests')
        .insert({
          employee_id: currentUser.id,
          start_date: newRequest.start_date,
          end_date: newRequest.end_date,
          reason: newRequest.reason,
          leave_type: newRequest.leave_type,
          leave_days: leaveDays,
          is_special_leave: newRequest.is_special_leave,
          is_monthly_leave: newRequest.is_monthly_leave,
          status: 'pending',
          created_at: koreaDateTime // 한국 시간으로 명시적으로 설정
        });

      if (error) throw error;

      alert('연차 신청이 완료되었습니다. 관리자 승인을 기다려주세요.');
      setShowRequestModal(false);
      setNewRequest({
        start_date: '',
        end_date: '',
        reason: '',
        leave_type: 'annual',
        is_special_leave: false,
        is_monthly_leave: false
      });
      loadData();
    } catch (error) {
      console.error('연차 신청 오류:', error);
      alert('연차 신청에 실패했습니다.');
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">연차 정보를 불러오는 중...</p>
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
                <h1 className="text-2xl font-bold text-gray-900">연차 신청</h1>
                <p className="text-gray-600 mt-1">연차 신청 및 잔여일 조회</p>
              </div>
            </div>
            <button
              onClick={() => setShowRequestModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>연차 신청</span>
            </button>
          </div>
        </div>

        {/* 연차 잔여일 카드 */}
        {leaveBalance && (
          <div className={`grid grid-cols-1 gap-6 mb-6 ${welfareLeaveCount > 0 ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CalendarDays className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">총 연차 (법정)</p>
                  <p className="text-2xl font-semibold text-gray-900">{leaveBalance.total_days}일</p>
                </div>
              </div>
            </div>
            {welfareLeaveCount > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-6 border-2 border-yellow-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Calendar className="h-8 w-8 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">특별연차 (복지)</p>
                    <p className="text-2xl font-semibold text-yellow-700">{welfareLeaveCount}일</p>
                    <p className="text-xs text-gray-500 mt-1">연차 잔여일에 포함 안 됨</p>
                  </div>
                </div>
              </div>
            )}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">사용 연차</p>
                  <p className="text-2xl font-semibold text-gray-900">{leaveBalance.used_days}일</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">잔여 연차</p>
                  <p className={`text-2xl font-semibold ${
                    leaveBalance.remaining_days > 5 ? 'text-green-600' : 
                    leaveBalance.remaining_days > 2 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {leaveBalance.remaining_days}일
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {!leaveBalance && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
              <p className="text-sm text-yellow-800">
                연차 잔여일 정보가 없습니다. 관리자에게 문의해주세요.
              </p>
            </div>
          </div>
        )}

        {/* 특별연차 및 특별 근무 섹션 */}
        {(welfareLeaves.length > 0 || specialWorks.length > 0) && (
          <div className="bg-white rounded-lg shadow-sm mb-6">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">특별연차 및 특별 근무</h2>
              
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
                
                return (
                  <div className="mb-4">
                    {/* 이번 연도 복지 연차 (미래 날짜) */}
                    {upcomingLeaves.length > 0 && (
                      <div className="mb-4">
                        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-yellow-600" />
                          이번 연도 복지 연차
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {upcomingLeaves.map((welfare) => (
                            <div
                              key={welfare.id}
                              className="px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg text-sm"
                            >
                              <span className="font-medium text-yellow-800">
                                {new Date(welfare.date).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                              </span>
                              {welfare.description && (
                                <span className="text-yellow-600 ml-2">({welfare.description})</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* 지난 복지 연차 (과거 날짜) */}
                    {pastLeaves.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                          지난 복지 연차
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {pastLeaves.map((welfare) => (
                            <div
                              key={welfare.id}
                              className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                            >
                              <span className="font-medium text-gray-600">
                                {new Date(welfare.date).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })}
                              </span>
                              {welfare.description && (
                                <span className="text-gray-500 ml-2">({welfare.description})</span>
                              )}
                              <span className="ml-2 text-xs text-gray-400">(지남)</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}
              
              {/* 특별 근무 표시 */}
              {specialWorks.length > 0 && (
                <div className={welfareLeaves.length > 0 ? "mt-4 pt-4 border-t border-gray-200" : ""}>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-green-600" />
                    이번 달 특별 근무
                  </h3>
                  <div className="space-y-2">
                    {specialWorks.map((work) => {
                      const workDate = new Date(work.date);
                      const dayOfWeek = workDate.getDay();
                      const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
                      
                      return (
                        <div
                          key={work.id}
                          className="px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-sm"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium text-green-800">
                                {workDate.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })} ({dayNames[dayOfWeek]})
                              </span>
                              {work.is_weekend && (
                                <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">
                                  주말
                                </span>
                              )}
                              {work.is_day_off && !work.is_weekend && (
                                <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                  휴무일
                                </span>
                              )}
                            </div>
                            <div className="text-green-600 text-xs">
                              {work.visit_booking_time && (
                                <span>시타 {work.visit_booking_time}</span>
                              )}
                            </div>
                          </div>
                          {work.task_title && (
                            <p className="text-xs text-gray-600 mt-1">{work.task_title}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 연차 신청 내역 */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">내 연차 신청 내역</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
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
                  {leaveRequests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                        신청 내역이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    leaveRequests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50">
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
                          {request.status === 'rejected' && request.rejection_reason && (
                            <p className="text-xs text-red-600 mt-1">{request.rejection_reason}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {request.status === 'pending' && (
                            <button
                              onClick={() => handleEditRequest(request)}
                              className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                            >
                              <Edit className="h-4 w-4" />
                              <span>수정</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* 연차 신청 모달 */}
        {showRequestModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {isEditMode ? '연차 신청 수정' : '연차 신청'}
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    시작일 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={newRequest.start_date}
                    onChange={async (e) => {
                      const date = e.target.value;
                      setNewRequest({ ...newRequest, start_date: date });
                      
                      // 복지 연차 확인
                      const welfareCheck = await checkWelfareLeave(date);
                      if (welfareCheck.isWelfare) {
                        setNewRequest(prev => ({
                          ...prev,
                          start_date: date,
                          leave_type: 'special',
                          is_special_leave: true,
                          reason: welfareCheck.description || '복지 연차'
                        }));
                      }
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    종료일 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={newRequest.end_date}
                    onChange={async (e) => {
                      const date = e.target.value;
                      setNewRequest({ ...newRequest, end_date: date });
                      
                      // 복지 연차 확인
                      const welfareCheck = await checkWelfareLeave(date);
                      if (welfareCheck.isWelfare) {
                        setNewRequest(prev => ({
                          ...prev,
                          end_date: date,
                          leave_type: 'special',
                          is_special_leave: true,
                          reason: prev.reason || welfareCheck.description || '복지 연차'
                        }));
                      }
                    }}
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
                        is_special_leave: false, // 특별연차는 자동 감지 시에만 설정
                        is_monthly_leave: leaveType === 'monthly'
                      });
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {getAvailableLeaveTypes().map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {newRequest.leave_type === 'monthly' && (
                    <p className="text-sm text-purple-600 mt-1">
                      💡 월차는 연차와 별도로 관리됩니다.
                    </p>
                  )}
                  {newRequest.is_special_leave && (
                    <p className="text-sm text-yellow-600 mt-1">
                      💡 복지 연차로 자동 설정되었습니다. 연차 잔여일에 차감되지 않습니다.
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    사유 <span className="text-red-500">*</span>
                  </label>
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
                      {newRequest.leave_type === 'annual' && leaveBalance && (
                        <span className="block mt-1">
                          잔여 연차: {leaveBalance.remaining_days}일
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowRequestModal(false);
                    setIsEditMode(false);
                    setEditingRequestId(null);
                    setNewRequest({
                      start_date: '',
                      end_date: '',
                      reason: '',
                      leave_type: 'annual',
                      is_special_leave: false,
                      is_monthly_leave: false
                    });
                  }}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={handleRequestLeave}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {isEditMode ? '수정' : '신청'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

