'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, auth } from '@/lib/supabase';
import { 
  User, Save, Lock, Phone, Mail, Building, 
  Calendar, Shield, Eye, EyeOff, Key, ArrowLeft, Edit, Trash
} from 'lucide-react';

interface ProfileData {
  id: string;
  employee_id: string;
  name: string;
  nickname?: string;
  phone: string;
  email?: string;
  department_id?: string;
  department_name?: string;
  position_id?: string;
  position_name?: string;
  role_id?: string;
  role_name?: string;
  hire_date: string;
  pin_code?: string;
  password_hash?: string;
  avatar_url?: string;
  monthly_salary?: number;
  hourly_rate?: number;
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
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
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadProfileData();
    }
  }, [currentUser]);

  const checkAuth = async () => {
    const user = await auth.getCurrentUser();
    if (!user) {
      router.push('/login');
      return;
    }
    setCurrentUser(user);
  };

  const loadProfileData = async () => {
    try {
      if (!currentUser) return;

      const { data: employeeData, error } = await supabase
        .from('employees')
        .select(`
          *,
          department:departments(name),
          position:positions(name),
          role:roles(name)
        `)
        .eq('id', currentUser.id)
        .single();

      if (error) throw error;

      const profile: ProfileData = {
        ...employeeData,
        department_name: employeeData.department?.name,
        position_name: employeeData.position?.name,
        role_name: employeeData.role?.name
      };

      setProfileData(profile);
      setFormData({
        nickname: profile.nickname || '',
        email: profile.email || '',
        pin_code: profile.pin_code || '',
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      setIsLoading(false);
    } catch (error) {
      console.error('프로필 데이터 로드 오류:', error);
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!profileData) return;

    try {
      if (formData.new_password && formData.new_password !== formData.confirm_password) {
        alert('새 비밀번호가 일치하지 않습니다.');
        return;
      }

      const updates: any = {
        nickname: formData.nickname,
        email: formData.email,
        updated_at: new Date().toISOString()
      };

      if (formData.pin_code && formData.pin_code !== profileData.pin_code) {
        if (formData.pin_code.length !== 4) {
          alert('핀번호는 4자리여야 합니다.');
          return;
        }
        updates.pin_code = formData.pin_code;
      }

      if (formData.new_password) {
        const currentPassword = profileData.password_hash;
        const defaultPassword = profileData.phone.replace(/\D/g, '').slice(-8);
        
        if (formData.current_password !== currentPassword && formData.current_password !== defaultPassword) {
          alert('현재 비밀번호가 올바르지 않습니다.');
          return;
        }
        
        updates.password_hash = formData.new_password;
      }

      const { error } = await supabase
        .from('employees')
        .update(updates)
        .eq('id', profileData.id);

      if (error) throw error;

      const updatedProfile = { ...profileData, ...updates };
      localStorage.setItem('currentEmployee', JSON.stringify(updatedProfile));

      alert('프로필이 성공적으로 저장되었습니다.');
      setIsEditing(false);
      loadProfileData();
    } catch (error) {
      console.error('프로필 저장 오류:', error);
      alert('프로필 저장에 실패했습니다.');
    }
  };

  const handleDeleteAccount = async () => {
    if (!profileData) return;

    try {
      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', profileData.id);

      if (error) throw error;

      await auth.signOut();
      router.push('/login');
      alert('계정이 삭제되었습니다.');
    } catch (error) {
      console.error('계정 삭제 오류:', error);
      alert('계정 삭제에 실패했습니다.');
    }
  };

  const handleLogout = async () => {
    await auth.signOut();
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="text-center">
          <p className="text-gray-600">프로필 정보를 불러올 수 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <button
                onClick={() => router.push('/dashboard')}
                className="mr-4 p-3 rounded-xl hover:bg-gray-100 flex items-center transition-all duration-200"
              >
                <ArrowLeft className="h-5 w-5 mr-2" />
                뒤로가기
              </button>
              <h1 className="text-2xl font-bold text-gray-900">개인정보 관리</h1>
            </div>
            <div className="flex items-center space-x-4">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 flex items-center font-semibold transition-all duration-200 shadow-lg"
                >
                  <Edit className="h-5 w-5 mr-2" />
                  수정
                </button>
              ) : (
                <div className="flex space-x-3">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-6 py-3 border-2 border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 font-semibold transition-all duration-200"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleSave}
                    className="bg-green-600 text-white px-6 py-3 rounded-xl hover:bg-green-700 flex items-center font-semibold transition-all duration-200 shadow-lg"
                  >
                    <Save className="h-5 w-5 mr-2" />
                    저장
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 프로필 정보 - MAS Golf 스타일 카드 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="text-center">
                <div className="mx-auto h-24 w-24 rounded-full bg-indigo-100 flex items-center justify-center mb-6">
                  <span className="text-3xl font-bold text-indigo-600">
                    {profileData.name.charAt(0)}
                  </span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {profileData.name}
                </h2>
                <p className="text-gray-600 mb-6 font-medium">{profileData.role_name || '직원'}</p>
                
                <div className="space-y-4 text-left">
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <User className="h-5 w-5 text-indigo-500 mr-3" />
                    <span className="text-gray-700 font-medium">{profileData.employee_id}</span>
                  </div>
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <Building className="h-5 w-5 text-green-500 mr-3" />
                    <span className="text-gray-700 font-medium">
                      {profileData.department_name || '미지정'} · {profileData.position_name || '미지정'}
                    </span>
                  </div>
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <Phone className="h-5 w-5 text-blue-500 mr-3" />
                    <span className="text-gray-700 font-medium">{profileData.phone}</span>
                  </div>
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <Mail className="h-5 w-5 text-purple-500 mr-3" />
                    <span className="text-gray-700 font-medium">{profileData.email || '미설정'}</span>
                  </div>
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-orange-500 mr-3" />
                    <span className="text-gray-700 font-medium">입사일: {profileData.hire_date}</span>
                  </div>
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <Shield className="h-5 w-5 text-red-500 mr-3" />
                    <span className="text-gray-700 font-medium">권한: {profileData.role_name || 'employee'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 편집 폼 - MAS Golf 스타일 카드 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg">
              {/* 탭 네비게이션 */}
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 px-6">
                  <button
                    onClick={() => setActiveTab('basic')}
                    className={`py-4 px-1 border-b-2 font-semibold text-sm transition-all duration-200 ${
                      activeTab === 'basic'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    기본 정보
                  </button>
                  <button
                    onClick={() => setActiveTab('security')}
                    className={`py-4 px-1 border-b-2 font-semibold text-sm transition-all duration-200 ${
                      activeTab === 'security'
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    보안 설정
                  </button>
                  <button
                    onClick={() => setActiveTab('danger')}
                    className={`py-4 px-1 border-b-2 font-semibold text-sm transition-all duration-200 ${
                      activeTab === 'danger'
                        ? 'border-red-500 text-red-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    위험 영역
                  </button>
                </nav>
              </div>

              <div className="p-6">
                {activeTab === 'basic' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        닉네임
                      </label>
                      <input
                        type="text"
                        value={formData.nickname}
                        onChange={(e) => handleInputChange('nickname', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50 transition-all duration-200"
                        placeholder="닉네임을 입력하세요"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        이메일
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50 transition-all duration-200"
                        placeholder="이메일을 입력하세요"
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        핀번호 (4자리)
                      </label>
                      <div className="relative">
                        <input
                          type={showPin ? 'text' : 'password'}
                          value={formData.pin_code}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\D/g, '').slice(0, 4);
                            handleInputChange('pin_code', value);
                          }}
                          disabled={!isEditing}
                          maxLength={4}
                          className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50 transition-all duration-200"
                          placeholder="0000"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPin(!showPin)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 hover:bg-gray-100 rounded-lg transition-all duration-200"
                        >
                          {showPin ? (
                            <EyeOff className="h-5 w-5 text-gray-400" />
                          ) : (
                            <Eye className="h-5 w-5 text-gray-400" />
                          )}
                        </button>
                      </div>
                      <p className="mt-2 text-sm text-gray-500">빠른 로그인용 4자리 숫자</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        현재 비밀번호
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.current_password}
                        onChange={(e) => handleInputChange('current_password', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50 transition-all duration-200"
                        placeholder="현재 비밀번호를 입력하세요"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        새 비밀번호
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.new_password}
                        onChange={(e) => handleInputChange('new_password', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50 transition-all duration-200"
                        placeholder="새 비밀번호를 입력하세요"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-3">
                        새 비밀번호 확인
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.confirm_password}
                        onChange={(e) => handleInputChange('confirm_password', e.target.value)}
                        disabled={!isEditing}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:bg-gray-50 transition-all duration-200"
                        placeholder="새 비밀번호를 다시 입력하세요"
                      />
                    </div>

                    <div className="flex items-center">
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="flex items-center text-sm text-indigo-600 hover:text-indigo-500 font-medium transition-all duration-200"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                        {showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                      </button>
                    </div>
                  </div>
                )}

                {activeTab === 'danger' && (
                  <div className="space-y-6">
                    <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                      <h3 className="text-lg font-bold text-red-800 mb-3">⚠️ 위험 영역</h3>
                      <p className="text-red-700 mb-4">
                        아래 작업들은 되돌릴 수 없습니다. 신중하게 진행해주세요.
                      </p>
                    </div>

                    <div className="space-y-6">
                      <div className="p-6 bg-gray-50 rounded-xl">
                        <h4 className="text-lg font-bold text-gray-900 mb-3">로그아웃</h4>
                        <p className="text-gray-600 mb-4">현재 세션을 종료하고 로그인 페이지로 이동합니다.</p>
                        <button
                          onClick={handleLogout}
                          className="bg-gray-600 text-white px-6 py-3 rounded-xl hover:bg-gray-700 font-semibold transition-all duration-200 shadow-lg"
                        >
                          로그아웃
                        </button>
                      </div>

                      <div className="p-6 bg-red-50 border-2 border-red-200 rounded-xl">
                        <h4 className="text-lg font-bold text-red-900 mb-3">계정 삭제</h4>
                        <p className="text-red-700 mb-4">
                          계정을 영구적으로 삭제합니다. 이 작업은 되돌릴 수 없습니다.
                        </p>
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          className="bg-red-600 text-white px-6 py-3 rounded-xl hover:bg-red-700 flex items-center font-semibold transition-all duration-200 shadow-lg"
                        >
                          <Trash className="h-5 w-5 mr-2" />
                          계정 삭제
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 계정 삭제 확인 모달 */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-6 border w-96 shadow-2xl rounded-2xl bg-white">
            <div className="mt-3">
              <h3 className="text-xl font-bold text-red-900 mb-4">계정 삭제 확인</h3>
              <p className="text-gray-600 mb-6">
                정말로 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-6 py-3 border-2 border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all duration-200"
                >
                  취소
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="px-6 py-3 bg-red-600 border-2 border-transparent rounded-xl text-sm font-semibold text-white hover:bg-red-700 transition-all duration-200 shadow-lg"
                >
                  삭제
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
