'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Employee {
  id: string;
  name: string;
  employee_id: string;
  nickname?: string;
  employment_type: string;
  monthly_salary?: number;
  hourly_rate?: number;
}

interface PayslipData {
  employee_id: string;
  employee_name: string;
  employee_code?: string; // MASLABS-004
  employee_nickname?: string; // 최형호
  payment_date: string;
  salary_period: string;
  employment_type: string;
  base_salary: number;
  overtime_pay: number;
  incentive: number;
  point_bonus: number;
  total_earnings: number;
  tax_amount: number;
  net_salary: number;
  status: string;
  // 시간제 급여 관련 필드
  total_hours?: number;
  hourly_rate?: number;
  daily_details?: Array<{
    date: string;
    hours: number;
    daily_wage: number;
  }>;
}

export default function PayslipGenerator() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [payslipData, setPayslipData] = useState<PayslipData | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [checks, setChecks] = useState({
    baseSalary: false,
    overtimePay: false,
    incentive: false,
    pointBonus: false,
    taxCalculation: false,
    netSalary: false,
    finalReview: false
  });
  const [savedPayslips, setSavedPayslips] = useState<any[]>([]);
  const [showPayslipList, setShowPayslipList] = useState(false);

  useEffect(() => {
    loadEmployees();
    loadSavedPayslips();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      console.log('🔍 직원 목록 로드 시작...');
      
      const { data, error } = await supabase
        .from('employees')
        .select(`
          id,
          name,
          employee_id,
          nickname,
          employment_type,
          monthly_salary,
          hourly_rate
        `)
        .order('name');

      if (error) {
        console.error('❌ Supabase 에러:', error);
        throw error;
      }
      
      console.log('✅ 직원 데이터 로드 성공:', data?.length || 0, '명');
      console.log('📋 직원 목록:', data);
      setEmployees(data || []);
    } catch (error) {
      console.error('❌ 직원 목록 로드 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedPayslips = async () => {
    try {
      console.log('🔍 발행된 급여명세서 목록 로드 시작...');
      
      const { data, error } = await supabase
        .from('payslips')
        .select(`
          *,
          employees!inner(name, employee_id)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('급여명세서 목록 로드 실패:', error);
        return;
      }

      console.log('✅ 발행된 급여명세서 목록 로드 완료:', data?.length || 0, '개');
      setSavedPayslips(data || []);
    } catch (error) {
      console.error('급여명세서 목록 로드 중 오류:', error);
    }
  };

  const generatePayslip = async () => {
    if (!selectedEmployee) {
      alert('직원을 선택해주세요.');
      return;
    }

    try {
      setGenerating(true);
      const employee = employees.find(emp => emp.id === selectedEmployee);
      if (!employee) return;

      let payslip: PayslipData;

      if (employee.employment_type === 'part_time') {
        // 시간제 급여 계산
        payslip = await generateHourlyPayslip(employee, selectedYear, selectedMonth);
      } else {
        // 월급제 급여 계산
        payslip = await generateMonthlyPayslip(employee, selectedYear, selectedMonth);
      }

      setPayslipData(payslip);
    } catch (error) {
      console.error('급여 명세서 생성 실패:', error);
      alert('급여 명세서 생성에 실패했습니다.');
    } finally {
      setGenerating(false);
    }
  };

  const generateHourlyPayslip = async (employee: Employee, year: number, month: number) => {
    // 해당 월의 스케줄 조회
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-31`;
    
    const { data: schedules, error: scheduleError } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', employee.id)
      .gte('schedule_date', startDate)
      .lte('schedule_date', endDate)
      .eq('status', 'approved')
      .order('schedule_date', { ascending: true });

    if (scheduleError) {
      throw new Error('스케줄 조회 실패');
    }

    if (!schedules || schedules.length === 0) {
      throw new Error(`${year}년 ${month}월에 승인된 스케줄이 없습니다.`);
    }

    // 일별 근무시간 계산 (스케줄 자체가 점심시간 제외된 상태)
    const dailyHours: { [key: string]: number } = {};
    schedules.forEach(schedule => {
      const date = schedule.schedule_date;
      const start = new Date(`${date} ${schedule.scheduled_start}`);
      const end = new Date(`${date} ${schedule.scheduled_end}`);
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60); // 스케줄 자체가 점심시간 제외된 순 근무시간
      
      if (!dailyHours[date]) {
        dailyHours[date] = 0;
      }
      dailyHours[date] += hours;
    });

    // 시급별 계산 (8월 1일~7일: 13,000원, 8월 8일~31일: 12,000원)
    const hourlyWage1 = 13000;
    const hourlyWage2 = 12000;
    
    let totalHours = 0;
    let totalWage = 0;
    const dailyDetails: Array<{
      date: string;
      hours: number;
      hourly_wage: number;
      daily_wage: number;
    }> = [];

    Object.keys(dailyHours).sort().forEach(date => {
      const day = parseInt(date.split('-')[2]);
      const hours = dailyHours[date];
      const wage = day <= 7 ? hourlyWage1 : hourlyWage2;
      const dayWage = hours * wage;
      
      totalHours += hours;
      totalWage += dayWage;
      
      dailyDetails.push({
        date,
        hours,
        hourly_wage: wage,
        daily_wage: dayWage
      });
    });

    // 세금 계산 (3.3%)
    const taxAmount = Math.round(totalWage * 0.033);
    const netSalary = totalWage - taxAmount;

    const payslip: PayslipData = {
      employee_id: employee.id,
      employee_name: employee.name,
      employee_code: employee.employee_id, // MASLABS-004
      employee_nickname: employee.nickname || employee.name, // 닉네임 또는 이름
      payment_date: new Date().toISOString().split('T')[0],
      salary_period: `${year}-${month.toString().padStart(2, '0')}`,
      employment_type: 'part_time',
      base_salary: totalWage,
      overtime_pay: 0,
      incentive: 0,
      point_bonus: 0,
      total_earnings: totalWage,
      tax_amount: taxAmount,
      net_salary: netSalary,
      status: 'generated',
      total_hours: totalHours,
      hourly_rate: hourlyWage2, // 최종 시급
      daily_details: dailyDetails.map(detail => ({
        date: detail.date,
        hours: detail.hours,
        daily_wage: detail.daily_wage
      }))
    };

    // payslips 테이블에 저장 (upsert 사용)
    try {
      const { error: saveError } = await supabase
        .from('payslips')
        .upsert([{
          ...payslip,
          period: payslip.salary_period // salary_period를 period로 매핑
        }], {
          onConflict: 'employee_id,period'
        });

      if (saveError) {
        console.error('급여명세서 저장 실패:', saveError);
        throw new Error('급여명세서 저장에 실패했습니다.');
      }
      
      console.log('✅ 급여명세서 저장 성공');
    } catch (saveError) {
      console.error('급여명세서 저장 중 오류:', saveError);
      // 저장 실패해도 화면에는 표시
    }

    return payslip;
  };

  const generateMonthlyPayslip = async (employee: Employee, year: number, month: number) => {
    const baseSalary = employee.monthly_salary || 0;
    const overtimePay = 0; // 추후 구현
    const incentive = 0; // 추후 구현
    const pointBonus = 0; // 추후 구현
    const totalEarnings = baseSalary + overtimePay + incentive + pointBonus;
    const taxAmount = Math.round(totalEarnings * 0.033); // 3.3% 세금
    const netSalary = totalEarnings - taxAmount;

    const payslip: PayslipData = {
      employee_id: employee.id,
      employee_name: employee.name,
      employee_code: employee.employee_id, // MASLABS-004
      employee_nickname: employee.nickname || employee.name, // 닉네임 또는 이름
      payment_date: new Date().toISOString().split('T')[0],
      salary_period: `${year}-${month.toString().padStart(2, '0')}`,
      employment_type: 'full_time',
      base_salary: baseSalary,
      overtime_pay: overtimePay,
      incentive: incentive,
      point_bonus: pointBonus,
      total_earnings: totalEarnings,
      tax_amount: taxAmount,
      net_salary: netSalary,
      status: 'generated'
    };

    // payslips 테이블에 저장
    try {
      const { error: saveError } = await supabase
        .from('payslips')
        .insert([payslip]);

      if (saveError) {
        console.error('급여명세서 저장 실패:', saveError);
        throw new Error('급여명세서 저장에 실패했습니다.');
      }
      
      console.log('✅ 급여명세서 저장 성공');
    } catch (saveError) {
      console.error('급여명세서 저장 중 오류:', saveError);
      // 저장 실패해도 화면에는 표시
    }

    return payslip;
  };

  const handleCheck = (checkName: keyof typeof checks) => {
    setChecks(prev => ({
      ...prev,
      [checkName]: !prev[checkName]
    }));
  };

  const issuePayslip = async () => {
    if (!payslipData) return;

    try {
      // 먼저 기존 레코드가 있는지 확인
      const { data: existingPayslip, error: checkError } = await supabase
        .from('payslips')
        .select('id')
        .eq('employee_id', payslipData.employee_id)
        .eq('period', payslipData.salary_period)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116은 "레코드를 찾을 수 없음" 오류
        throw checkError;
      }

      if (existingPayslip) {
        // 기존 레코드가 있으면 업데이트
        const { error } = await supabase
          .from('payslips')
          .update({ 
            status: 'issued',
            issued_at: new Date().toISOString()
          })
          .eq('id', existingPayslip.id);

        if (error) {
          throw error;
        }
      } else {
        // 기존 레코드가 없으면 새로 생성
        const { error } = await supabase
          .from('payslips')
          .insert([{
            ...payslipData,
            period: payslipData.salary_period, // salary_period를 period로 매핑
            status: 'issued',
            issued_at: new Date().toISOString()
          }]);

        if (error) {
          throw error;
        }
      }

      setPayslipData(prev => prev ? { ...prev, status: 'issued' } : null);
      await loadSavedPayslips(); // 발행된 급여명세서 목록 새로고침
      alert('급여 명세서가 발행되었습니다.');
    } catch (error) {
      console.error('급여 명세서 발행 실패:', error);
      alert(`급여 명세서 발행에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  const markAsPaid = async () => {
    if (!payslipData) return;

    try {
      const { error } = await supabase
        .from('payslips')
        .update({ 
          status: 'paid',
          paid_at: new Date().toISOString()
        })
        .eq('employee_id', payslipData.employee_id)
        .eq('period', payslipData.salary_period);

      if (error) {
        throw error;
      }

      setPayslipData(prev => prev ? { ...prev, status: 'paid' } : null);
      await loadSavedPayslips(); // 발행된 급여명세서 목록 새로고침
      alert('급여 지급이 완료되었습니다.');
    } catch (error) {
      console.error('급여 지급 처리 실패:', error);
      alert('급여 지급 처리에 실패했습니다.');
    }
  };

  function printSavedPayslip(payslip: any) {
    // 인쇄용 창 열기
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('팝업이 차단되었습니다. 팝업을 허용해주세요.');
      return;
    }

    // 인쇄용 HTML 생성
    const printContent = `
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
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
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
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
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
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
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
                  <span>${payslip.employees.name}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">직원코드:</span>
                  <span>${payslip.employee_id || 'N/A'}</span>
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
                <span>${payslip.base_salary?.toLocaleString() || 0}원</span>
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
                <span>${payslip.total_earnings?.toLocaleString() || 0}원</span>
              </div>
              <div class="salary-item deduction">
                <span>세금 (3.3%)</span>
                <span>-${payslip.tax_amount?.toLocaleString() || 0}원</span>
              </div>
              <div class="salary-item net total">
                <span>실수령액</span>
                <span>${payslip.net_salary?.toLocaleString() || 0}원</span>
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

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // 인쇄 대화상자 열기
    setTimeout(() => {
      printWindow.print();
    }, 500);
  }

  const printPayslip = () => {
    if (!payslipData) return;
    
    // 인쇄용 창 열기
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('팝업이 차단되었습니다. 팝업을 허용해주세요.');
      return;
    }

    // 인쇄용 HTML 생성
    const printContent = `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>급여명세서 - ${payslipData.employee_name}</title>
        <style>
          body {
            font-family: 'Malgun Gothic', sans-serif;
            margin: 0;
            padding: 20px;
            background: white;
            color: #333;
          }
          .payslip-container {
            max-width: 800px;
            margin: 0 auto;
            border: 2px solid #333;
            padding: 30px;
          }
          .header {
            text-align: center;
            border-bottom: 2px solid #333;
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
          .info-section {
            margin-bottom: 30px;
          }
          .section-title {
            font-size: 18px;
            font-weight: bold;
            border-bottom: 1px solid #333;
            padding-bottom: 5px;
            margin-bottom: 15px;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
          }
          .info-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
          }
          .info-label {
            font-weight: bold;
          }
          .salary-section {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .salary-item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            padding: 5px 0;
          }
          .salary-item.total {
            border-top: 2px solid #333;
            padding-top: 15px;
            margin-top: 15px;
            font-weight: bold;
            font-size: 18px;
          }
          .status-badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
          }
          .status-generated { background: #fef3c7; color: #92400e; }
          .status-issued { background: #dbeafe; color: #1e40af; }
          .status-paid { background: #d1fae5; color: #065f46; }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #ccc;
            font-size: 12px;
            color: #666;
          }
          @media print {
            body { margin: 0; padding: 0; }
            .payslip-container { border: none; padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="payslip-container">
          <div class="header">
            <div class="company-name">MASLABS</div>
            <div class="payslip-title">급여명세서</div>
            <div class="period">${payslipData.salary_period}</div>
          </div>

          <div class="info-section">
            <div class="section-title">기본 정보</div>
            <div class="info-grid">
              <div>
                <div class="info-item">
                  <span class="info-label">직원명:</span>
                  <span>${payslipData.employee_name}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">직원 코드:</span>
                  <span>${payslipData.employee_code || payslipData.employee_id}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">닉네임:</span>
                  <span>${payslipData.employee_nickname || payslipData.employee_name}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">급여 기간:</span>
                  <span>${payslipData.salary_period}</span>
                </div>
              </div>
              <div>
                <div class="info-item">
                  <span class="info-label">고용 형태:</span>
                  <span>${payslipData.employment_type === 'full_time' ? '정규직' : '시간제'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">지급일:</span>
                  <span>${payslipData.payment_date}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">상태:</span>
                  <span class="status-badge status-${payslipData.status}">
                    ${payslipData.status === 'generated' ? '생성됨' :
                      payslipData.status === 'issued' ? '발행됨' : '지급완료'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          ${payslipData.employment_type === 'part_time' ? `
          <div class="info-section">
            <div class="section-title">시간제 급여 상세</div>
            <div class="info-item">
              <span class="info-label">총 근무시간:</span>
              <span>${payslipData.total_hours}시간</span>
            </div>
            <div class="info-item">
              <span class="info-label">시급:</span>
              <span>${payslipData.hourly_rate?.toLocaleString()}원</span>
            </div>
          </div>
          ` : ''}

          <div class="salary-section">
            <div class="section-title">급여 내역</div>
            <div class="salary-item">
              <span>기본급:</span>
              <span>${payslipData.base_salary.toLocaleString()}원</span>
            </div>
            ${payslipData.overtime_pay > 0 ? `
            <div class="salary-item">
              <span>연장수당:</span>
              <span>${payslipData.overtime_pay.toLocaleString()}원</span>
            </div>
            ` : ''}
            ${payslipData.incentive > 0 ? `
            <div class="salary-item">
              <span>인센티브:</span>
              <span>${payslipData.incentive.toLocaleString()}원</span>
            </div>
            ` : ''}
            ${payslipData.point_bonus > 0 ? `
            <div class="salary-item">
              <span>포인트 보너스:</span>
              <span>${payslipData.point_bonus.toLocaleString()}원</span>
            </div>
            ` : ''}
            <div class="salary-item">
              <span>총 지급액:</span>
              <span>${payslipData.total_earnings.toLocaleString()}원</span>
            </div>
            <div class="salary-item">
              <span>세금 (3.3%):</span>
              <span>-${payslipData.tax_amount.toLocaleString()}원</span>
            </div>
            <div class="salary-item total">
              <span>실수령액:</span>
              <span>${payslipData.net_salary.toLocaleString()}원</span>
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

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // 인쇄 대화상자 열기
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const selectedEmployeeData = employees.find(emp => emp.id === selectedEmployee);

  // 년도 옵션 생성 (2020-2030)
  const yearOptions = Array.from({ length: 11 }, (_, i) => 2020 + i);
  
  // 월 옵션 생성
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">급여 명세서 생성</h1>
              <p className="text-gray-600 mt-1">직원의 급여 명세서를 생성하고 발행합니다</p>
            </div>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              뒤로가기
            </button>
          </div>
        </div>

        {/* 직원 선택 및 기간 설정 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">급여 명세서 설정</h2>
          
          <div className="space-y-4">
            <div className="text-sm text-gray-600">
              <p>로딩 상태: {loading ? '로딩 중...' : '완료'}</p>
              <p>직원 수: {employees.length}명</p>
              <p>선택된 직원: {selectedEmployee || '없음'}</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 직원 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  직원 선택
                </label>
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  disabled={loading}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100"
                >
                  <option value="">직원을 선택하세요</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name} ({employee.employee_id}) - {employee.employment_type}
                    </option>
                  ))}
                </select>
              </div>

              {/* 년도 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  년도
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}년
                    </option>
                  ))}
                </select>
              </div>

              {/* 월 선택 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  월
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {monthOptions.map((month) => (
                    <option key={month} value={month}>
                      {month}월
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 생성 버튼 */}
            <div className="flex justify-center gap-4 pt-4">
              <button
                onClick={generatePayslip}
                disabled={!selectedEmployee || generating}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {generating ? '생성 중...' : `${selectedYear}년 ${selectedMonth}월 급여 명세서 생성`}
              </button>
              <button
                onClick={() => setShowPayslipList(!showPayslipList)}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                {showPayslipList ? '목록 숨기기' : '발행된 급여명세서 목록'}
              </button>
            </div>
          </div>
        </div>

        {/* 발행된 급여명세서 목록 */}
        {showPayslipList && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">발행된 급여명세서 목록</h2>
            
            {savedPayslips.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                발행된 급여명세서가 없습니다.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        직원명
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        급여 기간
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        고용 형태
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        총 급여
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        실수령액
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        상태
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        발행일
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        지급일
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        작업
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {savedPayslips.map((payslip) => (
                      <tr key={payslip.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {payslip.employees.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {payslip.period}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {payslip.employment_type === 'full_time' ? '정규직' : '시간제'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {payslip.total_earnings?.toLocaleString()}원
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {payslip.net_salary?.toLocaleString()}원
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            payslip.status === 'generated' ? 'bg-yellow-100 text-yellow-800' :
                            payslip.status === 'issued' ? 'bg-blue-100 text-blue-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {payslip.status === 'generated' ? '생성됨' :
                             payslip.status === 'issued' ? '발행됨' : '지급완료'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {payslip.issued_at ? new Date(payslip.issued_at).toLocaleDateString('ko-KR') : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {payslip.paid_at ? new Date(payslip.paid_at).toLocaleDateString('ko-KR') : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => printSavedPayslip(payslip)}
                            className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors"
                          >
                            출력/인쇄
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 급여 명세서 */}
        {payslipData && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">급여 명세서</h2>
              <div className="flex gap-2">
                <button
                  onClick={printPayslip}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  출력/인쇄
                </button>
                {payslipData.status === 'generated' && (
                  <button
                    onClick={issuePayslip}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    발행
                  </button>
                )}
                {payslipData.status === 'issued' && (
                  <button
                    onClick={markAsPaid}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    지급 완료
                  </button>
                )}
              </div>
            </div>

            {/* 기본 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-3">기본 정보</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">직원명:</span>
                    <span className="font-medium">{payslipData.employee_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">직원 코드:</span>
                    <span className="font-medium">{payslipData.employee_code || payslipData.employee_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">닉네임:</span>
                    <span className="font-medium">{payslipData.employee_nickname || payslipData.employee_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">급여 기간:</span>
                    <span className="font-medium">{payslipData.salary_period}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">고용 형태:</span>
                    <span className="font-medium">
                      {payslipData.employment_type === 'full_time' ? '정규직' : '시간제'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">지급일:</span>
                    <span className="font-medium">{payslipData.payment_date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">상태:</span>
                    <span className={`font-medium ${
                      payslipData.status === 'generated' ? 'text-yellow-600' :
                      payslipData.status === 'issued' ? 'text-blue-600' :
                      'text-green-600'
                    }`}>
                      {payslipData.status === 'generated' ? '생성됨' :
                       payslipData.status === 'issued' ? '발행됨' : '지급완료'}
                    </span>
                  </div>
                </div>
              </div>

              {/* 시간제 급여 상세 정보 */}
              {payslipData.employment_type === 'part_time' && (
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-3">시간제 급여 상세</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">총 근무시간:</span>
                      <span className="font-medium">{payslipData.total_hours}시간</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">시급별 계산:</span>
                      <span className="font-medium text-blue-600 cursor-pointer" onClick={() => {
                        // 시급별 계산 상세 표시
                        const hourlyDetails = payslipData.daily_details?.reduce((acc, detail) => {
                          const day = parseInt(detail.date.split('-')[2]);
                          const hourlyRate = day <= 7 ? 13000 : 12000;
                          const key = `${hourlyRate.toLocaleString()}원`;
                          if (!acc[key]) {
                            acc[key] = { hours: 0, wage: 0 };
                          }
                          acc[key].hours += detail.hours;
                          acc[key].wage += detail.daily_wage;
                          return acc;
                        }, {} as { [key: string]: { hours: number; wage: number } });

                        const details = Object.entries(hourlyDetails || {}).map(([rate, data]) => 
                          `${rate}: ${data.hours}시간 = ${data.wage.toLocaleString()}원`
                        ).join('\n');
                        
                        alert(`시급별 계산 상세:\n\n${details}`);
                      }}>
                        클릭하여 확인
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">일별 상세:</span>
                      <span className="font-medium text-blue-600 cursor-pointer" onClick={() => {
                        const details = payslipData.daily_details?.map(d => {
                          const day = parseInt(d.date.split('-')[2]);
                          const hourlyRate = day <= 7 ? 13000 : 12000;
                          return `${d.date}: ${d.hours}시간 × ${hourlyRate.toLocaleString()}원 = ${d.daily_wage.toLocaleString()}원`;
                        }).join('\n');
                        alert(details || '일별 상세 정보가 없습니다.');
                      }}>
                        클릭하여 확인
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 급여 내역 */}
            <div className="border-t pt-6">
              <h3 className="text-md font-medium text-gray-900 mb-4">급여 내역</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">기본급</span>
                  <span className="font-medium">{payslipData.base_salary.toLocaleString()}원</span>
                </div>
                {payslipData.overtime_pay > 0 && (
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">연장근무수당</span>
                    <span className="font-medium">{payslipData.overtime_pay.toLocaleString()}원</span>
                  </div>
                )}
                {payslipData.incentive > 0 && (
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">인센티브</span>
                    <span className="font-medium">{payslipData.incentive.toLocaleString()}원</span>
                  </div>
                )}
                {payslipData.point_bonus > 0 && (
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">포인트 보너스</span>
                    <span className="font-medium">{payslipData.point_bonus.toLocaleString()}원</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-2 border-b border-gray-300">
                  <span className="font-medium text-gray-900">총 지급액</span>
                  <span className="font-bold text-lg">{payslipData.total_earnings.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-gray-600">세금 (3.3%)</span>
                  <span className="font-medium text-red-600">-{payslipData.tax_amount.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between items-center py-3 bg-gray-50 rounded-lg px-4">
                  <span className="font-bold text-gray-900">실수령액</span>
                  <span className="font-bold text-xl text-blue-600">{payslipData.net_salary.toLocaleString()}원</span>
                </div>
              </div>
            </div>

            {/* 체크리스트 */}
            <div className="border-t pt-6 mt-6">
              <h3 className="text-md font-medium text-gray-900 mb-4">급여 명세서 검토 체크리스트</h3>
              <div className="space-y-3">
                {payslipData.employment_type === 'part_time' ? (
                  <>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checks.baseSalary}
                        onChange={() => handleCheck('baseSalary')}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">시간제 급여 계산 확인 (총 {payslipData.total_hours}시간)</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checks.overtimePay}
                        onChange={() => handleCheck('overtimePay')}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">일별 근무시간 상세 확인</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checks.incentive}
                        onChange={() => handleCheck('incentive')}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">시급 적용 확인 (8/1-7: 13,000원, 8/8-31: 12,000원)</span>
                    </label>
                  </>
                ) : (
                  <>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checks.baseSalary}
                        onChange={() => handleCheck('baseSalary')}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">기본급 확인 ({payslipData.base_salary.toLocaleString()}원)</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checks.overtimePay}
                        onChange={() => handleCheck('overtimePay')}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">연장근무수당 확인</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checks.incentive}
                        onChange={() => handleCheck('incentive')}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">인센티브 확인</span>
                    </label>
                    <label className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checks.pointBonus}
                        onChange={() => handleCheck('pointBonus')}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">포인트 보너스 확인</span>
                    </label>
                  </>
                )}
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checks.taxCalculation}
                    onChange={() => handleCheck('taxCalculation')}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">세금 계산 확인 (3.3%)</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checks.netSalary}
                    onChange={() => handleCheck('netSalary')}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">실수령액 확인 ({payslipData.net_salary.toLocaleString()}원)</span>
                </label>
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checks.finalReview}
                    onChange={() => handleCheck('finalReview')}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">최종 검토 완료</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}