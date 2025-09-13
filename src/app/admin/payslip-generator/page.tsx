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
      const period = `${year}-${month.toString().padStart(2, '0')}`;
      
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
        alert(`이미 ${period} 기간의 급여명세서가 존재합니다. (상태: ${statusText})\n\n발행된 급여명세서 목록에서 확인해주세요.`);
        return;
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

    // 시급 정보 조회
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
      const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60); // 스케줄 자체가 점심시간 제외된 순 근무시간
      
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
      
      // 해당 날짜에 적용되는 시급 찾기 (명확한 기간 기반)
      const applicableWages = wages.filter(wage => {
        const startDate = new Date(wage.effective_start_date);
        const endDate = wage.effective_end_date ? new Date(wage.effective_end_date) : null;
        
        // 시작일이 해당 날짜보다 이전이고, 종료일이 없거나 해당 날짜보다 이후인 경우
        return startDate <= scheduleDate && (!endDate || endDate >= scheduleDate);
      });
      
      // 가장 최근에 시작된 시급 선택 (기간이 명확한 경우)
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
      hourly_rate: wages[wages.length - 1].base_wage, // 최신 시급
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

  // 분할 생성 함수
  const generateCustomPeriodPayslip = async (employee: Employee, startDate: string, endDate: string, periodName: string) => {
    if (employee.employment_type !== 'part_time') {
      throw new Error('분할 생성은 시간제 직원만 가능합니다.');
    }

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

    // 시급 정보 조회
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

    // 일별 근무시간 계산
    const dailyHours: { [date: string]: number } = {};
    schedules.forEach(schedule => {
      if (schedule.total_hours && schedule.total_hours > 0) {
        dailyHours[schedule.schedule_date] = (dailyHours[schedule.schedule_date] || 0) + schedule.total_hours;
      }
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
      
      // 해당 날짜에 적용되는 시급 찾기 (명확한 기간 기반)
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

    // 세금 계산 (3.3%)
    const taxAmount = Math.round(totalWage * 0.033);
    const netSalary = totalWage - taxAmount;

    const payslip: PayslipData = {
      employee_id: employee.id,
      employee_name: employee.name,
      employee_code: employee.employee_id,
      employee_nickname: employee.nickname || employee.name,
      payment_date: new Date().toISOString().split('T')[0],
      salary_period: periodName, // 사용자가 입력한 정산서명 사용
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
        throw new Error(`이미 '${periodName}' 기간의 정산서가 존재합니다. 다른 이름을 사용해주세요.`);
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
    setSelectedPayslipForDetails(payslip);
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
            <div class="period">급여명세서 ${payslip.period}</div>
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
                  <span class="info-value">${payslip.period}</span>
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
            <div class="period">급여명세서 ${payslipData.salary_period}</div>
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
                    <span class="info-value">${payslipData.salary_period}</span>
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
                <span>연장수당</span>
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
                disabled={!selectedEmployee || generating || isDuplicatePeriod || (showCustomPeriod && (!customStartDate || !customEndDate || !customPeriodName))}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {generating ? '생성 중...' : 
                  isDuplicatePeriod ? 
                    `${selectedYear}년 ${selectedMonth}월 급여명세서 이미 존재` :
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                          <div className="flex space-x-2">
                            <button
                              onClick={() => printSavedPayslip(payslip)}
                              className="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700 transition-colors"
                            >
                              출력/인쇄
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
                    <div className="font-medium">{selectedPayslipForDetails.period}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-500">고용형태</div>
                    <div className="font-medium">
                      {selectedPayslipForDetails.employment_type === 'part_time' ? '파트타임' : '정규직'}
                    </div>
                  </div>
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
                      <div className="flex justify-between">
                        <span>연장근무수당</span>
                        <span>{(selectedPayslipForDetails.overtime_pay || 0).toLocaleString()}원</span>
                      </div>
                      <div className="flex justify-between">
                        <span>인센티브</span>
                        <span>{(selectedPayslipForDetails.incentive || 0).toLocaleString()}원</span>
                      </div>
                      <div className="flex justify-between">
                        <span>포인트 보너스</span>
                        <span>{(selectedPayslipForDetails.point_bonus || 0).toLocaleString()}원</span>
                      </div>
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
                    <div>
                      <span className="text-sm text-gray-500">시급</span>
                      <div className="font-medium">{(selectedPayslipForDetails.hourly_rate || 0).toLocaleString()}원/시간</div>
                    </div>
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
                          const hourlyDetails = selectedPayslipForDetails.daily_details?.reduce((acc: any, detail: any) => {
                            const key = detail.hourly_rate.toString();
                            if (!acc[key]) {
                              acc[key] = { hours: 0, wage: 0 };
                            }
                            acc[key].hours += detail.hours;
                            acc[key].wage += detail.daily_wage;
                            return acc;
                          }, {} as { [key: string]: { hours: number; wage: number } });

                          return Object.entries(hourlyDetails || {}).map(([rate, data]: [string, any]) =>
                            `${parseInt(rate).toLocaleString()}원: ${data.hours}시간 = ${data.wage.toLocaleString()}원`
                          ).join(', ');
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
                          {selectedPayslipForDetails.daily_details.map((detail: any, index: number) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {new Date(detail.date).toLocaleDateString('ko-KR', {
                                  month: 'long',
                                  day: 'numeric',
                                  weekday: 'short'
                                })}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {detail.hours}시간
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {(detail.hourly_rate || 0).toLocaleString()}원
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {(detail.daily_wage || 0).toLocaleString()}원
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}