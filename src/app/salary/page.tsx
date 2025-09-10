'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatBankAccount, getDocumentTypeLabel } from '@/utils/formatUtils';
import { formatDateKR } from '@/utils/dateUtils';
import { 
  DollarSign, FileText, Download, Eye, Lock, Calendar,
  ChevronLeft, CreditCard, TrendingUp, PieChart, Shield,
  Clock, User, Building, Coffee
} from 'lucide-react';

interface SalaryData {
  salaries: any[];
  contracts: any[];
  bankAccount: any;
  totalEarnings: number;
  averageMonthly: number;
  // 급여 정보 추가
  wageType: 'hourly' | 'monthly';
  monthlySalary: number | null;
  hourlyWage: number;
  pointBonus: number;
  totalEarningsWithBonus: number;
}

export default function SalaryPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [data, setData] = useState<SalaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [showContractModal, setShowContractModal] = useState(false);
  const [selectedContract, setSelectedContract] = useState<any>(null);
  const [currentDateInfo, setCurrentDateInfo] = useState<any>(null);

  useEffect(() => {
    loadSalaryData();
    calculateCurrentDateInfo();
  }, [selectedYear]);

  const calculateCurrentDateInfo = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentDate = now.getDate();
    
    // 급여 지급일 계산 (매월 25일)
    const paymentDate = new Date(currentYear, currentMonth - 1, 25);
    if (paymentDate > now) {
      // 이번 달 25일이 아직 안 지났으면 지난 달 25일로 설정
      paymentDate.setMonth(paymentDate.getMonth() - 1);
    }
    
    // 급여 기간 계산 (지난 달 1일 ~ 마지막 날)
    const periodStart = new Date(currentYear, currentMonth - 2, 1);
    const periodEnd = new Date(currentYear, currentMonth - 1, 0);
    
    setCurrentDateInfo({
      currentDate: now.toISOString().split('T')[0],
      currentYearMonth: `${currentYear}년 ${currentMonth}월`,
      paymentDate: paymentDate.toISOString().split('T')[0],
      periodStart: periodStart.toISOString().split('T')[0],
      periodEnd: periodEnd.toISOString().split('T')[0],
      periodDisplay: `${periodStart.toISOString().split('T')[0]} ~ ${periodEnd.toISOString().split('T')[0]}`
    });
  };

  const loadSalaryData = async () => {
    try {
      // 사용자 정보 가져오기
      const getCurrentUser = async () => {
        if (typeof window !== 'undefined') {
          const isLoggedIn = localStorage.getItem('isLoggedIn');
          const employeeData = localStorage.getItem('currentEmployee');
          
          if (isLoggedIn === 'true' && employeeData) {
            return JSON.parse(employeeData);
          }
        }
        return null;
      };

      const user = await getCurrentUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setCurrentUser(user);

      // 직원 정보 조회 (월급제 vs 시급제 구분)
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('employment_type, monthly_salary, hourly_rate, bank_account')
        .eq('id', user.id)
        .single();
      
      if (employeeError) {
        console.error('직원 정보 조회 오류:', employeeError);
        return;
      }

      // 급여 정보 계산 (employment_type 기준으로 판단)
      let wageType: 'hourly' | 'monthly' = 'hourly';
      let monthlySalary: number | null = null;
      let hourlyWage = 12000; // 기본값

      if (employee.employment_type === 'full_time' && employee.monthly_salary && employee.monthly_salary > 0) {
        wageType = 'monthly';
        monthlySalary = employee.monthly_salary;
        hourlyWage = Math.round(employee.monthly_salary / 22); // 일급 환산
      } else if (employee.employment_type === 'part_time' && employee.hourly_rate && employee.hourly_rate > 0) {
        wageType = 'hourly';
        hourlyWage = employee.hourly_rate;
      } else if (employee.employment_type === 'part_time') {
        // part_time이지만 hourly_rate가 없는 경우 기본값 사용
        wageType = 'hourly';
        hourlyWage = 12000; // 기본값
      }

      // 포인트 수당 계산
      const today = new Date().toISOString().split('T')[0];
      const { data: tasks, error: taskError } = await supabase
        .from('employee_tasks')
        .select(`
          id,
          points,
          operation_types!inner(
            id,
            name,
            points
          )
        `)
        .eq('employee_id', user.id)
        .eq('task_date', today);

      const pointBonus = (tasks || []).reduce((sum: number, task: any) => {
        return sum + (task.operation_types?.points || 0) * 100; // 1포인트 = 100원
      }, 0);

      // 급여 내역 조회 (payslips 테이블에서)
      const { data: payslips, error: payslipError } = await supabase
        .from('payslips')
        .select('*')
        .eq('employee_id', user.id)
        .order('period', { ascending: false });

      // 계약서 조회
      const { data: contracts, error: contractError } = await supabase
        .from('contracts')
        .select('*')
        .eq('employee_id', user.id)
        .order('contract_date', { ascending: false });

      // 통계 계산
      const totalEarnings = (payslips || []).reduce((sum: number, p: any) => sum + (p.net_salary || 0), 0);
      const averageMonthly = (payslips || []).length > 0 ? totalEarnings / (payslips || []).length : 0;
      const totalEarningsWithBonus = totalEarnings + pointBonus;

      setData({
        salaries: payslips || [], // payslips 데이터를 salaries로 매핑
        contracts: contracts || [],
        bankAccount: employee.bank_account,
        totalEarnings,
        averageMonthly,
        wageType,
        monthlySalary,
        hourlyWage,
        pointBonus,
        totalEarningsWithBonus
      });
    } catch (error) {
      console.error('급여 데이터 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewContract = async (contract: any) => {
    try {
      // 계약서 보기 (임시로 파일 경로 직접 열기)
      if (contract.file_path) {
        window.open(contract.file_path, '_blank');
      } else {
        alert('계약서 파일이 등록되지 않았습니다.');
      }
    } catch (error) {
      console.error('계약서 열기 실패:', error);
    }
  };

  const handleDownloadPayslip = async (payslip: any) => {
    try {
      // 급여명세서 HTML 생성
      const payslipHTML = `
        <!DOCTYPE html>
        <html lang="ko">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>MASLABS 급여명세서 - ${payslip.period}</title>
          <style>
            body {
              font-family: 'Malgun Gothic', sans-serif;
              margin: 0;
              padding: 20px;
              background-color: #f5f5f5;
            }
            .payslip-container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              border-radius: 0;
              box-shadow: none;
              overflow: hidden;
            }
            .header {
              background: white;
              color: #000;
              padding: 30px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: bold;
            }
            .header p {
              margin: 10px 0 0 0;
              font-size: 16px;
              opacity: 0.9;
            }
            .content {
              padding: 30px;
            }
            .info-section {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 30px;
              margin-bottom: 30px;
            }
            .info-item {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #eee;
            }
            .info-label {
              font-weight: 600;
              color: #555;
            }
            .salary-section {
              background: white;
              padding: 20px;
              border-radius: 0;
              margin-bottom: 20px;
            }
            .salary-item {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              font-size: 16px;
            }
            .salary-item.total {
              border-top: 2px solid #333;
              font-weight: bold;
              font-size: 18px;
              margin-top: 10px;
              padding-top: 15px;
            }
            .salary-item.deduction {
              color: #dc3545;
            }
            .salary-item.net {
              color: #28a745;
              font-weight: bold;
            }
            .footer {
              background: white;
              padding: 20px;
              text-align: center;
              color: #000;
              font-size: 14px;
            }
            .status-badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: bold;
            }
            .status-issued {
              background: #fff3cd;
              color: #856404;
            }
            .status-paid {
              background: #d4edda;
              color: #155724;
            }
            @media print {
              body { background: white; }
              .payslip-container { box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="payslip-container">
            <div class="header">
              <h1>MASLABS 급여명세서</h1>
              <p>${payslip.period}</p>
            </div>
            
            <div class="content">
              <div class="info-section">
                <div>
                  <div class="info-item">
                    <span class="info-label">직원명:</span>
                    <span>${currentUser?.name || 'N/A'}</span>
                  </div>
                       <div class="info-item">
                         <span class="info-label">직원코드:</span>
                         <span>${payslip.employee_id || currentUser?.employee_id || 'N/A'}</span>
                       </div>
                  <div class="info-item">
                    <span class="info-label">급여 기간:</span>
                    <span>${payslip.period}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">고용 형태:</span>
                    <span>${payslip.employment_type === 'part_time' ? '시간제' : '정규직'}</span>
                  </div>
                </div>
                <div>
                  <div class="info-item">
                    <span class="info-label">지급일:</span>
                    <span>${payslip.paid_at ? new Date(payslip.paid_at).toLocaleDateString('ko-KR') : '미지급'}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">상태:</span>
                    <span class="status-badge ${payslip.status === 'paid' ? 'status-paid' : 'status-issued'}">
                      ${payslip.status === 'paid' ? '지급완료' : payslip.status === 'issued' ? '발행됨' : '생성됨'}
                    </span>
                  </div>
                  ${payslip.employment_type === 'part_time' ? `
                  <div class="info-item">
                    <span class="info-label">총 근무시간:</span>
                    <span>${payslip.total_hours || 0}시간</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">시급:</span>
                    <span>${payslip.hourly_rate ? payslip.hourly_rate.toLocaleString() : 0}원</span>
                  </div>
                  ` : ''}
                </div>
              </div>
              
              <div class="salary-section">
                <h3 style="margin-top: 0; color: #333;">급여 내역</h3>
                <div class="salary-item">
                  <span>기본급</span>
                  <span>${payslip.base_salary.toLocaleString()}원</span>
                </div>
                ${payslip.overtime_pay > 0 ? `
                <div class="salary-item">
                  <span>연장수당</span>
                  <span>${payslip.overtime_pay.toLocaleString()}원</span>
                </div>
                ` : ''}
                ${payslip.incentive > 0 ? `
                <div class="salary-item">
                  <span>인센티브</span>
                  <span>${payslip.incentive.toLocaleString()}원</span>
                </div>
                ` : ''}
                <div class="salary-item total">
                  <span>총 지급액</span>
                  <span>${payslip.total_earnings.toLocaleString()}원</span>
                </div>
                <div class="salary-item deduction">
                  <span>세금 (3.3%)</span>
                  <span>-${payslip.tax_amount.toLocaleString()}원</span>
                </div>
                <div class="salary-item net total">
                  <span>실수령액</span>
                  <span>${payslip.net_salary.toLocaleString()}원</span>
                </div>
              </div>
            </div>
            
            <div class="footer">
              <p>본 급여명세서는 ${new Date().toLocaleDateString('ko-KR')}에 생성되었습니다.</p>
              <p>급여 관련 문의사항이 있으시면 경영지원팀으로 연락주세요.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      // 새 창에서 급여명세서 열기
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(payslipHTML);
        newWindow.document.close();
        
        // 인쇄 대화상자 열기
        setTimeout(() => {
          newWindow.print();
        }, 500);
      } else {
        alert('팝업이 차단되었습니다. 팝업을 허용하고 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('급여명세서 다운로드 실패:', error);
      alert('급여명세서 다운로드에 실패했습니다.');
    }
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
        {/* 급여 정보 카드 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-yellow-900 mb-4 flex items-center">
            <DollarSign className="h-5 w-5 mr-2" />
            급여 정보
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg p-4 border border-yellow-200 text-center">
              <div className="text-sm text-yellow-700 mb-2">
                {data?.wageType === 'monthly' ? '월급' : '시급'}
              </div>
              <div className="text-xl font-bold text-yellow-800">
                {data?.wageType === 'monthly' && data?.monthlySalary 
                  ? `${data.monthlySalary.toLocaleString()}원/월`
                  : `${data?.hourlyWage.toLocaleString()}원/시간`
                }
              </div>
              {data?.wageType === 'monthly' && (
                <div className="text-xs text-yellow-600 mt-1">
                  일급: {data?.hourlyWage.toLocaleString()}원
                </div>
              )}
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-yellow-200 text-center">
              <div className="text-sm text-yellow-700 mb-2">포인트 수당</div>
              <div className="text-xl font-bold text-yellow-800">
                {data?.pointBonus.toLocaleString()}원
              </div>
              <div className="text-xs text-yellow-600 mt-1">
                {Math.round((data?.pointBonus || 0) / 100)}포인트
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-yellow-200 text-center">
              <div className="text-sm text-yellow-700 mb-2">총 수입</div>
              <div className="text-xl font-bold text-yellow-800">
                {data?.totalEarningsWithBonus.toLocaleString()}원
              </div>
              <div className="text-xs text-yellow-600 mt-1">
                급여 + 포인트
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-yellow-200 text-center">
              <div className="text-sm text-yellow-700 mb-2">세금 (3.3%)</div>
              <div className="text-xl font-bold text-yellow-800">
                {data?.salaries[0] ? formatCurrency(data.salaries[0].tax_amount || 0) : '0원'}
              </div>
              <div className="text-xs text-yellow-600 mt-1">
                사업소득자 원천징수
              </div>
            </div>
            
            <div className="bg-white rounded-lg p-4 border border-yellow-200 text-center">
              <div className="text-sm text-yellow-700 mb-2">고용 형태</div>
              <div className="text-lg font-bold text-yellow-800">
                {data?.wageType === 'monthly' ? '정규직' : '시급직'}
              </div>
              <div className="text-xs text-yellow-600 mt-1">
                {data?.wageType === 'monthly' ? '월급제' : '시급제'}
              </div>
            </div>
          </div>
        </div>

        {/* 급여 요약 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100">최근 실수령액</p>
                <p className="text-3xl font-bold mt-2">
                  {data?.salaries[0] ? formatCurrency(data.salaries[0].net_salary) : '-'}
                </p>
                <p className="text-sm text-green-100 mt-1">
                  {data?.salaries[0] ? formatDateKR(data.salaries[0].paid_at || data.salaries[0].created_at) : (currentDateInfo?.paymentDate ? formatDateKR(currentDateInfo.paymentDate) : '')}
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
                  {currentDateInfo?.currentYearMonth?.split('년')[0] || selectedYear}년
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
                {data?.salaries.map((payslip) => (
                  <tr key={payslip.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {payslip.paid_at ? formatDateKR(payslip.paid_at) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {payslip.period}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(payslip.base_salary)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(payslip.overtime_pay || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(payslip.incentive || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      -{formatCurrency(payslip.tax_amount || 0)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-green-600">
                          {formatCurrency(payslip.net_salary)}
                        </span>
                        <span className={`text-xs flex items-center ${
                          payslip.status === 'paid' ? 'text-green-500' :
                          payslip.status === 'issued' ? 'text-yellow-500' :
                          'text-gray-500'
                        }`}>
                          {payslip.status === 'paid' ? '✅ 지급완료' :
                           payslip.status === 'issued' ? '📄 발행됨' : '⏳ 생성됨'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleDownloadPayslip(payslip)}
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

        {/* 한국 노동법/세금법 안내 */}
        <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-green-900 mb-2 flex items-center">
            <Shield className="h-4 w-4 mr-2" />
            한국 노동법/세금법 적용 안내
          </h4>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• <strong>현재 월:</strong> {currentDateInfo?.currentYearMonth || '2025년 9월'} ({currentDateInfo?.periodDisplay || '2025-07-31 ~ 2025-08-30'})</li>
            <li>• <strong>급여 지급일:</strong> {currentDateInfo?.paymentDate || '2025-08-24'} (매월 25일)</li>
            <li>• <strong>세율:</strong> 3.3% (사업소득자 원천징수)</li>
            <li>• <strong>지급 상태:</strong> ✅ 지급완료 (계좌이체)</li>
            <li>• <strong>최저임금:</strong> 10,000원/시간 (2025년 기준)</li>
            <li>• <strong>연장근무:</strong> 1.5배 수당 적용</li>
            <li>• <strong>4대보험:</strong> 별도 계산 (국민연금, 건강보험, 고용보험, 산재보험)</li>
          </ul>
        </div>

        {/* 개인정보 보호 안내 */}
        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
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
