'use client';

import { useState, useEffect } from 'react';
import { supabase, Employee } from '@/lib/supabase';
import { formatCurrency, getStatusColor, getEmploymentTypeLabel } from '@/utils/formatUtils';
import { formatPhoneNumber } from '@/utils/phoneUtils';
import { formatDateKR } from '@/utils/dateUtils';
import {
  Users,
  Building,
  ChevronDown,
  ChevronRight,
  User,
  Phone,
  Mail,
  Award,
  TrendingUp,
  DollarSign,
  Target,
  Edit,
  Plus,
  Search,
  Filter,
  Calendar,
  Briefcase,
  MapPin
} from 'lucide-react';

interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  employees?: EmployeeWithDetails[];
}

interface EmployeeWithDetails extends Employee {
  department?: { name: string; code: string };
  position?: { name: string; level: number };
  performance?: {
    totalPoints: number;
    monthlyRevenue: number;
    targetAchievement: number;
  };
}

interface TeamStats {
  totalEmployees: number;
  totalRevenue: number;
  averagePerformance: number;
  yoyGrowth: number;
}

export default function OrganizationChart() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
  const [employees, setEmployees] = useState<EmployeeWithDetails[]>([]);
  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<Employee | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [teamStats, setTeamStats] = useState<{ [key: string]: TeamStats }>({});

  useEffect(() => {
    loadOrganizationData();
    loadCurrentUser();
  }, []);

  const loadCurrentUser = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Employee 정보를 가져오는 로직 필요
        const { data: employee } = await supabase
          .from('employees')
          .select('*')
          .eq('email', user.email)
          .single();
        setCurrentUser(employee);
      }
    } catch (error) {
      console.error('사용자 정보 로드 실패:', error);
    }
  };

  const loadOrganizationData = async () => {
    setIsLoading(true);
    try {
      // 부서 목록 가져오기
      const { data: deptData, error: deptError } = await supabase
        .from('departments')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (deptError) throw deptError;

      // 직원 목록 가져오기 (부서, 직급 정보 포함)
      const { data: empData, error: empError } = await supabase
        .from('employees')
        .select(`
          *,
          department:departments(name, code),
          position:positions(name, level),
          role:roles(name, description)
        `)
        .eq('is_active', true)
        .order('name');

      if (empError) throw empError;

      // 부서별로 직원 그룹화
      const departmentsWithEmployees = deptData?.map(dept => {
        const deptEmployees = empData?.filter(emp => emp.department_id === dept.id) || [];
        return {
          ...dept,
          employees: deptEmployees
        };
      }) || [];

      setDepartments(departmentsWithEmployees);
      setEmployees(empData || []);

      // 팀 통계 계산
      calculateTeamStats(departmentsWithEmployees);
    } catch (error) {
      console.error('조직 데이터 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTeamStats = (depts: Department[]) => {
    const stats: { [key: string]: TeamStats } = {};

    depts.forEach(dept => {
      const employees = dept.employees || [];
      stats[dept.id] = {
        totalEmployees: employees.length,
        totalRevenue: 35000000, // 실제로는 API에서 가져와야 함
        averagePerformance: 78,
        yoyGrowth: 12
      };
    });

    setTeamStats(stats);
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

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.phone?.includes(searchTerm)
  );

  const isManager = currentUser?.role?.name === 'manager' || currentUser?.role?.name === 'admin';

  const getDepartmentIcon = (code: string) => {
    switch (code) {
      case 'HQ': return Building;
      case 'MGMT': return Briefcase;
      case 'STORE': return MapPin;
      default: return Users;
    }
  };

  const getPositionBadgeColor = (level?: number) => {
    if (!level) return 'bg-gray-100 text-gray-600';
    if (level <= 3) return 'bg-purple-100 text-purple-600';
    if (level <= 6) return 'bg-blue-100 text-blue-600';
    return 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">조직도 & 인사 관리</h1>
              <p className="text-sm text-gray-600 mt-1">
                MASLABS 조직 구조와 팀 성과를 확인합니다
              </p>
            </div>

            {isManager && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                직원 추가
              </button>
            )}
          </div>

          {/* 검색 */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="이름, 사번, 전화번호로 검색"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* 조직도 트리 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">조직 구조</h2>
              
              {/* HQ (본사) */}
              <div className="mb-4">
                <div className="flex items-center p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                  <Building className="w-6 h-6 text-purple-600 mr-3" />
                  <div>
                    <h3 className="font-bold text-gray-900">MASLABS HQ</h3>
                    <p className="text-xs text-gray-600">본사</p>
                  </div>
                </div>
              </div>

              {/* 부서 목록 */}
              <div className="space-y-2">
                {departments.map((dept) => {
                  const Icon = getDepartmentIcon(dept.code);
                  const isExpanded = expandedDepts.has(dept.id);
                  const stats = teamStats[dept.id];

                  return (
                    <div key={dept.id} className="border rounded-lg overflow-hidden">
                      <button
                        onClick={() => toggleDepartment(dept.id)}
                        className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-400 mr-2" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-400 mr-2" />
                          )}
                          <Icon className="w-5 h-5 text-gray-600 mr-2" />
                          <div className="text-left">
                            <h4 className="font-medium text-gray-900">{dept.name}</h4>
                            <p className="text-xs text-gray-500">
                              {stats?.totalEmployees || 0}명
                            </p>
                          </div>
                        </div>
                        
                        {stats && (
                          <div className="flex items-center space-x-2">
                            <span className="text-xs text-green-600">
                              +{stats.yoyGrowth}%
                            </span>
                          </div>
                        )}
                      </button>

                      {isExpanded && dept.employees && (
                        <div className="border-t bg-gray-50 p-3">
                          {/* 팀 통계 */}
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            <div className="bg-white rounded p-2">
                              <p className="text-xs text-gray-600">팀 매출</p>
                              <p className="text-sm font-bold text-gray-900">
                                {formatCurrency(stats?.totalRevenue || 0)}
                              </p>
                            </div>
                            <div className="bg-white rounded p-2">
                              <p className="text-xs text-gray-600">달성률</p>
                              <p className="text-sm font-bold text-green-600">
                                {stats?.averagePerformance || 0}%
                              </p>
                            </div>
                          </div>

                          {/* 팀원 목록 */}
                          <div className="space-y-1">
                            {dept.employees.map((emp) => (
                              <div
                                key={emp.id}
                                className="flex items-center justify-between p-2 bg-white rounded hover:shadow-sm cursor-pointer"
                                onClick={() => setSelectedDepartment(dept.id)}
                              >
                                <div className="flex items-center">
                                  <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center mr-2">
                                    <User className="w-4 h-4 text-gray-600" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{emp.name}</p>
                                    <p className="text-xs text-gray-500">
                                      {emp.position?.name}
                                    </p>
                                  </div>
                                </div>
                                <span className={`px-2 py-0.5 text-xs rounded-full ${getPositionBadgeColor(emp.position?.level)}`}>
                                  {emp.position?.level}급
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 직원 목록 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">
                {searchTerm ? '검색 결과' : '전체 직원'}
              </h2>

              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  직원이 없습니다.
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredEmployees.map((emp) => (
                    <div
                      key={emp.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          {/* 프로필 이미지 */}
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            {emp.profile_image_url ? (
                              <img
                                src={emp.profile_image_url}
                                alt={emp.name}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <User className="w-6 h-6 text-gray-600" />
                            )}
                          </div>

                          {/* 직원 정보 */}
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-bold text-gray-900">{emp.name}</h3>
                              <span className="text-sm text-gray-500">({emp.employee_id})</span>
                              <span className={`px-2 py-0.5 text-xs rounded-full ${getStatusColor(emp.status)}`}>
                                {emp.status === 'active' ? '재직' : '휴직'}
                              </span>
                            </div>
                            
                            <div className="mt-1 text-sm text-gray-600">
                              <span>{emp.department?.name}</span>
                              <span className="mx-2">•</span>
                              <span>{emp.position?.name}</span>
                              <span className="mx-2">•</span>
                              <span>{getEmploymentTypeLabel(emp.employment_type)}</span>
                            </div>

                            <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                              <div className="flex items-center">
                                <Phone className="w-3 h-3 mr-1" />
                                {formatPhoneNumber(emp.phone)}
                              </div>
                              {emp.email && (
                                <div className="flex items-center">
                                  <Mail className="w-3 h-3 mr-1" />
                                  {emp.email}
                                </div>
                              )}
                              <div className="flex items-center">
                                <Calendar className="w-3 h-3 mr-1" />
                                입사: {formatDateKR(emp.hire_date)}
                              </div>
                            </div>

                            {/* KPI 요약 (관리자만) */}
                            {isManager && (
                              <div className="mt-3 pt-3 border-t flex items-center space-x-6">
                                <div className="flex items-center">
                                  <DollarSign className="w-4 h-4 text-green-600 mr-1" />
                                  <span className="text-sm">
                                    월 매출: <span className="font-bold">₩1.2M</span>
                                  </span>
                                </div>
                                <div className="flex items-center">
                                  <Target className="w-4 h-4 text-blue-600 mr-1" />
                                  <span className="text-sm">
                                    달성률: <span className="font-bold text-blue-600">85%</span>
                                  </span>
                                </div>
                                <div className="flex items-center">
                                  <Award className="w-4 h-4 text-purple-600 mr-1" />
                                  <span className="text-sm">
                                    성과점수: <span className="font-bold">450P</span>
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 관리 버튼 (관리자만) */}
                        {isManager && (
                          <div className="flex items-center space-x-2">
                            <button className="p-2 text-gray-600 hover:text-blue-600">
                              <Edit className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 팀장 성과급 계산기 (관리자만) */}
            {isManager && (
              <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">팀장 성과급 계산기</h2>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3">OP팀장 인센티브</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">기본급</span>
                        <span className="font-medium">₩2,500,000</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">매출 달성 보너스</span>
                        <span className="font-medium text-green-600">+₩500,000</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">팀 성과 보너스</span>
                        <span className="font-medium text-green-600">+₩300,000</span>
                      </div>
                      <div className="pt-2 border-t flex justify-between">
                        <span className="font-medium">예상 총액</span>
                        <span className="font-bold text-green-600">₩3,300,000</span>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-3">팀원 평균 성과</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">평균 매출</span>
                        <span className="font-medium">₩950,000</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">평균 달성률</span>
                        <span className="font-medium">78%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">평균 성과점수</span>
                        <span className="font-medium">385P</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
