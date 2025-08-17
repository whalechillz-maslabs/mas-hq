'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Upload, Download, Users, CheckCircle, AlertCircle } from 'lucide-react';

interface EmployeeData {
  employee_id?: string;
  email: string;
  name: string;
  phone: string;
  department: string;
  position: string;
  role: string;
  hire_date: string;
  employment_type: 'full_time' | 'part_time' | 'contract';
  monthly_salary?: number;
  hourly_rate?: number;
  birth_date?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  bank_name?: string;
  bank_account_number?: string;
  bank_account_holder?: string;
}

export default function EmployeeMigrationPage() {
  const [file, setFile] = useState<File | null>(null);
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/csv') {
      setFile(file);
      parseCSV(file);
    } else {
      setMessage('CSV 파일만 업로드 가능합니다.');
      setMessageType('error');
    }
  };

  const parseCSV = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      const parsedEmployees: EmployeeData[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(',').map(v => v.trim());
          const employee: Record<string, string> = {};
          
          headers.forEach((header, index) => {
            employee[header] = values[index] || '';
          });
          
          parsedEmployees.push(employee as unknown as EmployeeData);
        }
      }
      
      setEmployees(parsedEmployees);
      setMessage(`${parsedEmployees.length}명의 직원 데이터가 로드되었습니다.`);
      setMessageType('success');
    };
    reader.readAsText(file);
  };

  const downloadTemplate = () => {
    const template = `email,name,phone,department,position,role,hire_date,employment_type,monthly_salary,hourly_rate,birth_date,address,emergency_contact_name,emergency_contact_phone,emergency_contact_relationship,bank_name,bank_account_number,bank_account_holder
admin@maslabs.kr,홍길동,010-1234-5678,본사,대표이사,admin,2024-01-01,full_time,5000000,,1990-01-01,서울시 강남구,김부모,010-9876-5432,부모,신한은행,110-123-456789,홍길동
employee@maslabs.kr,김철수,010-2345-6789,개발팀,사원,employee,2024-02-01,full_time,3000000,,1995-05-15,서울시 서초구,이부모,010-8765-4321,부모,국민은행,123-456-789012,김철수`;
    
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employee_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const migrateEmployees = async () => {
    if (employees.length === 0) {
      setMessage('마이그레이션할 직원 데이터가 없습니다.');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    setMessage('직원 데이터를 마이그레이션 중입니다...');
    setMessageType('info');

    try {
      let successCount = 0;
      let errorCount = 0;

      for (const employeeData of employees) {
        try {
          // 부서 ID 조회
          const { data: deptData } = await supabase
            .from('departments')
            .select('id')
            .eq('name', employeeData.department)
            .single();

          // 직급 ID 조회
          const { data: posData } = await supabase
            .from('positions')
            .select('id')
            .eq('name', employeeData.position)
            .single();

          // 역할 ID 조회
          const { data: roleData } = await supabase
            .from('roles')
            .select('id')
            .eq('name', employeeData.role)
            .single();

          // 직원 데이터 준비
          const employeeRecord = {
            email: employeeData.email,
            name: employeeData.name,
            phone: employeeData.phone,
            department_id: deptData?.id,
            position_id: posData?.id,
            role_id: roleData?.id,
            hire_date: employeeData.hire_date,
            employment_type: employeeData.employment_type,
            monthly_salary: employeeData.monthly_salary ? parseFloat(employeeData.monthly_salary.toString()) : null,
            hourly_rate: employeeData.hourly_rate ? parseFloat(employeeData.hourly_rate.toString()) : null,
            birth_date: employeeData.birth_date || null,
            address: employeeData.address || null,
            emergency_contact: employeeData.emergency_contact_name ? {
              name: employeeData.emergency_contact_name,
              phone: employeeData.emergency_contact_phone,
              relationship: employeeData.emergency_contact_relationship
            } : null,
            bank_account: employeeData.bank_name ? {
              bank_name: employeeData.bank_name,
              account_number: employeeData.bank_account_number,
              account_holder: employeeData.bank_account_holder
            } : null,
            status: 'active',
            is_active: true
          };

          // 직원 데이터 삽입
          const { error } = await supabase
            .from('employees')
            .insert(employeeRecord);

          if (error) {
            console.error('직원 삽입 오류:', error);
            errorCount++;
          } else {
            successCount++;
          }
        } catch (error) {
          console.error('개별 직원 처리 오류:', error);
          errorCount++;
        }
      }

      setMessage(`마이그레이션 완료: ${successCount}명 성공, ${errorCount}명 실패`);
      setMessageType(errorCount > 0 ? 'error' : 'success');
      
      if (successCount > 0) {
        setEmployees([]);
        setFile(null);
      }
    } catch (error) {
      console.error('마이그레이션 오류:', error);
      setMessage('마이그레이션 중 오류가 발생했습니다.');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  const getMessageIcon = () => {
    switch (messageType) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">직원 데이터 마이그레이션</h1>
          <p className="text-gray-600">CSV 파일을 업로드하여 직원 데이터를 일괄 등록할 수 있습니다.</p>
        </div>

        {/* 메시지 */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg border ${
            messageType === 'success' ? 'bg-green-50 border-green-200' :
            messageType === 'error' ? 'bg-red-50 border-red-200' :
            'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-center">
              {getMessageIcon()}
              <span className="ml-2">{message}</span>
            </div>
          </div>
        )}

        {/* 템플릿 다운로드 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">1. 템플릿 다운로드</h2>
          <p className="text-gray-600 mb-4">
            CSV 템플릿을 다운로드하여 직원 정보를 입력하세요.
          </p>
          <button
            onClick={downloadTemplate}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            <Download className="w-4 h-4 mr-2" />
            템플릿 다운로드
          </button>
        </div>

        {/* 파일 업로드 */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">2. CSV 파일 업로드</h2>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="hidden"
              id="csv-upload"
            />
            <label
              htmlFor="csv-upload"
              className="cursor-pointer inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              CSV 파일 선택
            </label>
            <p className="text-sm text-gray-500 mt-2">
              {file ? `선택된 파일: ${file.name}` : 'CSV 파일을 선택하세요'}
            </p>
          </div>
        </div>

        {/* 데이터 미리보기 */}
        {employees.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              3. 데이터 미리보기 ({employees.length}명)
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      이름
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      이메일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      전화번호
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      부서
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      직급
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      고용형태
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {employees.slice(0, 5).map((employee, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {employee.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {employee.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {employee.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {employee.department}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {employee.position}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {employee.employment_type}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {employees.length > 5 && (
                <p className="text-sm text-gray-500 mt-2">
                  ... 외 {employees.length - 5}명 더
                </p>
              )}
            </div>
          </div>
        )}

        {/* 마이그레이션 실행 */}
        {employees.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">4. 마이그레이션 실행</h2>
            <p className="text-gray-600 mb-4">
              위 데이터를 데이터베이스에 등록하시겠습니까?
            </p>
            <button
              onClick={migrateEmployees}
              disabled={isLoading}
              className={`inline-flex items-center px-6 py-3 rounded-md text-white font-medium ${
                isLoading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              }`}
            >
              <Users className="w-4 h-4 mr-2" />
              {isLoading ? '처리 중...' : '마이그레이션 실행'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
