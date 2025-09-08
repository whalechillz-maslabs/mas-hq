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
  department: string;
  position: string;
  employment_type: string;
  monthly_salary: number;
  hourly_rate: number;
}

interface PayslipData {
  employee_id: string;
  employee_name: string;
  payment_date: string;
  salary_period: string;
  base_salary: number;
  overtime_pay: number;
  incentive: number;
  point_bonus: number;
  total_earnings: number;
  tax_amount: number;
  net_salary: number;
  status: string;
}

export default function PayslipGenerator() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
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
      const { data, error } = await supabase
        .from('employees')
        .select(`
          id,
          name,
          employee_id,
          department,
          position,
          employment_type,
          monthly_salary,
          hourly_rate
        `)
        .order('name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('직원 목록 로드 실패:', error);
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

      // 현재 날짜 기준으로 급여 데이터 생성
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth() + 1;
      const currentYear = currentDate.getFullYear();
      
      // 기본 급여 계산
      const baseSalary = employee.monthly_salary || 0;
      const overtimePay = Math.floor(baseSalary * 0.1); // 기본급의 10%
      const incentive = Math.floor(baseSalary * 0.05); // 기본급의 5%
      const pointBonus = 0; // 포인트 보너스는 별도 계산
      
      const totalEarnings = baseSalary + overtimePay + incentive + pointBonus;
      const taxAmount = Math.floor(totalEarnings * 0.033); // 3.3% 사업소득세
      const netSalary = totalEarnings - taxAmount;

      const payslip: PayslipData = {
        employee_id: employee.employee_id,
        employee_name: employee.name,
        payment_date: currentDate.toISOString().split('T')[0],
        salary_period: `${currentYear}년 ${currentMonth}월`,
        base_salary: baseSalary,
        overtime_pay: overtimePay,
        incentive: incentive,
        point_bonus: pointBonus,
        total_earnings: totalEarnings,
        tax_amount: taxAmount,
        net_salary: netSalary,
        status: 'generated'
      };

      setPayslipData(payslip);
    } catch (error) {
      console.error('급여 명세서 생성 실패:', error);
      alert('급여 명세서 생성에 실패했습니다.');
    } finally {
      setGenerating(false);
    }
  };

  const handleCheckChange = (checkName: keyof typeof checks) => {
    setChecks(prev => ({
      ...prev,
      [checkName]: !prev[checkName]
    }));
  };

  const issuePayslip = async () => {
    if (!payslipData) return;

    // 모든 체크 항목이 완료되었는지 확인
    const allChecked = Object.values(checks).every(check => check);
    if (!allChecked) {
      alert('모든 체크 항목을 완료해주세요.');
      return;
    }

    try {
      setGenerating(true);
      
      // 급여 데이터를 데이터베이스에 저장
      const { error: salaryError } = await supabase
        .from('salaries')
        .insert({
          employee_id: selectedEmployee,
          payment_date: payslipData.payment_date,
          base_salary: payslipData.base_salary,
          overtime_pay: payslipData.overtime_pay,
          incentive: payslipData.incentive,
          deduction_amount: payslipData.tax_amount,
          net_salary: payslipData.net_salary,
          status: 'paid'
        });

      if (salaryError) throw salaryError;

      alert('급여 명세서가 성공적으로 발행되었습니다!');
      router.push('/admin/employee-management');
    } catch (error) {
      console.error('급여 명세서 발행 실패:', error);
      alert('급여 명세서 발행에 실패했습니다.');
    } finally {
      setGenerating(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">급여 명세서 생성</h1>
              <p className="text-gray-600 mt-1">직원의 급여 명세서를 생성하고 발행합니다</p>
            </div>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              뒤로가기
            </button>
          </div>
        </div>

        {/* 직원 선택 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">직원 선택</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                직원 선택
              </label>
              <select
                value={selectedEmployee}
                onChange={(e) => setSelectedEmployee(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={loading}
              >
                <option value="">직원을 선택하세요</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.id}>
                    {employee.name} ({employee.employee_id}) - {employee.department}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={generatePayslip}
                disabled={!selectedEmployee || generating}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {generating ? '생성 중...' : '급여 명세서 생성'}
              </button>
            </div>
          </div>
        </div>

        {/* 급여 명세서 미리보기 */}
        {payslipData && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">급여 명세서 미리보기</h2>
            
            {/* 급여 정보 카드 */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">💰 급여 정보</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-4 border">
                  <div className="text-sm text-gray-600">기본급</div>
                  <div className="text-xl font-bold text-gray-900">
                    {formatCurrency(payslipData.base_salary)}원
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 border">
                  <div className="text-sm text-gray-600">연장수당</div>
                  <div className="text-xl font-bold text-gray-900">
                    {formatCurrency(payslipData.overtime_pay)}원
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 border">
                  <div className="text-sm text-gray-600">인센티브</div>
                  <div className="text-xl font-bold text-gray-900">
                    {formatCurrency(payslipData.incentive)}원
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 border">
                  <div className="text-sm text-gray-600">포인트 보너스</div>
                  <div className="text-xl font-bold text-gray-900">
                    {formatCurrency(payslipData.point_bonus)}원
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 border">
                  <div className="text-sm text-gray-600">총 수입</div>
                  <div className="text-xl font-bold text-green-600">
                    {formatCurrency(payslipData.total_earnings)}원
                  </div>
                </div>
                <div className="bg-white rounded-lg p-4 border">
                  <div className="text-sm text-gray-600">세금 (3.3%)</div>
                  <div className="text-xl font-bold text-red-600">
                    -{formatCurrency(payslipData.tax_amount)}원
                  </div>
                </div>
              </div>
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-sm text-gray-600">실수령액</div>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(payslipData.net_salary)}원
                </div>
              </div>
            </div>

            {/* 체크리스트 */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">✅ 발행 전 체크리스트</h3>
              <div className="space-y-3">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checks.baseSalary}
                    onChange={() => handleCheckChange('baseSalary')}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700">기본급 금액 확인 ({formatCurrency(payslipData.base_salary)}원)</span>
                </label>
                
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checks.overtimePay}
                    onChange={() => handleCheckChange('overtimePay')}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700">연장수당 확인 ({formatCurrency(payslipData.overtime_pay)}원)</span>
                </label>
                
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checks.incentive}
                    onChange={() => handleCheckChange('incentive')}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700">인센티브 확인 ({formatCurrency(payslipData.incentive)}원)</span>
                </label>
                
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checks.pointBonus}
                    onChange={() => handleCheckChange('pointBonus')}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700">포인트 보너스 확인 ({formatCurrency(payslipData.point_bonus)}원)</span>
                </label>
                
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checks.taxCalculation}
                    onChange={() => handleCheckChange('taxCalculation')}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700">세금 계산 확인 (3.3% 사업소득세: {formatCurrency(payslipData.tax_amount)}원)</span>
                </label>
                
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checks.netSalary}
                    onChange={() => handleCheckChange('netSalary')}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700">실수령액 확인 ({formatCurrency(payslipData.net_salary)}원)</span>
                </label>
                
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checks.finalReview}
                    onChange={() => handleCheckChange('finalReview')}
                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-gray-700">최종 검토 완료</span>
                </label>
              </div>
            </div>

            {/* 발행 버튼 */}
            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={() => {
                  setPayslipData(null);
                  setChecks({
                    baseSalary: false,
                    overtimePay: false,
                    incentive: false,
                    pointBonus: false,
                    taxCalculation: false,
                    netSalary: false,
                    finalReview: false
                  });
                }}
                className="px-6 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={issuePayslip}
                disabled={generating || !Object.values(checks).every(check => check)}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {generating ? '발행 중...' : '급여 명세서 발행'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
