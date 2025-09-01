'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/supabase';
import { 
  Users, Target, Star, TrendingUp, Award, 
  CheckCircle, XCircle, Edit, Save, Eye,
  BarChart3, Calendar, DollarSign
} from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  employee_id: string;
  position: string;
  department: string;
  phone: string;
  hire_date: string;
  status: 'active' | 'inactive';
}

interface Evaluation {
  id: string;
  employee_id: string;
  evaluator_id: string;
  evaluation_date: string;
  period: 'monthly' | 'quarterly' | 'yearly';
  
  // KPI 점수
  phone_sales_score: number;
  online_sales_score: number;
  offline_sales_score: number;
  customer_satisfaction_score: number;
  content_views_score: number;
  
  // 종합 평가
  total_score: number;
  performance_rating: 'A' | 'B' | 'C' | 'D';
  manager_feedback: string;
  improvement_areas: string[];
  strengths: string[];
  
  // 인센티브
  incentive_amount: number;
  incentive_reason: string;
  
  status: 'draft' | 'submitted' | 'reviewed' | 'finalized';
  created_at: string;
  updated_at: string;
}

export default function TeamEvaluationPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('members');

  useEffect(() => {
    checkAuth();
    loadData();
  }, []);

  const checkAuth = async () => {
    const user = await auth.getCurrentUser();
    console.log('Current user:', user); // 디버깅용
    
    if (!user) {
      router.push('/login');
      return;
    }
    
    // 관리자/매니저 권한 확인
    const isManager = user.role_id === 'admin' || 
                     user.role_id === 'manager' ||
                     user.employee_id === 'MASLABS-001' ||
                     user.name === '시스템 관리자';
    
    if (!isManager) {
      alert('관리자 또는 매니저 권한이 필요합니다.');
      router.push('/dashboard');
      return;
    }
    
    setCurrentUser(user);
  };

  const loadData = async () => {
    // 샘플 팀원 데이터
    const sampleTeamMembers: TeamMember[] = [
      {
        id: '1',
        name: '김영희',
        employee_id: 'OP-001',
        position: 'OP팀원',
        department: '마쓰구',
        phone: '010-1234-5678',
        hire_date: '2024-03-01',
        status: 'active'
      },
      {
        id: '2',
        name: '박철수',
        employee_id: 'OP-002',
        position: 'OP팀원',
        department: '싱싱',
        phone: '010-2345-6789',
        hire_date: '2024-06-15',
        status: 'active'
      },
      {
        id: '3',
        name: '이민수',
        employee_id: 'OP-003',
        position: 'OP팀원',
        department: '마쓰구',
        phone: '010-3456-7890',
        hire_date: '2024-09-01',
        status: 'active'
      }
    ];

    // 샘플 평가 데이터
    const sampleEvaluations: Evaluation[] = [
      {
        id: '1',
        employee_id: '1',
        evaluator_id: currentUser?.employee_id || 'admin',
        evaluation_date: '2025-08-01',
        period: 'monthly',
        phone_sales_score: 85,
        online_sales_score: 92,
        offline_sales_score: 78,
        customer_satisfaction_score: 95,
        content_views_score: 88,
        total_score: 87.6,
        performance_rating: 'A',
        manager_feedback: '전화판매와 고객 만족도가 우수합니다. 오프라인 판매 실적을 더 개선하면 좋겠습니다.',
        improvement_areas: ['오프라인 판매 기법 향상', '제품 지식 심화'],
        strengths: ['고객 응대 능력', '전화판매 스킬', '콘텐츠 작성 능력'],
        incentive_amount: 150000,
        incentive_reason: '고객 만족도 95% 달성 및 전화판매 목표 초과 달성',
        status: 'finalized',
        created_at: '2025-08-01T00:00:00Z',
        updated_at: '2025-08-01T00:00:00Z'
      }
    ];

    setTeamMembers(sampleTeamMembers);
    setEvaluations(sampleEvaluations);
    setIsLoading(false);
  };

  const calculateTotalScore = (evaluation: Partial<Evaluation>) => {
    const scores = [
      evaluation.phone_sales_score || 0,
      evaluation.online_sales_score || 0,
      evaluation.offline_sales_score || 0,
      evaluation.customer_satisfaction_score || 0,
      evaluation.content_views_score || 0
    ];
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length * 10) / 10;
  };

  const getPerformanceRating = (score: number): 'A' | 'B' | 'C' | 'D' => {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    return 'D';
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'A': return 'text-green-600 bg-green-100';
      case 'B': return 'text-blue-600 bg-blue-100';
      case 'C': return 'text-yellow-600 bg-yellow-100';
      case 'D': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
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
      <div className="bg-white shadow">
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
              <div>
                <h1 className="text-2xl font-bold text-gray-900">팀원 평가 관리</h1>
                <p className="text-gray-600">팀장의 팀원 KPI 측정 및 성과 평가</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center">
                <BarChart3 className="w-4 h-4 mr-2" />
                평가 리포트
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('members')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'members'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              팀원 목록
            </button>
            <button
              onClick={() => setActiveTab('evaluations')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'evaluations'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Star className="w-4 h-4 inline mr-2" />
              평가 현황
            </button>
            <button
              onClick={() => setActiveTab('kpi')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'kpi'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Target className="w-4 h-4 inline mr-2" />
              KPI 대시보드
            </button>
          </nav>
        </div>

        {/* 팀원 목록 탭 */}
        {activeTab === 'members' && (
          <div className="mt-6">
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">팀원 목록</h3>
                <p className="text-sm text-gray-600 mt-1">총 {teamMembers.length}명의 팀원</p>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        팀원 정보
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        부서/직책
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        최근 평가
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        KPI 점수
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        액션
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {teamMembers.map((member) => {
                      const evaluation = evaluations.find(e => e.employee_id === member.id);
                      return (
                        <tr key={member.id} className="hover:bg-gray-50">
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
                                <div className="text-sm text-gray-500">{member.phone}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{member.department}</div>
                            <div className="text-sm text-gray-500">{member.position}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {evaluation ? (
                              <div>
                                <div className="text-sm text-gray-900">
                                  {evaluation.evaluation_date}
                                </div>
                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRatingColor(evaluation.performance_rating)}`}>
                                  {evaluation.performance_rating}등급
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">평가 없음</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {evaluation ? (
                              <div className="text-sm text-gray-900">
                                <div className="flex items-center">
                                  <Star className="w-4 h-4 text-yellow-400 mr-1" />
                                  {evaluation.total_score}점
                                </div>
                                <div className="text-xs text-gray-500">
                                  인센티브: ₩{(evaluation.incentive_amount / 1000).toFixed(0)}K
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-500">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setSelectedMember(member)}
                                className="text-indigo-600 hover:text-indigo-900"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button className="text-green-600 hover:text-green-900">
                                <Edit className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 평가 현황 탭 */}
        {activeTab === 'evaluations' && (
          <div className="mt-6">
            <div className="grid gap-6">
              {evaluations.map((evaluation) => {
                const member = teamMembers.find(m => m.id === evaluation.employee_id);
                return (
                  <div key={evaluation.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {member?.name} - {evaluation.period} 평가
                        </h3>
                        <p className="text-gray-600 mt-1">
                          평가일: {evaluation.evaluation_date} | 
                          상태: <span className={`px-2 py-1 text-xs rounded-full ${getRatingColor(evaluation.performance_rating)}`}>
                            {evaluation.status}
                          </span>
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getRatingColor(evaluation.performance_rating)}`}>
                          {evaluation.performance_rating}등급
                        </span>
                        <span className="text-2xl font-bold text-indigo-600">
                          {evaluation.total_score}점
                        </span>
                      </div>
                    </div>

                    {/* KPI 점수 상세 */}
                    <div className="grid md:grid-cols-5 gap-4 mb-6">
                      <div className="text-center p-3 bg-gray-50 rounded">
                        <div className="text-sm text-gray-600">전화판매</div>
                        <div className="text-lg font-semibold text-blue-600">{evaluation.phone_sales_score}점</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded">
                        <div className="text-sm text-gray-600">온라인판매</div>
                        <div className="text-lg font-semibold text-green-600">{evaluation.online_sales_score}점</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded">
                        <div className="text-sm text-gray-600">오프라인판매</div>
                        <div className="text-lg font-semibold text-purple-600">{evaluation.offline_sales_score}점</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded">
                        <div className="text-sm text-gray-600">고객만족도</div>
                        <div className="text-lg font-semibold text-orange-600">{evaluation.customer_satisfaction_score}점</div>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded">
                        <div className="text-sm text-gray-600">콘텐츠조회수</div>
                        <div className="text-lg font-semibold text-red-600">{evaluation.content_views_score}점</div>
                      </div>
                    </div>

                    {/* 피드백 및 인센티브 */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">매니저 피드백</h4>
                        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                          {evaluation.manager_feedback}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 mb-2">인센티브</h4>
                        <div className="bg-green-50 p-3 rounded">
                          <div className="text-lg font-semibold text-green-600">
                            ₩{(evaluation.incentive_amount / 1000).toFixed(0)}K
                          </div>
                          <div className="text-sm text-green-700">
                            {evaluation.incentive_reason}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* KPI 대시보드 탭 */}
        {activeTab === 'kpi' && (
          <div className="mt-6">
            <div className="grid gap-6">
              {/* 팀 전체 KPI */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">팀 전체 KPI 현황</h3>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-blue-50 rounded">
                    <DollarSign className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-blue-600">₩45.2M</div>
                    <div className="text-sm text-blue-700">월 매출</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded">
                    <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">+12.5%</div>
                    <div className="text-sm text-green-700">YOY 성장률</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded">
                    <Target className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-purple-600">94.2%</div>
                    <div className="text-sm text-purple-700">목표 달성률</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded">
                    <Star className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-orange-600">87.6</div>
                    <div className="text-sm text-orange-700">평균 KPI 점수</div>
                  </div>
                </div>
              </div>

              {/* 개별 팀원 KPI 차트 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">팀원별 KPI 비교</h3>
                <div className="space-y-4">
                  {teamMembers.map((member) => {
                    const evaluation = evaluations.find(e => e.employee_id === member.id);
                    if (!evaluation) return null;
                    
                    return (
                      <div key={member.id} className="flex items-center justify-between p-4 border rounded">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-indigo-600">
                              {member.name.charAt(0)}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{member.name}</div>
                            <div className="text-sm text-gray-500">{member.department}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-6">
                          <div className="text-center">
                            <div className="text-lg font-semibold text-gray-900">
                              {evaluation.total_score}점
                            </div>
                            <div className="text-sm text-gray-500">총점</div>
                          </div>
                          <div className="text-center">
                            <span className={`px-3 py-1 text-sm font-semibold rounded-full ${getRatingColor(evaluation.performance_rating)}`}>
                              {evaluation.performance_rating}등급
                            </span>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-green-600">
                              ₩{(evaluation.incentive_amount / 1000).toFixed(0)}K
                            </div>
                            <div className="text-sm text-gray-500">인센티브</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
