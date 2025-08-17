'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db, storage } from '@/lib/supabase';
import { formatCurrency, formatBankAccount, getDocumentTypeLabel } from '@/utils/formatUtils';
import { formatDateKR } from '@/utils/dateUtils';
import { 
  DollarSign, FileText, Download, Eye, Lock, Calendar,
  ChevronLeft, CreditCard, TrendingUp, PieChart, Shield
} from 'lucide-react';

interface SalaryData {
  salaries: any[];
  contracts: any[];
  bankAccount: any;
  totalEarnings: number;
  averageMonthly: number;
}

export default function SalaryPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [data, setData] = useState<SalaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showContractModal, setShowContractModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);

  useEffect(() => {
    loadSalaryData();
  }, [selectedYear]);

  const loadSalaryData = async () => {
    try {
      const user = await auth.getCurrentUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setCurrentUser(user);

      // 급여 정보 조회
      const salaries = await db.getMySalaries(user.id);
      const contracts = await db.getMyContracts(user.id);

      // 통계 계산
      const totalEarnings = salaries.reduce((sum: number, s: any) => sum + (s.net_amount || 0), 0);
      const averageMonthly = salaries.length > 0 ? totalEarnings / salaries.length : 0;

      setData({
        salaries,
        contracts,
        bankAccount: user.bank_account,
        totalEarnings,
        averageMonthly
      });
    } catch (error) {
      console.error('급여 데이터 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewContract = async (contract: any) => {
    try {
      // 계약서 보기 (보안 URL 생성)
      const signedUrl = await storage.getSignedUrl('contracts', contract.file_path, 3600);
      window.open(signedUrl, '_blank');
    } catch (error) {
      console.error('계약서 열기 실패:', error);
    }
  };

  const handleDownloadPayslip = async (salary: any) => {
    // 급여명세서 다운로드 로직
    console.log('급여명세서 다운로드:', salary);
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
              <h1 className="text-xl font-semibold">급여 조회</h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <Lock className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-600">개인정보 보호</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 급여 요약 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">최근 실수령액</p>
                <p className="text-3xl font-bold mt-2">
                  {data?.salaries[0] ? formatCurrency(data.salaries[0].net_amount) : '-'}
                </p>
                <p className="text-sm text-green-100 mt-1">
                  {data?.salaries[0] ? formatDateKR(data.salaries[0].payment_date) : ''}
                </p>
              </div>
              <DollarSign className="h-12 w-12 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100">월 평균 급여</p>
                <p className="text-3xl font-bold mt-2">
                  {formatCurrency(data?.averageMonthly || 0)}
                </p>
                <p className="text-sm text-blue-100 mt-1">
                  최근 12개월 기준
                </p>
              </div>
              <TrendingUp className="h-12 w-12 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100">누적 수령액</p>
                <p className="text-3xl font-bold mt-2">
                  {formatCurrency(data?.totalEarnings || 0)}
                </p>
                <p className="text-sm text-purple-100 mt-1">
                  {selectedYear}년
                </p>
              </div>
              <PieChart className="h-12 w-12 text-purple-200" />
            </div>
          </div>
        </div>

        {/* 계좌 정보 */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <CreditCard className="h-5 w-5 mr-2" />
            급여 계좌
          </h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <p className="text-sm text-gray-600 mb-2">등록된 계좌</p>
            <p className="text-lg font-medium">
              {formatBankAccount(data?.bankAccount) || '계좌 정보가 등록되지 않았습니다.'}
            </p>
          </div>
        </div>

        {/* 급여 내역 테이블 */}
        <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold">급여 내역</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    지급일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    급여 기간
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    기본급
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    연장수당
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    인센티브
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    공제액
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    실수령액
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    명세서
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data?.salaries.map((salary) => (
                  <tr key={salary.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDateKR(salary.payment_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateKR(salary.period_start)} ~ {formatDateKR(salary.period_end)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(salary.base_salary)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(salary.overtime_pay || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(salary.bonus || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      -{formatCurrency(salary.deductions || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold text-green-600">
                        {formatCurrency(salary.net_amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleDownloadPayslip(salary)}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 계약서 및 문서 */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            계약서 및 문서
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.contracts.map((contract) => (
              <div
                key={contract.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-900">
                      {getDocumentTypeLabel(contract.document_type)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatDateKR(contract.contract_date || contract.created_at)}
                    </p>
                  </div>
                  {contract.is_confidential && (
                    <Shield className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                
                <p className="text-sm text-gray-600 mb-3">
                  {contract.document_name}
                </p>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleViewContract(contract)}
                    className="flex-1 px-3 py-1 text-sm bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100"
                  >
                    <Eye className="h-4 w-4 inline mr-1" />
                    보기
                  </button>
                  <button
                    onClick={() => handleViewContract(contract)}
                    className="flex-1 px-3 py-1 text-sm bg-gray-50 text-gray-600 rounded hover:bg-gray-100"
                  >
                    <Download className="h-4 w-4 inline mr-1" />
                    다운로드
                  </button>
                </div>
              </div>
            ))}
          </div>

          {(!data?.contracts || data.contracts.length === 0) && (
            <div className="text-center py-8 text-gray-500">
              등록된 계약서가 없습니다.
            </div>
          )}
        </div>

        {/* 안내 메시지 */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-2 flex items-center">
            <Lock className="h-4 w-4 mr-2" />
            개인정보 보호 안내
          </h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• 급여 정보는 본인만 조회할 수 있습니다.</li>
            <li>• 계약서 및 문서는 암호화되어 안전하게 보관됩니다.</li>
            <li>• 세금 계산은 3.3% 원천징수 기준입니다.</li>
            <li>• 급여 관련 문의는 경영지원팀으로 연락 주세요.</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
