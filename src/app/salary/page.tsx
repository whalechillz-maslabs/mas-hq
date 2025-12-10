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

      // 급여 내역 조회 (payslips 테이블에서, employees 정보만 포함)
      // contracts는 별도로 조회 (FK 관계가 없어서 직접 조인 불가)
      const { data: payslips, error: payslipError } = await supabase
        .from('payslips')
        .select(`
          *,
          employees:employee_id (
            id,
            name,
            employee_id,
            birth_date,
            nickname
          )
        `)
        .eq('employee_id', user.id)
        .order('period', { ascending: false });

      if (payslipError) {
        console.error('급여 내역 조회 오류:', payslipError);
      }

      // 계약서 조회 (별도로 조회)
      const { data: contracts, error: contractError } = await supabase
        .from('contracts')
        .select('*')
        .eq('employee_id', user.id)
        .order('created_at', { ascending: false });

      if (contractError) {
        console.error('계약서 조회 오류:', contractError);
      }

      // payslips에 contracts 정보 수동 매핑 (해당 기간의 활성 계약서 찾기)
      const payslipsWithContracts = (payslips || []).map((payslip: any) => {
        // 급여 기간에 해당하는 계약서 찾기
        const payslipPeriod = payslip.period; // 예: '2025-11'
        const [year, month] = payslipPeriod.split('-');
        const payslipDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        
        const activeContract = contracts?.find((contract: any) => {
          const contractStart = new Date(contract.start_date);
          const contractEnd = contract.end_date ? new Date(contract.end_date) : null;
          
          // 계약 시작일이 급여 기간 이전이고, 종료일이 없거나 급여 기간 이후인 경우
          return contractStart <= payslipDate && (!contractEnd || contractEnd >= payslipDate);
        });
        
        return {
          ...payslip,
          contracts: activeContract || null
        };
      });

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
      const totalEarnings = (payslipsWithContracts || []).reduce((sum: number, p: any) => sum + (p.net_salary || 0), 0);
      const averageMonthly = (payslipsWithContracts || []).length > 0 ? totalEarnings / (payslipsWithContracts || []).length : 0;
      const totalEarningsWithBonus = totalEarnings + pointBonus;

      setData({
        salaries: payslipsWithContracts || [], // contracts 정보가 포함된 payslips
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
      // 계약서 상세보기 모달 열기
      setSelectedContract(contract);
      setShowContractModal(true);
    } catch (error) {
      console.error('계약서 열기 실패:', error);
    }
  };

  const handleDownloadContract = async (contract: any) => {
    try {
      // 계약서 HTML 생성 및 다운로드
      const contractHTML = generateContractHTML(contract);
      const blob = new Blob([contractHTML], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `근로계약서_${contract.start_date}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('계약서 다운로드 실패:', error);
      alert('계약서 다운로드에 실패했습니다.');
    }
  };

  const generateContractHTML = (contract: any) => {
    const getContractTypeText = (type: string) => {
      switch (type) {
        case 'part_time': return '파트타임 (시급제)';
        case 'full_time': return '정규직 (월급제)';
        case 'annual': return '연봉제';
        default: return type;
      }
    };

    return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>근로계약서</title>
    <style>
        body { font-family: 'Malgun Gothic', sans-serif; line-height: 1.6; margin: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .title { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
        .section { margin: 20px 0; }
        .section-title { font-size: 16px; font-weight: bold; margin-bottom: 10px; border-bottom: 2px solid #333; padding-bottom: 5px; }
        .info-table { width: 100%; border-collapse: collapse; margin: 10px 0; }
        .info-table th, .info-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        .info-table th { background-color: #f5f5f5; font-weight: bold; }
        .signature-section { margin-top: 40px; display: flex; justify-content: space-between; }
        .signature-box { width: 45%; text-align: center; }
        .signature-line { border-bottom: 1px solid #333; height: 50px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">근로계약서</div>
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
                <td>${currentUser?.name || '직원'}</td>
            </tr>
        </table>
    </div>

    <div class="section">
        <div class="section-title">2. 근로조건</div>
        <table class="info-table">
            <tr>
                <th>계약 유형</th>
                <td>${getContractTypeText(contract.contract_type)}</td>
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
                <td>${contract.salary.toLocaleString()}원 ${contract.contract_type === 'part_time' ? '(시급)' : contract.contract_type === 'full_time' ? '(월급)' : '(연봉)'}</td>
            </tr>
        </table>
    </div>

    <div class="signature-section">
        <div class="signature-box">
            <div>사업주</div>
            <div class="signature-line"></div>
            <div>마스골프 대표 김탁수</div>
            <div>${new Date(contract.created_at).toLocaleDateString()}</div>
        </div>
        <div class="signature-box">
            <div>근로자</div>
            <div class="signature-line"></div>
            <div>${currentUser?.name || '직원'}</div>
            <div>${new Date(contract.created_at).toLocaleDateString()}</div>
        </div>
    </div>
</body>
</html>`;
  };


  // 나이 계산 함수
  const getAgeFromBirthDate = (birthDate?: string | Date): number => {
    if (!birthDate) return 30;
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age -= 1;
    }
    return age;
  };

  // 4대보험 계산 함수 (세무사 기준)
  const calculateInsurance = (
    totalEarnings: number, 
    mealAllowance: number = 0,
    employeeAge: number = 30,
    contract?: { insurance_4major?: boolean, insurance_display?: any }
  ) => {
    const baseAmount = totalEarnings - mealAllowance;
    const round = (v: number) => Math.floor(v);
    
    const nationalPension = (
      employeeAge >= 60 || 
      contract?.insurance_display?.national_pension === false ||
      contract?.insurance_4major === false
    ) ? 0 : round(baseAmount * 0.045);
    
    const healthInsurance = Math.max(0, round(baseAmount * 0.03545) - 3);
    const longTermCareInsurance = round(baseAmount * 0.00459);
    const employmentInsurance = round(baseAmount * 0.009);
    const industrialAccidentInsurance = 0;
    
    const totalInsurance = nationalPension + healthInsurance + longTermCareInsurance + employmentInsurance + industrialAccidentInsurance;
    
    return {
      nationalPension,
      healthInsurance,
      longTermCareInsurance,
      employmentInsurance,
      industrialAccidentInsurance,
      totalInsurance
    };
  };

  // display_type에 따라 적절한 출력 함수 호출
  const handlePrintPayslip = async (payslip: any) => {
    const displayType = payslip.display_type || 'basic';
    
    // payslip에 employees와 contracts 정보가 이미 포함되어 있음 (loadSalaryData에서 조회)
    if (displayType === 'detailed') {
      printDetailedSavedPayslipForEmployee(payslip);
    } else if (displayType === 'insurance') {
      printSavedPayslipWithInsuranceForEmployee(payslip);
    } else if (displayType === 'business_income') {
      printSavedPayslipBusinessIncomeOnlyForEmployee(payslip);
    } else {
      printSavedPayslipBasicForEmployee(payslip);
    }
  };

  // 기본 명세서 출력 함수
  const printSavedPayslipBasicForEmployee = (payslip: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('팝업이 차단되었습니다. 팝업을 허용해주세요.');
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>급여명세서 - ${currentUser?.name || '직원'}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
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
          .salary-item.total {
            border-top: 2px solid #000;
            border-bottom: 2px solid #000;
            font-weight: 900;
            font-size: 20px;
            margin: 20px 0;
            padding: 20px 0;
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
          @media print {
            body { background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .payslip-container { border: none; box-shadow: none; }
            .header { background: white !important; color: black !important; }
            .footer { background: white !important; color: black !important; }
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
                    <span class="info-value">${payslip.status === 'generated' ? '생성됨' : payslip.status === 'issued' ? '발행됨' : '지급완료'}</span>
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
              ${payslip.weekly_holiday_pay > 0 ? `<div class="salary-item"><span>주휴수당</span><span>${payslip.weekly_holiday_pay.toLocaleString()}원</span></div>` : ''}
              ${payslip.meal_allowance > 0 ? `<div class="salary-item"><span>식대</span><span>${payslip.meal_allowance.toLocaleString()}원</span></div>` : ''}
              ${payslip.point_bonus > 0 ? `<div class="salary-item"><span>포인트 보너스</span><span>${payslip.point_bonus.toLocaleString()}원</span></div>` : ''}
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

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  // 상세 명세서 출력 함수 (관리자 페이지의 printDetailedSavedPayslip과 동일)
  const printDetailedSavedPayslipForEmployee = async (payslip: any) => {
    const age = getAgeFromBirthDate(payslip.employees?.birth_date);
    const mealAllowance = payslip.meal_allowance || 0;
    const contract = Array.isArray(payslip.contracts) ? payslip.contracts[0] : payslip.contracts || null;
    const insurance = calculateInsurance(payslip.total_earnings, mealAllowance, age, contract);
    
    // daily_details가 없으면 스케줄 조회하여 생성
    let dailyDetails = payslip.daily_details || [];
    if (!dailyDetails || dailyDetails.length === 0) {
      try {
        // period에서 년월 추출 (예: '2025-11')
        const [year, month] = payslip.period.split('-');
        const startDate = `${year}-${month}-01`;
        const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
        const endDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
        
        // 스케줄 조회
        const { data: schedules, error: scheduleError } = await supabase
          .from('schedules')
          .select('*')
          .eq('employee_id', payslip.employee_id)
          .gte('schedule_date', startDate)
          .lte('schedule_date', endDate)
          .neq('status', 'cancelled')
          .order('schedule_date', { ascending: true });
        
        if (!scheduleError && schedules && schedules.length > 0) {
          // 스케줄 기반 일별 내역 생성 (시간만 표시, 금액은 월급제라 계산 안 함)
          dailyDetails = schedules.map((schedule: any) => {
            let hours = 0;
            if (schedule.scheduled_start && schedule.scheduled_end) {
              const start = new Date(`${schedule.schedule_date} ${schedule.scheduled_start}`);
              const end = new Date(`${schedule.schedule_date} ${schedule.scheduled_end}`);
              hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
            }
            
            return {
              date: schedule.schedule_date,
              hours: Math.round(hours * 10) / 10, // 소수점 1자리
              daily_wage: 0, // 월급제는 일급 계산 안 함
              hourly_rate: 0, // 월급제는 시급 계산 안 함
              note: '정규근무'
            };
          });
        }
      } catch (error) {
        console.error('스케줄 조회 실패:', error);
        // 스케줄 조회 실패해도 계속 진행
      }
    }
    
    // 포인트 내역 조회 (해당 기간의 employee_tasks)
    let pointDetails: Array<{ date: string, operation_type: string, points: number, title: string }> = [];
    try {
      const [year, month] = payslip.period.split('-');
      const startDate = `${year}-${month}-01`;
      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
      const endDate = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
      
      const { data: tasks, error: tasksError } = await supabase
        .from('employee_tasks')
        .select(`
          task_date,
          title,
          operation_types!inner(
            code,
            name,
            points
          )
        `)
        .eq('employee_id', payslip.employee_id)
        .gte('task_date', startDate)
        .lte('task_date', endDate)
        .order('task_date', { ascending: true });
      
      if (!tasksError && tasks && tasks.length > 0) {
        pointDetails = tasks.map((task: any) => ({
          date: task.task_date,
          operation_type: task.operation_types?.code || '',
          points: task.operation_types?.points || 0,
          title: task.title || ''
        }));
      }
    } catch (error) {
      console.error('포인트 내역 조회 실패:', error);
      // 포인트 조회 실패해도 계속 진행
    }
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('팝업이 차단되었습니다. 팝업을 허용해주세요.');
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>상세 급여명세서 - ${currentUser?.name || '직원'}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Malgun Gothic', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background: white;
            padding: 20px;
          }
          .payslip-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            border: 2px solid #333;
            padding: 30px;
          }
          .header {
            text-align: center;
            border-bottom: 3px solid #333;
            padding-bottom: 20px;
            margin-bottom: 30px;
          }
          .company-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          .payslip-title {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .period {
            font-size: 16px;
            color: #666;
          }
          .employee-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 30px;
            padding: 20px;
            background: #f8f9fa;
            border: 1px solid #ddd;
          }
          .info-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
          }
          .info-label {
            font-weight: bold;
            color: #333;
          }
          .info-value {
            color: #666;
          }
          .salary-section {
            margin-bottom: 30px;
          }
          .section-title {
            font-size: 18px;
            font-weight: bold;
            background: #333;
            color: white;
            padding: 10px 15px;
            margin-bottom: 15px;
          }
          .salary-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #eee;
          }
          .salary-item:last-child {
            border-bottom: 2px solid #333;
            font-weight: bold;
            font-size: 16px;
          }
          .calculation-details {
            background: #f8f9fa;
            padding: 15px;
            margin: 10px 0;
            border-left: 4px solid #007bff;
            font-size: 14px;
          }
          .calculation-title {
            font-weight: bold;
            margin-bottom: 8px;
            color: #007bff;
          }
          .calculation-formula {
            font-family: monospace;
            white-space: pre-line;
            color: #666;
          }
          .insurance-section {
            background: #fff3cd;
            padding: 15px;
            margin: 15px 0;
            border: 1px solid #ffeaa7;
          }
          .insurance-title {
            font-weight: bold;
            color: #856404;
            margin-bottom: 10px;
          }
          .insurance-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 5px;
            font-size: 14px;
          }
          .total-section {
            background: #e8f5e8;
            padding: 20px;
            border: 2px solid #28a745;
            margin-top: 20px;
          }
          .total-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 16px;
          }
          .final-amount {
            font-size: 20px;
            font-weight: bold;
            color: #28a745;
            border-top: 2px solid #28a745;
            padding-top: 10px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 12px;
          }
          @media print {
            body { padding: 0; }
            .payslip-container { border: none; box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="payslip-container">
          <div class="header">
            <div class="company-name">MASLABS</div>
            <div class="payslip-title">상세 급여명세서</div>
            <div class="period">${payslip.period} (${payslip.paid_at ? new Date(payslip.paid_at).toLocaleDateString('ko-KR') : '미지급'})</div>
          </div>
          <div class="employee-info">
            <div>
              <div class="info-item">
                <span class="info-label">직원명:</span>
                <span class="info-value">${currentUser?.name || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">직원코드:</span>
                <span class="info-value">${currentUser?.employee_id || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">고용형태:</span>
                <span class="info-value">${payslip.employment_type === 'part_time' ? '시간제' : '정규직'}</span>
              </div>
            </div>
            <div>
              <div class="info-item">
                <span class="info-label">지급일:</span>
                <span class="info-value">${payslip.paid_at ? new Date(payslip.paid_at).toLocaleDateString('ko-KR') : '미지급'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">상태:</span>
                <span class="info-value">${payslip.status === 'generated' ? '생성됨' : payslip.status === 'issued' ? '발행됨' : '지급완료'}</span>
              </div>
            </div>
          </div>
          <div class="salary-section">
            <div class="section-title">급여 내역</div>
            <div class="salary-item">
              <span>기본급</span>
              <span>${(payslip.base_salary || 0).toLocaleString()}원</span>
            </div>
            <div class="salary-item">
              <span>주휴수당</span>
              <span>${((payslip.overtime_pay || payslip.weekly_holiday_pay || 0) > 0 ? (payslip.overtime_pay || payslip.weekly_holiday_pay || 0).toLocaleString() : '-')}${(payslip.overtime_pay || payslip.weekly_holiday_pay || 0) > 0 ? '원' : ''}</span>
            </div>
            ${payslip.weeklyHolidayCalculation ? `
            <div class="calculation-details">
              <div class="calculation-title">주휴수당 산출 식:</div>
              <div class="calculation-formula">${payslip.weeklyHolidayCalculation}</div>
            </div>
            ` : ''}
            <div class="salary-item">
              <span>주유대</span>
              <span>${(payslip.fuel_allowance || 0) > 0 ? payslip.fuel_allowance.toLocaleString() + '원' : '-'}</span>
            </div>
            <div class="salary-item">
              <span>추가근무</span>
              <span>${(payslip.additional_work || 0) > 0 ? payslip.additional_work.toLocaleString() + '원' : '-'}</span>
            </div>
            <div class="salary-item">
              <span>인센티브</span>
              <span>${(payslip.incentive || 0) > 0 ? payslip.incentive.toLocaleString() + '원' : '-'}</span>
            </div>
            <div class="salary-item">
              <span>포인트 보너스</span>
              <span>${(payslip.point_bonus || 0) > 0 ? payslip.point_bonus.toLocaleString() + '원' : '-'}</span>
            </div>
            <div class="salary-item">
              <span>식대</span>
              <span>${(payslip.meal_allowance || 0) > 0 ? payslip.meal_allowance.toLocaleString() + '원' : '-'}</span>
            </div>
            <div class="salary-item" style="border-top: 2px solid #333; padding-top: 10px; margin-top: 10px; font-weight: bold; font-size: 16px;">
              <span>총 지급액</span>
              <span>${(payslip.total_earnings || 0).toLocaleString()}원</span>
            </div>
          </div>
          <div class="insurance-section">
            <div class="insurance-title">공제 내역 (4대보험)</div>
            ${insurance.nationalPension > 0 ? `<div class="insurance-item"><span>국민연금 (4.5%)</span><span>${insurance.nationalPension.toLocaleString()}원</span></div>` : ''}
            <div class="insurance-item">
              <span>건강보험</span>
              <span>${insurance.healthInsurance.toLocaleString()}원</span>
            </div>
            <div class="insurance-item">
              <span>장기요양보험료</span>
              <span>${insurance.longTermCareInsurance.toLocaleString()}원</span>
            </div>
            <div class="insurance-item">
              <span>고용보험 (0.9%)</span>
              <span>${insurance.employmentInsurance.toLocaleString()}원</span>
            </div>
            <div class="insurance-item" style="font-weight: bold; border-top: 1px solid #ddd; padding-top: 5px;">
              <span>공제액계</span>
              <span>${insurance.totalInsurance.toLocaleString()}원</span>
            </div>
          </div>
          <div class="total-section">
            <div class="total-item">
              <span>총 지급액(과세):</span>
              <span>${(payslip.total_earnings - (payslip.meal_allowance || 0)).toLocaleString()}원</span>
            </div>
            <div class="total-item">
              <span>공제액계:</span>
              <span>-${insurance.totalInsurance.toLocaleString()}원</span>
            </div>
            <div class="total-item final-amount" style="border-top: 2px solid #333; padding-top: 10px; margin-top: 10px;">
              <span>차인지급액 (이체 금액):</span>
              <span>${((payslip.total_earnings - (payslip.meal_allowance || 0)) - insurance.totalInsurance).toLocaleString()}원</span>
            </div>
            ${(payslip.meal_allowance || 0) > 0 ? `
            <div class="total-item" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd;">
              <span>식대 (별도 지급):</span>
              <span>${(payslip.meal_allowance || 0).toLocaleString()}원</span>
            </div>
            <div class="total-item final-amount" style="font-size: 18px; color: #2563eb; border-top: 2px solid #2563eb; padding-top: 10px; margin-top: 10px;">
              <span>총 급여:</span>
              <span>${(((payslip.total_earnings - (payslip.meal_allowance || 0)) - insurance.totalInsurance) + (payslip.meal_allowance || 0)).toLocaleString()}원</span>
            </div>
            ` : ''}
          </div>
          
          ${Array.isArray(dailyDetails) && dailyDetails.length > 0 ? `
          <div class="salary-section" style="margin-top:10px">
            <div class="section-title">일별 근무 내역</div>
            <table style="width:100%; border-collapse:collapse; font-size:14px">
              <thead>
                <tr>
                  <th style="text-align:left; padding:8px 4px; border-bottom:1px solid #ddd;">날짜</th>
                  <th style="text-align:left; padding:8px 4px; border-bottom:1px solid #ddd;">근무시간</th>
                  <th style="text-align:right; padding:8px 4px; border-bottom:1px solid #ddd;">시급</th>
                  <th style="text-align:right; padding:8px 4px; border-bottom:1px solid #ddd;">일급</th>
                  <th style="text-align:left; padding:8px 4px; border-bottom:1px solid #ddd;">비고</th>
                </tr>
              </thead>
              <tbody>
                ${dailyDetails.map((d: any) => {
                  try {
                    const date = d.date ? new Date(d.date).toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' }) : '날짜 없음';
                    const hours = (d.hours || 0) > 0 ? (d.hours || 0) + '시간' : '-';
                    const hourlyRate = (d.hourly_rate || 0) > 0 ? (d.hourly_rate || 0).toLocaleString() + '원' : '-';
                    const dailyWage = (d.daily_wage || 0) > 0 ? (d.daily_wage || 0).toLocaleString() + '원' : '-';
                    const tags = typeof d.note === 'string' ? d.note.split(';').filter(Boolean) : [];
                    const tagHtml = tags.map((t: string) => `<span style=\"display:inline-block; margin-right:6px; padding:2px 6px; border:1px solid ${t==='추가근무'?'#FDBA74':t==='식대'?'#93C5FD':'#E0E0E0'}; border-radius:4px; font-size:11px; background:${t==='추가근무'?'#FFEDD5':t==='식대'?'#EFF6FF':'#F5F5F5'}; color:${t==='추가근무'?'#9A3412':t==='식대'?'#1D4ED8':'#666'};\">${t}</span>`).join('');
                    return `<tr>
                      <td style=\"padding:8px 4px; border-bottom:1px solid #f0f0f0;\">${date}</td>
                      <td style=\"padding:8px 4px; border-bottom:1px solid #f0f0f0;\">${hours}</td>
                      <td style=\"text-align:right; padding:8px 4px; border-bottom:1px solid #f0f0f0;\">${hourlyRate}</td>
                      <td style=\"text-align:right; padding:8px 4px; border-bottom:1px solid #f0f0f0;\">${dailyWage}</td>
                      <td style=\"padding:8px 4px; border-bottom:1px solid #f0f0f0;\">${tagHtml || '-'}</td>
                    </tr>`
                  } catch { return ''}
                }).join('')}
              </tbody>
            </table>
          </div>
          ` : ''}
          
          ${(() => {
            // 식대 일별 계산 상세 추출 (3시간 이상 근무한 날 모두 포함)
            if ((payslip.meal_allowance || 0) > 0 && Array.isArray(dailyDetails) && dailyDetails.length > 0) {
              const mealDetails: Array<{ date: string, rate: number, hours: number }> = [];
              const rateChangeDate = new Date('2025-11-10');
              rateChangeDate.setHours(0, 0, 0, 0);
              
              dailyDetails.forEach((d: any) => {
                const hours = d.hours || 0;
                // 3시간 이상 근무한 날에 식대 지급
                if (hours >= 3) {
                  const date = d.date ? new Date(d.date) : null;
                  if (date) {
                    date.setHours(0, 0, 0, 0);
                    // 11월 10일 기준 단가 변경 확인
                    const rate = (date >= rateChangeDate) ? 8000 : 7000;
                    mealDetails.push({ date: d.date, rate, hours });
                  }
                }
              });
              
              // 식대가 일별 계산인 경우 상세 표시 (항상 표시)
              if (mealDetails.length > 0) {
                return `
          <div class="salary-section" style="margin-top:10px">
            <div class="section-title">식대 일별 계산 상세</div>
            <table style="width:100%; border-collapse:collapse; font-size:14px">
              <thead>
                <tr>
                  <th style="text-align:left; padding:8px 4px; border-bottom:1px solid #ddd;">날짜</th>
                  <th style="text-align:center; padding:8px 4px; border-bottom:1px solid #ddd;">근무시간</th>
                  <th style="text-align:right; padding:8px 4px; border-bottom:1px solid #ddd;">단가</th>
                  <th style="text-align:right; padding:8px 4px; border-bottom:1px solid #ddd;">금액</th>
                </tr>
              </thead>
              <tbody>
                ${mealDetails.map((m: any) => {
                  const date = new Date(m.date);
                  const dateStr = date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
                  const hoursStr = m.hours + '시간';
                  const rateStr = m.rate.toLocaleString() + '원';
                  const amountStr = m.rate.toLocaleString() + '원';
                  const isNewRate = m.rate === 8000;
                  return `<tr>
                    <td style=\"padding:8px 4px; border-bottom:1px solid #f0f0f0;\">${dateStr}${isNewRate ? ' <span style=\"color:#2563eb; font-size:11px;\">(인상)</span>' : ''}</td>
                    <td style=\"text-align:center; padding:8px 4px; border-bottom:1px solid #f0f0f0;\">${hoursStr}</td>
                    <td style=\"text-align:right; padding:8px 4px; border-bottom:1px solid #f0f0f0;\">${rateStr}</td>
                    <td style=\"text-align:right; padding:8px 4px; border-bottom:1px solid #f0f0f0;\">${amountStr}</td>
                  </tr>`
                }).join('')}
                <tr style=\"font-weight:bold; border-top:2px solid #333;\">
                  <td style=\"padding:8px 4px;\">합계</td>
                  <td style=\"text-align:center; padding:8px 4px;\">${mealDetails.length}일</td>
                  <td style=\"text-align:right; padding:8px 4px;\">-</td>
                  <td style=\"text-align:right; padding:8px 4px;\">${(payslip.meal_allowance || 0).toLocaleString()}원</td>
                </tr>
              </tbody>
            </table>
          </div>
          `;
              }
            }
            return '';
          })()}
          
          ${pointDetails.length > 0 ? `
          <div class="salary-section" style="margin-top:10px">
            <div class="section-title">포인트 내역</div>
            <table style="width:100%; border-collapse:collapse; font-size:14px">
              <thead>
                <tr>
                  <th style="text-align:left; padding:8px 4px; border-bottom:1px solid #ddd;">날짜</th>
                  <th style="text-align:left; padding:8px 4px; border-bottom:1px solid #ddd;">업무명</th>
                  <th style="text-align:left; padding:8px 4px; border-bottom:1px solid #ddd;">업무 유형</th>
                  <th style="text-align:right; padding:8px 4px; border-bottom:1px solid #ddd;">포인트</th>
                </tr>
              </thead>
              <tbody>
                ${pointDetails.map((p: any) => {
                  const date = new Date(p.date);
                  const dateStr = date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });
                  return `<tr>
                    <td style=\"padding:8px 4px; border-bottom:1px solid #f0f0f0;\">${dateStr}</td>
                    <td style=\"padding:8px 4px; border-bottom:1px solid #f0f0f0;\">${p.title || '-'}</td>
                    <td style=\"padding:8px 4px; border-bottom:1px solid #f0f0f0;\">${p.operation_type || '-'}</td>
                    <td style=\"text-align:right; padding:8px 4px; border-bottom:1px solid #f0f0f0;\">${p.points || 0}포인트</td>
                  </tr>`
                }).join('')}
                <tr style=\"font-weight:bold; border-top:2px solid #333;\">
                  <td style=\"padding:8px 4px;\">합계</td>
                  <td style=\"padding:8px 4px;\">-</td>
                  <td style=\"padding:8px 4px;\">-</td>
                  <td style=\"text-align:right; padding:8px 4px;\">${pointDetails.reduce((sum, p) => sum + (p.points || 0), 0)}포인트</td>
                </tr>
              </tbody>
            </table>
          </div>
          ` : ''}
          
          <div class="footer">
            <p>본 급여명세서는 MASLABS에서 발행한 공식 문서입니다.</p>
            <p>급여 관련 문의사항이 있으시면 경영지원팀으로 연락해 주세요.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  // 4대보험 포함 명세서 출력 함수
  const printSavedPayslipWithInsuranceForEmployee = (payslip: any) => {
    try {
      const age = getAgeFromBirthDate(payslip.employees?.birth_date);
      const mealAllowance = payslip.meal_allowance || 0;
      const contract = Array.isArray(payslip.contracts) ? payslip.contracts[0] : payslip.contracts || null;
      const insurance = calculateInsurance(payslip.total_earnings, mealAllowance, age, contract);
      
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('팝업이 차단되었습니다. 팝업을 허용해주세요.');
        return;
      }

      const printContent = `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>4대보험 포함 급여명세서 - ${currentUser?.name || '직원'}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
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
          .header p {
            font-size: 18px;
            font-weight: 600;
            margin-bottom: 5px;
          }
          .employee-info {
            padding: 30px;
            border-bottom: 1px solid #ddd;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
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
            border-bottom: 1px solid #ddd;
            font-size: 16px;
          }
          .salary-item:last-child {
            border-bottom: 2px solid #000;
            font-weight: 900;
            font-size: 18px;
            padding: 20px 0;
          }
          .insurance-section {
            background: #fff8dc;
            padding: 20px;
            margin: 20px 0;
            border: 2px solid #daa520;
          }
          .insurance-title {
            font-size: 18px;
            font-weight: bold;
            color: #b8860b;
            margin-bottom: 15px;
            text-align: center;
          }
          .insurance-item {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid #daa520;
          }
          .insurance-item:last-child {
            border-bottom: none;
            font-weight: bold;
            padding-top: 15px;
            border-top: 2px solid #daa520;
          }
          .total-section {
            background: #f0f8ff;
            padding: 25px;
            border: 2px solid #4169e1;
            margin-top: 20px;
          }
          .total-item {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            font-size: 16px;
          }
          .final-amount {
            font-size: 22px;
            font-weight: 900;
            color: #4169e1;
            border-top: 2px solid #4169e1;
            padding-top: 15px;
            margin-top: 10px;
          }
          .footer {
            text-align: center;
            padding: 30px;
            border-top: 1px solid #ddd;
            color: #666;
            font-size: 14px;
          }
          @media print {
            body { margin: 0; padding: 0; }
            .payslip-container { box-shadow: none; }
          }
        </style>
      </head>
      <body>
        <div class="payslip-container">
          <div class="header">
            <h1>MASLABS</h1>
            <p>4대보험 포함 급여명세서</p>
            <p>${payslip.period} (${payslip.paid_at ? new Date(payslip.paid_at).toLocaleDateString('ko-KR') : '미지급'})</p>
          </div>
          <div class="employee-info">
            <div class="info-grid">
              <div>
                <div class="info-item">
                  <span class="info-label">직원명:</span>
                  <span class="info-value">${currentUser?.name || 'N/A'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">직원코드:</span>
                  <span class="info-value">${currentUser?.employee_id || 'N/A'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">고용 형태:</span>
                  <span class="info-value">${payslip.employment_type === 'part_time' ? '시간제' : '정규직'}</span>
                </div>
              </div>
              <div>
                <div class="info-item">
                  <span class="info-label">지급 기간:</span>
                  <span class="info-value">${payslip.period}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">지급일:</span>
                  <span class="info-value">${payslip.paid_at ? new Date(payslip.paid_at).toLocaleDateString('ko-KR') : '미지급'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">상태:</span>
                  <span class="info-value">${payslip.status === 'generated' ? '생성됨' : payslip.status === 'issued' ? '발행됨' : '지급완료'}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="salary-section">
            <div class="salary-title">급여 내역</div>
            <div class="salary-item">
              <span>기본급</span>
              <span>${payslip.base_salary.toLocaleString()}원</span>
            </div>
            ${payslip.overtime_pay > 0 ? `<div class="salary-item"><span>주휴수당</span><span>${payslip.overtime_pay.toLocaleString()}원</span></div>` : ''}
            ${payslip.incentive > 0 ? `<div class="salary-item"><span>인센티브</span><span>${payslip.incentive.toLocaleString()}원</span></div>` : ''}
            <div class="salary-item">
              <span>총 지급액</span>
              <span>${payslip.total_earnings.toLocaleString()}원</span>
            </div>
          </div>
          <div class="insurance-section">
            <div class="insurance-title">공제 내역 (4대보험)</div>
            ${insurance.nationalPension > 0 ? `<div class="insurance-item"><span>국민연금 (4.5%)</span><span>${insurance.nationalPension.toLocaleString()}원</span></div>` : ''}
            <div class="insurance-item">
              <span>건강보험</span>
              <span>${insurance.healthInsurance.toLocaleString()}원</span>
            </div>
            <div class="insurance-item">
              <span>장기요양보험료</span>
              <span>${insurance.longTermCareInsurance.toLocaleString()}원</span>
            </div>
            <div class="insurance-item">
              <span>고용보험 (0.9%)</span>
              <span>${insurance.employmentInsurance.toLocaleString()}원</span>
            </div>
            <div class="insurance-item">
              <span>공제액계</span>
              <span>${insurance.totalInsurance.toLocaleString()}원</span>
            </div>
          </div>
          <div class="total-section">
            <div class="total-item">
              <span>총 지급액(과세):</span>
              <span>${(payslip.total_earnings - (payslip.meal_allowance || 0)).toLocaleString()}원</span>
            </div>
            <div class="total-item">
              <span>공제액계:</span>
              <span>-${insurance.totalInsurance.toLocaleString()}원</span>
            </div>
            <div class="total-item final-amount" style="border-top: 2px solid #333; padding-top: 10px; margin-top: 10px;">
              <span>차인지급액 (이체 금액):</span>
              <span>${((payslip.total_earnings - (payslip.meal_allowance || 0)) - insurance.totalInsurance).toLocaleString()}원</span>
            </div>
            ${(payslip.meal_allowance || 0) > 0 ? `
            <div class="total-item" style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #ddd;">
              <span>식대 (별도 지급):</span>
              <span>${(payslip.meal_allowance || 0).toLocaleString()}원</span>
            </div>
            <div class="total-item final-amount" style="font-size: 18px; color: #2563eb; border-top: 2px solid #2563eb; padding-top: 10px; margin-top: 10px;">
              <span>총 급여:</span>
              <span>${(((payslip.total_earnings - (payslip.meal_allowance || 0)) - insurance.totalInsurance) + (payslip.meal_allowance || 0)).toLocaleString()}원</span>
            </div>
            ` : ''}
          </div>
          <div class="footer">
            <p>본 급여명세서는 MASLABS에서 발행한 공식 문서입니다.</p>
            <p>급여 관련 문의사항이 있으시면 경영지원팀으로 연락해 주세요.</p>
          </div>
        </div>
      </body>
      </html>
    `;

      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    } catch (error) {
      console.error('급여명세서 인쇄 실패:', error);
      alert('급여명세서 인쇄에 실패했습니다.');
    }
  };

  // 3.3%만 명세서 출력 함수
  const printSavedPayslipBusinessIncomeOnlyForEmployee = (payslip: any) => {
    try {
      const businessIncomeTax = Math.round(payslip.total_earnings * 0.033);
      const netSalary = payslip.total_earnings - businessIncomeTax;
      
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('팝업이 차단되었습니다. 팝업을 허용해주세요.');
        return;
      }

      const printContent = `
        <!DOCTYPE html>
        <html lang="ko">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>사업소득세 급여명세서 - ${currentUser?.name || '직원'}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
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
            .header p {
              font-size: 18px;
              font-weight: 600;
              margin-bottom: 5px;
            }
            .employee-info {
              padding: 30px;
              border-bottom: 1px solid #ddd;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
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
              border-bottom: 1px solid #ddd;
              font-size: 16px;
            }
            .salary-item:last-child {
              border-bottom: 2px solid #000;
              font-weight: 900;
              font-size: 18px;
              padding: 20px 0;
            }
            .tax-section {
              background: #fff5f5;
              padding: 20px;
              margin: 20px 0;
              border: 2px solid #dc2626;
            }
            .tax-title {
              font-size: 18px;
              font-weight: bold;
              color: #dc2626;
              margin-bottom: 15px;
              text-align: center;
            }
            .tax-item {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              font-size: 16px;
              font-weight: bold;
            }
            .total-section {
              background: #f0fdf4;
              padding: 25px;
              border: 2px solid #16a34a;
              margin-top: 20px;
            }
            .total-item {
              display: flex;
              justify-content: space-between;
              padding: 10px 0;
              font-size: 16px;
            }
            .final-amount {
              font-size: 22px;
              font-weight: 900;
              color: #16a34a;
              border-top: 2px solid #16a34a;
              padding-top: 15px;
              margin-top: 10px;
            }
            .footer {
              text-align: center;
              padding: 30px;
              border-top: 1px solid #ddd;
              color: #666;
              font-size: 14px;
            }
            @media print {
              body { margin: 0; padding: 0; }
              .payslip-container { box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="payslip-container">
            <div class="header">
              <h1>MASLABS</h1>
              <p>사업소득세 급여명세서</p>
              <p>${payslip.period} (${payslip.paid_at ? new Date(payslip.paid_at).toLocaleDateString('ko-KR') : '미지급'})</p>
            </div>
            <div class="employee-info">
              <div class="info-grid">
                <div>
                  <div class="info-item">
                    <span class="info-label">직원명:</span>
                    <span class="info-value">${currentUser?.name || 'N/A'}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">직원코드:</span>
                    <span class="info-value">${currentUser?.employee_id || 'N/A'}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">고용 형태:</span>
                    <span class="info-value">${payslip.employment_type === 'part_time' ? '시간제' : '정규직'}</span>
                  </div>
                </div>
                <div>
                  <div class="info-item">
                    <span class="info-label">지급 기간:</span>
                    <span class="info-value">${payslip.period}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">지급일:</span>
                    <span class="info-value">${payslip.paid_at ? new Date(payslip.paid_at).toLocaleDateString('ko-KR') : '미지급'}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">상태:</span>
                    <span class="info-value">${payslip.status === 'generated' ? '생성됨' : payslip.status === 'issued' ? '발행됨' : '지급완료'}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="salary-section">
              <div class="salary-title">급여 내역</div>
              <div class="salary-item">
                <span>기본급</span>
                <span>${payslip.base_salary.toLocaleString()}원</span>
              </div>
              ${payslip.overtime_pay > 0 ? `<div class="salary-item"><span>주휴수당</span><span>${payslip.overtime_pay.toLocaleString()}원</span></div>` : ''}
              ${payslip.incentive > 0 ? `<div class="salary-item"><span>인센티브</span><span>${payslip.incentive.toLocaleString()}원</span></div>` : ''}
              <div class="salary-item">
                <span>총 지급액</span>
                <span>${payslip.total_earnings.toLocaleString()}원</span>
              </div>
            </div>
            <div class="tax-section">
              <div class="tax-title">세금 공제</div>
              <div class="tax-item">
                <span>사업소득세 (3.3%)</span>
                <span>${businessIncomeTax.toLocaleString()}원</span>
              </div>
            </div>
            <div class="total-section">
              <div class="total-item">
                <span>총 지급액:</span>
                <span>${payslip.total_earnings.toLocaleString()}원</span>
              </div>
              <div class="total-item">
                <span>세금 공제:</span>
                <span>-${businessIncomeTax.toLocaleString()}원</span>
              </div>
              <div class="total-item final-amount">
                <span>실수령액:</span>
                <span>${netSalary.toLocaleString()}원</span>
              </div>
            </div>
            <div class="footer">
              <p>본 급여명세서는 사업소득세(3.3%)만 적용된 버전입니다.</p>
              <p>MASLABS 급여관리시스템 | 문의: 인사팀</p>
            </div>
          </div>
        </body>
        </html>
      `;

      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
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
                      <button
                        onClick={() => handlePrintPayslip(payslip)}
                        className="text-green-600 hover:text-green-900"
                        title="명세서 인쇄"
                      >
                        <Printer className="h-4 w-4" />
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
            {data?.contracts.map((contract) => {
              const getContractTypeText = (type: string) => {
                switch (type) {
                  case 'part_time': return '파트타임 (시급제)';
                  case 'full_time': return '정규직 (월급제)';
                  case 'annual': return '연봉제';
                  default: return type;
                }
              };

              const getStatusBadge = (status: string) => {
                const statusConfig: { [key: string]: { text: string; color: string } } = {
                  draft: { text: '초안', color: 'bg-gray-100 text-gray-800' },
                  pending_signature: { text: '서명 대기', color: 'bg-yellow-100 text-yellow-800' },
                  signed: { text: '서명 완료', color: 'bg-blue-100 text-blue-800' },
                  active: { text: '활성', color: 'bg-green-100 text-green-800' },
                  expired: { text: '만료', color: 'bg-red-100 text-red-800' }
                };
                const config = statusConfig[status] || statusConfig.draft;
                return (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                    {config.text}
                  </span>
                );
              };

              return (
              <div
                key={contract.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-900">
                        {getContractTypeText(contract.contract_type)}
                    </p>
                    <p className="text-sm text-gray-500">
                        {formatDateKR(contract.created_at)}
                    </p>
                  </div>
                    {getStatusBadge(contract.status)}
                </div>
                
                  <div className="text-sm text-gray-600 mb-3 space-y-1">
                    <p>계약기간: {contract.start_date} {contract.end_date ? `~ ${contract.end_date}` : '(무기한)'}</p>
                    <p>{contract.contract_type === 'part_time' ? '시급' : contract.contract_type === 'full_time' ? '월급' : '연봉'}: {contract.salary.toLocaleString()}원</p>
                    <p>근무: {contract.work_hours}시간/일, {contract.work_days}일/주</p>
                  </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleViewContract(contract)}
                      className="flex-1 px-3 py-1 text-sm bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 flex items-center justify-center"
                  >
                      <Eye className="h-4 w-4 mr-1" />
                    보기
                  </button>
                  <button
                      onClick={() => handleDownloadContract(contract)}
                      className="flex-1 px-3 py-1 text-sm bg-gray-50 text-gray-600 rounded hover:bg-gray-100 flex items-center justify-center"
                  >
                      <Download className="h-4 w-4 mr-1" />
                    다운로드
                  </button>
                </div>
              </div>
              );
            })}
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

      {/* 계약서 상세보기 모달 */}
      {showContractModal && selectedContract && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">계약서 상세 정보</h3>
                <button
                  onClick={() => {
                    setShowContractModal(false);
                    setSelectedContract(null);
                  }}
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
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedContract.contract_type === 'part_time' ? '파트타임 (시급제)' : 
                       selectedContract.contract_type === 'full_time' ? '정규직 (월급제)' : '연봉제'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">상태</label>
                    <div className="mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        selectedContract.status === 'active' ? 'bg-green-100 text-green-800' :
                        selectedContract.status === 'expired' ? 'bg-red-100 text-red-800' :
                        selectedContract.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedContract.status === 'active' ? '활성' :
                         selectedContract.status === 'expired' ? '만료' :
                         selectedContract.status === 'draft' ? '초안' : '서명 대기'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">계약 시작일</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDateKR(selectedContract.start_date)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">계약 종료일</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedContract.end_date ? formatDateKR(selectedContract.end_date) : '무기한'}
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
                    <p className="mt-1 text-sm text-gray-900">{formatCurrency(selectedContract.salary)}원</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">식대</label>
                    <p className="mt-1 text-sm text-gray-900">{formatCurrency(selectedContract.meal_allowance || 0)}원</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">근무 시간</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedContract.work_hours}시간/일</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">근무 일수</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedContract.work_days}일/주</p>
                  </div>
                </div>
              </div>

              {/* 근무 조건 */}
              <div>
                <h4 className="text-lg font-semibold text-gray-900 mb-3">근무 조건</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">근무 시간대</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedContract.work_time || '09:00-17:00'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">점심 시간</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedContract.lunch_break || 1}시간</p>
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
                      <p className="mt-1 text-sm text-gray-900">{formatDateKR(selectedContract.probation_period.start_date)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">수습 종료일</label>
                      <p className="mt-1 text-sm text-gray-900">{formatDateKR(selectedContract.probation_period.end_date)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* 급여 변동 이력 */}
              {selectedContract.salary_history && selectedContract.salary_history.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-3">급여 변동 이력</h4>
                  <div className="space-y-2">
                    {selectedContract.salary_history.map((history: any, index: number) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {formatDateKR(history.effective_date)} - {formatCurrency(history.salary)}원
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
                onClick={() => {
                  setShowContractModal(false);
                  setSelectedContract(null);
                }}
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
