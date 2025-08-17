'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatCurrency, getStatusColor, formatPercentage } from '@/utils/formatUtils';
import { formatPhoneNumber } from '@/utils/phoneUtils';
import { 
  Users, Building, ChevronLeft, ChevronDown, ChevronRight,
  User, Phone, Mail, Award, TrendingUp, Target, Star, X
} from 'lucide-react';

interface Department {
  id: string;
  name: string;
  code: string;
  description: string;
  employees: Employee[];
  stats?: {
    totalSales: number;
    targetAchievement: number;
    avgPerformance: number;
  };
}

interface Employee {
  id: string;
  employee_id: string;
  name: string;
  email: string;
  phone: string;
  position: any;
  role: any;
  status: string;
  profile_image_url?: string;
  performance?: {
    totalPoints: number;
    ranking: number;
  };
}

export default function OrganizationPage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrganizationData();
  }, []);

  const loadOrganizationData = async () => {
    try {
      // 부서 목록 가져오기
      const { data: deptData, error: deptError } = await supabase
        .from('departments')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (deptError) throw deptError;

      // 직원 정보 가져오기
      const { data: empData, error: empError } = await supabase
        .from('employees')
        .select(`
          *,
          position:positions(name, level),
          role:roles(name, description),
          department:departments(name, code)
        `)
        .eq('is_active', true)
        .order('position(level)', { ascending: true });

      if (empError) throw empError;

      // 부서별로 직원 그룹화
      const departmentsWithEmployees = deptData.map(dept => {
        const deptEmployees = empData.filter(emp => emp.department_id === dept.id);
        
        // 부서 통계 계산 (더미 데이터)
        const stats = {
          totalSales: Math.floor(Math.random() * 50000000) + 10000000,
          targetAchievement: Math.floor(Math.random() * 30) + 70,
          avgPerformance: Math.floor(Math.random() * 20) + 80
        };

        return {
          ...dept,
          employees: deptEmployees,
          stats
        };
      });

      setDepartments(departmentsWithEmployees);
    } catch (error) {
      console.error('조직도 데이터 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleDepartment = (deptId: string) => {
    const newExpanded = new Set(expandedDepts);
    if (newExpanded.has(deptId)) {
      newExpanded.delete(deptId);
    } else {
      newExpanded.add(deptId);
    }
    setExpandedDepts(newExpanded);
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
      case 'manager':
        return <Star className="h-4 w-4 text-yellow-500" />;
      case 'team_lead':
        return <Award className="h-4 w-4 text-blue-500" />;
      default:
        return <User className="h-4 w-4 text-gray-400" />;
    }
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
              <h1 className="text-xl font-semibold">조직도</h1>
            </div>
            
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-600">
                총 {departments.reduce((sum, dept) => sum + dept.employees.length, 0)}명
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* HQ 섹션 */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg p-6 text-white mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">MASLABS HQ</h2>
              <p className="text-indigo-100">대표이사 직속</p>
            </div>
            <Building className="h-12 w-12 text-white/50" />
          </div>
          
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-white/20 rounded-lg p-3">
              <p className="text-sm text-indigo-100">총 매출</p>
              <p className="text-xl font-bold">
                {formatCurrency(departments.reduce((sum, dept) => sum + (dept.stats?.totalSales || 0), 0))}
              </p>
            </div>
            <div className="bg-white/20 rounded-lg p-3">
              <p className="text-sm text-indigo-100">목표 달성률</p>
              <p className="text-xl font-bold">
                {Math.round(departments.reduce((sum, dept) => sum + (dept.stats?.targetAchievement || 0), 0) / departments.length)}%
              </p>
            </div>
            <div className="bg-white/20 rounded-lg p-3">
              <p className="text-sm text-indigo-100">평균 성과</p>
              <p className="text-xl font-bold">
                {Math.round(departments.reduce((sum, dept) => sum + (dept.stats?.avgPerformance || 0), 0) / departments.length)}점
              </p>
            </div>
          </div>
        </div>

        {/* 부서별 조직도 */}
        <div className="space-y-6">
          {departments.map((dept) => (
            <div key={dept.id} className="bg-white rounded-lg shadow overflow-hidden">
              {/* 부서 헤더 */}
              <div
                className="px-6 py-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => toggleDepartment(dept.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {expandedDepts.has(dept.id) ? (
                      <ChevronDown className="h-5 w-5 mr-2 text-gray-400" />
                    ) : (
                      <ChevronRight className="h-5 w-5 mr-2 text-gray-400" />
                    )}
                    <div>
                      <h3 className="text-lg font-semibold">{dept.name}</h3>
                      <p className="text-sm text-gray-600">{dept.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <p className="text-sm text-gray-600">팀원</p>
                      <p className="text-xl font-bold">{dept.employees.length}명</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">매출</p>
                      <p className="text-xl font-bold text-green-600">
                        {formatCurrency(dept.stats?.totalSales || 0)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">달성률</p>
                      <p className="text-xl font-bold text-blue-600">
                        {dept.stats?.targetAchievement}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 직원 목록 */}
              {expandedDepts.has(dept.id) && (
                <div className="px-6 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {dept.employees.map((employee) => (
                      <div
                        key={employee.id}
                        className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => setSelectedEmployee(employee)}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center">
                            {employee.profile_image_url ? (
                              <img
                                src={employee.profile_image_url}
                                alt={employee.name}
                                className="h-10 w-10 rounded-full mr-3"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center mr-3">
                                <User className="h-6 w-6 text-gray-400" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-gray-900">{employee.name}</p>
                              <p className="text-sm text-gray-500">{employee.employee_id}</p>
                            </div>
                          </div>
                          {getRoleIcon(employee.role?.name)}
                        </div>
                        
                        <div className="space-y-1">
                          <p className="text-sm text-gray-600">
                            {employee.position?.name}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center">
                            <Phone className="h-3 w-3 mr-1" />
                            {formatPhoneNumber(employee.phone)}
                          </p>
                          {employee.email && (
                            <p className="text-sm text-gray-600 flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {employee.email}
                            </p>
                          )}
                        </div>
                        
                        <div className="mt-3 pt-3 border-t">
                          <div className="flex justify-between items-center">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(employee.status)}`}>
                              {employee.status === 'active' ? '재직중' : '휴직'}
                            </span>
                            {employee.performance && (
                              <div className="flex items-center text-sm text-gray-600">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                {employee.performance.totalPoints}점
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 팀장 성과급 계산기 (관리자용) */}
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Target className="h-5 w-5 mr-2" />
            팀장 성과급 계산기
          </h3>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">기본급</p>
                <p className="text-xl font-bold">{formatCurrency(2500000)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">매출 단계별 보너스</p>
                <p className="text-xl font-bold text-green-600">+{formatCurrency(500000)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">예상 총액</p>
                <p className="text-xl font-bold text-indigo-600">{formatCurrency(3000000)}</p>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600">
                * 매출 목표 달성 시 단계별 보너스 지급
              </p>
              <p className="text-sm text-gray-600">
                * YOY 성장률에 따른 추가 인센티브 적용
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* 직원 상세 모달 */}
      {selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">직원 정보</h3>
              <button
                onClick={() => setSelectedEmployee(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center">
                {selectedEmployee.profile_image_url ? (
                  <img
                    src={selectedEmployee.profile_image_url}
                    alt={selectedEmployee.name}
                    className="h-16 w-16 rounded-full mr-4"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center mr-4">
                    <User className="h-10 w-10 text-gray-400" />
                  </div>
                )}
                <div>
                  <p className="text-xl font-semibold">{selectedEmployee.name}</p>
                  <p className="text-gray-600">{selectedEmployee.employee_id}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">직급</span>
                  <span className="font-medium">{selectedEmployee.position?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">역할</span>
                  <span className="font-medium">{selectedEmployee.role?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">전화번호</span>
                  <span className="font-medium">{formatPhoneNumber(selectedEmployee.phone)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">이메일</span>
                  <span className="font-medium">{selectedEmployee.email || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">상태</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(selectedEmployee.status)}`}>
                    {selectedEmployee.status === 'active' ? '재직중' : '휴직'}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedEmployee(null)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
