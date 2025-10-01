'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, auth } from '@/lib/supabase';
import { 
  Users, UserPlus, UserCheck, Settings, Save, 
  Plus, Edit, Trash, Eye, Search, Filter, ArrowLeft, X, Key, RefreshCw, ExternalLink, CreditCard
} from 'lucide-react';

interface Employee {
  id: string;
  employee_id: string;
  name: string;
  phone: string;
  email?: string;
  birth_date?: string;
  department_id?: string;
  department_name?: string;
  position_id?: string;
  position_name?: string;
  role_id?: string;
  role_name?: string;
  hire_date: string;
  status: 'active' | 'inactive' | 'on_leave';
  monthly_salary?: number;
  hourly_rate?: number;
  password_hash?: string;
  pin_code?: string;
  user_meta?: {
    base_daily_wage?: number;
    fuel_allowance?: number;
    meal_allowance_rate?: number;
    work_days_per_week?: number;
    work_days_per_week_new?: number;
    change_date?: string;
    special_notes?: string;
  };
}

interface Department {
  id: string;
  name: string;
  code: string;
}

interface Position {
  id: string;
  name: string;
  level: number;
}

interface Role {
  id: string;
  name: string;
  description: string;
}

interface NewEmployee {
  name: string;
  phone: string;
  email: string;
  department_id: string;
  position_id: string;
  role_id: string;
  hire_date: string;
  status: 'active' | 'inactive' | 'on_leave';
  monthly_salary?: number;
  hourly_rate?: number;
}

