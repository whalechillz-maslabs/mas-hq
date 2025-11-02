'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { FileText, Download, Eye, ArrowLeft, Calendar, User, DollarSign, Clock, X } from 'lucide-react';

interface Contract {
  id: string;
  employee_id: string;
  contract_type: 'part_time' | 'full_time' | 'annual';
  start_date: string;
  end_date?: string;
  salary: number;
  work_hours: number;
  work_days: number;
  work_time: string;
  lunch_break: number;
  meal_allowance: number;
  includes_weekly_holiday: boolean;
  insurance_4major: boolean;
  status: 'draft' | 'pending_signature' | 'signed' | 'active' | 'expired';
  created_at: string;
  signed_at?: string;
  employee_signature?: string;
  employer_signature?: string;
  documents?: {
    id_card?: string;
    family_register?: string;
    bank_account?: string;
  };
  salary_history?: {
    effective_date: string;
    salary: number;
    reason: string;
    notes?: string;
  }[];
  probation_period?: {
    start_date: string;
    end_date: string;
    minimum_wage: boolean;
  };
}

export default function ContractsPage() {
  const router = useRouter();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    loadContracts();
  }, []);

  const loadContracts = async () => {
    try {
      // localStorage에서 현재 로그인한 직원 정보 가져오기
      let currentEmployee = null;
      if (typeof window !== 'undefined') {
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        const employeeData = localStorage.getItem('currentEmployee');
        
        if (isLoggedIn === 'true' && employeeData) {
          currentEmployee = JSON.parse(employeeData);
        }
      }

      if (!currentEmployee) {
        router.push('/login');
        return;
      }

      // 현재 직원의 계약서만 조회 (employees 테이블의 ID 사용)
      const { data: contracts, error } = await supabase
        .from('contracts')
        .select('*')
        .eq('employee_id', currentEmployee.id) // employees 테이블의 ID 사용
        .order('created_at', { ascending: false });

      if (error) {
        console.error('계약서 조회 실패:', error);
        return;
      }

      setContracts(contracts || []);
    } catch (error) {
      console.error('계약서 로드 중 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { text: '초안', color: 'bg-gray-100 text-gray-800' },
      pending_signature: { text: '서명 대기', color: 'bg-yellow-100 text-yellow-800' },
      signed: { text: '서명 완료', color: 'bg-blue-100 text-blue-800' },
      active: { text: '활성', color: 'bg-green-100 text-green-800' },
      expired: { text: '만료', color: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
        {config.text}
      </span>
    );
  };

  const getContractTypeText = (type: string) => {
    switch (type) {
      case 'part_time': return '파트타임 (시급제)';
      case 'full_time': return '정규직 (월급제)';
      case 'annual': return '연봉제';
      default: return type;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const handleViewContract = (contract: Contract) => {
    setSelectedContract(contract);
    setShowDetailModal(true);
  };

  const handleDownloadContract = async (contract: Contract) => {
    try {
      // 현재 직원 정보 가져오기
      let currentEmployee = null;
      if (typeof window !== 'undefined') {
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        const employeeData = localStorage.getItem('currentEmployee');
        
        if (isLoggedIn === 'true' && employeeData) {
          currentEmployee = JSON.parse(employeeData);
        }
      }

      if (!currentEmployee) {
        alert('직원 정보를 불러올 수 없습니다.');
        return;
      }

      // 계약서 HTML 생성
      const contractHTML = generateContractHTML(contract, currentEmployee);
      
      const blob = new Blob([contractHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `근로계약서_${currentEmployee.name}_${contract.start_date}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('계약서 다운로드 실패:', error);
      alert('계약서 다운로드에 실패했습니다.');
    }
  };

  const generateContractHTML = (contract: Contract, employee: any) => {
    const calculateAge = (birthDate: string, referenceDate: Date = new Date()): number => {
      if (!birthDate) return 0;
      const birth = new Date(birthDate);
      let age = referenceDate.getFullYear() - birth.getFullYear();
      const monthDiff = referenceDate.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && referenceDate.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    };

    const age = employee.birth_date ? calculateAge(employee.birth_date) : null;
    const nationalPension = contract.insurance_4major && age !== null ? (age >= 18 && age < 60) : (contract.insurance_4major ? true : false);

    return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>근로계약서 - ${employee.name}</title>
    <style>
        body { font-family: 'Malgun Gothic', sans-serif; line-height: 1.6; margin: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        .subtitle { font-size: 18px; color: #666; }
        .section { margin: 20px 0; }
        .section-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; border-bottom: 2px solid #333; padding-bottom: 5px; }
        .info-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        .info-table th, .info-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .info-table th { background-color: #f5f5f5; font-weight: bold; }
        .signature-section { margin-top: 40px; display: flex; justify-content: space-between; }
        .signature-box { width: 45%; text-align: center; }
        .signature-line { border-bottom: 1px solid #333; height: 50px; margin: 20px 0; }
        .terms { margin: 20px 0; }
        .terms ol { padding-left: 20px; }
        .terms li { margin: 10px 0; }
        @media print { body { margin: 20px; } }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">근로계약서</div>
        <div class="subtitle">Employment Contract</div>
    </div>

    <div class="section">
        <div class="section-title">1. 당사자</div>
        <table class="info-table">
            <tr>
                <th>사업주</th>
                <td>마스골프 (대표: 김탁수)</td>
            </tr>
            <tr>
                <th>근로자</th>
                <td>${employee.name} (${employee.employee_id})</td>
            </tr>
        </table>
    </div>

    <div class="section">
        <div class="section-title">2. 근로조건</div>
        <table class="info-table">
            <tr>
                <th>계약 유형</th>
                <td>${contract.contract_type === 'part_time' ? '파트타임 (시급제)' : contract.contract_type === 'full_time' ? '정규직 (월급제)' : contract.contract_type === 'annual' ? '연봉제' : '정규직'}</td>
            </tr>
            <tr>
                <th>계약 기간</th>
                <td>${contract.start_date} ~ ${contract.end_date || '무기한'}</td>
            </tr>
            <tr>
                <th>근무 시간</th>
                <td>주 ${contract.work_days}일, 일 ${contract.work_hours}시간</td>
            </tr>
            <tr>
                <th>급여</th>
                <td>${contract.contract_type === 'annual' ? 
                    `${contract.salary.toLocaleString()}원 (연봉) - 월 환산 ${Math.round(contract.salary / 12).toLocaleString()}원` : 
                    `${contract.salary.toLocaleString()}원 ${contract.contract_type === 'part_time' ? '(시급)' : contract.contract_type === 'full_time' ? '(월급)' : '(월급)'}`
                }</td>
            </tr>
        </table>
    </div>

    <div class="section">
        <div class="section-title">3. 근로조건 세부사항</div>
        <div class="terms">
            <ol>
                <li>근무시간: ${contract.work_time || '09:00-17:00'} (점심시간 ${contract.lunch_break || 1}시간)</li>
                <li>주휴수당: ${contract.includes_weekly_holiday ? '포함' : '별도 지급'}</li>
                <li>식대: ${contract.meal_policy === 'per_day' ? 
                    `${contract.meal_rate ? contract.meal_rate.toLocaleString() : '7,000'}원/일 (3시간 이상 근무일)` : 
                    contract.meal_policy === 'fixed_with_reconcile' ?
                    `월 ${((contract.meal_fixed_days_per_month || 20) * (contract.meal_rate || 7000)).toLocaleString()}원 선지급 (${contract.meal_fixed_days_per_month || 20}일×${contract.meal_rate ? contract.meal_rate.toLocaleString() : '7,000'}원), 익월 실제 사용분 정산` :
                    `${contract.meal_allowance ? contract.meal_allowance.toLocaleString() : '0'}원`
                }</li>
                <li>4대보험: ${contract.insurance_4major ? 
                    `${nationalPension ? '국민연금(가입), ' : '국민연금(미가입), '}건강보험(가입), 고용보험(가입), 산재보험(가입)` : 
                    '해당없음'
                }</li>
                <li>연차: ${contract.contract_type === 'part_time' ? '해당없음' : '근로기준법에 따라 지급'}</li>
            </ol>
        </div>
    </div>

    ${contract.vacation_policy ? `
    <div class="section">
        <div class="section-title">4. 휴가 관련 조항</div>
        <div class="terms">
            <ol>
                <li>대체 공휴일: ${contract.vacation_policy.substitute_holidays ? '정상 근무' : '휴무'}</li>
                <li>병가: ${contract.vacation_policy.sick_leave_deducts_annual ? '연차에서 차감' : '연차와 별도 처리'}</li>
                <li>가족 경조사 휴가: ${contract.vacation_policy.family_events_days || 3}일 (배우자, 자식, 부모)</li>
            </ol>
        </div>
    </div>
    ` : ''}

    <div class="section">
        <div class="section-title">${contract.vacation_policy ? '5' : '4'}. 기타 조건</div>
        <div class="terms">
            <ol>
                <li>본 계약서는 근로기준법에 따라 작성되었습니다.</li>
                <li>계약 조건 변경 시에는 서면으로 합의해야 합니다.</li>
                <li>해고 시에는 30일 전 통보 또는 30일분의 통상임금을 지급합니다.</li>
                <li>기타 근로조건은 근로기준법 및 관련 법령에 따릅니다.</li>
            </ol>
        </div>
    </div>

    <div class="signature-section">
        <div class="signature-box">
            <div>사업주</div>
            <div class="signature-line"></div>
            <div>마스골프 대표 김탁수</div>
            <div>${new Date(contract.created_at).toLocaleDateString('ko-KR')}</div>
        </div>
        <div class="signature-box">
            <div>근로자</div>
            <div class="signature-line"></div>
            <div>${employee.name}</div>
            <div>${new Date(contract.created_at).toLocaleDateString('ko-KR')}</div>
        </div>
    </div>
</body>
</html>`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">계약서를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">계약서 조회</h1>
                <p className="text-gray-600">나의 근로계약서 확인 및 다운로드</p>
              </div>
            </div>
          </div>
        </div>

        {/* 계약서 목록 */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">근로계약서 목록</h2>
            <p className="text-sm text-gray-600 mt-1">
              총 {contracts.length}건의 계약서가 있습니다.
            </p>
          </div>

          {contracts.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">계약서가 없습니다</h3>
              <p className="text-gray-600">아직 등록된 근로계약서가 없습니다.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {contracts.map((contract) => (
                <div key={contract.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {getContractTypeText(contract.contract_type)}
                        </h3>
                        {getStatusBadge(contract.status)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {formatDate(contract.start_date)}
                            {contract.end_date && ` ~ ${formatDate(contract.end_date)}`}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-4 h-4" />
                          <span>
                            {contract.contract_type === 'part_time' ? '시급' : 
                             contract.contract_type === 'full_time' ? '월급' : '연봉'}: 
                            {contract.salary.toLocaleString()}원
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4" />
                          <span>
                            {contract.work_hours}시간/일, {contract.work_days}일/주
                          </span>
                        </div>
                      </div>
                      
                      <div className="mt-2 text-xs text-gray-500">
                        생성일: {formatDate(contract.created_at)}
                        {contract.signed_at && ` • 서명일: ${formatDate(contract.signed_at)}`}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => handleViewContract(contract)}
                        className="flex items-center px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        상세보기
                      </button>
                      
                      <button
                        onClick={() => handleDownloadContract(contract)}
                        className="flex items-center px-3 py-1.5 text-sm text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        다운로드
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 계약서 상세 모달 */}
      {showDetailModal && selectedContract && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">계약서 상세 정보</h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              {/* 기본 정보 */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">기본 정보</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">계약 유형</label>
                    <p className="mt-1 text-sm text-gray-900">{getContractTypeText(selectedContract.contract_type)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">상태</label>
                    <div className="mt-1">{getStatusBadge(selectedContract.status)}</div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">계약 시작일</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedContract.start_date)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">계약 종료일</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedContract.end_date ? formatDate(selectedContract.end_date) : '무기한'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 급여 정보 */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">급여 정보</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {selectedContract.contract_type === 'part_time' ? '시급' : 
                       selectedContract.contract_type === 'full_time' ? '월급' : '연봉'}
                    </label>
                    <p className="mt-1 text-sm text-gray-900">{selectedContract.salary ? selectedContract.salary.toLocaleString() : '0'}원</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">식대</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedContract.meal_allowance ? selectedContract.meal_allowance.toLocaleString() : '0'}원</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">근무 시간</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedContract.work_hours || 0}시간/일</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">근무 일수</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedContract.work_days || 0}일/주</p>
                  </div>
                </div>
              </div>

              {/* 근무 조건 */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">근무 조건</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">근무 시간대</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedContract.work_time}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">점심 시간</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedContract.lunch_break}시간</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">주휴수당 포함</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedContract.includes_weekly_holiday ? '포함' : '미포함'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">4대보험</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedContract.insurance_4major ? '가입' : '미가입'}</p>
                  </div>
                </div>
              </div>

              {/* 수습기간 */}
              {selectedContract.probation_period && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">수습기간</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">수습 시작일</label>
                      <p className="mt-1 text-sm text-gray-900">{formatDate(selectedContract.probation_period.start_date)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">수습 종료일</label>
                      <p className="mt-1 text-sm text-gray-900">{formatDate(selectedContract.probation_period.end_date)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 급여 변동 이력 */}
              {selectedContract.salary_history && selectedContract.salary_history.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">급여 변동 이력</h4>
                  <div className="space-y-2">
                    {selectedContract.salary_history.map((history, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {formatDate(history.effective_date)} - {history.salary.toLocaleString()}원
                            </p>
                            <p className="text-sm text-gray-600">{history.reason}</p>
                            {history.notes && (
                              <p className="text-xs text-gray-500 mt-1">{history.notes}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                닫기
              </button>
              <button
                onClick={() => handleDownloadContract(selectedContract)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>다운로드</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
