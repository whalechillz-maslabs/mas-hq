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
  // 연봉계약 관련 필드 추가
  salary_structure?: {
    contract_type: 'hourly' | 'monthly' | 'annual';
    base_salary?: number;
    meal_allowance?: number;
    includes_weekly_holiday?: boolean;
    work_schedule?: {
      days_per_week: number;
      hours_per_day: number;
      hours_per_week: number;
      work_time: string;
      lunch_break: number;
    };
    effective_date?: string; // 계약 변경 적용일
  };
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
  meal_allowance: number; // 식대
  // 새로운 필드 구조
  fuel_allowance?: number; // 주유대
  additional_work?: number; // 추가 근무 수당
  weekly_holiday_pay?: number; // 주휴수당
  transportation_allowance?: number; // 교통비
  performance_bonus?: number; // 성과급/보너스
  total_earnings: number;
  tax_amount: number;
  net_salary: number;
  status: string;
  // 시간제 급여 관련 필드
  total_hours?: number;
  hourly_rate?: number;
  weeklyHolidayCalculation?: string; // 주휴수당 산출 식
  daily_details?: Array<{
    date: string;
    hours: number;
    daily_wage: number;
    hourly_rate: number;
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
  const [isDuplicatePeriod, setIsDuplicatePeriod] = useState(false);
  
  // 분할 생성 관련 상태
  const [showCustomPeriod, setShowCustomPeriod] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [customPeriodName, setCustomPeriodName] = useState('');
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
  const [payslipFilter, setPayslipFilter] = useState<string>('all'); // 'all', '허상원', '최형호', etc.
  const [selectedPayslipForDetails, setSelectedPayslipForDetails] = useState<any>(null);
  const [editingDates, setEditingDates] = useState(false);
  const [editIssuedDate, setEditIssuedDate] = useState('');
  const [editPaidDate, setEditPaidDate] = useState('');
  
  // 연봉계약 전환 관련 상태
  const [showContractChangeModal, setShowContractChangeModal] = useState(false);
  const [contractChangeData, setContractChangeData] = useState({
    employee_id: '',
    employee_name: '',
    current_contract: 'hourly' as 'hourly' | 'monthly' | 'annual',
    new_contract: 'annual' as 'hourly' | 'monthly' | 'annual',
    effective_date: '',
    annual_salary: 28080000,
    monthly_salary: 2340000,
    meal_allowance: 140000,
    includes_weekly_holiday: true,
    work_schedule: {
      days_per_week: 5,
      hours_per_day: 7,
      hours_per_week: 35,
      work_time: '09:00-17:00',
      lunch_break: 1
    }
  });

  useEffect(() => {
    loadEmployees();
    loadSavedPayslips();
  }, []);

  // 중복 체크 useEffect
  useEffect(() => {
    const checkDuplicatePeriod = async () => {
      if (!selectedEmployee || showCustomPeriod) {
        setIsDuplicatePeriod(false);
        return;
      }

      try {
        const period = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
        const { data: existingPayslip, error } = await supabase
          .from('payslips')
          .select('*')
          .eq('employee_id', selectedEmployee)
          .eq('period', period)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('중복 체크 중 오류:', error);
          setIsDuplicatePeriod(false);
          return;
        }

        setIsDuplicatePeriod(!!existingPayslip);
      } catch (error) {
        console.error('중복 체크 중 오류:', error);
        setIsDuplicatePeriod(false);
      }
    };

    checkDuplicatePeriod();
  }, [selectedEmployee, selectedYear, selectedMonth, showCustomPeriod]);

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

    const employee = employees.find(emp => emp.id === selectedEmployee);
    if (!employee) {
      alert('선택된 직원 정보를 찾을 수 없습니다.');
      return;
    }

    // 월 단위 생성 시 중복 체크
    if (!showCustomPeriod) {
      let period = `${selectedYear}-${selectedMonth.toString().padStart(2, '0')}`;
      
      // 기존 급여명세서가 있는지 확인
      const { data: existingPayslip, error: checkError } = await supabase
        .from('payslips')
        .select('*')
        .eq('employee_id', employee.id)
        .eq('period', period)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('중복 체크 중 오류:', checkError);
        alert('급여명세서 중복 체크 중 오류가 발생했습니다.');
        return;
      }

      if (existingPayslip) {
        const statusText = existingPayslip.status === 'generated' ? '생성됨' : 
                          existingPayslip.status === 'issued' ? '발행됨' : '지급완료';
        const shouldCreateNewVersion = confirm(`이미 ${period} 기간의 급여명세서가 존재합니다. (상태: ${statusText})\n\n새 버전을 생성하시겠습니까? (기존 명세서는 보존됩니다)`);
        if (!shouldCreateNewVersion) {
          return;
        }
        
        // 새 버전 번호 생성
        const { data: existingVersions, error: versionError } = await supabase
          .from('payslips')
          .select('period')
          .eq('employee_id', employee.id)
          .like('period', `${period}%`)
          .order('period', { ascending: false });
          
        if (versionError) {
          console.error('버전 확인 중 오류:', versionError);
          alert('버전 확인 중 오류가 발생했습니다.');
          return;
        }
        
        // 다음 버전 번호 계산
        let versionNumber = 2;
        if (existingVersions && existingVersions.length > 0) {
          const versionPattern = new RegExp(`${period}-v(\\d+)$`);
          const maxVersion = existingVersions
            .map(v => {
              const match = v.period.match(versionPattern);
              return match ? parseInt(match[1]) : 0;
            })
            .reduce((max, v) => Math.max(max, v), 0);
          versionNumber = maxVersion + 1;
        }
        
        // period를 새 버전으로 변경
        period = `${period}-v${versionNumber}`;
      }
    }

    // 분할 생성 시 유효성 검사
    if (showCustomPeriod) {
      if (!customStartDate || !customEndDate || !customPeriodName) {
        alert('시작일, 종료일, 정산서명을 모두 입력해주세요.');
        return;
      }
      
      if (new Date(customStartDate) > new Date(customEndDate)) {
        alert('시작일이 종료일보다 늦을 수 없습니다.');
        return;
      }
    }

    try {
      setGenerating(true);
      let payslip: PayslipData;

      if (showCustomPeriod) {
        // 분할 생성
        payslip = await generateCustomPeriodPayslip(employee, customStartDate, customEndDate, customPeriodName);
      } else {
        // 월 단위 생성
        if (employee.employment_type === 'part_time') {
          // 시간제 급여 계산
          payslip = await generateHourlyPayslip(employee, selectedYear, selectedMonth);
        } else {
          // 월급제 급여 계산
          payslip = await generateMonthlyPayslip(employee, selectedYear, selectedMonth);
        }
      }

      setPayslipData(payslip);
    } catch (error) {
      console.error('급여 명세서 생성 실패:', error);
      alert(`급여 명세서 생성에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setGenerating(false);
    }
  };

  const generateHourlyPayslip = async (employee: Employee, year: number, month: number) => {
    // 해당 월의 스케줄 조회
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    // 해당 월의 마지막 날짜 계산
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
    
    // 계약서에서 식대 정보 조회
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('meal_allowance, salary_history, probation_period')
      .eq('employee_id', employee.id)
      .lte('start_date', endDate)
      .or(`end_date.is.null,end_date.gte.${startDate}`)
      .eq('status', 'active')
      .order('start_date', { ascending: false })
      .limit(1)
      .single();

    const mealAllowance = contract?.meal_allowance || 0;
    
    const { data: schedules, error: scheduleError } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', employee.id)
      .gte('schedule_date', startDate)
      .lte('schedule_date', endDate)
      .neq('status', 'cancelled') // 취소된 스케줄만 제외
      .order('schedule_date', { ascending: true });

    if (scheduleError) {
      throw new Error('스케줄 조회 실패');
    }

    if (!schedules || schedules.length === 0) {
      throw new Error(`${year}년 ${month}월에 유효한 스케줄이 없습니다.`);
    }

    // 실제 시급 정보 조회 (hourly_wages 테이블 사용)
    const { data: wages, error: wageError } = await supabase
      .from('hourly_wages')
      .select('*')
      .eq('employee_id', employee.id)
      .order('effective_start_date');

    if (wageError) {
      throw new Error('시급 정보 조회에 실패했습니다.');
    }

    if (!wages || wages.length === 0) {
      throw new Error('시급 정보가 없습니다.');
    }

    // 일별 근무시간 계산 (스케줄 자체가 점심시간 제외된 상태)
    const dailyHours: { [key: string]: number } = {};
    schedules.forEach(schedule => {
      const date = schedule.schedule_date;
      const start = new Date(`${date} ${schedule.scheduled_start}`);
      const end = new Date(`${date} ${schedule.scheduled_end}`);
      const rawHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60); // 스케줄 자체가 점심시간 제외된 순 근무시간
      
      // 근무시간을 그대로 사용 (정규화하지 않음)
      const hours = rawHours;
      
      if (!dailyHours[date]) {
        dailyHours[date] = 0;
      }
      dailyHours[date] += hours;
    });
    
    let totalHours = 0;
    let totalWage = 0;
    const dailyDetails: Array<{
      date: string;
      hours: number;
      hourly_rate: number;
      daily_wage: number;
    }> = [];

    Object.keys(dailyHours).sort().forEach(date => {
      const hours = dailyHours[date];
      const scheduleDate = new Date(date);
      
      // 해당 날짜에 적용되는 시급 찾기 (hourly_wages 테이블 기반)
      const applicableWages = wages.filter(wage => {
        const startDate = new Date(wage.effective_start_date);
        const endDate = wage.effective_end_date ? new Date(wage.effective_end_date) : null;
        
        // 시작일이 해당 날짜보다 이전이고, 종료일이 없거나 해당 날짜보다 이후인 경우
        return startDate <= scheduleDate && (!endDate || endDate >= scheduleDate);
      });
      
      // 가장 최근에 시작된 시급 선택
      const applicableWage = applicableWages.length > 0 
        ? applicableWages.reduce((latest, current) => 
            new Date(current.effective_start_date) > new Date(latest.effective_start_date) ? current : latest
          )
        : wages[0];
      
      const hourlyWage = applicableWage ? applicableWage.base_wage : wages[0].base_wage;
      const dayWage = hours * hourlyWage;
      
      totalHours += hours;
      totalWage += dayWage;
      
      dailyDetails.push({
        date,
        hours,
        hourly_rate: hourlyWage,
        daily_wage: dayWage
      });
    });

    // 주휴수당 계산 (주별로 15시간 이상 근무 시)
    let weeklyHolidayPay = 0;
    const latestHourlyRate = wages[wages.length - 1].base_wage;
    let weeklyHolidayCalculation = ''; // 산출 식 저장
    
    // 주별 근무시간 및 근무일수 계산
    const weeklyData: { [key: string]: { hours: number, days: number } } = {};
    Object.keys(dailyHours).forEach(date => {
      const dateObj = new Date(date);
      const weekStart = new Date(dateObj);
      weekStart.setDate(dateObj.getDate() - dateObj.getDay()); // 일요일을 주의 시작으로
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { hours: 0, days: 0 };
      }
      weeklyData[weekKey].hours += dailyHours[date];
      weeklyData[weekKey].days += 1;
    });
    
    // 주별로 15시간 이상인 주에 대해 주휴수당 지급
    Object.entries(weeklyData).forEach(([weekKey, data]) => {
      if (data.hours >= 15) {
        // 주 5일 근무 기준으로 1일치 임금 지급 (7시간 × 시급)
        const weeklyHolidayAmount = 7 * latestHourlyRate; // 7시간 × 시급 = 1일치 임금
        weeklyHolidayPay += weeklyHolidayAmount;
        
        // 산출 식 추가
        const weekNumber = Object.keys(weeklyData).indexOf(weekKey) + 1;
        weeklyHolidayCalculation += `${weekNumber}주차: ${data.hours}시간 (15시간 이상) → 7시간 × ${latestHourlyRate.toLocaleString()}원 = ${weeklyHolidayAmount.toLocaleString()}원\n`;
      }
    });

    // 총 급여 계산 (기본급 + 주휴수당 + 식대)
    const totalEarnings = totalWage + weeklyHolidayPay + mealAllowance;
    
    // 세금 계산 (3.3% 사업소득세 - 식대는 비과세)
    const taxableAmount = totalWage + weeklyHolidayPay;
    const taxAmount = Math.round(taxableAmount * 0.033);
    const netSalary = totalEarnings - taxAmount; // 총 급여에서 세금을 차감한 실수령액

    const payslip: PayslipData = {
      employee_id: employee.id,
      employee_name: employee.name,
      employee_code: employee.employee_id, // MASLABS-004
      employee_nickname: employee.nickname || employee.name, // 닉네임 또는 이름
      payment_date: new Date().toISOString().split('T')[0],
      salary_period: `${year}-${month.toString().padStart(2, '0')}`,
      employment_type: 'part_time',
      base_salary: totalWage,
      overtime_pay: weeklyHolidayPay, // 주휴수당을 overtime_pay 필드에 저장
      incentive: 0,
      point_bonus: 0,
      meal_allowance: mealAllowance, // 식대
      total_earnings: totalEarnings,
      tax_amount: taxAmount,
      net_salary: netSalary,
      status: 'generated',
      total_hours: totalHours,
      hourly_rate: wages[wages.length - 1].base_wage, // 최신 시급
      weeklyHolidayCalculation: weeklyHolidayCalculation, // 주휴수당 산출 식
      daily_details: dailyDetails.map(detail => ({
        date: detail.date,
        hours: detail.hours,
        daily_wage: detail.daily_wage,
        hourly_rate: detail.hourly_rate
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
    // 계약서에서 식대 정보 조회
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
    
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('meal_allowance, salary_history, probation_period')
      .eq('employee_id', employee.id)
      .lte('start_date', endDate)
      .or(`end_date.is.null,end_date.gte.${startDate}`)
      .eq('status', 'active')
      .order('start_date', { ascending: false })
      .limit(1)
      .single();

    const mealAllowance = contract?.meal_allowance || 0;
    
    const baseSalary = employee.monthly_salary || 0;
    const overtimePay = 0; // 추후 구현
    const incentive = 0; // 추후 구현
    const pointBonus = 0; // 추후 구현
    const totalEarnings = baseSalary + overtimePay + incentive + pointBonus + mealAllowance;
    const taxableAmount = baseSalary + overtimePay + incentive + pointBonus; // 식대는 비과세
    const taxAmount = Math.round(taxableAmount * 0.033); // 3.3% 사업소득세
    const netSalary = totalEarnings - taxAmount; // 총 급여에서 세금을 차감한 실수령액

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
      meal_allowance: mealAllowance, // 식대
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

  // 기본 기간 포맷팅 함수
  const formatBasePeriod = (period: string, dailyDetails?: any[]) => {
    // 월 급여명세서인 경우 (2025-06 형태)
    if (period.match(/^\d{4}-\d{2}$/)) {
      const [year, month] = period.split('-');
      const monthNum = parseInt(month);
      
      // daily_details가 있으면 실제 근무 기간 계산
      if (dailyDetails && dailyDetails.length > 0) {
        const dates = dailyDetails.map(d => new Date(d.date)).sort((a, b) => a.getTime() - b.getTime());
        const startDate = dates[0];
        const endDate = dates[dates.length - 1];
        
        const startDay = startDate.getDate();
        const endDay = endDate.getDate();
        
        if (startDay === endDay) {
          return `${year}년 ${monthNum}월 ${startDay}일`;
        } else {
          return `${year}년 ${monthNum}월 ${startDay}일-${endDay}일`;
        }
      }
      
      return `${year}년 ${monthNum}월`;
    }
    
    return period;
  };

  // 급여 기간을 더 구체적으로 표시하는 함수
  const formatSalaryPeriod = (period: string, dailyDetails?: any[]) => {
    // 버전 번호가 있는 경우 표시
    if (period.includes('-v')) {
      const [basePeriod, version] = period.split('-v');
      const versionNumber = parseInt(version);
      const formattedBase = formatBasePeriod(basePeriod, dailyDetails);
      return `${formattedBase} (v${versionNumber})`;
    }
    
    // 분할 급여명세서인 경우 (periodName이 사용된 경우)
    if (period.includes('차') || period.includes('~')) {
      return period; // 이미 구체적인 기간이 표시됨
    }
    
    // 월 급여명세서인 경우 (2025-06 형태)
    if (period.match(/^\d{4}-\d{2}$/)) {
      const [year, month] = period.split('-');
      const monthNum = parseInt(month);
      
      // 나수진(일당제)의 경우 매월 전체 기간으로 표시
      if (dailyDetails && dailyDetails.length > 0) {
        // daily_details의 첫 번째 항목에서 직원 정보 확인
        const firstDetail = dailyDetails[0];
        if (firstDetail && firstDetail.note && firstDetail.note.includes('월 정규근무')) {
          // 일당제 직원은 매월 전체 기간으로 표시
          return `${monthNum}월`;
        }
        
        // 기존 로직: 실제 근무 기간 계산
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

  // 분할 생성 함수
  const generateCustomPeriodPayslip = async (employee: Employee, startDate: string, endDate: string, periodName: string) => {
    if (employee.employment_type !== 'part_time') {
      throw new Error('분할 생성은 시간제 직원만 가능합니다.');
    }

    // 계약서에서 식대 정보 조회
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('meal_allowance, salary_history, probation_period')
      .eq('employee_id', employee.id)
      .lte('start_date', endDate)
      .or(`end_date.is.null,end_date.gte.${startDate}`)
      .eq('status', 'active')
      .order('start_date', { ascending: false })
      .limit(1)
      .single();

    const mealAllowance = contract?.meal_allowance || 0;

    // 해당 기간의 스케줄 조회
    const { data: schedules, error: scheduleError } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', employee.id)
      .gte('schedule_date', startDate)
      .lte('schedule_date', endDate)
      .order('schedule_date');

    if (scheduleError) {
      throw new Error('스케줄 조회에 실패했습니다.');
    }

    if (!schedules || schedules.length === 0) {
      throw new Error('해당 기간에 스케줄이 없습니다.');
    }

    // 실제 시급 정보 조회 (hourly_wages 테이블 사용)
    const { data: wages, error: wageError } = await supabase
      .from('hourly_wages')
      .select('*')
      .eq('employee_id', employee.id)
      .order('effective_start_date');

    if (wageError) {
      throw new Error('시급 정보 조회에 실패했습니다.');
    }

    if (!wages || wages.length === 0) {
      throw new Error('시급 정보가 없습니다.');
    }

    // 일별 근무시간 계산 (스케줄의 실제 시간을 그대로 사용)
    const dailyHours: { [date: string]: number } = {};
    schedules.forEach(schedule => {
      const date = schedule.schedule_date;
      const start = new Date(`${date} ${schedule.scheduled_start}`);
      const end = new Date(`${date} ${schedule.scheduled_end}`);
      const rawHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60); // 스케줄의 실제 근무시간
      
      // 근무시간을 그대로 사용 (정규화하지 않음)
      const hours = rawHours;
      
      if (!dailyHours[date]) {
        dailyHours[date] = 0;
      }
      dailyHours[date] += hours;
    });

    // 시급 적용 및 총액 계산
    let totalHours = 0;
    let totalWage = 0;
    const dailyDetails: Array<{
      date: string;
      hours: number;
      hourly_rate: number;
      daily_wage: number;
    }> = [];

    Object.keys(dailyHours).sort().forEach(date => {
      const hours = dailyHours[date];
      const scheduleDate = new Date(date);
      
      // 해당 날짜에 적용되는 시급 찾기 (hourly_wages 테이블 기반)
      const applicableWages = wages.filter(wage => {
        const startDate = new Date(wage.effective_start_date);
        const endDate = wage.effective_end_date ? new Date(wage.effective_end_date) : null;
        
        // 시작일이 해당 날짜보다 이전이고, 종료일이 없거나 해당 날짜보다 이후인 경우
        return startDate <= scheduleDate && (!endDate || endDate >= scheduleDate);
      });
      
      // 가장 최근에 시작된 시급 선택
      const applicableWage = applicableWages.length > 0 
        ? applicableWages.reduce((latest, current) => 
            new Date(current.effective_start_date) > new Date(latest.effective_start_date) ? current : latest
          )
        : wages[0];
      
      const hourlyWage = applicableWage ? applicableWage.base_wage : wages[0].base_wage;
      const dayWage = hours * hourlyWage;
      
      totalHours += hours;
      totalWage += dayWage;
      
      dailyDetails.push({
        date,
        hours,
        hourly_rate: hourlyWage,
        daily_wage: dayWage
      });
    });

    // 주휴수당 계산 (주별로 15시간 이상 근무 시)
    let weeklyHolidayPay = 0;
    const latestHourlyRate = wages[wages.length - 1].base_wage;
    let weeklyHolidayCalculation = ''; // 산출 식 저장
    
    // 주별 근무시간 및 근무일수 계산
    const weeklyData: { [key: string]: { hours: number, days: number } } = {};
    Object.keys(dailyHours).forEach(date => {
      const dateObj = new Date(date);
      const weekStart = new Date(dateObj);
      weekStart.setDate(dateObj.getDate() - dateObj.getDay()); // 일요일을 주의 시작으로
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { hours: 0, days: 0 };
      }
      weeklyData[weekKey].hours += dailyHours[date];
      weeklyData[weekKey].days += 1;
    });
    
    // 주별로 15시간 이상인 주에 대해 주휴수당 지급
    Object.entries(weeklyData).forEach(([weekKey, data]) => {
      if (data.hours >= 15) {
        // 주 5일 근무 기준으로 1일치 임금 지급 (7시간 × 시급)
        const weeklyHolidayAmount = 7 * latestHourlyRate; // 7시간 × 시급 = 1일치 임금
        weeklyHolidayPay += weeklyHolidayAmount;
        
        // 산출 식 추가
        const weekNumber = Object.keys(weeklyData).indexOf(weekKey) + 1;
        weeklyHolidayCalculation += `${weekNumber}주차: ${data.hours}시간 (15시간 이상) → 7시간 × ${latestHourlyRate.toLocaleString()}원 = ${weeklyHolidayAmount.toLocaleString()}원\n`;
      }
    });

    // 총 급여 계산 (기본급 + 주휴수당 + 식대)
    const totalEarnings = totalWage + weeklyHolidayPay + mealAllowance;
    
    // 세금 계산 (3.3% 사업소득세 - 식대는 비과세)
    const taxableAmount = totalWage + weeklyHolidayPay;
    const taxAmount = Math.round(taxableAmount * 0.033);
    const netSalary = totalEarnings - taxAmount; // 총 급여에서 세금을 차감한 실수령액

    const payslip: PayslipData = {
      employee_id: employee.id,
      employee_name: employee.name,
      employee_code: employee.employee_id,
      employee_nickname: employee.nickname || employee.name,
      payment_date: new Date().toISOString().split('T')[0],
      salary_period: periodName, // 사용자가 입력한 정산서명 사용
      employment_type: 'part_time',
      base_salary: totalWage,
      overtime_pay: weeklyHolidayPay, // 주휴수당을 overtime_pay 필드에 저장
      incentive: 0,
      point_bonus: 0,
      meal_allowance: mealAllowance, // 식대
      total_earnings: totalEarnings,
      tax_amount: taxAmount,
      net_salary: netSalary,
      status: 'generated',
      total_hours: totalHours,
      hourly_rate: wages[wages.length - 1].base_wage, // 최신 시급
      daily_details: dailyDetails.map(detail => ({
        date: detail.date,
        hours: detail.hours,
        daily_wage: detail.daily_wage,
        hourly_rate: detail.hourly_rate
      }))
    };

    // 중복 체크 후 저장
    try {
      const { data: existingPayslip, error: checkError } = await supabase
        .from('payslips')
        .select('*')
        .eq('employee_id', employee.id)
        .eq('period', periodName)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      if (existingPayslip) {
        const statusText = existingPayslip.status === 'generated' ? '생성됨' : 
                          existingPayslip.status === 'issued' ? '발행됨' : '지급완료';
        const shouldCreateNewVersion = confirm(`이미 '${periodName}' 기간의 정산서가 존재합니다. (상태: ${statusText})\n\n새 버전을 생성하시겠습니까? (기존 정산서는 보존됩니다)`);
        if (!shouldCreateNewVersion) {
          throw new Error('사용자가 취소했습니다.');
        }
        
        // 새 버전 번호 생성
        const { data: existingVersions, error: versionError } = await supabase
          .from('payslips')
          .select('period')
          .eq('employee_id', employee.id)
          .like('period', `${periodName}%`)
          .order('period', { ascending: false });
          
        if (versionError) {
          throw new Error('버전 확인 중 오류가 발생했습니다.');
        }
        
        // 다음 버전 번호 계산
        let versionNumber = 2;
        if (existingVersions && existingVersions.length > 0) {
          const versionPattern = new RegExp(`${periodName}-v(\\d+)$`);
          const maxVersion = existingVersions
            .map(v => {
              const match = v.period.match(versionPattern);
              return match ? parseInt(match[1]) : 0;
            })
            .reduce((max, v) => Math.max(max, v), 0);
          versionNumber = maxVersion + 1;
        }
        
        // periodName을 새 버전으로 변경
        periodName = `${periodName}-v${versionNumber}`;
      }

      // 새 정산서 저장 (데이터베이스 스키마에 맞게 필드 제한)
      const { error: saveError } = await supabase
        .from('payslips')
        .insert([{
          employee_id: payslip.employee_id,
          period: periodName,
          employment_type: payslip.employment_type,
          base_salary: payslip.base_salary,
          overtime_pay: payslip.overtime_pay,
          incentive: payslip.incentive,
          point_bonus: payslip.point_bonus,
          total_earnings: payslip.total_earnings,
          tax_amount: payslip.tax_amount,
          net_salary: payslip.net_salary,
          total_hours: payslip.total_hours,
          hourly_rate: payslip.hourly_rate,
          daily_details: payslip.daily_details,
          status: payslip.status
        }]);

      if (saveError) {
        console.error('급여명세서 저장 실패:', saveError);
        throw new Error('급여명세서 저장에 실패했습니다.');
      }
      
      console.log('✅ 분할 급여명세서 저장 성공');
    } catch (saveError) {
      console.error('급여명세서 저장 중 오류:', saveError);
      throw saveError;
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
        // 기존 레코드가 없으면 새로 생성 (데이터베이스 스키마에 맞게 필드 제한)
        const { error } = await supabase
          .from('payslips')
          .insert([{
            employee_id: payslipData.employee_id,
            period: payslipData.salary_period,
            employment_type: payslipData.employment_type,
            base_salary: payslipData.base_salary,
            overtime_pay: payslipData.overtime_pay,
            incentive: payslipData.incentive,
            point_bonus: payslipData.point_bonus,
            total_earnings: payslipData.total_earnings,
            tax_amount: payslipData.tax_amount,
            net_salary: payslipData.net_salary,
            total_hours: payslipData.total_hours,
            hourly_rate: payslipData.hourly_rate,
            daily_details: payslipData.daily_details,
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

  const deletePayslip = async (payslipId: string, employeeName: string, period: string) => {
    if (!confirm(`${employeeName}의 ${period} 급여명세서를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('payslips')
        .delete()
        .eq('id', payslipId);

      if (error) {
        throw error;
      }

      await loadSavedPayslips(); // 발행된 급여명세서 목록 새로고침
      alert('급여명세서가 삭제되었습니다.');
    } catch (error) {
      console.error('급여명세서 삭제 실패:', error);
      alert(`급여명세서 삭제에 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  const viewPayslipDetails = (payslip: any) => {
    console.log('상세 보기 클릭:', payslip);
    console.log('daily_details:', payslip.daily_details);
    console.log('employees:', payslip.employees);
    setSelectedPayslipForDetails(payslip);
    setEditingDates(false);
    // 날짜 편집을 위한 초기값 설정
    setEditIssuedDate(payslip.issued_at ? new Date(payslip.issued_at).toISOString().split('T')[0] : '');
    setEditPaidDate(payslip.paid_at ? new Date(payslip.paid_at).toISOString().split('T')[0] : '');
  };

  const updatePayslipDates = async () => {
    if (!selectedPayslipForDetails) return;

    try {
      const updateData: any = {};
      
      if (editIssuedDate) {
        updateData.issued_at = new Date(editIssuedDate).toISOString();
      }
      
      if (editPaidDate) {
        updateData.paid_at = new Date(editPaidDate).toISOString();
      }

      const { error } = await supabase
        .from('payslips')
        .update(updateData)
        .eq('id', selectedPayslipForDetails.id);

      if (error) {
        throw error;
      }

      // 상태 업데이트
      setSelectedPayslipForDetails((prev: any) => prev ? {
        ...prev,
        issued_at: editIssuedDate ? new Date(editIssuedDate).toISOString() : prev.issued_at,
        paid_at: editPaidDate ? new Date(editPaidDate).toISOString() : prev.paid_at
      } : null);
      
      await loadSavedPayslips();
      setEditingDates(false);
      alert('날짜가 성공적으로 업데이트되었습니다.');
    } catch (error) {
      console.error('날짜 업데이트 실패:', error);
      alert('날짜 업데이트에 실패했습니다.');
    }
  };

  function printSavedPayslip(payslip: any) {
    // 인쇄용 창 열기
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('팝업이 차단되었습니다. 팝업을 허용해주세요.');
      return;
    }

    // 인쇄용 HTML 생성 (흑백 고급스러운 디자인)
    const printContent = `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>MASLABS 급여명세서 - ${payslip.period}</title>
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
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-bottom: 40px;
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
            <div class="period">급여명세서 ${formatSalaryPeriod(payslip.period, payslip.daily_details)}</div>
          </div>
          
          <div class="content">
            <div class="info-section">
              <div>
                <div class="info-item">
                  <span class="info-label">직원명:</span>
                  <span class="info-value">${payslip.employees.name}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">직원코드:</span>
                  <span class="info-value">${payslip.employees.employee_id || 'N/A'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">급여 기간:</span>
                  <span class="info-value">${formatSalaryPeriod(payslip.period, payslip.daily_details)}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">고용 형태:</span>
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
                  <span class="status-badge ${payslip.status === 'paid' ? 'status-paid' : payslip.status === 'issued' ? 'status-issued' : 'status-generated'}">
                    ${payslip.status === 'paid' ? '지급완료' : payslip.status === 'issued' ? '발행됨' : '생성됨'}
                  </span>
                </div>
                ${payslip.employment_type === 'part_time' ? `
                <div class="info-item">
                  <span class="info-label">총 근무시간:</span>
                  <span class="info-value">${payslip.total_hours || 0}시간</span>
                </div>
                <div class="info-item">
                  <span class="info-label">시급:</span>
                  <span class="info-value">${payslip.hourly_rate ? payslip.hourly_rate.toLocaleString() : 0}원</span>
                </div>
                ` : ''}
              </div>
            </div>
            
            <div class="salary-section">
              <div class="salary-title">급여 내역</div>
              <div class="salary-item">
                <span>기본급</span>
                <span>${payslip.base_salary?.toLocaleString() || 0}원</span>
              </div>
              ${(payslip.fuel_allowance || 0) > 0 ? `
              <div class="salary-item">
                <span>주유대</span>
                <span>${payslip.fuel_allowance.toLocaleString()}원</span>
              </div>
              ` : ''}
              ${(payslip.additional_work || 0) > 0 ? `
              <div class="salary-item">
                <span>추가근무</span>
                <span>${payslip.additional_work.toLocaleString()}원</span>
              </div>
              ` : ''}
              ${(payslip.weekly_holiday_pay || 0) > 0 ? `
              <div class="salary-item">
                <span>주휴수당</span>
                <span>${payslip.weekly_holiday_pay.toLocaleString()}원</span>
              </div>
              ` : ''}
              ${(payslip.overtime_pay || 0) > 0 && !payslip.weekly_holiday_pay ? `
              <div class="salary-item">
                <span>주휴수당</span>
                <span>${payslip.overtime_pay.toLocaleString()}원</span>
              </div>
              ` : ''}
              ${(payslip.meal_allowance || 0) > 0 ? `
              <div class="salary-item">
                <span>식대</span>
                <span>${payslip.meal_allowance.toLocaleString()}원</span>
              </div>
              ` : ''}
              ${(payslip.incentive || 0) > 0 ? `
              <div class="salary-item">
                <span>인센티브</span>
                <span>${payslip.incentive.toLocaleString()}원</span>
              </div>
              ` : ''}
              ${(payslip.performance_bonus || 0) > 0 ? `
              <div class="salary-item">
                <span>성과급</span>
                <span>${payslip.performance_bonus.toLocaleString()}원</span>
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
              <div class="salary-item net">
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

  function printDetailedSavedPayslip(payslip: any) {
    // 4대보험 계산
    const insurance = calculateInsurance(payslip.total_earnings);
    
    // 인쇄용 창 열기
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('팝업이 차단되었습니다. 팝업을 허용해주세요.');
      return;
    }

    // 상세 인쇄용 HTML 생성
    const printContent = `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>상세 급여명세서 - ${payslip.employee_name}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
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
            <div class="period">${payslip.period} (${payslip.payment_date})</div>
          </div>
          
          <div class="employee-info">
            <div>
              <div class="info-item">
                <span class="info-label">직원명:</span>
                <span class="info-value">${payslip.employee_name}</span>
              </div>
              <div class="info-item">
                <span class="info-label">직원코드:</span>
                <span class="info-value">${payslip.employee_code || 'N/A'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">닉네임:</span>
                <span class="info-value">${payslip.employee_nickname || payslip.employee_name}</span>
              </div>
            </div>
            <div>
              <div class="info-item">
                <span class="info-label">고용형태:</span>
                <span class="info-value">${payslip.employment_type === 'part_time' ? '시간제' : '정규직'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">지급일:</span>
                <span class="info-value">${payslip.payment_date}</span>
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
              <span>${payslip.base_salary.toLocaleString()}원</span>
            </div>
            ${payslip.overtime_pay > 0 ? `
            <div class="salary-item">
              <span>주휴수당</span>
              <span>${payslip.overtime_pay.toLocaleString()}원</span>
            </div>
            ${payslip.weeklyHolidayCalculation ? `
            <div class="calculation-details">
              <div class="calculation-title">주휴수당 산출 식:</div>
              <div class="calculation-formula">${payslip.weeklyHolidayCalculation}</div>
            </div>
            ` : ''}
            ` : ''}
            ${payslip.incentive > 0 ? `
            <div class="salary-item">
              <span>인센티브</span>
              <span>${payslip.incentive.toLocaleString()}원</span>
            </div>
            ` : ''}
            <div class="salary-item">
              <span>총 지급액</span>
              <span>${payslip.total_earnings.toLocaleString()}원</span>
            </div>
          </div>

          <div class="insurance-section">
            <div class="insurance-title">4대보험 계산</div>
            <div class="insurance-item">
              <span>국민연금 (4.5%)</span>
              <span>${insurance.nationalPension.toLocaleString()}원</span>
            </div>
            <div class="insurance-item">
              <span>건강보험 (3.597%)</span>
              <span>${insurance.healthInsurance.toLocaleString()}원</span>
            </div>
            <div class="insurance-item">
              <span>고용보험 (0.8%)</span>
              <span>${insurance.employmentInsurance.toLocaleString()}원</span>
            </div>
            <div class="insurance-item">
              <span>산재보험 (0.65%)</span>
              <span>${insurance.industrialAccidentInsurance.toLocaleString()}원</span>
            </div>
            <div class="insurance-item" style="font-weight: bold; border-top: 1px solid #ddd; padding-top: 5px;">
              <span>4대보험 총액</span>
              <span>${insurance.totalInsurance.toLocaleString()}원</span>
            </div>
          </div>

          <div class="total-section">
            <div class="total-item">
              <span>총 지급액:</span>
              <span>${payslip.total_earnings.toLocaleString()}원</span>
            </div>
            <div class="total-item">
              <span>4대보험:</span>
              <span>-${insurance.totalInsurance.toLocaleString()}원</span>
            </div>
            <div class="total-item">
              <span>소득세 (3.3%):</span>
              <span>-${payslip.tax_amount.toLocaleString()}원</span>
            </div>
            <div class="total-item final-amount">
              <span>실수령액:</span>
              <span>${(payslip.net_salary - insurance.totalInsurance).toLocaleString()}원</span>
            </div>
          </div>

          <div class="footer">
            <p>본 급여명세서는 MASLABS 급여관리시스템에서 자동 생성되었습니다.</p>
            <p>문의사항이 있으시면 인사팀으로 연락해주세요.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }

  // 발행된 급여명세서용 4대보험 포함 출력/인쇄 함수
  function printSavedPayslipWithInsurance(payslip: any) {
    // 4대보험 계산
    const insurance = calculateInsurance(payslip.total_earnings);
    
    // 인쇄용 창 열기
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('팝업이 차단되었습니다. 팝업을 허용해주세요.');
      return;
    }

    // 4대보험 포함 인쇄용 HTML 생성
    const printContent = `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>4대보험 포함 급여명세서 - ${payslip.employee_name}</title>
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
            <p>${payslip.period} (${payslip.payment_date})</p>
          </div>
          
          <div class="employee-info">
            <div class="info-grid">
              <div>
                <div class="info-item">
                  <span class="info-label">직원명:</span>
                  <span class="info-value">${payslip.employee_name}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">직원코드:</span>
                  <span class="info-value">${payslip.employee_code || 'N/A'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">고용 형태:</span>
                  <span class="info-value">${payslip.employment_type === 'part_time' ? '시간제' : '정규직'} (4대보험 적용)</span>
                </div>
              </div>
              <div>
                <div class="info-item">
                  <span class="info-label">지급 기간:</span>
                  <span class="info-value">${payslip.period}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">지급일:</span>
                  <span class="info-value">${payslip.payment_date}</span>
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
            ${payslip.overtime_pay > 0 ? `
            <div class="salary-item">
              <span>주휴수당</span>
              <span>${payslip.overtime_pay.toLocaleString()}원</span>
            </div>
            ` : ''}
            ${payslip.incentive > 0 ? `
            <div class="salary-item">
              <span>인센티브</span>
              <span>${payslip.incentive.toLocaleString()}원</span>
            </div>
            ` : ''}
            <div class="salary-item">
              <span>총 지급액</span>
              <span>${payslip.total_earnings.toLocaleString()}원</span>
            </div>
          </div>

          <div class="insurance-section">
            <div class="insurance-title">4대보험 공제</div>
            <div class="insurance-item">
              <span>국민연금 (4.5%)</span>
              <span>${insurance.nationalPension.toLocaleString()}원</span>
            </div>
            <div class="insurance-item">
              <span>건강보험 (3.597%)</span>
              <span>${insurance.healthInsurance.toLocaleString()}원</span>
            </div>
            <div class="insurance-item">
              <span>고용보험 (0.8%)</span>
              <span>${insurance.employmentInsurance.toLocaleString()}원</span>
            </div>
            <div class="insurance-item">
              <span>산재보험 (0.65%)</span>
              <span>${insurance.industrialAccidentInsurance.toLocaleString()}원</span>
            </div>
            <div class="insurance-item">
              <span>4대보험 총액</span>
              <span>${insurance.totalInsurance.toLocaleString()}원</span>
            </div>
          </div>

          <div class="total-section">
            <div class="total-item">
              <span>총 지급액:</span>
              <span>${payslip.total_earnings.toLocaleString()}원</span>
            </div>
            <div class="total-item">
              <span>4대보험 공제:</span>
              <span>-${insurance.totalInsurance.toLocaleString()}원</span>
            </div>
            <div class="total-item final-amount">
              <span>실수령액:</span>
              <span>${(payslip.total_earnings - insurance.totalInsurance).toLocaleString()}원</span>
            </div>
          </div>

          <div class="footer">
            <p><strong>※ 본 급여명세서는 4대보험이 적용된 버전입니다.</strong></p>
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
  }

  // 발행된 급여명세서용 사업소득세만 출력/인쇄 함수
  function printSavedPayslipBusinessIncomeOnly(payslip: any) {
    // 3.3% 사업소득세만 계산
    const businessIncomeTax = Math.round(payslip.total_earnings * 0.033);
    const netSalary = payslip.total_earnings - businessIncomeTax;
    
    // 인쇄용 창 열기
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('팝업이 차단되었습니다. 팝업을 허용해주세요.');
      return;
    }

    // 사업소득세만 인쇄용 HTML 생성
    const printContent = `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>사업소득세 급여명세서 - ${payslip.employee_name}</title>
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
            <p>${payslip.period} (${payslip.payment_date})</p>
          </div>
          
          <div class="employee-info">
            <div class="info-grid">
              <div>
                <div class="info-item">
                  <span class="info-label">직원명:</span>
                  <span class="info-value">${payslip.employee_name}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">직원코드:</span>
                  <span class="info-value">${payslip.employee_code || 'N/A'}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">고용 형태:</span>
                  <span class="info-value">${payslip.employment_type === 'part_time' ? '시간제' : '정규직'} (사업소득세)</span>
                </div>
              </div>
              <div>
                <div class="info-item">
                  <span class="info-label">지급 기간:</span>
                  <span class="info-value">${payslip.period}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">지급일:</span>
                  <span class="info-value">${payslip.payment_date}</span>
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
            ${payslip.overtime_pay > 0 ? `
            <div class="salary-item">
              <span>주휴수당</span>
              <span>${payslip.overtime_pay.toLocaleString()}원</span>
            </div>
            ` : ''}
            ${payslip.incentive > 0 ? `
            <div class="salary-item">
              <span>인센티브</span>
              <span>${payslip.incentive.toLocaleString()}원</span>
            </div>
            ` : ''}
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
              <span>사업소득세 공제:</span>
              <span>-${businessIncomeTax.toLocaleString()}원</span>
            </div>
            <div class="total-item final-amount">
              <span>실수령액:</span>
              <span>${netSalary.toLocaleString()}원</span>
            </div>
          </div>

          <div class="footer">
            <p><strong>※ 본 급여명세서는 사업소득세(3.3%)만 적용된 버전입니다.</strong></p>
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
  }

  // 4대보험 계산 함수
  const calculateInsurance = (totalEarnings: number, employeeAge: number = 65) => {
    // 최형호는 60대이므로 연금 제외
    const nationalPension = employeeAge >= 60 ? 0 : Math.round(totalEarnings * 0.045); // 4.5%
    const healthInsurance = Math.round(totalEarnings * 0.03597); // 3.597%
    const employmentInsurance = Math.round(totalEarnings * 0.008); // 0.8%
    const industrialAccidentInsurance = Math.round(totalEarnings * 0.0065); // 0.65%
    
    const totalInsurance = nationalPension + healthInsurance + employmentInsurance + industrialAccidentInsurance;
    
    return {
      nationalPension,
      healthInsurance,
      employmentInsurance,
      industrialAccidentInsurance,
      totalInsurance
    };
  };

  const printDetailedPayslip = () => {
    if (!payslipData) return;
    
    // 4대보험 계산
    const insurance = calculateInsurance(payslipData.total_earnings);
    
    // 인쇄용 창 열기
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('팝업이 차단되었습니다. 팝업을 허용해주세요.');
      return;
    }

    // 상세 인쇄용 HTML 생성
    const printContent = `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>상세 급여명세서 - ${payslipData.employee_name}</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
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
            <div class="period">${payslipData.salary_period} (${payslipData.payment_date})</div>
          </div>
          
          <div class="employee-info">
            <div>
              <div class="info-item">
                <span class="info-label">직원명:</span>
                <span class="info-value">${payslipData.employee_name}</span>
              </div>
              <div class="info-item">
                <span class="info-label">직원코드:</span>
                <span class="info-value">${payslipData.employee_code}</span>
              </div>
              <div class="info-item">
                <span class="info-label">닉네임:</span>
                <span class="info-value">${payslipData.employee_nickname}</span>
              </div>
            </div>
            <div>
              <div class="info-item">
                <span class="info-label">고용형태:</span>
                <span class="info-value">${payslipData.employment_type === 'part_time' ? '시간제' : '정규직'}</span>
              </div>
              <div class="info-item">
                <span class="info-label">지급일:</span>
                <span class="info-value">${payslipData.payment_date}</span>
              </div>
              <div class="info-item">
                <span class="info-label">상태:</span>
                <span class="info-value">${payslipData.status === 'generated' ? '생성됨' : payslipData.status === 'issued' ? '발행됨' : '지급완료'}</span>
              </div>
            </div>
          </div>

          <div class="salary-section">
            <div class="section-title">급여 내역</div>
            <div class="salary-item">
              <span>기본급</span>
              <span>${payslipData.base_salary.toLocaleString()}원</span>
            </div>
            ${payslipData.overtime_pay > 0 ? `
            <div class="salary-item">
              <span>주휴수당</span>
              <span>${payslipData.overtime_pay.toLocaleString()}원</span>
            </div>
            ${payslipData.weeklyHolidayCalculation ? `
            <div class="calculation-details">
              <div class="calculation-title">주휴수당 산출 식:</div>
              <div class="calculation-formula">${payslipData.weeklyHolidayCalculation}</div>
            </div>
            ` : ''}
            ` : ''}
            ${payslipData.incentive > 0 ? `
            <div class="salary-item">
              <span>인센티브</span>
              <span>${payslipData.incentive.toLocaleString()}원</span>
            </div>
            ` : ''}
            <div class="salary-item">
              <span>총 지급액</span>
              <span>${payslipData.total_earnings.toLocaleString()}원</span>
            </div>
          </div>

          <div class="insurance-section">
            <div class="insurance-title">4대보험 계산</div>
            <div class="insurance-item">
              <span>국민연금 (4.5%)</span>
              <span>${insurance.nationalPension.toLocaleString()}원</span>
            </div>
            <div class="insurance-item">
              <span>건강보험 (3.597%)</span>
              <span>${insurance.healthInsurance.toLocaleString()}원</span>
            </div>
            <div class="insurance-item">
              <span>고용보험 (0.8%)</span>
              <span>${insurance.employmentInsurance.toLocaleString()}원</span>
            </div>
            <div class="insurance-item">
              <span>산재보험 (0.65%)</span>
              <span>${insurance.industrialAccidentInsurance.toLocaleString()}원</span>
            </div>
            <div class="insurance-item" style="font-weight: bold; border-top: 1px solid #ddd; padding-top: 5px;">
              <span>4대보험 총액</span>
              <span>${insurance.totalInsurance.toLocaleString()}원</span>
            </div>
          </div>

          <div class="total-section">
            <div class="total-item">
              <span>총 지급액:</span>
              <span>${payslipData.total_earnings.toLocaleString()}원</span>
            </div>
            <div class="total-item">
              <span>4대보험:</span>
              <span>-${insurance.totalInsurance.toLocaleString()}원</span>
            </div>
            <div class="total-item">
              <span>소득세 (3.3%):</span>
              <span>-${payslipData.tax_amount.toLocaleString()}원</span>
            </div>
            <div class="total-item final-amount">
              <span>실수령액:</span>
              <span>${(payslipData.net_salary - insurance.totalInsurance).toLocaleString()}원</span>
            </div>
          </div>

          <div class="footer">
            <p>본 급여명세서는 MASLABS 급여관리시스템에서 자동 생성되었습니다.</p>
            <p>문의사항이 있으시면 인사팀으로 연락해주세요.</p>
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

  // 4대보험 포함 출력/인쇄 함수 (모든 직원에게 4대보험 적용)
  const printPayslipWithInsurance = () => {
    if (!payslipData) return;
    
    // 4대보험 계산 (모든 직원에게 적용)
    const insurance = calculateInsurance(payslipData.total_earnings);
    
    // 인쇄용 창 열기
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('팝업이 차단되었습니다. 팝업을 허용해주세요.');
      return;
    }

    // 4대보험 포함 인쇄용 HTML 생성
    const printContent = `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>4대보험 포함 급여명세서 - ${payslipData.employee_name}</title>
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
            <p>${payslipData.salary_period} (${payslipData.payment_date})</p>
          </div>
          
          <div class="employee-info">
            <div class="info-grid">
              <div>
                <div class="info-item">
                  <span class="info-label">직원명:</span>
                  <span class="info-value">${payslipData.employee_name}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">직원코드:</span>
                  <span class="info-value">${payslipData.employee_code}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">고용 형태:</span>
                  <span class="info-value">${payslipData.employment_type === 'part_time' ? '시간제' : '정규직'} (4대보험 적용)</span>
                </div>
              </div>
              <div>
                <div class="info-item">
                  <span class="info-label">지급 기간:</span>
                  <span class="info-value">${payslipData.salary_period}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">지급일:</span>
                  <span class="info-value">${payslipData.payment_date}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">상태:</span>
                  <span class="info-value">${payslipData.status === 'generated' ? '생성됨' : payslipData.status === 'issued' ? '발행됨' : '지급완료'}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="salary-section">
            <div class="salary-title">급여 내역</div>
            <div class="salary-item">
              <span>기본급</span>
              <span>${payslipData.base_salary.toLocaleString()}원</span>
            </div>
            ${payslipData.overtime_pay > 0 ? `
            <div class="salary-item">
              <span>주휴수당</span>
              <span>${payslipData.overtime_pay.toLocaleString()}원</span>
            </div>
            ` : ''}
            ${payslipData.incentive > 0 ? `
            <div class="salary-item">
              <span>인센티브</span>
              <span>${payslipData.incentive.toLocaleString()}원</span>
            </div>
            ` : ''}
            <div class="salary-item">
              <span>총 지급액</span>
              <span>${payslipData.total_earnings.toLocaleString()}원</span>
            </div>
          </div>

          <div class="insurance-section">
            <div class="insurance-title">4대보험 공제</div>
            <div class="insurance-item">
              <span>국민연금 (4.5%)</span>
              <span>${insurance.nationalPension.toLocaleString()}원</span>
            </div>
            <div class="insurance-item">
              <span>건강보험 (3.597%)</span>
              <span>${insurance.healthInsurance.toLocaleString()}원</span>
            </div>
            <div class="insurance-item">
              <span>고용보험 (0.8%)</span>
              <span>${insurance.employmentInsurance.toLocaleString()}원</span>
            </div>
            <div class="insurance-item">
              <span>산재보험 (0.65%)</span>
              <span>${insurance.industrialAccidentInsurance.toLocaleString()}원</span>
            </div>
            <div class="insurance-item">
              <span>4대보험 총액</span>
              <span>${insurance.totalInsurance.toLocaleString()}원</span>
            </div>
          </div>

          <div class="total-section">
            <div class="total-item">
              <span>총 지급액:</span>
              <span>${payslipData.total_earnings.toLocaleString()}원</span>
            </div>
            <div class="total-item">
              <span>4대보험 공제:</span>
              <span>-${insurance.totalInsurance.toLocaleString()}원</span>
            </div>
            <div class="total-item final-amount">
              <span>실수령액:</span>
              <span>${(payslipData.total_earnings - insurance.totalInsurance).toLocaleString()}원</span>
            </div>
          </div>

          <div class="footer">
            <p><strong>※ 본 급여명세서는 4대보험이 적용된 버전입니다.</strong></p>
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
  };

  // 사업소득세만 출력/인쇄 함수 (모든 직원에게 3.3%만 적용)
  const printPayslipBusinessIncomeOnly = () => {
    if (!payslipData) return;
    
    // 3.3% 사업소득세만 계산
    const businessIncomeTax = Math.round(payslipData.total_earnings * 0.033);
    const netSalary = payslipData.total_earnings - businessIncomeTax;
    
    // 인쇄용 창 열기
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('팝업이 차단되었습니다. 팝업을 허용해주세요.');
      return;
    }

    // 사업소득세만 인쇄용 HTML 생성
    const printContent = `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>사업소득세 급여명세서 - ${payslipData.employee_name}</title>
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
            <p>${payslipData.salary_period} (${payslipData.payment_date})</p>
          </div>
          
          <div class="employee-info">
            <div class="info-grid">
              <div>
                <div class="info-item">
                  <span class="info-label">직원명:</span>
                  <span class="info-value">${payslipData.employee_name}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">직원코드:</span>
                  <span class="info-value">${payslipData.employee_code}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">고용 형태:</span>
                  <span class="info-value">${payslipData.employment_type === 'part_time' ? '시간제' : '정규직'} (사업소득세)</span>
                </div>
              </div>
              <div>
                <div class="info-item">
                  <span class="info-label">지급 기간:</span>
                  <span class="info-value">${payslipData.salary_period}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">지급일:</span>
                  <span class="info-value">${payslipData.payment_date}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">상태:</span>
                  <span class="info-value">${payslipData.status === 'generated' ? '생성됨' : payslipData.status === 'issued' ? '발행됨' : '지급완료'}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="salary-section">
            <div class="salary-title">급여 내역</div>
            <div class="salary-item">
              <span>기본급</span>
              <span>${payslipData.base_salary.toLocaleString()}원</span>
            </div>
            ${payslipData.overtime_pay > 0 ? `
            <div class="salary-item">
              <span>주휴수당</span>
              <span>${payslipData.overtime_pay.toLocaleString()}원</span>
            </div>
            ` : ''}
            ${payslipData.incentive > 0 ? `
            <div class="salary-item">
              <span>인센티브</span>
              <span>${payslipData.incentive.toLocaleString()}원</span>
            </div>
            ` : ''}
            <div class="salary-item">
              <span>총 지급액</span>
              <span>${payslipData.total_earnings.toLocaleString()}원</span>
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
              <span>${payslipData.total_earnings.toLocaleString()}원</span>
            </div>
            <div class="total-item">
              <span>사업소득세 공제:</span>
              <span>-${businessIncomeTax.toLocaleString()}원</span>
            </div>
            <div class="total-item final-amount">
              <span>실수령액:</span>
              <span>${netSalary.toLocaleString()}원</span>
            </div>
          </div>

          <div class="footer">
            <p><strong>※ 본 급여명세서는 사업소득세(3.3%)만 적용된 버전입니다.</strong></p>
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
  };

  // 공통: 화면 임시상태가 아닌 저장된 명세서로 인쇄하기 위한 래퍼
  const loadPayslipForPrint = async (): Promise<any | null> => {
    // 우선 상세 모달에서 선택된 저장 레코드가 있으면 그것을 사용
    if (selectedPayslipForDetails) return selectedPayslipForDetails;

    if (!payslipData) return null;
    try {
      const period = payslipData.salary_period || payslipData.period;
      if (!payslipData.employee_id || !period) return null;
      const { data, error } = await supabase
        .from('payslips')
        .select('*')
        .eq('employee_id', payslipData.employee_id)
        .eq('period', period)
        .limit(1)
        .single();
      if (error) {
        console.error('저장된 급여명세서 조회 실패:', error);
        return null;
      }
      return data;
    } catch (e) {
      console.error('loadPayslipForPrint 오류:', e);
      return null;
    }
  };

  // 기본/상세/4대보험/3.3% 인쇄 버튼용 래퍼 (저장 레코드 기반으로 출력)
  const handlePrintBasic = async () => {
    const saved = await loadPayslipForPrint();
    if (saved) {
      printSavedPayslip(saved);
    } else if (payslipData) {
      // 저장본이 없으면 기존 방식으로라도 출력
      printPayslip();
    }
  };

  const handlePrintDetailed = async () => {
    const saved = await loadPayslipForPrint();
    if (saved) {
      printDetailedSavedPayslip(saved);
    } else if (payslipData) {
      printDetailedPayslip();
    }
  };

  const handlePrintWithInsurance = async () => {
    const saved = await loadPayslipForPrint();
    if (saved) {
      printSavedPayslipWithInsurance(saved);
    } else if (payslipData) {
      printPayslipWithInsurance();
    }
  };

  const handlePrintBusinessIncomeOnly = async () => {
    const saved = await loadPayslipForPrint();
    if (saved) {
      printSavedPayslipBusinessIncomeOnly(saved);
    } else if (payslipData) {
      printPayslipBusinessIncomeOnly();
    }
  };

  const printPayslip = () => {
    if (!payslipData) return;
    
    // 인쇄용 창 열기
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('팝업이 차단되었습니다. 팝업을 허용해주세요.');
      return;
    }

    // 인쇄용 HTML 생성 (흑백 고급스러운 디자인)
    const printContent = `
      <!DOCTYPE html>
      <html lang="ko">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>급여명세서 - ${payslipData.employee_name}</title>
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
            <div class="period">급여명세서 ${formatSalaryPeriod(payslipData.salary_period, payslipData.daily_details)}</div>
          </div>

          <div class="content">
            <div class="info-section">
              <div class="section-title">기본 정보</div>
              <div class="info-grid">
                <div>
                  <div class="info-item">
                    <span class="info-label">직원명:</span>
                    <span class="info-value">${payslipData.employee_name}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">직원 코드:</span>
                    <span class="info-value">${payslipData.employee_code || 'N/A'}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">닉네임:</span>
                    <span class="info-value">${payslipData.employee_nickname || payslipData.employee_name}</span>
                  </div>
                <div class="info-item">
                  <span class="info-label">급여 기간:</span>
                  <span class="info-value">${formatSalaryPeriod(payslipData.salary_period, payslipData.daily_details)}</span>
                </div>
                </div>
                <div>
                  <div class="info-item">
                    <span class="info-label">고용 형태:</span>
                    <span class="info-value">${payslipData.employment_type === 'full_time' ? '정규직' : '시간제'}</span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">지급일:</span>
                    <span class="info-value">${payslipData.payment_date}</span>
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
                <span class="info-value">${payslipData.total_hours}시간</span>
              </div>
              <div class="info-item">
                <span class="info-label">시급:</span>
                <span class="info-value">${payslipData.hourly_rate?.toLocaleString()}원</span>
              </div>
            </div>
            ` : ''}

            <div class="salary-section">
              <div class="salary-title">급여 내역</div>
              <div class="salary-item">
                <span>기본급</span>
                <span>${payslipData.base_salary.toLocaleString()}원</span>
              </div>
              ${payslipData.overtime_pay > 0 ? `
              <div class="salary-item">
                <span>주휴수당</span>
                <span>${payslipData.overtime_pay.toLocaleString()}원</span>
              </div>
              ` : ''}
              ${payslipData.incentive > 0 ? `
              <div class="salary-item">
                <span>인센티브</span>
                <span>${payslipData.incentive.toLocaleString()}원</span>
              </div>
              ` : ''}
              ${payslipData.point_bonus > 0 ? `
              <div class="salary-item">
                <span>포인트 보너스</span>
                <span>${payslipData.point_bonus.toLocaleString()}원</span>
              </div>
              ` : ''}
              <div class="salary-item total">
                <span>총 지급액</span>
                <span>${payslipData.total_earnings.toLocaleString()}원</span>
              </div>
              <div class="salary-item deduction">
                <span>세금 (3.3%)</span>
                <span>-${payslipData.tax_amount.toLocaleString()}원</span>
              </div>
              <div class="salary-item net">
                <span>실수령액</span>
                <span>${payslipData.net_salary.toLocaleString()}원</span>
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
              <p>선택된 직원: {selectedEmployee ? 
                (() => {
                  const employee = employees.find(emp => emp.id === selectedEmployee);
                  return employee ? `${employee.name} (${employee.employee_id})` : '알 수 없음';
                })() 
                : '없음'}</p>
            </div>
            
            {/* 생성 방식 선택 */}
            <div className="flex gap-4 mb-4">
              <button
                onClick={() => setShowCustomPeriod(false)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  !showCustomPeriod 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                월 단위 생성
              </button>
              <button
                onClick={() => setShowCustomPeriod(true)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  showCustomPeriod 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                분할 생성 (기간 지정)
              </button>
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

              {/* 월 단위 생성 - 년도/월 선택 */}
              {!showCustomPeriod && (
                <>
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
                </>
              )}

              {/* 분할 생성 - 기간 지정 */}
              {showCustomPeriod && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      시작일
                    </label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      종료일
                    </label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </>
              )}
            </div>

            {/* 분할 생성 시 정산서명 입력 */}
            {showCustomPeriod && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  정산서명 (예: 8월 1차, 7월 2차)
                </label>
                <input
                  type="text"
                  value={customPeriodName}
                  onChange={(e) => setCustomPeriodName(e.target.value)}
                  placeholder="예: 2025-08-1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}

            {/* 생성 버튼 */}
            <div className="flex justify-center gap-4 pt-4">
              <button
                onClick={generatePayslip}
                disabled={!selectedEmployee || generating || (showCustomPeriod && (!customStartDate || !customEndDate || !customPeriodName))}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {generating ? '생성 중...' : 
                  showCustomPeriod ? 
                    `${customStartDate} ~ ${customEndDate} 급여 명세서 생성` :
                    `${selectedYear}년 ${selectedMonth}월 급여 명세서 생성`
                }
              </button>
              <button
                onClick={() => setShowPayslipList(!showPayslipList)}
                className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                {showPayslipList ? '목록 숨기기' : '발행된 급여명세서 목록'}
              </button>
              {selectedEmployee && (
                <button
                  onClick={() => {
                    const employee = employees.find(emp => emp.id === selectedEmployee);
                    if (employee) {
                      setContractChangeData({
                        employee_id: employee.id,
                        employee_name: employee.name,
                        current_contract: employee.employment_type === 'part_time' ? 'hourly' : 'monthly',
                        new_contract: 'annual',
                        effective_date: '2025-10-01',
                        annual_salary: 28080000,
                        monthly_salary: 2340000,
                        meal_allowance: 140000,
                        includes_weekly_holiday: true,
                        work_schedule: {
                          days_per_week: 5,
                          hours_per_day: 7,
                          hours_per_week: 35,
                          work_time: '09:00-17:00',
                          lunch_break: 1
                        }
                      });
                      setShowContractChangeModal(true);
                    }
                  }}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium"
                >
                  연봉계약 전환
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 발행된 급여명세서 목록 */}
        {showPayslipList && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">발행된 급여명세서 목록</h2>
              
              {/* 직원별 필터 */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">직원별 필터:</label>
                <select
                  value={payslipFilter}
                  onChange={(e) => setPayslipFilter(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">전체</option>
                  {Array.from(new Set(savedPayslips.map(p => p.employees.name))).map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {(() => {
              const filteredPayslips = payslipFilter === 'all' 
                ? savedPayslips 
                : savedPayslips.filter(p => p.employees.name === payslipFilter);
              
              // 통계 계산
              const totalAmount = filteredPayslips.reduce((sum, p) => sum + (p.net_salary || 0), 0);
              const paidCount = filteredPayslips.filter(p => p.status === 'paid').length;
              const issuedCount = filteredPayslips.filter(p => p.status === 'issued').length;
              
              return filteredPayslips.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  {payslipFilter === 'all' ? '발행된 급여명세서가 없습니다.' : `${payslipFilter} 직원의 급여명세서가 없습니다.`}
                </div>
              ) : (
                <>
                  {/* 통계 정보 */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{filteredPayslips.length}</div>
                      <div className="text-sm text-gray-600">총 정산서</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{paidCount}</div>
                      <div className="text-sm text-gray-600">지급완료</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-600">{issuedCount}</div>
                      <div className="text-sm text-gray-600">발행됨</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{totalAmount.toLocaleString()}</div>
                      <div className="text-sm text-gray-600">총 지급액 (원)</div>
                    </div>
                  </div>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky right-0 z-10 bg-white shadow-[inset_1px_0_0_0_rgba(229,231,235,1)] w-[360px] min-w-[360px]">
                        작업
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPayslips.map((payslip) => (
                      <tr key={payslip.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {payslip.employees.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatSalaryPeriod(payslip.period, payslip.daily_details)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {payslip.employment_type === 'full_time' ? '정규직' : 
                           payslip.employees?.name === '나수진' ? '일당제' : '시간제'}
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
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 sticky right-0 z-10 bg-white w-[360px] min-w-[360px] shadow-[inset_1px_0_0_0_rgba(229,231,235,1)]">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => printSavedPayslip(payslip)}
                              className="px-2 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors"
                            >
                              기본
                            </button>
                            <button
                              onClick={() => printDetailedSavedPayslip(payslip)}
                              className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                            >
                              상세
                            </button>
                            <button
                              onClick={() => printSavedPayslipWithInsurance(payslip)}
                              className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                            >
                              4대보험
                            </button>
                            <button
                              onClick={() => printSavedPayslipBusinessIncomeOnly(payslip)}
                              className="px-2 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-700 transition-colors"
                            >
                              3.3%만
                            </button>
                            <button
                              onClick={() => viewPayslipDetails(payslip)}
                              className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                            >
                              상세
                            </button>
                            <button
                              onClick={() => deletePayslip(payslip.id, payslip.employees.name, payslip.period)}
                              className="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                            >
                              삭제
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
                </>
              );
            })()}
          </div>
        )}

        {/* 급여 명세서 */}
        {payslipData && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">급여 명세서</h2>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={handlePrintBasic}
                  className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                >
                  기본 출력/인쇄
                </button>
                <button
                  onClick={handlePrintDetailed}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  상세 출력/인쇄
                </button>
                <button
                  onClick={handlePrintWithInsurance}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  4대보험 포함
                </button>
                <button
                  onClick={handlePrintBusinessIncomeOnly}
                  className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                >
                  사업소득세만
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
                    <span className="font-medium">{formatSalaryPeriod(payslipData.salary_period, payslipData.daily_details)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">고용 형태:</span>
                    <span className="font-medium">
                      {payslipData.employment_type === 'full_time' ? '정규직' : 
                       payslipData.employee_name === '나수진' ? '일당제' : '시간제'}
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

              {/* 시간제/일당제 급여 상세 정보 */}
              {payslipData.employment_type === 'part_time' && (
                <div>
                  <h3 className="text-md font-medium text-gray-900 mb-3">
                    {payslipData.employee_name === '나수진' ? '일당제 급여 상세' : '시간제 급여 상세'}
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">총 근무시간:</span>
                      <span className="font-medium">{payslipData.total_hours}시간</span>
                    </div>
                    {payslipData.employee_name === '나수진' ? (
                      <div className="flex justify-between">
                        <span className="text-gray-600">일급별 계산:</span>
                        <span className="font-medium text-gray-800">
                          {(() => {
                            const dailyDetails = payslipData.daily_details?.reduce((acc, detail) => {
                              const key = detail.daily_wage.toString();
                              if (!acc[key]) {
                                acc[key] = { days: 0, wage: 0 };
                              }
                              acc[key].days += 1;
                              acc[key].wage += detail.daily_wage;
                              return acc;
                            }, {} as { [key: string]: { days: number; wage: number } });

                            return Object.entries(dailyDetails || {}).map(([wage, data]) => 
                              `${wage.toLocaleString()}원: ${data.days}일 = ${data.wage.toLocaleString()}원`
                            ).join(', ');
                          })()}
                        </span>
                      </div>
                    ) : (
                      <div className="flex justify-between">
                        <span className="text-gray-600">시급별 계산:</span>
                        <span className="font-medium text-gray-800">
                          {(() => {
                            const hourlyDetails = payslipData.daily_details?.reduce((acc, detail) => {
                              const key = detail.hourly_rate.toString();
                              if (!acc[key]) {
                                acc[key] = { hours: 0, wage: 0 };
                              }
                              acc[key].hours += detail.hours;
                              acc[key].wage += detail.daily_wage;
                              return acc;
                            }, {} as { [key: string]: { hours: number; wage: number } });

                            return Object.entries(hourlyDetails || {}).map(([rate, data]) => 
                              `${rate.toLocaleString()}원: ${data.hours}시간 = ${data.wage.toLocaleString()}원`
                            ).join(', ');
                          })()}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-600">일별 상세:</span>
                      <span className="font-medium text-gray-800">
                        {payslipData.daily_details?.length || 0}일 근무
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
                {/* 새로운 필드 구조로 표시 */}
                {payslipData.fuel_allowance && payslipData.fuel_allowance > 0 && (
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">주유대</span>
                    <span className="font-medium">{payslipData.fuel_allowance.toLocaleString()}원</span>
                  </div>
                )}
                {payslipData.additional_work && payslipData.additional_work > 0 && (
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">추가근무</span>
                    <span className="font-medium">{payslipData.additional_work.toLocaleString()}원</span>
                  </div>
                )}
                {payslipData.weekly_holiday_pay && payslipData.weekly_holiday_pay > 0 && (
                  <div className="py-2 border-b">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">주휴수당</span>
                      <span className="font-medium">{payslipData.weekly_holiday_pay.toLocaleString()}원</span>
                    </div>
                    {payslipData.weeklyHolidayCalculation && (
                      <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                        <div className="font-medium mb-1">산출 식:</div>
                        <pre className="whitespace-pre-wrap">{payslipData.weeklyHolidayCalculation}</pre>
                      </div>
                    )}
                  </div>
                )}
                {payslipData.transportation_allowance && payslipData.transportation_allowance > 0 && (
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">교통비</span>
                    <span className="font-medium">{payslipData.transportation_allowance.toLocaleString()}원</span>
                  </div>
                )}
                {payslipData.performance_bonus && payslipData.performance_bonus > 0 && (
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">성과급</span>
                    <span className="font-medium">{payslipData.performance_bonus.toLocaleString()}원</span>
                  </div>
                )}
                {/* 기존 필드 (하위 호환성) */}
                {payslipData.overtime_pay > 0 && !payslipData.additional_work && !payslipData.weekly_holiday_pay && (
                  <div className="py-2 border-b">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">시간외 근무</span>
                      <span className="font-medium">{payslipData.overtime_pay.toLocaleString()}원</span>
                    </div>
                  </div>
                )}
                {payslipData.meal_allowance > 0 && (
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-gray-600">식대</span>
                    <span className="font-medium">{payslipData.meal_allowance.toLocaleString()}원</span>
                  </div>
                )}
                {payslipData.incentive > 0 && !payslipData.fuel_allowance && !payslipData.performance_bonus && (
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

            {/* 일별 상세 리스트 */}
            {payslipData.daily_details && payslipData.daily_details.length > 0 && (
              <div className="border-t pt-6 mt-6">
                <h3 className="text-md font-medium text-gray-900 mb-4">일별 상세 내역</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-2">
                    {payslipData.daily_details.map((detail, index) => (
                      <div key={index} className="flex justify-between items-center py-2 px-3 bg-white rounded border">
                        <div className="flex items-center space-x-4">
                          <span className="text-sm font-medium text-gray-900">
                            {new Date(detail.date).toLocaleDateString('ko-KR', { 
                              month: 'long', 
                              day: 'numeric',
                              weekday: 'short'
                            })}
                          </span>
                          <span className="text-sm text-gray-600">
                            {detail.hours}시간
                          </span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-600">
                            {detail.hourly_rate.toLocaleString()}원/시간
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {detail.daily_wage.toLocaleString()}원
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

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
                      <span className="text-sm text-gray-700">시급 적용 확인 (데이터베이스 기준)</span>
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
                      <span className="text-sm text-gray-700">주휴수당 확인</span>
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

        {/* 관리자 상세 보기 모달 */}
        {selectedPayslipForDetails && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
              {/* 모달 닫기 버튼 */}
              <div className="flex justify-end mb-4">
                <button
                  onClick={() => setSelectedPayslipForDetails(null)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              
              <div className="mt-3">
                {/* 정산서 헤더 */}
                <div className="text-center border-b pb-4 mb-6">
                  <h1 className="text-2xl font-bold text-gray-900">MASLABS 급여 명세서 (관리자용)</h1>
                  <h2 className="text-lg text-gray-600 mt-2">{selectedPayslipForDetails.period}</h2>
                </div>

                {/* 직원 정보 */}
                <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-sm text-gray-500">직원명</div>
                    <div className="font-medium">{selectedPayslipForDetails.employees?.name || '정보 없음'}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-500">정산기간</div>
                    <div className="font-medium">{formatSalaryPeriod(selectedPayslipForDetails.period, selectedPayslipForDetails.daily_details)}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-500">고용형태</div>
                    <div className="font-medium">
                      {selectedPayslipForDetails.employment_type === 'part_time' ? '파트타임' : '정규직'}
                    </div>
                  </div>
                </div>

                {/* 발행일/지급일 편집 섹션 */}
                <div className="bg-blue-50 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">발행일/지급일 관리</h3>
                    <button
                      onClick={() => setEditingDates(!editingDates)}
                      className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                    >
                      {editingDates ? '취소' : '편집'}
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        발행일
                      </label>
                      {editingDates ? (
                        <input
                          type="date"
                          value={editIssuedDate}
                          onChange={(e) => setEditIssuedDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <div className="px-3 py-2 bg-white border border-gray-300 rounded-lg">
                          {selectedPayslipForDetails.issued_at 
                            ? new Date(selectedPayslipForDetails.issued_at).toLocaleDateString('ko-KR')
                            : '미발행'
                          }
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        지급일
                      </label>
                      {editingDates ? (
                        <input
                          type="date"
                          value={editPaidDate}
                          onChange={(e) => setEditPaidDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <div className="px-3 py-2 bg-white border border-gray-300 rounded-lg">
                          {selectedPayslipForDetails.paid_at 
                            ? new Date(selectedPayslipForDetails.paid_at).toLocaleDateString('ko-KR')
                            : '미지급'
                          }
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {editingDates && (
                    <div className="mt-4 flex justify-end">
                      <button
                        onClick={updatePayslipDates}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        날짜 저장
                      </button>
                    </div>
                  )}
                </div>

                {/* 급여 요약 */}
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-blue-900 mb-3">지급 내역</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>기본급</span>
                        <span>{(selectedPayslipForDetails.base_salary || 0).toLocaleString()}원</span>
                      </div>
                      {(selectedPayslipForDetails.fuel_allowance || 0) > 0 && (
                        <div className="flex justify-between">
                          <span>주유대</span>
                          <span>{(selectedPayslipForDetails.fuel_allowance || 0).toLocaleString()}원</span>
                        </div>
                      )}
                      {(selectedPayslipForDetails.additional_work || 0) > 0 && (
                        <div className="flex justify-between">
                          <span>추가근무</span>
                          <span>{(selectedPayslipForDetails.additional_work || 0).toLocaleString()}원</span>
                        </div>
                      )}
                      {(selectedPayslipForDetails.weekly_holiday_pay || 0) > 0 && (
                        <div className="flex justify-between">
                          <span>주휴수당</span>
                          <span>{(selectedPayslipForDetails.weekly_holiday_pay || 0).toLocaleString()}원</span>
                        </div>
                      )}
                      {(selectedPayslipForDetails.overtime_pay || 0) > 0 && !selectedPayslipForDetails.weekly_holiday_pay && (
                        <div className="flex justify-between">
                          <span>주휴수당</span>
                          <span>{(selectedPayslipForDetails.overtime_pay || 0).toLocaleString()}원</span>
                        </div>
                      )}
                      {(selectedPayslipForDetails.meal_allowance || 0) > 0 && (
                        <div className="flex justify-between">
                          <span>식대</span>
                          <span>{(selectedPayslipForDetails.meal_allowance || 0).toLocaleString()}원</span>
                        </div>
                      )}
                      {(selectedPayslipForDetails.incentive || 0) > 0 && (
                        <div className="flex justify-between">
                          <span>인센티브</span>
                          <span>{(selectedPayslipForDetails.incentive || 0).toLocaleString()}원</span>
                        </div>
                      )}
                      {(selectedPayslipForDetails.point_bonus || 0) > 0 && (
                        <div className="flex justify-between">
                          <span>포인트 보너스</span>
                          <span>{(selectedPayslipForDetails.point_bonus || 0).toLocaleString()}원</span>
                        </div>
                      )}
                      {(selectedPayslipForDetails.performance_bonus || 0) > 0 && (
                        <div className="flex justify-between">
                          <span>성과급</span>
                          <span>{(selectedPayslipForDetails.performance_bonus || 0).toLocaleString()}원</span>
                        </div>
                      )}
                      <div className="border-t pt-2 font-semibold flex justify-between">
                        <span>총 지급액</span>
                        <span>{(selectedPayslipForDetails.total_earnings || 0).toLocaleString()}원</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold text-green-900 mb-3">공제 내역</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>세금 (3.3%)</span>
                        <span>{(selectedPayslipForDetails.tax_amount || 0).toLocaleString()}원</span>
                      </div>
                      <div className="border-t pt-2 font-semibold flex justify-between text-green-700">
                        <span>실수령액</span>
                        <span>{(selectedPayslipForDetails.net_salary || 0).toLocaleString()}원</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 근무 정보 */}
                <div className="bg-gray-50 p-4 rounded-lg mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">근무 정보</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <span className="text-sm text-gray-500">총 근무시간</span>
                      <div className="font-medium">{selectedPayslipForDetails.total_hours || 0}시간</div>
                    </div>
                    {selectedPayslipForDetails.employee_name !== '나수진' && (
                      <div>
                        <span className="text-sm text-gray-500">시급</span>
                        <div className="font-medium">{(selectedPayslipForDetails.hourly_rate || 0).toLocaleString()}원/시간</div>
                      </div>
                    )}
                    <div>
                      <span className="text-sm text-gray-500">상태</span>
                      <div className="font-medium">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          selectedPayslipForDetails.status === 'generated' ? 'bg-yellow-100 text-yellow-800' :
                          selectedPayslipForDetails.status === 'issued' ? 'bg-blue-100 text-blue-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {selectedPayslipForDetails.status === 'generated' ? '생성됨' :
                           selectedPayslipForDetails.status === 'issued' ? '발행됨' : '지급완료'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 시급별 계산 상세 */}
                {selectedPayslipForDetails.daily_details && selectedPayslipForDetails.daily_details.length > 0 && (
                  <div className="bg-white border rounded-lg p-4 mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">시급별 계산 상세</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="text-sm text-gray-700">
                        {(() => {
                          try {
                            const hourlyDetails = selectedPayslipForDetails.daily_details?.reduce((acc: any, detail: any) => {
                              // 안전한 데이터 접근
                              const hourlyRate = detail.hourly_rate || detail.hourly_wage || 0;
                              const hours = detail.hours || 0;
                              const dailyWage = detail.daily_wage || 0;
                              
                              const key = hourlyRate.toString();
                              if (!acc[key]) {
                                acc[key] = { hours: 0, wage: 0 };
                              }
                              acc[key].hours += hours;
                              acc[key].wage += dailyWage;
                              return acc;
                            }, {} as { [key: string]: { hours: number; wage: number } });

                            return Object.entries(hourlyDetails || {}).map(([rate, data]: [string, any]) =>
                              `${parseInt(rate).toLocaleString()}원: ${data.hours}시간 = ${data.wage.toLocaleString()}원`
                            ).join(', ');
                          } catch (error) {
                            console.error('시급별 계산 오류:', error);
                            return '시급별 계산 정보를 불러올 수 없습니다.';
                          }
                        })()}
                      </div>
                    </div>
                  </div>
                )}

                {/* 일별 상세 내역 */}
                {selectedPayslipForDetails.daily_details && selectedPayslipForDetails.daily_details.length > 0 && (
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
                          {selectedPayslipForDetails.daily_details.map((detail: any, index: number) => {
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
                                    {(detail.hourly_rate || detail.hourly_wage || 0).toLocaleString()}원
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {(detail.daily_wage || 0).toLocaleString()}원
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

                {/* 모달 하단 버튼들 */}
                <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
                  <div className="flex space-x-3">
                    <button
                      onClick={() => printSavedPayslip(selectedPayslipForDetails)}
                      className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
                    >
                      기본 출력/인쇄
                    </button>
                    <button
                      onClick={() => printDetailedSavedPayslip(selectedPayslipForDetails)}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                    >
                      상세 출력/인쇄
                    </button>
                    <button
                      onClick={() => printSavedPayslipWithInsurance(selectedPayslipForDetails)}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                    >
                      4대보험 포함
                    </button>
                    <button
                      onClick={() => printSavedPayslipBusinessIncomeOnly(selectedPayslipForDetails)}
                      className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm"
                    >
                      사업소득세만
                    </button>
                    {selectedPayslipForDetails.status === 'generated' && (
                      <button
                        onClick={async () => {
                          try {
                            const { error } = await supabase
                              .from('payslips')
                              .update({ 
                                status: 'issued',
                                issued_at: new Date().toISOString()
                              })
                              .eq('id', selectedPayslipForDetails.id);

                            if (error) {
                              throw error;
                            }

                            // 상태 업데이트
                            setSelectedPayslipForDetails((prev: any) => prev ? { ...prev, status: 'issued' } : null);
                            await loadSavedPayslips();
                            alert('급여 명세서가 발행되었습니다.');
                          } catch (error) {
                            console.error('발행 실패:', error);
                            alert('발행에 실패했습니다.');
                          }
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        발행
                      </button>
                    )}
                    {selectedPayslipForDetails.status === 'issued' && (
                      <button
                        onClick={async () => {
                          try {
                            const { error } = await supabase
                              .from('payslips')
                              .update({ 
                                status: 'paid',
                                paid_at: new Date().toISOString()
                              })
                              .eq('id', selectedPayslipForDetails.id);

                            if (error) {
                              throw error;
                            }

                            // 상태 업데이트
                            setSelectedPayslipForDetails((prev: any) => prev ? { ...prev, status: 'paid' } : null);
                            await loadSavedPayslips();
                            alert('급여 지급이 완료되었습니다.');
                          } catch (error) {
                            console.error('지급 완료 실패:', error);
                            alert('지급 완료 처리에 실패했습니다.');
                          }
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        지급 완료
                      </button>
                    )}
                    <button
                      onClick={() => deletePayslip(selectedPayslipForDetails.id, selectedPayslipForDetails.employees?.name || '알 수 없음', selectedPayslipForDetails.period)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                  <button
                    onClick={() => setSelectedPayslipForDetails(null)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    닫기
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 연봉계약 전환 모달 */}
        {showContractChangeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold mb-4">연봉계약 전환</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">직원명</label>
                  <input
                    type="text"
                    value={contractChangeData.employee_name}
                    readOnly
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">현재 계약 유형</label>
                  <input
                    type="text"
                    value={contractChangeData.current_contract === 'hourly' ? '일급계약' : '월급계약'}
                    readOnly
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">새 계약 유형</label>
                  <input
                    type="text"
                    value="연봉계약"
                    readOnly
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">적용일</label>
                  <input
                    type="date"
                    value={contractChangeData.effective_date}
                    onChange={(e) => setContractChangeData({
                      ...contractChangeData,
                      effective_date: e.target.value
                    })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">연봉 (원)</label>
                  <input
                    type="number"
                    value={contractChangeData.annual_salary}
                    onChange={(e) => setContractChangeData({
                      ...contractChangeData,
                      annual_salary: parseInt(e.target.value),
                      monthly_salary: Math.round(parseInt(e.target.value) / 12)
                    })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">월급 (원)</label>
                  <input
                    type="number"
                    value={contractChangeData.monthly_salary}
                    readOnly
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 bg-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">식대 (원)</label>
                  <input
                    type="number"
                    value={contractChangeData.meal_allowance}
                    onChange={(e) => setContractChangeData({
                      ...contractChangeData,
                      meal_allowance: parseInt(e.target.value)
                    })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="includes_weekly_holiday"
                    checked={contractChangeData.includes_weekly_holiday}
                    onChange={(e) => setContractChangeData({
                      ...contractChangeData,
                      includes_weekly_holiday: e.target.checked
                    })}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="includes_weekly_holiday" className="ml-2 block text-sm text-gray-900">
                    주휴수당 포함
                  </label>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">계약 조건 요약</h4>
                  <div className="text-sm text-blue-800 space-y-1">
                    <p>• 연봉: {contractChangeData.annual_salary.toLocaleString()}원</p>
                    <p>• 월급: {contractChangeData.monthly_salary.toLocaleString()}원</p>
                    <p>• 식대: {contractChangeData.meal_allowance.toLocaleString()}원</p>
                    <p>• 주휴수당: {contractChangeData.includes_weekly_holiday ? '포함' : '별도'}</p>
                    <p>• 근무시간: 주 5일, 일 7시간 (35시간/주)</p>
                    <p>• 적용일: {contractChangeData.effective_date}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowContractChangeModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={async () => {
                    try {
                      const { error } = await supabase
                        .from('employees')
                        .update({
                          employment_type: 'full_time',
                          monthly_salary: contractChangeData.monthly_salary,
                          salary_structure: {
                            contract_type: 'annual',
                            base_salary: contractChangeData.monthly_salary,
                            meal_allowance: contractChangeData.meal_allowance,
                            includes_weekly_holiday: contractChangeData.includes_weekly_holiday,
                            work_schedule: contractChangeData.work_schedule,
                            effective_date: contractChangeData.effective_date
                          }
                        })
                        .eq('id', contractChangeData.employee_id);

                      if (error) {
                        console.error('계약 변경 실패:', error);
                        alert('계약 변경에 실패했습니다.');
                        return;
                      }

                      alert(`${contractChangeData.employee_name} 직원의 계약이 연봉계약으로 변경되었습니다.`);
                      setShowContractChangeModal(false);
                      loadEmployees(); // 직원 목록 새로고침
                    } catch (error) {
                      console.error('계약 변경 중 오류:', error);
                      alert('계약 변경 중 오류가 발생했습니다.');
                    }
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  계약 변경 실행
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}