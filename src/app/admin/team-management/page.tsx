'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/supabase';
import { 
  Users, UserPlus, UserCheck, Settings, Save, 
  Plus, Edit, Trash, Eye, Crown, Building
} from 'lucide-react';

interface TeamMember {
  id: string;
  employee_id: string;
  name: string;
  phone: string;
  department: string;
  position: string;
  role: string;
  is_team_lead: boolean;
  team_lead_id?: string;
  hire_date: string;
  status: 'active' | 'inactive';
}

export default function TeamManagementPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('team-leads');

  useEffect(() => {
    checkAuth();
    loadData();
  }, []);

  const checkAuth = async () => {
    try {
      // localStorage 기반 인증 확인
      if (typeof window === 'undefined') return;
      
      const isLoggedIn = localStorage.getItem('isLoggedIn');
      const currentEmployee = localStorage.getItem('currentEmployee');
      
      if (!isLoggedIn || !currentEmployee) {
        router.push('/login');
        return;
      }
      
      const employee = JSON.parse(currentEmployee);
      
      // 관리자 권한 확인
      if (employee.role !== 'admin' && 
          employee.role !== 'manager' &&
          employee.name !== '김탁수') {
        router.push('/dashboard');
        return;
      }
      
      setCurrentUser(employee);
    } catch (error) {
      console.error('사용자 확인 오류:', error);
      router.push('/login');
    }
  };

  const loadData = async () => {
    // 샘플 데이터
    const sampleTeamMembers: TeamMember[] = [
      {
        id: '1',
        employee_id: 'MASLABS-001',
        name: '시스템 관리자',
        phone: '010-6669-9000',
        department: '경영지원팀',
        position: '총관리자',
        role: 'admin',
        is_team_lead: true,
        hire_date: '2024-01-01',
        status: 'active'
      },
      {
        id: '2',
        employee_id: 'MASLABS-002',
        name: '김팀장',
        phone: '010-1234-5678',
        department: 'OP팀',
        position: '팀장',
        role: 'team_lead',
        is_team_lead: true,
        hire_date: '2024-02-01',
        status: 'active'
      },
      {
        id: '3',
        employee_id: 'MASLABS-003',
        name: '이사원',
        phone: '010-2345-6789',
        department: 'OP팀',
        position: '사원',
        role: 'employee',
        is_team_lead: false,
        team_lead_id: '2',
        hire_date: '2024-03-01',
        status: 'active'
      }
    ];

    setTeamMembers(sampleTeamMembers);
    setIsLoading(false);
  };

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
                <svg className="h-5 w-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                뒤로가기
              </button>
              <h1 className="text-2xl font-bold text-gray-900">OP 팀장 설정</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                {currentUser?.name} ({currentUser?.role_id})
              </span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 탭 네비게이션 */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('team-leads')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'team-leads'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Crown className="h-4 w-4 inline mr-2" />
              팀장 관리
            </button>
            <button
              onClick={() => setActiveTab('member-assignment')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'member-assignment'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <UserPlus className="h-4 w-4 inline mr-2" />
              팀원 배정
            </button>
          </nav>
        </div>

        {/* 팀장 관리 탭 */}
        {activeTab === 'team-leads' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">팀장 목록</h2>
              <p className="text-sm text-gray-600 mt-1">현재 지정된 팀장들을 관리합니다.</p>
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
                      팀장 상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      관리 팀원 수
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      액션
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {teamMembers.filter(member => member.is_team_lead).map((member) => (
                    <tr key={member.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-indigo-600">
                                {member.name.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{member.name}</div>
                            <div className="text-sm text-gray-500">{member.employee_id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{member.department}</div>
                        <div className="text-sm text-gray-500">{member.position}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          팀장
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {teamMembers.filter(m => m.team_lead_id === member.id).length}명
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-indigo-600 hover:text-indigo-900">
                          상세보기
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 팀원 배정 탭 */}
        {activeTab === 'member-assignment' && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">팀원 배정</h2>
              <p className="text-sm text-gray-600 mt-1">팀원을 팀장에게 배정합니다.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      직원 정보
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      현재 팀장
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      액션
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {teamMembers.filter(member => !member.is_team_lead).map((member) => (
                    <tr key={member.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-600">
                                {member.name.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{member.name}</div>
                            <div className="text-sm text-gray-500">{member.employee_id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {member.team_lead_id ? 
                          teamMembers.find(tl => tl.id === member.team_lead_id)?.name || '미배정' :
                          '미배정'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-indigo-600 hover:text-indigo-900">
                          팀장 변경
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
