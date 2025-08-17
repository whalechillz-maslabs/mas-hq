'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/supabase';
import { 
  User, Save, Lock, Phone, Mail, Building, 
  Calendar, Shield, Eye, EyeOff, Key
} from 'lucide-react';

interface ProfileData {
  id: string;
  employee_id: string;
  name: string;
  nickname?: string;
  phone: string;
  email?: string;
  department: string;
  position: string;
  role: string;
  hire_date: string;
  pin_code?: string;
  avatar_url?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  
  // 폼 데이터
  const [formData, setFormData] = useState({
    nickname: '',
    email: '',
    pin_code: '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  useEffect(() => {
    checkAuth();
    loadProfileData();
  }, []);

  const checkAuth = async () => {
    const user = await auth.getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setCurrentUser(user);
  };

  const loadProfileData = async () => {
    // 샘플 프로필 데이터
    const sampleProfile: ProfileData = {
      id: '1',
      employee_id: 'MASLABS-001',
      name: '시스템 관리자',
      nickname: '관리자',
      phone: '010-6669-9000',
      email: 'admin@maslabs.kr',
      department: '경영지원팀',
      position: '총관리자',
      role: 'admin',
      hire_date: '2024-01-01',
      pin_code: '1234'
    };

    setProfileData(sampleProfile);
    setFormData({
      nickname: sampleProfile.nickname || '',
      email: sampleProfile.email || '',
      pin_code: sampleProfile.pin_code || '',
      current_password: '',
      new_password: '',
      confirm_password: ''
    });
    setIsLoading(false);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    // 프로필 저장 로직
    alert('프로필이 저장되었습니다.');
    setIsEditing(false);
  };

  const handlePinCodeChange = (value: string) => {
    // 4자리 숫자만 허용
    const numericValue = value.replace(/\D/g, '');
    if (numericValue.length <= 4) {
      handleInputChange('pin_code', numericValue);
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
              <h1 className="text-2xl font-bold text-gray-900">개인정보 관리</h1>
            </div>
            <div className="flex items-center space-x-4">
              {isEditing ? (
                <>
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button 
                    onClick={handleSave}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                  >
                    <Save className="h-4 w-4 inline mr-2" />
                    저장
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setIsEditing(true)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
                >
                  수정
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 프로필 카드 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center">
                <div className="mx-auto h-24 w-24 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
                  <span className="text-2xl font-bold text-indigo-600">
                    {profileData?.name?.charAt(0)}
                  </span>
                </div>
                <h2 className="text-xl font-semibold text-gray-900">{profileData?.name}</h2>
                <p className="text-sm text-gray-500">{profileData?.employee_id}</p>
                <p className="text-sm text-gray-500 mt-1">{profileData?.department} • {profileData?.position}</p>
              </div>
              
              <div className="mt-6 space-y-4">
                <div className="flex items-center text-sm">
                  <Phone className="h-4 w-4 text-gray-400 mr-3" />
                  <span className="text-gray-600">{profileData?.phone}</span>
                </div>
                {profileData?.email && (
                  <div className="flex items-center text-sm">
                    <Mail className="h-4 w-4 text-gray-400 mr-3" />
                    <span className="text-gray-600">{profileData.email}</span>
                  </div>
                )}
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 text-gray-400 mr-3" />
                  <span className="text-gray-600">입사일: {profileData?.hire_date}</span>
                </div>
                <div className="flex items-center text-sm">
                  <Shield className="h-4 w-4 text-gray-400 mr-3" />
                  <span className="text-gray-600">권한: {profileData?.role}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 설정 탭 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow">
              {/* 탭 네비게이션 */}
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  <button
                    onClick={() => setActiveTab('basic')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'basic'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <User className="h-4 w-4 inline mr-2" />
                    기본 정보
                  </button>
                  <button
                    onClick={() => setActiveTab('security')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'security'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Lock className="h-4 w-4 inline mr-2" />
                    보안 설정
                  </button>
                </nav>
              </div>

              <div className="p-6">
                {/* 기본 정보 탭 */}
                {activeTab === 'basic' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        닉네임
                      </label>
                      <input
                        type="text"
                        value={formData.nickname}
                        onChange={(e) => handleInputChange('nickname', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50"
                        placeholder="닉네임을 입력하세요"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        이메일
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50"
                        placeholder="이메일을 입력하세요"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        핀번호 (4자리)
                      </label>
                      <div className="relative">
                        <input
                          type={showPin ? "text" : "password"}
                          value={formData.pin_code}
                          onChange={(e) => handlePinCodeChange(e.target.value)}
                          disabled={!isEditing}
                          maxLength={4}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50 pr-10"
                          placeholder="0000"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPin(!showPin)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showPin ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">빠른 로그인용 4자리 숫자</p>
                    </div>
                  </div>
                )}

                {/* 보안 설정 탭 */}
                {activeTab === 'security' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        현재 비밀번호
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          value={formData.current_password}
                          onChange={(e) => handleInputChange('current_password', e.target.value)}
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50 pr-10"
                          placeholder="현재 비밀번호를 입력하세요"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        새 비밀번호
                      </label>
                      <input
                        type="password"
                        value={formData.new_password}
                        onChange={(e) => handleInputChange('new_password', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50"
                        placeholder="새 비밀번호를 입력하세요"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        새 비밀번호 확인
                      </label>
                      <input
                        type="password"
                        value={formData.confirm_password}
                        onChange={(e) => handleInputChange('confirm_password', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50"
                        placeholder="새 비밀번호를 다시 입력하세요"
                      />
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex">
                        <Key className="h-5 w-5 text-yellow-400 mr-2" />
                        <div>
                          <h3 className="text-sm font-medium text-yellow-800">보안 팁</h3>
                          <p className="text-sm text-yellow-700 mt-1">
                            • 비밀번호는 8자 이상으로 설정하세요<br/>
                            • 영문, 숫자, 특수문자를 포함하세요<br/>
                            • 핀번호는 다른 곳에서 사용하지 마세요
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
