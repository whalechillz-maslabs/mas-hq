'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatCurrency, formatBankAccount, getDocumentTypeLabel } from '@/utils/formatUtils';
import { formatDateKR } from '@/utils/dateUtils';
import { 
  DollarSign, FileText, Download, Eye, Lock, Calendar,
  ChevronLeft, CreditCard, TrendingUp, PieChart, Shield,
  Clock, User, Building, Coffee, Printer, Plus, Edit, Save, X
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
  const [selectedPayslip, setSelectedPayslip] = useState<any>(null);
  const [showBankAccountModal, setShowBankAccountModal] = useState(false);
  const [bankAccountData, setBankAccountData] = useState({
    bank_name: '',
    account_number: '',
    account_holder: ''
  });

  // 급여 기간을 더 구체적으로 표시하는 함수
  const formatSalaryPeriod = (period: string, dailyDetails?: any[]) => {
    // 분할 급여명세서인 경우 (periodName이 사용된 경우)
    if (period.includes('차') || period.includes('~')) {
      return period; // 이미 구체적인 기간이 표시됨
    }
    
    // 월 급여명세서인 경우 (2025-06 형태)
    if (period.match(/^\d{4}-\d{2}$/)) {
      const [year, month] = period.split('-');
      const monthNum = parseInt(month);
      
      // daily_details가 있으면 실제 근무 기간 계산
      if (dailyDetails && dailyDetails.length > 0) {
        const dates = dailyDetails.map(d => new Date(d.date)).sort((a, b) => a.getTime() - b.getTime());
        const startDate = dates[0];
        const endDate = dates[dates.length - 1];
        
        const startMonth = startDate.getMonth() + 1;
        const startDay = startDate.getDate();
        const endMonth = endDate.getMonth() + 1;
        const endDay = endDate.getDate();
        
        if (startMonth === endMonth) {
          return `${startMonth}월${startDay}일-${endDay}일`;
        } else {
          return `${startMonth}월${startDay}일-${endMonth}월${endDay}일`;
        }
      }
      
      // daily_details가 없으면 월 전체로 표시
      return `${monthNum}월`;
    }
    
    return period;
  };

  useEffect(() => {
    loadSalaryData();
    calculateCurrentDateInfo();
  }, [selectedYear]);

  const calculateCurrentDateInfo = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentDate = now.getDate();
    
    // 급여 지급일 계산 (매월 말일)
    const paymentDate = new Date(currentYear, currentMonth, 0); // 현재 달의 마지막 날
    if (paymentDate > now) {
      // 이번 달 말일이 아직 안 지났으면 지난 달 말일로 설정
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

      // 계좌 정보 조회 (임시로 employees 테이블에서)
      let bankAccount = null;
      if (employee.bank_account) {
        const parts = employee.bank_account.split('|');
        if (parts.length === 3) {
          bankAccount = {
            bank_name: parts[0],
            account_number: parts[1],
            account_holder: parts[2]
          };
        }
      }

      // 통계 계산
      const totalEarnings = (payslips || []).reduce((sum: number, p: any) => sum + (p.net_salary || 0), 0);
      const averageMonthly = (payslips || []).length > 0 ? totalEarnings / (payslips || []).length : 0;
      const totalEarningsWithBonus = totalEarnings + pointBonus;

      setData({
        salaries: payslips || [], // payslips 데이터를 salaries로 매핑
        contracts: contracts || [],
        bankAccount: bankAccount, // 파싱된 계좌 정보 사용
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
      // 급여명세서 HTML 생성 (관리자용과 동일한 흑백 고급스러운 디자인)
      const payslipHTML = `
        <!DOCTYPE html>
        <html lang="ko">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>급여명세서 - ${currentUser?.name || '직원'}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif;
              background: white;
              color: #000;
              line-height: 1.6;
            }
            .payslip-container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              border: none;
              padding: 0;
            }
            .header {
              background: white;
              color: #000;
              padding: 40px 30px;
              text-align: center;
              border-bottom: 2px solid #000;
            }
            .header h1 {
              font-size: 32px;
              font-weight: 900;
              letter-spacing: 2px;
              margin-bottom: 10px;
            }
            .header .period {
              font-size: 18px;
              font-weight: 600;
              letter-spacing: 1px;
            }
            .content {
              padding: 40px 30px;
            }
            .info-section {
              margin-bottom: 40px;
            }
            .section-title {
              font-size: 20px;
              font-weight: 900;
              text-align: center;
              margin-bottom: 25px;
              padding-bottom: 10px;
              border-bottom: 2px solid #000;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 40px;
            }
            .info-item {
              display: flex;
              justify-content: space-between;
              padding: 12px 0;
              border-bottom: 1px solid #ccc;
              font-size: 16px;
            }
            .info-label {
              font-weight: 700;
              color: #000;
              min-width: 120px;
            }
            .info-value {
              font-weight: 500;
              text-align: right;
            }
            .salary-section {
              border: none;
              padding: 30px;
              margin-bottom: 30px;
              background: white;
            }
            .salary-title {
              font-size: 20px;
              font-weight: 900;
              text-align: center;
              margin-bottom: 25px;
              padding-bottom: 10px;
              border-bottom: 2px solid #000;
            }
            .salary-item {
              display: flex;
              justify-content: space-between;
              padding: 15px 0;
              font-size: 16px;
              border-bottom: 1px solid #ddd;
            }
            .salary-item:last-child {
              border-bottom: none;
            }
            .salary-item.total {
              border-top: 2px solid #000;
              border-bottom: 2px solid #000;
              font-weight: 900;
              font-size: 20px;
              margin: 20px 0;
              padding: 20px 0;
              background: white;
            }
            .salary-item.deduction {
              font-weight: 600;
            }
            .salary-item.net {
              font-weight: 900;
              font-size: 22px;
              background: white;
              padding: 20px;
              margin-top: 15px;
              border: none;
            }
            .footer {
              background: white;
              color: #000;
              padding: 25px;
              text-align: center;
              font-size: 14px;
              line-height: 1.8;
            }
            .status-badge {
              display: inline-block;
              padding: 6px 15px;
              border: none;
              font-size: 12px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .status-issued {
              background: white;
              color: #000;
            }
            .status-paid {
              background: white;
              color: #000;
            }
            .status-generated {
              background: white;
              color: #000;
            }
            @media print {
              body { 
                background: white; 
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .payslip-container { 
                border: none;
                box-shadow: none;
              }
              .header {
                background: white !important;
                color: black !important;
              }
              .footer {
                background: white !important;
                color: black !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="payslip-container">
            <div class="header">
              <h1>MASLABS</h1>
              <div class="period">급여명세서 ${payslip.period}</div>
            </div>

            <div class="content">
              <div class="info-section">
                <div class="section-title">기본 정보</div>
                <div class="info-grid">
                  <div>
                    <div class="info-item">
                      <span class="info-label">직원명:</span>
                      <span class="info-value">${currentUser?.name || '정보 없음'}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">직원 코드:</span>
                      <span class="info-value">${currentUser?.employee_id || '정보 없음'}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">급여 기간:</span>
                      <span class="info-value">${payslip.period}</span>
                    </div>
                  </div>
                  <div>
                    <div class="info-item">
                      <span class="info-label">고용 형태:</span>
                      <span class="info-value">${payslip.employment_type === 'full_time' ? '정규직' : '시간제'}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">지급일:</span>
                      <span class="info-value">${payslip.payment_date || (payslip.status === 'paid' ? '지급완료' : '미지급')}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">상태:</span>
                      <span class="status-badge status-${payslip.status}">
                        ${payslip.status === 'generated' ? '생성됨' :
                          payslip.status === 'issued' ? '발행됨' : '지급완료'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="salary-section">
                <div class="salary-title">급여 내역</div>
                <div class="salary-item">
                  <span>기본급</span>
                  <span>${payslip.base_salary?.toLocaleString() || 0}원</span>
                </div>
                ${payslip.weekly_holiday_pay > 0 ? `
                <div class="salary-item">
                  <span>주휴수당</span>
                  <span>${payslip.weekly_holiday_pay.toLocaleString()}원</span>
                </div>
                ` : ''}
                ${payslip.meal_allowance > 0 ? `
                <div class="salary-item">
                  <span>식대</span>
                  <span>${payslip.meal_allowance.toLocaleString()}원</span>
                </div>
                ` : ''}
                ${payslip.point_bonus > 0 ? `
                <div class="salary-item">
                  <span>포인트 보너스</span>
                  <span>${payslip.point_bonus.toLocaleString()}원</span>
                </div>
                ` : ''}
                <div class="salary-item total">
                  <span>총 지급액</span>
                  <span>${payslip.total_earnings?.toLocaleString() || 0}원</span>
                </div>
              </div>

              <div class="salary-section">
                <div class="salary-title">공제 내역</div>
                <div class="salary-item deduction">
                  <span>세금 (3.3%)</span>
                  <span>${payslip.tax_amount?.toLocaleString() || 0}원</span>
                </div>
                <div class="salary-item net">
                  <span>실수령액</span>
                  <span>${payslip.net_salary?.toLocaleString() || 0}원</span>
                </div>
              </div>

              <div class="footer">
                <p>본 급여명세서는 MASLABS에서 발행한 공식 문서입니다.</p>
                <p>급여 관련 문의사항이 있으시면 경영지원팀으로 연락해 주세요.</p>
              </div>
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

  const handlePrintPayslip = async (payslip: any) => {
    try {
      // 급여명세서 HTML 생성 (관리자용과 동일한 흑백 고급스러운 디자인)
      const payslipHTML = `
        <!DOCTYPE html>
        <html lang="ko">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>급여명세서 - ${currentUser?.name || '직원'}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Malgun Gothic', 'Apple SD Gothic Neo', sans-serif;
              background: white;
              color: #000;
              line-height: 1.6;
            }
            .payslip-container {
              max-width: 800px;
              margin: 0 auto;
              background: white;
              border: none;
              padding: 0;
            }
            .header {
              background: white;
              color: #000;
              padding: 40px 30px;
              text-align: center;
              border-bottom: 2px solid #000;
            }
            .header h1 {
              font-size: 32px;
              font-weight: 900;
              letter-spacing: 2px;
              margin-bottom: 10px;
            }
            .header .period {
              font-size: 18px;
              font-weight: 600;
              letter-spacing: 1px;
            }
            .content {
              padding: 40px 30px;
            }
            .info-section {
              margin-bottom: 40px;
            }
            .section-title {
              font-size: 20px;
              font-weight: 900;
              text-align: center;
              margin-bottom: 25px;
              padding-bottom: 10px;
              border-bottom: 2px solid #000;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 40px;
            }
            .info-item {
              display: flex;
              justify-content: space-between;
              padding: 12px 0;
              border-bottom: 1px solid #ccc;
              font-size: 16px;
            }
            .info-label {
              font-weight: 700;
              color: #000;
              min-width: 120px;
            }
            .info-value {
              font-weight: 500;
              text-align: right;
            }
            .salary-section {
              border: none;
              padding: 30px;
              margin-bottom: 30px;
              background: white;
            }
            .salary-title {
              font-size: 20px;
              font-weight: 900;
              text-align: center;
              margin-bottom: 25px;
              padding-bottom: 10px;
              border-bottom: 2px solid #000;
            }
            .salary-item {
              display: flex;
              justify-content: space-between;
              padding: 15px 0;
              font-size: 16px;
              border-bottom: 1px solid #ddd;
            }
            .salary-item:last-child {
              border-bottom: none;
            }
            .salary-item.total {
              border-top: 2px solid #000;
              border-bottom: 2px solid #000;
              font-weight: 900;
              font-size: 20px;
              margin: 20px 0;
              padding: 20px 0;
              background: white;
            }
            .salary-item.deduction {
              font-weight: 600;
            }
            .salary-item.net {
              font-weight: 900;
              font-size: 22px;
              background: white;
              padding: 20px;
              margin-top: 15px;
              border: none;
            }
            .footer {
              background: white;
              color: #000;
              padding: 25px;
              text-align: center;
              font-size: 14px;
              line-height: 1.8;
            }
            .status-badge {
              display: inline-block;
              padding: 6px 15px;
              border: none;
              font-size: 12px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .status-issued {
              background: white;
              color: #000;
            }
            .status-paid {
              background: white;
              color: #000;
            }
            .status-generated {
              background: white;
              color: #000;
            }
            @media print {
              body { 
                background: white; 
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              .payslip-container { 
                border: none;
                box-shadow: none;
              }
              .header {
                background: white !important;
                color: black !important;
              }
              .footer {
                background: white !important;
                color: black !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="payslip-container">
            <div class="header">
              <h1>MASLABS</h1>
              <div class="period">급여명세서 ${payslip.period}</div>
            </div>

            <div class="content">
              <div class="info-section">
                <div class="section-title">기본 정보</div>
                <div class="info-grid">
                  <div>
                    <div class="info-item">
                      <span class="info-label">직원명:</span>
                      <span class="info-value">${currentUser?.name || '정보 없음'}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">직원 코드:</span>
                      <span class="info-value">${currentUser?.employee_id || '정보 없음'}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">급여 기간:</span>
                      <span class="info-value">${payslip.period}</span>
                    </div>
                  </div>
                  <div>
                    <div class="info-item">
                      <span class="info-label">고용 형태:</span>
                      <span class="info-value">${payslip.employment_type === 'full_time' ? '정규직' : '시간제'}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">지급일:</span>
                      <span class="info-value">${payslip.payment_date || (payslip.status === 'paid' ? '지급완료' : '미지급')}</span>
                    </div>
                    <div class="info-item">
                      <span class="info-label">상태:</span>
                      <span class="status-badge status-${payslip.status}">
                        ${payslip.status === 'generated' ? '생성됨' :
                          payslip.status === 'issued' ? '발행됨' : '지급완료'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="salary-section">
                <div class="salary-title">급여 내역</div>
                <div class="salary-item">
                  <span>기본급</span>
                  <span>${payslip.base_salary?.toLocaleString() || 0}원</span>
                </div>
                ${payslip.weekly_holiday_pay > 0 ? `
                <div class="salary-item">
                  <span>주휴수당</span>
                  <span>${payslip.weekly_holiday_pay.toLocaleString()}원</span>
                </div>
                ` : ''}
                ${payslip.meal_allowance > 0 ? `
                <div class="salary-item">
                  <span>식대</span>
                  <span>${payslip.meal_allowance.toLocaleString()}원</span>
                </div>
                ` : ''}
                ${payslip.point_bonus > 0 ? `
                <div class="salary-item">
                  <span>포인트 보너스</span>
                  <span>${payslip.point_bonus.toLocaleString()}원</span>
                </div>
                ` : ''}
                <div class="salary-item total">
                  <span>총 지급액</span>
                  <span>${payslip.total_earnings?.toLocaleString() || 0}원</span>
                </div>
              </div>

              <div class="salary-section">
                <div class="salary-title">공제 내역</div>
                <div class="salary-item deduction">
                  <span>세금 (3.3%)</span>
                  <span>${payslip.tax_amount?.toLocaleString() || 0}원</span>
                </div>
                <div class="salary-item net">
                  <span>실수령액</span>
                  <span>${payslip.net_salary?.toLocaleString() || 0}원</span>
                </div>
              </div>

              <div class="footer">
                <p>본 급여명세서는 MASLABS에서 발행한 공식 문서입니다.</p>
                <p>급여 관련 문의사항이 있으시면 경영지원팀으로 연락해 주세요.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      // 새 창에서 HTML 열기
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(payslipHTML);
        printWindow.document.close();
        
        // 인쇄 대화상자 열기
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } catch (error) {
      console.error('급여명세서 인쇄 실패:', error);
      alert('급여명세서 인쇄에 실패했습니다.');
    }
  };

  const handleViewPayslipDetails = (payslip: any) => {
    // 세부 내역서 모달 표시
    setSelectedPayslip(payslip);
  };

  const handleSaveBankAccount = async () => {
    if (!bankAccountData.bank_name || !bankAccountData.account_number || !bankAccountData.account_holder) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    try {
      if (!currentUser) {
        alert('로그인이 필요합니다.');
        return;
      }

      // 임시로 employees 테이블의 bank_account 필드에 저장
      const bankAccountInfo = `${bankAccountData.bank_name}|${bankAccountData.account_number}|${bankAccountData.account_holder}`;
      
      const { error } = await supabase
        .from('employees')
        .update({
          bank_account: bankAccountInfo,
          updated_at: new Date().toISOString()
        })
        .eq('id', currentUser.id);

      if (error) {
        console.error('계좌 정보 저장 실패:', error);
        alert(`계좌 정보 저장에 실패했습니다.\n오류: ${error.message}`);
        return;
      }

      alert('계좌 정보가 저장되었습니다.');
      setShowBankAccountModal(false);
      loadSalaryData(); // 데이터 다시 로드
    } catch (error) {
      console.error('계좌 정보 저장 중 오류:', error);
      alert(`계좌 정보 저장 중 오류가 발생했습니다.\n오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  const handleEditBankAccount = () => {
    if (data?.bankAccount) {
      setBankAccountData({
        bank_name: data.bankAccount.bank_name || '',
        account_number: data.bankAccount.account_number || '',
        account_holder: data.bankAccount.account_holder || ''
      });
    }
    setShowBankAccountModal(true);
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center">
              <CreditCard className="h-5 w-5 mr-2" />
              급여 계좌
            </h3>
            <button
              onClick={handleEditBankAccount}
              className="flex items-center px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              {data?.bankAccount ? <Edit className="w-4 h-4 mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
              {data?.bankAccount ? '수정' : '등록'}
            </button>
          </div>
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
                  {currentUser?.name === '나수진' ? (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">주유대</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">추가근무</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">식대</th>
                    </>
                  ) : (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">주휴수당</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">식대</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">공제액</th>
                    </>
                  )}
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
                      {formatSalaryPeriod(payslip.period, payslip.daily_details)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(payslip.base_salary)}
                    </td>
                    {currentUser?.name === '나수진' ? (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(payslip.fuel_allowance || 0)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(payslip.additional_work || 0)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(payslip.meal_allowance || 0)}</td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(payslip.weekly_holiday_pay || 0)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(payslip.meal_allowance || 0)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">-{formatCurrency(payslip.tax_amount || 0)}</td>
                      </>
                    )}
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
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleDownloadPayslip(payslip)}
                        className="text-indigo-600 hover:text-indigo-900"
                          title="다운로드"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                        <button
                          onClick={() => handlePrintPayslip(payslip)}
                          className="text-green-600 hover:text-green-900"
                          title="인쇄"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleViewPayslipDetails(payslip)}
                          className="text-blue-600 hover:text-blue-900"
                          title="세부 내역서"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
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

        
      </main>

      {/* 세부 내역서 모달 */}
      {selectedPayslip && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            {/* 모달 닫기 버튼 */}
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setSelectedPayslip(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="mt-3">
              {/* 정산서 헤더 */}
              <div className="text-center border-b pb-4 mb-6">
                <h1 className="text-2xl font-bold text-gray-900">MASLABS 급여 명세서</h1>
                <h2 className="text-lg text-gray-600 mt-2">{formatSalaryPeriod(selectedPayslip.period, selectedPayslip.daily_details)}</h2>
              </div>

              {/* 직원 정보 */}
              <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <div className="text-sm text-gray-500">직원명</div>
                  <div className="font-medium">{currentUser?.name || '허상원'}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-500">정산기간</div>
                  <div className="font-medium">{formatSalaryPeriod(selectedPayslip.period, selectedPayslip.daily_details)}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-gray-500">고용형태</div>
                  <div className="font-medium">
                    {selectedPayslip.employment_type === 'part_time' ? '파트타임' : '정규직'}
                  </div>
                </div>
              </div>

              {/* 급여 요약 */}
                  <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">지급 내역</h3>
                  {currentUser?.name === '나수진' ? (
                    <div className="space-y-2">
                      <div className="flex justify-between"><span>기본급</span><span>{formatCurrency(selectedPayslip.base_salary || 0)}원</span></div>
                      {selectedPayslip.fuel_allowance ? (<div className="flex justify-between"><span>주유대</span><span>{formatCurrency(selectedPayslip.fuel_allowance)}원</span></div>) : null}
                      {selectedPayslip.additional_work ? (<div className="flex justify-between"><span>추가근무</span><span>{formatCurrency(selectedPayslip.additional_work)}원</span></div>) : null}
                      {selectedPayslip.meal_allowance ? (<div className="flex justify-between"><span>식대</span><span>{formatCurrency(selectedPayslip.meal_allowance)}원</span></div>) : null}
                      <div className="border-t pt-2 font-semibold flex justify-between"><span>총 지급액</span><span>{formatCurrency(selectedPayslip.total_earnings || 0)}원</span></div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between"><span>기본급</span><span>{formatCurrency(selectedPayslip.base_salary || 0)}원</span></div>
                      <div className="flex justify-between"><span>주휴수당</span><span>{formatCurrency(selectedPayslip.weekly_holiday_pay || 0)}원</span></div>
                      {selectedPayslip.meal_allowance ? (<div className="flex justify-between"><span>식대</span><span>{formatCurrency(selectedPayslip.meal_allowance)}원</span></div>) : null}
                      <div className="border-t pt-2 font-semibold flex justify-between"><span>총 지급액</span><span>{formatCurrency(selectedPayslip.total_earnings || 0)}원</span></div>
                    </div>
                  )}
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-900 mb-3">공제 내역</h3>
                  {currentUser?.name === '나수진' ? (
                    <div className="space-y-2">
                      <div className="flex justify-between"><span>공제</span><span>0원 (현금 지급)</span></div>
                      <div className="border-t pt-2 font-semibold flex justify-between text-green-700"><span>실수령액</span><span>{formatCurrency(selectedPayslip.net_salary || 0)}원</span></div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex justify-between"><span>세금 (3.3%)</span><span>{formatCurrency(selectedPayslip.tax_amount || 0)}원</span></div>
                      <div className="border-t pt-2 font-semibold flex justify-between text-green-700"><span>실수령액</span><span>{formatCurrency(selectedPayslip.net_salary || 0)}원</span></div>
                    </div>
                  )}
                </div>
              </div>

              {/* 근무 정보 */}
              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">근무 정보</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-gray-500">총 근무시간</span>
                    <div className="font-medium">{selectedPayslip.total_hours || 0}시간</div>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">시급</span>
                    <div className="font-medium">{formatCurrency(selectedPayslip.hourly_rate || 0)}원/시간</div>
                  </div>
                </div>
              </div>

              {/* 일별 상세 내역 */}
              {selectedPayslip.daily_details && selectedPayslip.daily_details.length > 0 && (
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">일별 상세 내역</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">날짜</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">근무시간</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">시급</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">일급</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedPayslip.daily_details.map((detail: any, index: number) => {
                          try {
                            return (
                              <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {detail.date ? new Date(detail.date).toLocaleDateString('ko-KR', {
                                    month: 'long',
                                    day: 'numeric',
                                    weekday: 'short'
                                  }) : '날짜 없음'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {detail.hours || 0}시간
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {formatCurrency(detail.hourly_rate || detail.hourly_wage || 0)}원
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                  {formatCurrency(detail.daily_wage || 0)}원
                                </td>
                              </tr>
                            );
                          } catch (error) {
                            console.error('일별 내역 렌더링 오류:', error, detail);
                            return (
                              <tr key={index}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600" colSpan={4}>
                                  데이터 오류
                                </td>
                              </tr>
                            );
                          }
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 계좌 등록/수정 모달 */}
      {showBankAccountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">
                  {data?.bankAccount ? '계좌 정보 수정' : '계좌 정보 등록'}
                </h3>
                <button
                  onClick={() => setShowBankAccountModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">은행명</label>
                <input
                  type="text"
                  value={bankAccountData.bank_name}
                  onChange={(e) => setBankAccountData({ ...bankAccountData, bank_name: e.target.value })}
                  placeholder="예: 기업은행"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">계좌번호</label>
                <input
                  type="text"
                  value={bankAccountData.account_number}
                  onChange={(e) => setBankAccountData({ ...bankAccountData, account_number: e.target.value })}
                  placeholder="예: 165-043559-02-028"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">예금주</label>
                <input
                  type="text"
                  value={bankAccountData.account_holder}
                  onChange={(e) => setBankAccountData({ ...bankAccountData, account_holder: e.target.value })}
                  placeholder="예: 최형호"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowBankAccountModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSaveBankAccount}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>저장</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
