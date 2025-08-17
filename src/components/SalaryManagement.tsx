'use client';

import { useState, useEffect } from 'react';
import { db, Employee, Salary, Contract } from '@/lib/supabase';
import { formatCurrency, formatBankAccount } from '@/utils/formatUtils';
import { formatDateKR, formatDateISO } from '@/utils/dateUtils';
import {
  DollarSign,
  FileText,
  Download,
  Eye,
  TrendingUp,
  TrendingDown,
  Calendar,
  CreditCard,
  Award,
  AlertCircle,
  Lock,
  Shield
} from 'lucide-react';

interface SalaryDetails {
  baseSalary: number;
  overtimePay: number;
  bonus: number;
  deductions: number;
  netAmount: number;
  workHours: number;
  overtimeHours: number;
}

export default function SalaryManagement() {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [showContractModal, setShowContractModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // 현재 직원 정보 가져오기
      const currentEmployee = await db.auth.getCurrentUser();
      if (currentEmployee) {
        setEmployee(currentEmployee);

        // 급여 내역 가져오기
        const salaryData = await db.getMySalaries(currentEmployee.id, 12);
        setSalaries(salaryData || []);

        // 계약서 가져오기
        const contractData = await db.getMyContracts(currentEmployee.id);
        setContracts(contractData || []);

        // 최신 급여 기간 선택
        if (salaryData && salaryData.length > 0) {
          setSelectedPeriod(salaryData[0].id);
        }
      }
    } catch (error) {
      console.error('데이터 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getSelectedSalary = (): Salary | undefined => {
    return salaries.find(s => s.id === selectedPeriod);
  };

  const calculateTax = (amount: number): number => {
    return Math.floor(amount * 0.033); // 3.3% 세금
  };

  const getTotalEarnings = (): number => {
    return salaries.reduce((acc, salary) => acc + (salary.net_amount || 0), 0);
  };

  const getAverageMonthly = (): number => {
    if (salaries.length === 0) return 0;
    return Math.floor(getTotalEarnings() / salaries.length);
  };

  const handleViewContract = async (contract: Contract) => {
    // 실제로는 서명된 URL을 생성하여 보여줘야 함
    setSelectedContract(contract);
    setShowContractModal(true);
  };

  const handleDownloadPayslip = (salary: Salary) => {
    // 실제로는 PDF 생성 로직 구현
    alert('급여명세서 다운로드 기능은 준비 중입니다.');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const selectedSalary = getSelectedSalary();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">내 급여 현황</h1>
          <p className="text-gray-600 mt-2">급여 내역과 계약 정보를 확인할 수 있습니다</p>
        </div>

        {/* 요약 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="w-8 h-8 text-green-600" />
              <span className="text-xs text-green-600 font-medium">이번 달</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {selectedSalary ? formatCurrency(selectedSalary.net_amount || 0) : '-'}
            </div>
            <div className="text-sm text-gray-600 mt-1">실수령액</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8 text-blue-600" />
              <span className="text-xs text-gray-600">최근 12개월</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(getTotalEarnings())}
            </div>
            <div className="text-sm text-gray-600 mt-1">총 수령액</div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <Award className="w-8 h-8 text-purple-600" />
              <span className="text-xs text-gray-600">평균</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(getAverageMonthly())}
            </div>
            <div className="text-sm text-gray-600 mt-1">월 평균</div>
          </div>
        </div>

        {/* 급여 상세 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">급여 상세 내역</h2>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              {salaries.map((salary) => (
                <option key={salary.id} value={salary.id}>
                  {formatDateKR(salary.period_start)} ~ {formatDateKR(salary.period_end)}
                </option>
              ))}
            </select>
          </div>

          {selectedSalary ? (
            <div className="space-y-4">
              {/* 급여 내역 */}
              <div className="border-b pb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">지급 내역</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">기본급</span>
                    <span className="font-medium">{formatCurrency(selectedSalary.base_salary || 0)}</span>
                  </div>
                  {selectedSalary.overtime_pay && selectedSalary.overtime_pay > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">연장근무 수당</span>
                      <span className="font-medium">{formatCurrency(selectedSalary.overtime_pay)}</span>
                    </div>
                  )}
                  {selectedSalary.bonus && selectedSalary.bonus > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">인센티브</span>
                      <span className="font-medium text-green-600">+{formatCurrency(selectedSalary.bonus)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 공제 내역 */}
              <div className="border-b pb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-3">공제 내역</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">소득세 (3.3%)</span>
                    <span className="font-medium text-red-600">
                      -{formatCurrency(calculateTax(selectedSalary.base_salary || 0))}
                    </span>
                  </div>
                  {selectedSalary.deductions && selectedSalary.deductions > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">기타 공제</span>
                      <span className="font-medium text-red-600">-{formatCurrency(selectedSalary.deductions)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 실수령액 */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">실수령액</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      지급예정일: {selectedSalary.payment_date ? formatDateKR(selectedSalary.payment_date) : '미정'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(selectedSalary.net_amount || 0)}
                    </div>
                    <button
                      onClick={() => handleDownloadPayslip(selectedSalary)}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      명세서 다운로드
                    </button>
                  </div>
                </div>
              </div>

              {/* 근무 시간 정보 */}
              {selectedSalary.total_work_hours && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">근무 시간</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-600">정규 근무</span>
                      <p className="font-medium">{selectedSalary.total_work_hours}시간</p>
                    </div>
                    {selectedSalary.total_overtime_hours && selectedSalary.total_overtime_hours > 0 && (
                      <div>
                        <span className="text-gray-600">연장 근무</span>
                        <p className="font-medium text-red-600">{selectedSalary.total_overtime_hours}시간</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              급여 내역이 없습니다.
            </div>
          )}
        </div>

        {/* 계좌 정보 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">계좌 정보</h2>
            <CreditCard className="w-6 h-6 text-gray-400" />
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            {employee?.bank_account ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">급여 수령 계좌</p>
                  <p className="font-medium text-gray-900 mt-1">
                    {formatBankAccount(employee.bank_account)}
                  </p>
                </div>
                <Shield className="w-5 h-5 text-green-600" />
              </div>
            ) : (
              <div className="text-center text-gray-500">
                등록된 계좌 정보가 없습니다. 관리자에게 문의하세요.
              </div>
            )}
          </div>
        </div>

        {/* 계약서 및 문서 */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">계약서 및 문서</h2>
            <Lock className="w-6 h-6 text-gray-400" />
          </div>

          {contracts.length > 0 ? (
            <div className="space-y-3">
              {contracts.map((contract) => (
                <div
                  key={contract.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{contract.document_name}</p>
                      <p className="text-sm text-gray-600">
                        {contract.document_type === 'employment' && '근로계약서'}
                        {contract.document_type === 'nda' && '비밀유지서약서'}
                        {contract.document_type === 'other' && '기타 문서'}
                        {contract.contract_date && ` • ${formatDateKR(contract.contract_date)}`}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleViewContract(contract)}
                    className="flex items-center px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    열람
                  </button>
                </div>
              ))}
              
              <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">보안 안내</p>
                    <p>계약서 및 급여 정보는 본인만 열람 가능하며, 외부 유출 시 법적 책임을 물을 수 있습니다.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              등록된 문서가 없습니다.
            </div>
          )}
        </div>
      </div>

      {/* 계약서 보기 모달 */}
      {showContractModal && selectedContract && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">{selectedContract.document_name}</h3>
              <button
                onClick={() => setShowContractModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-8 text-center">
              <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">보안 문서입니다.</p>
              <p className="text-sm text-gray-500 mt-2">
                계약서 열람은 HR 부서에 문의하세요.
              </p>
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowContractModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