export default function EmployeeManagementPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showBankAccountModal, setShowBankAccountModal] = useState(false);
  const [bankAccountData, setBankAccountData] = useState({
    bank_name: '',
    account_number: '',
    account_holder: ''
  });
  const [newEmployee, setNewEmployee] = useState<NewEmployee>({
    name: '',
    phone: '',
    email: '',
    department_id: '',
    position_id: '',
    role_id: '',
    hire_date: new Date().toISOString().split('T')[0],
    status: 'active',
    monthly_salary: undefined,
    hourly_rate: undefined
  });

  useEffect(() => {
    checkAuth();
    loadData();
  }, []);

  const checkAuth = async () => {
    const user = await auth.getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setCurrentUser(user);
  };

  const loadData = async () => {
    try {
      // 부서 데이터 로드
      const { data: deptData, error: deptError } = await supabase
        .from('departments')
        .select('*')
        .order('name');
      
      if (deptError) throw deptError;
      setDepartments(deptData || []);

      // 직급 데이터 로드
      const { data: posData, error: posError } = await supabase
        .from('positions')
        .select('*')
        .order('level');
      
      if (posError) throw posError;
      setPositions(posData || []);

      // 역할 데이터 로드
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('*')
        .order('name');
      
      if (roleError) throw roleError;
      setRoles(roleData || []);

      // 직원 데이터 로드 (패스워드와 핀번호 포함)
      const { data: empData, error: empError } = await supabase
        .from('employees')
        .select(`
          *,
          department:departments(name),
          position:positions(name),
          role:roles(name)
        `)
        .order('name');
      
      if (empError) throw empError;
      
      const formattedEmployees = (empData || []).map(emp => ({
        ...emp,
        department_name: emp.department?.name,
        position_name: emp.position?.name,
        role_name: emp.role?.name
      }));
      
      setEmployees(formattedEmployees);
      setIsLoading(false);
    } catch (error) {
      console.error('데이터 로드 오류:', error);
      setIsLoading(false);
    }
  };

  const generateEmployeeId = () => {
    const count = employees.length + 1;
    return `MASLABS-${count.toString().padStart(3, '0')}`;
  };

  const handleAddEmployee = () => {
    setNewEmployee({
      name: '',
      phone: '',
      email: '',
      department_id: '',
      position_id: '',
      role_id: '',
      hire_date: new Date().toISOString().split('T')[0],
      status: 'active',
      monthly_salary: undefined,
      hourly_rate: undefined
    });
    setShowAddModal(true);
  };

  const handleSaveNewEmployee = async () => {
    try {
      // 필수 필드 검증
      if (!newEmployee.name || !newEmployee.phone || !newEmployee.department_id || !newEmployee.position_id || !newEmployee.role_id) {
        alert('필수 정보를 모두 입력해주세요.');
        return;
      }

      const employeeId = generateEmployeeId();
      const defaultPassword = newEmployee.phone.replace(/\D/g, '').slice(-8);

      const { error } = await supabase
        .from('employees')
        .insert({
          employee_id: employeeId,
          name: newEmployee.name,
          phone: newEmployee.phone,
          email: newEmployee.email || null,
          department_id: newEmployee.department_id,
          position_id: newEmployee.position_id,
          role_id: newEmployee.role_id,
          hire_date: newEmployee.hire_date,
          status: newEmployee.status,
          monthly_salary: newEmployee.monthly_salary || null,
          hourly_rate: newEmployee.hourly_rate || null,
          password_hash: defaultPassword,
          pin_code: '1234',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setShowAddModal(false);
      loadData(); // 데이터 새로고침
      alert(`직원이 성공적으로 추가되었습니다.\n사번: ${employeeId}\n기본 비밀번호: ${defaultPassword}\n기본 핀번호: 1234`);
    } catch (error) {
      console.error('직원 추가 오류:', error);
      alert('직원 추가에 실패했습니다.');
    }
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setShowEditModal(true);
  };

  const handleSaveEmployee = async () => {
    if (!editingEmployee) return;

    try {
      const { error } = await supabase
        .from('employees')
        .update({
          department_id: editingEmployee.department_id,
          position_id: editingEmployee.position_id,
          role_id: editingEmployee.role_id,
          status: editingEmployee.status,
          birth_date: editingEmployee.birth_date,
          monthly_salary: editingEmployee.monthly_salary,
          hourly_rate: editingEmployee.hourly_rate,
          user_meta: editingEmployee.user_meta,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingEmployee.id);

      if (error) throw error;

      setShowEditModal(false);
      setEditingEmployee(null);
      loadData(); // 데이터 새로고침
      alert('직원 정보가 성공적으로 업데이트되었습니다.');
    } catch (error) {
      console.error('직원 정보 업데이트 오류:', error);
      alert('직원 정보 업데이트에 실패했습니다.');
    }
  };

  const handleDeleteEmployee = (employee: Employee) => {
    setDeletingEmployee(employee);
    setShowDeleteModal(true);
  };

  const confirmDeleteEmployee = async () => {
    if (!deletingEmployee) return;

    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', deletingEmployee.id);

      if (error) throw error;

      setShowDeleteModal(false);
      setDeletingEmployee(null);
      loadData(); // 데이터 새로고침
      alert('직원이 성공적으로 삭제되었습니다.');
    } catch (error) {
      console.error('직원 삭제 오류:', error);
      alert('직원 삭제에 실패했습니다.');
    }
  };

  const handleViewPassword = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowPasswordModal(true);
  };

  const handleResetPassword = (employee: Employee) => {
    setSelectedEmployee(employee);
    setShowResetModal(true);
  };

  const handleEditBankAccount = (employee: Employee) => {
    setSelectedEmployee(employee);
    
    // bank_account 필드 파싱 (형식: "은행명|계좌번호|예금주")
    let bankAccountInfo = {
      bank_name: '',
      account_number: '',
      account_holder: ''
    };
    
    if (employee.bank_account && typeof employee.bank_account === 'string') {
      const parts = employee.bank_account.split('|');
      if (parts.length === 3) {
        bankAccountInfo = {
          bank_name: parts[0],
          account_number: parts[1],
          account_holder: parts[2]
        };
      }
    }
    
    setBankAccountData(bankAccountInfo);
    setShowBankAccountModal(true);
  };

  const handleSaveBankAccount = async () => {
    if (!selectedEmployee || !bankAccountData.bank_name || !bankAccountData.account_number || !bankAccountData.account_holder) {
      alert('모든 필드를 입력해주세요.');
      return;
    }

    try {
      // 임시로 employees 테이블의 bank_account 필드에 저장
      const bankAccountInfo = `${bankAccountData.bank_name}|${bankAccountData.account_number}|${bankAccountData.account_holder}`;
      
      const { error } = await supabase
        .from('employees')
        .update({
          bank_account: bankAccountInfo,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedEmployee.id);

      if (error) {
        console.error('계좌 정보 저장 실패:', error);
        alert('계좌 정보 저장에 실패했습니다.');
        return;
      }

      alert('계좌 정보가 저장되었습니다.');
      setShowBankAccountModal(false);
      loadData(); // 데이터 다시 로드
    } catch (error) {
      console.error('계좌 정보 저장 중 오류:', error);
      alert('계좌 정보 저장 중 오류가 발생했습니다.');
    }
  };

  const confirmResetPassword = async () => {
    if (!selectedEmployee) return;

    try {
      const defaultPassword = selectedEmployee.phone.replace(/\D/g, '').slice(-8);
      
      const { error } = await supabase
        .from('employees')
        .update({
          password_hash: defaultPassword,
          pin_code: '1234',
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedEmployee.id);

      if (error) throw error;

      setShowResetModal(false);
      setSelectedEmployee(null);
      loadData(); // 데이터 새로고침
      alert(`비밀번호가 초기화되었습니다.\n새 비밀번호: ${defaultPassword}\n새 핀번호: 1234`);
    } catch (error) {
      console.error('비밀번호 초기화 오류:', error);
      alert('비밀번호 초기화에 실패했습니다.');
    }
  };

  // 테스트 로그인 함수 추가
  const handleTestLogin = (employee: Employee) => {
    // 새창에서 로그인 페이지를 열고, 직원 정보를 URL 파라미터로 전달
    const loginUrl = `${window.location.origin}/login?test_user=${encodeURIComponent(employee.phone)}&test_password=${encodeURIComponent(employee.password_hash || '')}&test_name=${encodeURIComponent(employee.name)}`;
    
    // 새창 열기
    const newWindow = window.open(loginUrl, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    
    if (newWindow) {
      // 새창이 차단되었을 경우 알림
      setTimeout(() => {
        if (newWindow.closed) {
          alert('팝업이 차단되었습니다. 팝업 차단을 해제하고 다시 시도해주세요.');
        }
      }, 1000);
    }
  };

  const filteredEmployees = employees.filter(employee =>
    employee.name.includes(searchTerm) ||
    employee.employee_id.includes(searchTerm) ||
    employee.department_name?.includes(searchTerm)
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="mr-4 p-2 rounded-lg hover:bg-gray-100 flex items-center"
              >
                <ArrowLeft className="h-5 w-5 mr-1" />
                뒤로가기
              </button>
              <h1 className="text-2xl font-bold text-gray-900">직원 관리</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={handleAddEmployee}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
              >
                <Plus className="h-4 w-4 inline mr-2" />
                직원 추가
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 검색 및 필터 */}
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="직원명, 사번, 부서로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
            <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Filter className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* 직원 목록 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">직원 목록</h2>
            <p className="text-sm text-gray-600 mt-1">총 {filteredEmployees.length}명의 직원</p>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    직원 정보
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    부서/직책
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    연락처
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    급여
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    계좌
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-indigo-600">
                              {employee.name.charAt(0)}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                          <div className="text-sm text-gray-500">{employee.employee_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{employee.department_name || '미지정'}</div>
                      <div className="text-sm text-gray-500">{employee.position_name || '미지정'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{employee.phone}</div>
                      <div className="text-sm text-gray-500">{employee.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        employee.status === 'active' 
                          ? 'bg-green-100 text-green-800'
                          : employee.status === 'on_leave'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {employee.status === 'active' ? '재직' : 
                         employee.status === 'on_leave' ? '휴직' : '퇴직'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.monthly_salary ? `${employee.monthly_salary.toLocaleString()}원` : 
                       employee.hourly_rate ? `${employee.hourly_rate.toLocaleString()}원/시` : '미지정'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {employee.bank_account && employee.bank_account.includes('|') ? (
                        <div className="text-xs">
                          <div className="font-medium">{employee.bank_account.split('|')[0]}</div>
                          <div className="text-gray-500">{employee.bank_account.split('|')[1]}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400">미등록</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button 
                        onClick={() => handleEditEmployee(employee)}
                        className="text-indigo-600 hover:text-indigo-900 mr-2"
                        title="수정"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleEditBankAccount(employee)}
                        className="text-green-600 hover:text-green-900 mr-2"
                        title="계좌 등록/수정"
                      >
                        <CreditCard className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleViewPassword(employee)}
                        className="text-blue-600 hover:text-blue-900 mr-2"
                        title="비밀번호 확인"
                      >
                        <Key className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleResetPassword(employee)}
                        className="text-orange-600 hover:text-orange-900 mr-2"
                        title="비밀번호 초기화"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleTestLogin(employee)}
                        className="text-green-600 hover:text-green-900 mr-2"
                        title="테스트 로그인"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteEmployee(employee)}
                        className="text-red-600 hover:text-red-900"
                        title="삭제"
                      >
                        <Trash className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* 비밀번호 확인 모달 */}
      {showPasswordModal && selectedEmployee && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">비밀번호 정보</h3>
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">직원명</label>
                  <p className="text-sm text-gray-900">{selectedEmployee.name} ({selectedEmployee.employee_id})</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">전화번호</label>
                  <p className="text-sm text-gray-900">{selectedEmployee.phone}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">현재 비밀번호</label>
                  <p className="text-sm text-gray-900 font-mono bg-gray-100 p-2 rounded">
                    {selectedEmployee.password_hash || '미설정'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">현재 핀번호</label>
                  <p className="text-sm text-gray-900 font-mono bg-gray-100 p-2 rounded">
                    {selectedEmployee.pin_code || '미설정'}
                  </p>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                  <p className="text-sm text-yellow-800">
                    <strong>보안 주의사항:</strong><br />
                    • 비밀번호는 직원에게 직접 전달하세요<br />
                    • 화면에 표시된 정보를 캡처하지 마세요<br />
                    • 확인 후 즉시 창을 닫으세요
                  </p>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 bg-gray-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-gray-700"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 비밀번호 초기화 확인 모달 */}
      {showResetModal && selectedEmployee && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">비밀번호 초기화 확인</h3>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  <strong>{selectedEmployee.name}</strong> ({selectedEmployee.employee_id}) 직원의 비밀번호를 초기화하시겠습니까?
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                  <p className="text-sm text-blue-800">
                    <strong>초기화 후 설정될 정보:</strong><br />
                    • 비밀번호: {selectedEmployee.phone.replace(/\D/g, '').slice(-8)}<br />
                    • 핀번호: 1234
                  </p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-800">
                    <strong>주의사항:</strong><br />
                    • 기존 비밀번호는 즉시 무효화됩니다<br />
                    • 직원에게 새로운 비밀번호를 안전하게 전달하세요
                  </p>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowResetModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={confirmResetPassword}
                  className="px-4 py-2 bg-orange-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-orange-700"
                >
                  초기화
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 직원 추가 모달 */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">새 직원 추가</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">이름 *</label>
                  <input
                    type="text"
                    value={newEmployee.name}
                    onChange={(e) => setNewEmployee({
                      ...newEmployee,
                      name: e.target.value
                    })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="직원 이름"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">전화번호 *</label>
                  <input
                    type="tel"
                    value={newEmployee.phone}
                    onChange={(e) => setNewEmployee({
                      ...newEmployee,
                      phone: e.target.value
                    })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="010-6669-9000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">이메일</label>
                  <input
                    type="email"
                    value={newEmployee.email}
                    onChange={(e) => setNewEmployee({
                      ...newEmployee,
                      email: e.target.value
                    })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">부서 *</label>
                  <select
                    value={newEmployee.department_id}
                    onChange={(e) => setNewEmployee({
                      ...newEmployee,
                      department_id: e.target.value
                    })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">부서 선택</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">직급 *</label>
                  <select
                    value={newEmployee.position_id}
                    onChange={(e) => setNewEmployee({
                      ...newEmployee,
                      position_id: e.target.value
                    })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">직급 선택</option>
                    {positions.map(pos => (
                      <option key={pos.id} value={pos.id}>{pos.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">역할 *</label>
                  <select
                    value={newEmployee.role_id}
                    onChange={(e) => setNewEmployee({
                      ...newEmployee,
                      role_id: e.target.value
                    })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">역할 선택</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">입사일</label>
                  <input
                    type="date"
                    value={newEmployee.hire_date}
                    onChange={(e) => setNewEmployee({
                      ...newEmployee,
                      hire_date: e.target.value
                    })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">상태</label>
                  <select
                    value={newEmployee.status}
                    onChange={(e) => setNewEmployee({
                      ...newEmployee,
                      status: e.target.value as 'active' | 'inactive' | 'on_leave'
                    })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="active">재직</option>
                    <option value="on_leave">휴직</option>
                    <option value="inactive">퇴직</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">월급 (원)</label>
                  <input
                    type="number"
                    value={newEmployee.monthly_salary || ''}
                    onChange={(e) => setNewEmployee({
                      ...newEmployee,
                      monthly_salary: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="월급 입력"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">시급 (원)</label>
                  <input
                    type="number"
                    value={newEmployee.hourly_rate || ''}
                    onChange={(e) => setNewEmployee({
                      ...newEmployee,
                      hourly_rate: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="시급 입력"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveNewEmployee}
                  className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700"
                >
                  추가
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 수정 모달 */}
      {showEditModal && editingEmployee && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">직원 정보 수정</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">부서</label>
                  <select
                    value={editingEmployee.department_id || ''}
                    onChange={(e) => setEditingEmployee({
                      ...editingEmployee,
                      department_id: e.target.value
                    })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">부서 선택</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">직급</label>
                  <select
                    value={editingEmployee.position_id || ''}
                    onChange={(e) => setEditingEmployee({
                      ...editingEmployee,
                      position_id: e.target.value
                    })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">직급 선택</option>
                    {positions.map(pos => (
                      <option key={pos.id} value={pos.id}>{pos.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">역할</label>
                  <select
                    value={editingEmployee.role_id || ''}
                    onChange={(e) => setEditingEmployee({
                      ...editingEmployee,
                      role_id: e.target.value
                    })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="">역할 선택</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">상태</label>
                  <select
                    value={editingEmployee.status}
                    onChange={(e) => setEditingEmployee({
                      ...editingEmployee,
                      status: e.target.value as 'active' | 'inactive' | 'on_leave'
                    })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="active">재직</option>
                    <option value="on_leave">휴직</option>
                    <option value="inactive">퇴직</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">생년월일</label>
                  <input
                    type="date"
                    value={editingEmployee.birth_date || ''}
                    onChange={(e) => setEditingEmployee({
                      ...editingEmployee,
                      birth_date: e.target.value
                    })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">월급 (원)</label>
                  <input
                    type="number"
                    value={editingEmployee.monthly_salary || ''}
                    onChange={(e) => setEditingEmployee({
                      ...editingEmployee,
                      monthly_salary: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="월급 입력"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">시급 (원)</label>
                  <input
                    type="number"
                    value={editingEmployee.hourly_rate || ''}
                    onChange={(e) => setEditingEmployee({
                      ...editingEmployee,
                      hourly_rate: e.target.value ? parseInt(e.target.value) : undefined
                    })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="시급 입력"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">일급 (원)</label>
                  <input
                    type="number"
                    value={editingEmployee.user_meta?.base_daily_wage || ''}
                    onChange={(e) => setEditingEmployee({
                      ...editingEmployee,
                      user_meta: {
                        ...editingEmployee.user_meta,
                        base_daily_wage: e.target.value ? parseInt(e.target.value) : undefined
                      }
                    })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="일급 입력"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">주유대 (원)</label>
                  <input
                    type="number"
                    value={editingEmployee.user_meta?.fuel_allowance || ''}
                    onChange={(e) => setEditingEmployee({
                      ...editingEmployee,
                      user_meta: {
                        ...editingEmployee.user_meta,
                        fuel_allowance: e.target.value ? parseInt(e.target.value) : undefined
                      }
                    })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="주유대 입력"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">식대 (원/일)</label>
                  <input
                    type="number"
                    value={editingEmployee.user_meta?.meal_allowance_rate || ''}
                    onChange={(e) => setEditingEmployee({
                      ...editingEmployee,
                      user_meta: {
                        ...editingEmployee.user_meta,
                        meal_allowance_rate: e.target.value ? parseInt(e.target.value) : undefined
                      }
                    })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="식대 입력"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveEmployee}
                  className="px-4 py-2 bg-indigo-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-indigo-700"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {showDeleteModal && deletingEmployee && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">직원 삭제 확인</h3>
              <p className="text-sm text-gray-600 mb-6">
                <strong>{deletingEmployee.name}</strong> ({deletingEmployee.employee_id}) 직원을 삭제하시겠습니까?
                <br />
                <span className="text-red-600">이 작업은 되돌릴 수 없습니다.</span>
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={confirmDeleteEmployee}
                  className="px-4 py-2 bg-red-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-red-700"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 계좌 등록/수정 모달 */}
      {showBankAccountModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-gray-900">
                  {selectedEmployee.name}님 계좌 정보 {selectedEmployee.bank_account && selectedEmployee.bank_account.includes('|') ? '수정' : '등록'}
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