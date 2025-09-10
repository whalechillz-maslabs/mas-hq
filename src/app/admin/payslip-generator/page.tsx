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
  employment_type: string;
  monthly_salary?: number;
  hourly_rate?: number;
}

interface PayslipData {
  employee_id: string;
  employee_name: string;
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

  useEffect(() => {
    loadEmployees();
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
      const hours = (end - start) / (1000 * 60 * 60); // 스케줄 자체가 점심시간 제외된 순 근무시간
      
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
      const { error } = await supabase
        .from('payslips')
        .update({ 
          status: 'issued',
          issued_at: new Date().toISOString()
        })
        .eq('employee_id', payslipData.employee_id)
        .eq('salary_period', payslipData.salary_period);

      if (error) {
        throw error;
      }

      setPayslipData(prev => prev ? { ...prev, status: 'issued' } : null);
      alert('급여 명세서가 발행되었습니다.');
    } catch (error) {
      console.error('급여 명세서 발행 실패:', error);
      alert('급여 명세서 발행에 실패했습니다.');
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
        .eq('salary_period', payslipData.salary_period);

      if (error) {
        throw error;
      }

      setPayslipData(prev => prev ? { ...prev, status: 'paid' } : null);
      alert('급여 지급이 완료되었습니다.');
    } catch (error) {
      console.error('급여 지급 처리 실패:', error);
      alert('급여 지급 처리에 실패했습니다.');
    }
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
            <div className="flex justify-center pt-4">
              <button
                onClick={generatePayslip}
                disabled={!selectedEmployee || generating}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {generating ? '생성 중...' : `${selectedYear}년 ${selectedMonth}월 급여 명세서 생성`}
              </button>
            </div>
          </div>
        </div>

        {/* 급여 명세서 */}
        {payslipData && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">급여 명세서</h2>
              <div className="flex gap-2">
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
                    <span className="text-gray-600">직원 ID:</span>
                    <span className="font-medium">{payslipData.employee_id}</span>
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