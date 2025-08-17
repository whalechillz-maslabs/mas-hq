'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/supabase';
import { 
  Users, Target, DollarSign, Award, TrendingUp, 
  Settings, Save, Plus, Edit, Trash, Eye
} from 'lucide-react';

interface HRPolicy {
  id: string;
  category: 'compensation' | 'incentive' | 'evaluation' | 'team_management';
  title: string;
  description: string;
  rules: string[];
  target_roles: string[];
  effective_date: string;
  status: 'active' | 'draft' | 'archived';
  created_at: string;
  updated_at: string;
}

interface IncentiveRule {
  id: string;
  position: string;
  base_salary: number;
  sales_targets: {
    target_amount: number;
    bonus_amount: number;
    description: string;
  }[];
  yoy_bonus: {
    growth_rate: number;
    bonus_percentage: number;
  }[];
  team_performance_bonus: {
    team_target_achievement: number;
    bonus_amount: number;
  }[];
}

export default function HRPolicyPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [policies, setPolicies] = useState<HRPolicy[]>([]);
  const [incentiveRules, setIncentiveRules] = useState<IncentiveRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('policies');

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
    
    // 관리자 권한 확인 (여러 방법으로 체크)
    const isAdmin = user.role_id === 'admin' || 
                   user.employee_id === 'MASLABS-001' ||
                   user.name === '시스템 관리자';
    
    if (!isAdmin) {
      alert('관리자 권한이 필요합니다.');
      router.push('/dashboard');
      return;
    }
    
    setCurrentUser(user);
  };

  const loadData = async () => {
    // 샘플 데이터 로드
    const samplePolicies: HRPolicy[] = [
      {
        id: '1',
        category: 'compensation',
        title: 'OP팀장 성과급 체계',
        description: 'OP팀장의 기본급과 매출 달성 보너스 체계',
        rules: [
          '기본급: 250만원',
          '매출 3000만원 달성 시 20만원 보너스',
          '매출 4000만원 달성 시 40만원 보너스',
          'YOY 성장률 10% 이상 시 추가 10% 보너스'
        ],
        target_roles: ['OP팀장'],
        effective_date: '2025-01-01',
        status: 'active',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      },
      {
        id: '2',
        category: 'evaluation',
        title: '팀원 KPI 평가 기준',
        description: '팀원들의 성과 평가 기준과 측정 방법',
        rules: [
          '전화판매: 건당 10점',
          '온라인 판매 성사: 건당 15점',
          '오프라인 시타 실행: 건당 20점',
          '고객 만족도 90% 이상: 30점 보너스',
          '콘텐츠 조회수 1000회 이상: 25점 보너스'
        ],
        target_roles: ['OP팀원'],
        effective_date: '2025-01-01',
        status: 'active',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }
    ];

    const sampleIncentiveRules: IncentiveRule[] = [
      {
        id: '1',
        position: 'OP팀장',
        base_salary: 2500000,
        sales_targets: [
          { target_amount: 30000000, bonus_amount: 200000, description: '3000만원 달성' },
          { target_amount: 40000000, bonus_amount: 400000, description: '4000만원 달성' },
          { target_amount: 50000000, bonus_amount: 600000, description: '5000만원 달성' }
        ],
        yoy_bonus: [
          { growth_rate: 10, bonus_percentage: 10 },
          { growth_rate: 20, bonus_percentage: 20 },
          { growth_rate: 30, bonus_percentage: 30 }
        ],
        team_performance_bonus: [
          { team_target_achievement: 100, bonus_amount: 300000 },
          { team_target_achievement: 120, bonus_amount: 500000 },
          { team_target_achievement: 150, bonus_amount: 800000 }
        ]
      }
    ];

    setPolicies(samplePolicies);
    setIncentiveRules(sampleIncentiveRules);
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
                <h1 className="text-2xl font-bold text-gray-900">인사정책 관리</h1>
                <p className="text-gray-600">실적현황, 시상, 인센티브, 팀장 책임과 권한 관리</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center">
                <Plus className="w-4 h-4 mr-2" />
                새 정책 추가
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
              onClick={() => setActiveTab('policies')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'policies'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings className="w-4 h-4 inline mr-2" />
              인사정책
            </button>
            <button
              onClick={() => setActiveTab('incentives')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'incentives'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <DollarSign className="w-4 h-4 inline mr-2" />
              성과급 체계
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
              KPI 관리
            </button>
          </nav>
        </div>

        {/* 인사정책 탭 */}
        {activeTab === 'policies' && (
          <div className="mt-6">
            <div className="grid gap-6">
              {policies.map((policy) => (
                <div key={policy.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{policy.title}</h3>
                      <p className="text-gray-600 mt-1">{policy.description}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button className="p-2 text-red-400 hover:text-red-600">
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">적용 대상</h4>
                      <div className="flex flex-wrap gap-2">
                        {policy.target_roles.map((role) => (
                          <span key={role} className="px-2 py-1 bg-indigo-100 text-indigo-800 text-sm rounded">
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">시행일</h4>
                      <p className="text-gray-600">{policy.effective_date}</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900 mb-2">정책 내용</h4>
                    <ul className="space-y-1">
                      {policy.rules.map((rule, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start">
                          <span className="w-2 h-2 bg-indigo-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                          {rule}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 성과급 체계 탭 */}
        {activeTab === 'incentives' && (
          <div className="mt-6">
            <div className="grid gap-6">
              {incentiveRules.map((rule) => (
                <div key={rule.id} className="bg-white rounded-lg shadow p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold text-gray-900">{rule.position} 성과급 체계</h3>
                    <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                      <Save className="w-4 h-4 inline mr-2" />
                      저장
                    </button>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    {/* 기본급 */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">기본급</h4>
                      <div className="text-2xl font-bold text-indigo-600">
                        ₩{(rule.base_salary / 10000).toFixed(0)}만원
                      </div>
                    </div>

                    {/* 매출 목표 보너스 */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">매출 목표 보너스</h4>
                      <div className="space-y-2">
                        {rule.sales_targets.map((target, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              {(target.target_amount / 10000).toFixed(0)}만원
                            </span>
                            <span className="font-medium text-green-600">
                              +₩{(target.bonus_amount / 10000).toFixed(0)}만원
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* YOY 성장 보너스 */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">YOY 성장 보너스</h4>
                      <div className="space-y-2">
                        {rule.yoy_bonus.map((bonus, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <span className="text-sm text-gray-600">
                              {bonus.growth_rate}% 이상
                            </span>
                            <span className="font-medium text-green-600">
                              +{bonus.bonus_percentage}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 팀 성과 보너스 */}
                  <div className="mt-6 bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">팀 성과 보너스</h4>
                    <div className="grid md:grid-cols-3 gap-4">
                      {rule.team_performance_bonus.map((bonus, index) => (
                        <div key={index} className="text-center">
                          <div className="text-lg font-semibold text-gray-900">
                            {bonus.team_target_achievement}% 달성
                          </div>
                          <div className="text-xl font-bold text-green-600">
                            +₩{(bonus.bonus_amount / 10000).toFixed(0)}만원
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* KPI 관리 탭 */}
        {activeTab === 'kpi' && (
          <div className="mt-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">KPI 측정 항목 관리</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                {/* 팀장 KPI */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">팀장 KPI</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <Target className="w-4 h-4 text-green-500 mr-2" />
                      YOY 성장률 달성
                    </li>
                    <li className="flex items-center">
                      <DollarSign className="w-4 h-4 text-green-500 mr-2" />
                      매출 목표 달성
                    </li>
                    <li className="flex items-center">
                      <Users className="w-4 h-4 text-green-500 mr-2" />
                      팀원 관리 및 평가
                    </li>
                    <li className="flex items-center">
                      <Award className="w-4 h-4 text-green-500 mr-2" />
                      팀 성과급 지급
                    </li>
                  </ul>
                </div>

                {/* 팀원 KPI */}
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">팀원 KPI</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center">
                      <Target className="w-4 h-4 text-blue-500 mr-2" />
                      전화판매 성과
                    </li>
                    <li className="flex items-center">
                      <DollarSign className="w-4 h-4 text-blue-500 mr-2" />
                      온라인/오프라인 판매 성사
                    </li>
                    <li className="flex items-center">
                      <Award className="w-4 h-4 text-blue-500 mr-2" />
                      고객 만족도 체크
                    </li>
                    <li className="flex items-center">
                      <TrendingUp className="w-4 h-4 text-blue-500 mr-2" />
                      콘텐츠 조회수
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <h4 className="font-medium text-gray-900 mb-3">KPI 측정 방법</h4>
                <div className="grid md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-gray-50 rounded p-3">
                    <h5 className="font-medium mb-2">전화판매</h5>
                    <p className="text-gray-600">건당 10점, 성사 시 추가 20점</p>
                  </div>
                  <div className="bg-gray-50 rounded p-3">
                    <h5 className="font-medium mb-2">온라인 판매</h5>
                    <p className="text-gray-600">건당 15점, 고객 만족도 반영</p>
                  </div>
                  <div className="bg-gray-50 rounded p-3">
                    <h5 className="font-medium mb-2">콘텐츠</h5>
                    <p className="text-gray-600">조회수 1000회당 5점, 최대 50점</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
