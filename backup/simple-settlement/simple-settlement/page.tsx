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

export default function SimpleSettlement() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('employees')
        .select('id, name, employee_id, employment_type, monthly_salary, hourly_rate')
        .order('name');

      if (error) throw error;
      setEmployees(data || []);
    } catch (error) {
      console.error('직원 목록 로드 실패:', error);
      setResult('직원 목록 로드 실패: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const testSettlement = async () => {
    if (!selectedEmployee) {
      setResult('직원을 선택해주세요.');
      return;
    }

    try {
      setLoading(true);
      const employee = employees.find(emp => emp.id === selectedEmployee);
      if (!employee) {
        setResult('선택한 직원을 찾을 수 없습니다.');
        return;
      }

      let settlementInfo = `=== ${employee.name} 정산 정보 ===\n`;
      settlementInfo += `직원번호: ${employee.employee_id}\n`;
      settlementInfo += `고용형태: ${employee.employment_type}\n`;

      if (employee.employment_type === 'part_time' && employee.hourly_rate) {
        // 파트타임 정산
        const hourlyRate = employee.hourly_rate;
        const workHours = 5; // 예시: 5시간 근무
        const dailyWage = hourlyRate * workHours;
        
        settlementInfo += `시급: ${hourlyRate.toLocaleString()}원\n`;
        settlementInfo += `근무시간: ${workHours}시간\n`;
        settlementInfo += `일급: ${dailyWage.toLocaleString()}원\n`;
        
        // 주간 정산 (5일 근무 가정)
        const weeklyWage = dailyWage * 5;
        settlementInfo += `주급 (5일): ${weeklyWage.toLocaleString()}원\n`;
        
      } else if (employee.employment_type === 'full_time' && employee.monthly_salary) {
        // 정규직 정산
        const monthlySalary = employee.monthly_salary;
        const dailyWage = Math.floor(monthlySalary / 30);
        
        settlementInfo += `월급: ${monthlySalary.toLocaleString()}원\n`;
        settlementInfo += `일급: ${dailyWage.toLocaleString()}원\n`;
        
        // 연장수당 및 인센티브 계산
        const overtimePay = Math.floor(monthlySalary * 0.1);
        const incentive = Math.floor(monthlySalary * 0.05);
        const totalEarnings = monthlySalary + overtimePay + incentive;
        const tax = Math.floor(totalEarnings * 0.033);
        const netSalary = totalEarnings - tax;
        
        settlementInfo += `연장수당: ${overtimePay.toLocaleString()}원\n`;
        settlementInfo += `인센티브: ${incentive.toLocaleString()}원\n`;
        settlementInfo += `총 수입: ${totalEarnings.toLocaleString()}원\n`;
        settlementInfo += `세금 (3.3%): ${tax.toLocaleString()}원\n`;
        settlementInfo += `실수령액: ${netSalary.toLocaleString()}원\n`;
      } else {
        settlementInfo += '급여 정보가 설정되지 않았습니다.\n';
      }

      // 스케줄 정보 조회
      const { data: schedules, error: scheduleError } = await supabase
        .from('schedules')
        .select('schedule_date, scheduled_start, scheduled_end')
        .eq('employee_id', selectedEmployee)
        .gte('schedule_date', '2025-09-01')
        .lte('schedule_date', '2025-09-30')
        .order('schedule_date');

      if (!scheduleError && schedules) {
        settlementInfo += `\n=== 9월 스케줄 정보 ===\n`;
        settlementInfo += `총 스케줄 수: ${schedules.length}개\n`;
        
        if (schedules.length > 0) {
          settlementInfo += `첫 근무일: ${schedules[0].schedule_date}\n`;
          settlementInfo += `마지막 근무일: ${schedules[schedules.length - 1].schedule_date}\n`;
        }
      }

      setResult(settlementInfo);

    } catch (error) {
      console.error('정산 테스트 실패:', error);
      setResult('정산 테스트 실패: ' + error);
    } finally {
      setLoading(false);
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
              <h1 className="text-2xl font-bold text-gray-900">간단한 정산 테스트</h1>
              <p className="text-gray-600 mt-1">직원의 급여 정산을 테스트합니다</p>
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
                    {employee.name} ({employee.employee_id}) - {employee.employment_type}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={testSettlement}
                disabled={!selectedEmployee || loading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? '정산 중...' : '정산 테스트'}
              </button>
            </div>
          </div>
        </div>

        {/* 결과 표시 */}
        {result && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">정산 결과</h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono">
                {result}
              </pre>
            </div>
          </div>
        )}

        {/* 직원 목록 */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">직원 목록</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    이름
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    직원번호
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    고용형태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    월급
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    시급
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {employees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {employee.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.employee_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.employment_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.monthly_salary ? formatCurrency(employee.monthly_salary) + '원' : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.hourly_rate ? formatCurrency(employee.hourly_rate) + '원' : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
