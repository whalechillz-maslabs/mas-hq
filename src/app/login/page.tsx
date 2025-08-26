'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/supabase';
import { formatPhoneNumberOnInput } from '@/utils/phoneUtils';
import { Phone, IdCard, Lock, Eye, EyeOff, Loader2, User, TestTube } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loginType, setLoginType] = useState<'phone' | 'employeeId' | 'pin'>('phone');
  const [formData, setFormData] = useState({
    phone: '',
    employeeId: '',
    password: '',
    pinUserId: '', // 핀번호 로그인용 사용자 식별자
    pinCode: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [autoLogoutTimer, setAutoLogoutTimer] = useState<NodeJS.Timeout | null>(null);
  const [isTestMode, setIsTestMode] = useState(false);
  const [testUserInfo, setTestUserInfo] = useState<{
    name: string;
    phone: string;
    password: string;
  } | null>(null);

  // 테스트 모드 확인 및 설정
  useEffect(() => {
    const testUser = searchParams.get('test_user');
    const testPassword = searchParams.get('test_password');
    const testName = searchParams.get('test_name');

    if (testUser && testPassword && testName) {
      setIsTestMode(true);
      setTestUserInfo({
        name: decodeURIComponent(testName),
        phone: decodeURIComponent(testUser),
        password: decodeURIComponent(testPassword)
      });

      // 폼에 테스트 데이터 자동 입력
      setFormData({
        phone: decodeURIComponent(testUser),
        employeeId: '',
        password: decodeURIComponent(testPassword),
        pinUserId: decodeURIComponent(testUser),
        pinCode: '1234' // 기본 핀번호
      });
    }
  }, [searchParams]);

  // 자동 로그오프 타이머 설정 (5분)
  useEffect(() => {
    const checkAutoLogout = () => {
      const lastActivity = localStorage.getItem('lastActivity');
      if (lastActivity) {
        const now = Date.now();
        const timeDiff = now - parseInt(lastActivity);
        const fiveMinutes = 5 * 60 * 1000; // 5분
        
        if (timeDiff > fiveMinutes) {
          // 5분 이상 비활성 상태면 자동 로그아웃
          auth.signOut();
          router.push('/login');
          alert('5분간 활동이 없어 자동 로그아웃되었습니다.');
        }
      }
    };

    // 페이지 로드 시 타이머 시작
    const timer = setInterval(checkAutoLogout, 30000); // 30초마다 체크
    setAutoLogoutTimer(timer);

    // 사용자 활동 감지
    const updateActivity = () => {
      localStorage.setItem('lastActivity', Date.now().toString());
    };

    // 이벤트 리스너 등록
    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keypress', updateActivity);
    window.addEventListener('click', updateActivity);
    window.addEventListener('scroll', updateActivity);

    return () => {
      clearInterval(timer);
      window.removeEventListener('mousemove', updateActivity);
      window.removeEventListener('keypress', updateActivity);
      window.removeEventListener('click', updateActivity);
      window.removeEventListener('scroll', updateActivity);
    };
  }, [router]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumberOnInput(e.target.value, formData.phone);
    setFormData({ ...formData, phone: formatted });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (loginType === 'phone') {
        await auth.signInWithPhone(formData.phone, formData.password);
      } else if (loginType === 'employeeId') {
        await auth.signInWithEmployeeId(formData.employeeId, formData.password);
      } else if (loginType === 'pin') {
        // 개선된 핀번호 로그인 로직
        await auth.signInWithPin(formData.pinUserId, formData.pinCode);
      }
      
      // 로그인 성공 시 활동 시간 업데이트
      localStorage.setItem('lastActivity', Date.now().toString());
      router.push('/dashboard');
    } catch (error: any) {
      setError(error.message || '로그인에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* 테스트 모드 배너 */}
        {isTestMode && testUserInfo && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
            <div className="flex items-center">
              <TestTube className="h-5 w-5 text-yellow-600 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">테스트 모드</h3>
                <p className="text-sm text-yellow-700">
                  {testUserInfo.name} ({testUserInfo.phone}) 계정으로 테스트 중입니다.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 로고 및 타이틀 */}
        <div>
          <div className="mx-auto h-12 w-12 bg-indigo-600 rounded-full flex items-center justify-center">
            <User className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            {isTestMode ? '테스트 로그인' : '로그인'}
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            {isTestMode ? '테스트 계정으로 로그인합니다' : 'MASLABS 직원 포털에 로그인하세요'}
          </p>
        </div>

        {/* 로그인 타입 선택 */}
        <div className="flex rounded-md shadow-sm">
          <button
            type="button"
            onClick={() => setLoginType('phone')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-l-md border ${
              loginType === 'phone'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            전화번호
          </button>
          <button
            type="button"
            onClick={() => setLoginType('employeeId')}
            className={`flex-1 py-2 px-4 text-sm font-medium border-t border-b ${
              loginType === 'employeeId'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            사번
          </button>
          <button
            type="button"
            onClick={() => setLoginType('pin')}
            className={`flex-1 py-2 px-4 text-sm font-medium rounded-r-md border ${
              loginType === 'pin'
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            핀번호
          </button>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            {loginType === 'phone' ? (
              <div>
                <label htmlFor="phone" className="sr-only">
                  전화번호
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    required
                    className="appearance-none rounded-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="010-0000-0000"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    readOnly={isTestMode}
                  />
                </div>
              </div>
            ) : loginType === 'employeeId' ? (
              <div>
                <label htmlFor="employeeId" className="sr-only">
                  사번
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <IdCard className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="employeeId"
                    name="employeeId"
                    type="text"
                    autoComplete="username"
                    required
                    className="appearance-none rounded-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="MASLABS-XXX"
                    value={formData.employeeId}
                    onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                    readOnly={isTestMode}
                  />
                </div>
              </div>
            ) : (
              // 개선된 핀번호 로그인 폼
              <>
                <div>
                  <label htmlFor="pinUserId" className="sr-only">
                    사용자 식별
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="pinUserId"
                      name="pinUserId"
                      type="text"
                      autoComplete="username"
                      required
                      className="appearance-none rounded-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                      placeholder="전화번호 또는 사번"
                      value={formData.pinUserId}
                      onChange={(e) => setFormData({ ...formData, pinUserId: e.target.value })}
                      readOnly={isTestMode}
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="pinCode" className="sr-only">
                    핀번호
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="pinCode"
                      name="pinCode"
                      type="password"
                      autoComplete="off"
                      required
                      maxLength={4}
                      className="appearance-none rounded-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                      placeholder="0000"
                      value={formData.pinCode}
                      onChange={(e) => {
                        const numericValue = e.target.value.replace(/\D/g, '');
                        if (numericValue.length <= 4) {
                          setFormData({ ...formData, pinCode: numericValue });
                        }
                      }}
                      readOnly={isTestMode}
                    />
                  </div>
                </div>
              </>
            )}

            {loginType !== 'pin' && (
              <div>
                <label htmlFor="password" className="sr-only">
                  비밀번호
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    className="appearance-none rounded-none relative block w-full px-3 py-2 pl-10 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                    placeholder="비밀번호"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    readOnly={isTestMode}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 로그인 상태 유지 및 비밀번호 찾기 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                로그인 상태 유지
              </label>
            </div>

            <div className="text-sm">
              <Link href="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
                비밀번호 찾기
              </Link>
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    로그인 오류
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    {error}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 로그인 버튼 */}
          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" />
              ) : null}
              {isTestMode ? '테스트 로그인' : '로그인'}
            </button>
          </div>

          {/* 회원가입 링크 (테스트 모드에서는 숨김) */}
          {!isTestMode && (
            <div className="text-center">
              <Link href="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
                계정이 없으신가요? 회원가입
              </Link>
            </div>
          )}
        </form>

        {/* 로그인 안내 */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">로그인 안내</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• 전화번호: 등록된 휴대폰 번호를 입력하세요</li>
            <li>• 사번: MASLABS-XXX 형식의 사번을 입력하세요</li>
            <li>• 핀번호: 전화번호/사번 + 4자리 핀번호로 간편 로그인</li>
            <li>• 비밀번호: 초기 비밀번호는 관리자에게 문의하세요</li>
            <li>• 자동 로그오프: 5분간 활동이 없으면 자동 로그아웃됩니다</li>
            {isTestMode && (
              <li className="text-yellow-700 font-medium">• 테스트 모드: 관리자가 테스트를 위해 임시로 로그인한 상태입니다</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
