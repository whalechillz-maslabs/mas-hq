"use client";

import { useState, useEffect } from "react";
import { 
  Plus, Edit2, Trash2, Search, Mail, Phone, Shield, 
  UserX, UserCheck, Key, Building, Briefcase, Calendar,
  Download, Upload, Filter, Eye
} from "lucide-react";

// 타입 정의
interface Employee {
  id: string;
  employeeId: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  departmentId: string;
  position: string;
  positionId: string;
  role: string;
  roleId: string;
  hireDate: string;
  birthDate?: string;
  address?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  isActive: boolean;
  profileImage?: string;
  lastLogin?: string;
  createdAt: string;
}

interface Department {
  id: string;
  name: string;
  code: string;
  managerId?: string;
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
  permissions?: any;
}

export default function EmployeeManagement() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([
    { id: '1', name: '개발팀', code: 'DEV' },
    { id: '2', name: '디자인팀', code: 'DESIGN' },
    { id: '3', name: '마케팅팀', code: 'MARKETING' },
    { id: '4', name: '경영지원팀', code: 'ADMIN' }
  ]);
  const [positions, setPositions] = useState<Position[]>([
    { id: '1', name: '대표이사', level: 1 },
    { id: '2', name: '이사', level: 2 },
    { id: '3', name: '부장', level: 3 },
    { id: '4', name: '차장', level: 4 },
    { id: '5', name: '과장', level: 5 },
    { id: '6', name: '대리', level: 6 },
    { id: '7', name: '주임', level: 7 },
    { id: '8', name: '사원', level: 8 },
    { id: '9', name: '인턴', level: 9 }
  ]);
  const [roles, setRoles] = useState<Role[]>([
    { id: '1', name: 'admin', description: '관리자' },
    { id: '2', name: 'hr_manager', description: 'HR 매니저' },
    { id: '3', name: 'team_lead', description: '팀장' },
    { id: '4', name: 'employee', description: '직원' }
  ]);
  
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showPasswordResetModal, setShowPasswordResetModal] = useState(false);
  const [resetPasswordEmployee, setResetPasswordEmployee] = useState<Employee | null>(null);
  const [newPassword, setNewPassword] = useState("");
  
  // 폼 데이터
  const [formData, setFormData] = useState({
    employeeId: "",
    name: "",
    email: "",
    phone: "",
    departmentId: "",
    positionId: "",
    roleId: "",
    hireDate: "",
    birthDate: "",
    address: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    emergencyContactRelation: "",
    password: "1234",
    isActive: true
  });

  // 데이터 로드
  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    // 샘플 데이터
    const sampleData: Employee[] = [
      {
        id: '1',
        employeeId: 'EMP001',
        name: '홍길동',
        email: 'hong@maslabs.com',
        phone: '010-1234-5678',
        department: '개발팀',
        departmentId: '1',
        position: '과장',
        positionId: '5',
        role: 'team_lead',
        roleId: '3',
        hireDate: '2020-03-15',
        birthDate: '1985-05-20',
        address: '서울시 강남구 테헤란로 123',
        emergencyContact: {
          name: '홍부인',
          phone: '010-9876-5432',
          relationship: '배우자'
        },
        isActive: true,
        lastLogin: '2024-01-15T09:30:00',
        createdAt: '2020-03-15T09:00:00'
      },
      {
        id: '2',
        employeeId: 'EMP002',
        name: '김철수',
        email: 'kim@maslabs.com',
        phone: '010-2345-6789',
        department: '디자인팀',
        departmentId: '2',
        position: '대리',
        positionId: '6',
        role: 'employee',
        roleId: '4',
        hireDate: '2021-06-01',
        isActive: true,
        createdAt: '2021-06-01T09:00:00'
      }
    ];
    
    setTimeout(() => {
      setEmployees(sampleData);
      setLoading(false);
    }, 500);
  };

  // 사번 자동 생성
  const generateEmployeeId = () => {
    const year = new Date().getFullYear();
    const lastNumber = employees.length + 1;
    return `EMP${year}${String(lastNumber).padStart(4, '0')}`;
  };

  // 직원 저장
  const handleSave = async () => {
    if (!formData.name || !formData.email || !formData.employeeId) {
      alert('필수 항목을 입력해주세요.');
      return;
    }

    try {
      if (editingEmployee) {
        // 수정
        const updatedEmployee: Employee = {
          ...editingEmployee,
          ...formData,
          department: departments.find(d => d.id === formData.departmentId)?.name || '',
          position: positions.find(p => p.id === formData.positionId)?.name || '',
          emergencyContact: formData.emergencyContactName ? {
            name: formData.emergencyContactName,
            phone: formData.emergencyContactPhone,
            relationship: formData.emergencyContactRelation
          } : undefined
        };
        
        setEmployees(prev => 
          prev.map(emp => emp.id === editingEmployee.id ? updatedEmployee : emp)
        );
        alert('직원 정보가 수정되었습니다.');
      } else {
        // 추가
        const newEmployee: Employee = {
          id: String(employees.length + 1),
          employeeId: formData.employeeId,
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          department: departments.find(d => d.id === formData.departmentId)?.name || '',
          departmentId: formData.departmentId,
          position: positions.find(p => p.id === formData.positionId)?.name || '',
          positionId: formData.positionId,
          role: roles.find(r => r.id === formData.roleId)?.name || 'employee',
          roleId: formData.roleId,
          hireDate: formData.hireDate,
          birthDate: formData.birthDate,
          address: formData.address,
          emergencyContact: formData.emergencyContactName ? {
            name: formData.emergencyContactName,
            phone: formData.emergencyContactPhone,
            relationship: formData.emergencyContactRelation
          } : undefined,
          isActive: formData.isActive,
          createdAt: new Date().toISOString()
        };
        
        setEmployees(prev => [...prev, newEmployee]);
        alert(`직원이 등록되었습니다.\n\n초기 비밀번호: ${formData.password}`);
      }
      
      setShowModal(false);
      resetForm();
    } catch (error) {
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  // 직원 삭제
  const handleDelete = async (id: string) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    
    setEmployees(prev => prev.filter(emp => emp.id !== id));
    alert('삭제되었습니다.');
  };

  // 활성/비활성 토글
  const toggleActive = async (employee: Employee) => {
    setEmployees(prev =>
      prev.map(emp =>
        emp.id === employee.id ? { ...emp, isActive: !emp.isActive } : emp
      )
    );
  };

  // 비밀번호 초기화
  const handlePasswordReset = async () => {
    if (!resetPasswordEmployee || !newPassword) return;
    
    alert(`${resetPasswordEmployee.name}님의 비밀번호가 초기화되었습니다.\n\n새 비밀번호: ${newPassword}`);
    setShowPasswordResetModal(false);
    setResetPasswordEmployee(null);
    setNewPassword("");
  };

  // 비밀번호 생성
  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(password);
  };

  // 폼 초기화
  const resetForm = () => {
    setFormData({
      employeeId: generateEmployeeId(),
      name: "",
      email: "",
      phone: "",
      departmentId: departments[0]?.id || "",
      positionId: positions[positions.length - 2]?.id || "",
      roleId: roles[roles.length - 1]?.id || "",
      hireDate: new Date().toISOString().split('T')[0],
      birthDate: "",
      address: "",
      emergencyContactName: "",
      emergencyContactPhone: "",
      emergencyContactRelation: "",
      password: "1234",
      isActive: true
    });
    setEditingEmployee(null);
  };

  // 수정 모드
  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      employeeId: employee.employeeId,
      name: employee.name,
      email: employee.email,
      phone: employee.phone,
      departmentId: employee.departmentId,
      positionId: employee.positionId,
      roleId: employee.roleId,
      hireDate: employee.hireDate,
      birthDate: employee.birthDate || "",
      address: employee.address || "",
      emergencyContactName: employee.emergencyContact?.name || "",
      emergencyContactPhone: employee.emergencyContact?.phone || "",
      emergencyContactRelation: employee.emergencyContact?.relationship || "",
      password: "",
      isActive: employee.isActive
    });
    setShowModal(true);
  };

  // 필터링
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = !filterDepartment || employee.departmentId === filterDepartment;
    const matchesStatus = filterStatus === "all" ||
                         (filterStatus === "active" && employee.isActive) ||
                         (filterStatus === "inactive" && !employee.isActive);
    
    return matchesSearch && matchesDepartment && matchesStatus;
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">직원 관리</h1>
        <p className="text-gray-600 mt-1">직원 정보를 등록하고 관리합니다.</p>
      </div>

      {/* 필터 섹션 */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="이름, 사번, 이메일 검색"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">전체 부서</option>
            {departments.map(dept => (
              <option key={dept.id} value={dept.id}>{dept.name}</option>
            ))}
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">전체 상태</option>
            <option value="active">재직</option>
            <option value="inactive">퇴직</option>
          </select>

          <button
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download className="w-5 h-5" />
            엑셀 다운로드
          </button>

          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            직원 추가
          </button>
        </div>
      </div>

      {/* 직원 목록 */}
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  직원 정보
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  소속
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  연락처
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  입사일
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.map(employee => (
                <tr key={employee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <Shield className="w-5 h-5 text-gray-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{employee.name}</div>
                        <div className="text-sm text-gray-500">{employee.employeeId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{employee.department}</div>
                    <div className="text-sm text-gray-500">{employee.position}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center text-sm text-gray-900">
                        <Mail className="w-4 h-4 mr-1 text-gray-400" />
                        {employee.email}
                      </div>
                      <div className="flex items-center text-sm text-gray-900">
                        <Phone className="w-4 h-4 mr-1 text-gray-400" />
                        {employee.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(employee.hireDate).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleActive(employee)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                        ${employee.isActive ?
                          'bg-green-100 text-green-800 hover:bg-green-200' :
                          'bg-red-100 text-red-800 hover:bg-red-200'}
                        transition-colors cursor-pointer`}
                    >
                      {employee.isActive ? (
                        <>
                          <UserCheck className="w-3 h-3" />
                          재직
                        </>
                      ) : (
                        <>
                          <UserX className="w-3 h-3" />
                          퇴직
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => {
                        setSelectedEmployee(employee);
                        setShowDetailModal(true);
                      }}
                      className="text-gray-600 hover:text-gray-900 mr-3"
                      title="상세보기"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(employee)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      title="수정"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setResetPasswordEmployee(employee);
                        generatePassword();
                        setShowPasswordResetModal(true);
                      }}
                      className="text-yellow-600 hover:text-yellow-900 mr-3"
                      title="비밀번호 초기화"
                    >
                      <Key className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(employee.id)}
                      className="text-red-600 hover:text-red-900"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 직원 추가/수정 모달 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingEmployee ? "직원 정보 수정" : "직원 추가"}
            </h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  사번 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  readOnly={editingEmployee !== null}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이메일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  전화번호
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  부서 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.departmentId}
                  onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  직급 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.positionId}
                  onChange={(e) => setFormData({ ...formData, positionId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {positions.map(pos => (
                    <option key={pos.id} value={pos.id}>{pos.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  권한 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.roleId}
                  onChange={(e) => setFormData({ ...formData, roleId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.description}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  입사일 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.hireDate}
                  onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  생년월일
                </label>
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  주소
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="col-span-2">
                <h3 className="text-sm font-medium text-gray-700 mb-2">비상 연락처</h3>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="이름"
                    value={formData.emergencyContactName}
                    onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                    className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="tel"
                    placeholder="전화번호"
                    value={formData.emergencyContactPhone}
                    onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                    className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="text"
                    placeholder="관계"
                    value={formData.emergencyContactRelation}
                    onChange={(e) => setFormData({ ...formData, emergencyContactRelation: e.target.value })}
                    className="px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {!editingEmployee && (
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    초기 비밀번호
                  </label>
                  <input
                    type="text"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div className="col-span-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">재직 상태</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {editingEmployee ? "수정" : "추가"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 비밀번호 초기화 모달 */}
      {showPasswordResetModal && resetPasswordEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">비밀번호 초기화</h2>
            
            <div className="mb-4">
              <p className="text-gray-700 mb-2">
                <strong>{resetPasswordEmployee.name}</strong>님의 비밀번호를 초기화합니다.
              </p>
              <p className="text-sm text-gray-600">
                사번: {resetPasswordEmployee.employeeId}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  새 비밀번호
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                  <button
                    onClick={generatePassword}
                    className="px-3 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    자동생성
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowPasswordResetModal(false);
                  setResetPasswordEmployee(null);
                  setNewPassword("");
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handlePasswordReset}
                disabled={!newPassword}
                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                초기화
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 상세 정보 모달 */}
      {showDetailModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">직원 상세 정보</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">사번</label>
                <p className="mt-1 text-sm text-gray-900">{selectedEmployee.employeeId}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">이름</label>
                <p className="mt-1 text-sm text-gray-900">{selectedEmployee.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">이메일</label>
                <p className="mt-1 text-sm text-gray-900">{selectedEmployee.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">전화번호</label>
                <p className="mt-1 text-sm text-gray-900">{selectedEmployee.phone}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">부서</label>
                <p className="mt-1 text-sm text-gray-900">{selectedEmployee.department}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">직급</label>
                <p className="mt-1 text-sm text-gray-900">{selectedEmployee.position}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">권한</label>
                <p className="mt-1 text-sm text-gray-900">
                  {roles.find(r => r.name === selectedEmployee.role)?.description}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">입사일</label>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(selectedEmployee.hireDate).toLocaleDateString('ko-KR')}
                </p>
              </div>
              {selectedEmployee.birthDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">생년월일</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedEmployee.birthDate).toLocaleDateString('ko-KR')}
                  </p>
                </div>
              )}
              {selectedEmployee.address && (
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">주소</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedEmployee.address}</p>
                </div>
              )}
              {selectedEmployee.emergencyContact && (
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">비상 연락처</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedEmployee.emergencyContact.name} ({selectedEmployee.emergencyContact.relationship}) - 
                    {selectedEmployee.emergencyContact.phone}
                  </p>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">상태</label>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                  ${selectedEmployee.isActive ?
                    'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'}`}
                >
                  {selectedEmployee.isActive ? '재직' : '퇴직'}
                </span>
              </div>
              {selectedEmployee.lastLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">마지막 로그인</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {new Date(selectedEmployee.lastLogin).toLocaleString('ko-KR')}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedEmployee(null);
                }}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                닫기
              </button>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  handleEdit(selectedEmployee);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                수정
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
