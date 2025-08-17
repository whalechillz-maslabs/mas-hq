'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/supabase';
import { 
  Settings, Save, Database, Shield, Clock, 
  Users, Bell, Globe, Key, Server
} from 'lucide-react';

interface SystemSetting {
  id: string;
  category: string;
  name: string;
  value: string;
  description: string;
  type: 'text' | 'number' | 'boolean' | 'select';
  options?: string[];
}

export default function SystemSettingsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('general');

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
    // 샘플 시스템 설정 데이터
    const sampleSettings: SystemSetting[] = [
      {
        id: '1',
        category: 'general',
        name: '회사명',
        value: 'MASLABS',
        description: '시스템에 표시되는 회사명',
        type: 'text'
      },
      {
        id: '2',
        category: 'general',
        name: '기본 근무시간',
        value: '8',
        description: '일일 기본 근무시간 (시간)',
        type: 'number'
      },
      {
        id: '3',
        category: 'security',
        name: '세션 타임아웃',
        value: '30',
        description: '자동 로그아웃 시간 (분)',
        type: 'number'
      },
      {
        id: '4',
        category: 'security',
        name: '2FA 필수',
        value: 'true',
        description: '2단계 인증 필수 여부',
        type: 'boolean'
      },
      {
        id: '5',
        category: 'notification',
        name: '이메일 알림',
        value: 'true',
        description: '이메일 알림 활성화',
        type: 'boolean'
      },
      {
        id: '6',
        category: 'notification',
        name: 'SMS 알림',
        value: 'false',
        description: 'SMS 알림 활성화',
        type: 'boolean'
      }
    ];

    setSettings(sampleSettings);
    setIsLoading(false);
  };

  const handleSettingChange = (id: string, value: string) => {
    setSettings(prev => 
      prev.map(setting => 
        setting.id === id ? { ...setting, value } : setting
      )
    );
  };

  const handleSave = async () => {
    // 설정 저장 로직
    alert('설정이 저장되었습니다.');
  };

  const filteredSettings = settings.filter(setting => setting.category === activeTab);

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
              <h1 className="text-2xl font-bold text-gray-900">시스템 설정</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={handleSave}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
              >
                <Save className="h-4 w-4 inline mr-2" />
                저장
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 탭 네비게이션 */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('general')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'general'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Globe className="h-4 w-4 inline mr-2" />
              일반 설정
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'security'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Shield className="h-4 w-4 inline mr-2" />
              보안 설정
            </button>
            <button
              onClick={() => setActiveTab('notification')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'notification'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Bell className="h-4 w-4 inline mr-2" />
              알림 설정
            </button>
          </nav>
        </div>

        {/* 설정 목록 */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              {activeTab === 'general' && '일반 설정'}
              {activeTab === 'security' && '보안 설정'}
              {activeTab === 'notification' && '알림 설정'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {activeTab === 'general' && '시스템의 기본 설정을 관리합니다.'}
              {activeTab === 'security' && '보안 관련 설정을 관리합니다.'}
              {activeTab === 'notification' && '알림 관련 설정을 관리합니다.'}
            </p>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              {filteredSettings.map((setting) => (
                <div key={setting.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{setting.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{setting.description}</p>
                    </div>
                    <div className="ml-6">
                      {setting.type === 'text' && (
                        <input
                          type="text"
                          value={setting.value}
                          onChange={(e) => handleSettingChange(setting.id, e.target.value)}
                          className="w-64 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      )}
                      {setting.type === 'number' && (
                        <input
                          type="number"
                          value={setting.value}
                          onChange={(e) => handleSettingChange(setting.id, e.target.value)}
                          className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      )}
                      {setting.type === 'boolean' && (
                        <select
                          value={setting.value}
                          onChange={(e) => handleSettingChange(setting.id, e.target.value)}
                          className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="true">활성화</option>
                          <option value="false">비활성화</option>
                        </select>
                      )}
                      {setting.type === 'select' && setting.options && (
                        <select
                          value={setting.value}
                          onChange={(e) => handleSettingChange(setting.id, e.target.value)}
                          className="w-48 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          {setting.options.map((option) => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 시스템 정보 */}
        <div className="mt-8 bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">시스템 정보</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center space-x-3">
                <Server className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">서버 상태</p>
                  <p className="text-sm text-gray-500">정상 운영 중</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Database className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">데이터베이스</p>
                  <p className="text-sm text-gray-500">Supabase (원격)</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">활성 사용자</p>
                  <p className="text-sm text-gray-500">3명</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">마지막 업데이트</p>
                  <p className="text-sm text-gray-500">2025-01-15 14:30</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
