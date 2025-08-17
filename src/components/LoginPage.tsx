'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/supabase';
import { formatPhoneNumber, formatPhoneNumberOnInput } from '@/utils/phoneUtils';
import { 
  User, 
  Lock, 
  Phone, 
  ChevronRight,
  Briefcase,
  Users,
  TrendingUp,
  FileText,
  Award
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [loginType, setLoginType] = useState<'phone' | 'employee_id'>('phone');
  const [phone, setPhone] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // 브랜드 지표 (실제로는 API에서 가져와야 함)
  const [brandMetrics, setBrandMetrics] = useState({
    monthlyVisitors: 12540,
    blogViews: 8210,
    newConsultations: 18,
    contentUploads: 24
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (loginType === 'phone') {
        await auth.signInWithPhone(phone, password);
      } else {
        await auth.signInWithEmployeeId(employeeId, password);
      }
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || '로그인에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumberOnInput(e.target.value, phone);
    setPhone(formatted);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      {/* 헤더 */}
      <header className="pt-8 pb-4 px-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">M</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">MASGOLF</h1>
          </div>
          <div className="text-sm text-gray-600">
            MASLABS Employee Dashboard
          </div>
        </div>
      </header>

      {/* 브랜드 메시지 섹션 */}
      <section className="max-w-4xl mx-auto px-6 py-12 text-center">
        <h2 className="text-4xl font-bold text-gray-900 mb-4">
          골퍼들은 공을 멀리 보냈을 때<br />
          살아 있음을 느낀다.
        </h2>
        <p className="text-lg text-gray-600 mb-12">
          우리는 골퍼의 꿈을 현실로 만듭니다
        </p>

        {/* 브랜드 건강 지표 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-center mb-3">
              <TrendingUp className="w-8 h-8 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {brandMetrics.monthlyVisitors.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 mt-1">월 방문자</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-center mb-3">
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {brandMetrics.blogViews.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 mt-1">블로그 조회수</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-center mb-3">
              <Users className="w-8 h-8 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {brandMetrics.newConsultations}
            </div>
            <div className="text-sm text-gray-600 mt-1">신규 상담</div>
          </div>
          
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-center mb-3">
              <Award className="w-8 h-8 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {brandMetrics.contentUploads}
            </div>
            <div className="text-sm text-gray-600 mt-1">콘텐츠 업로드</div>
          </div>
        </div>
      </section>

      {/* 로그인 폼 */}
      <section className="max-w-md mx-auto px-6 pb-12">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            직원 로그인
          </h3>

          {/* 로그인 타입 선택 */}
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setLoginType('phone')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                loginType === 'phone'
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Phone className="w-4 h-4 inline mr-2" />
              전화번호
            </button>
            <button
              type="button"
              onClick={() => setLoginType('employee_id')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                loginType === 'employee_id'
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <User className="w-4 h-4 inline mr-2" />
              사번
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            {loginType === 'phone' ? (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  전화번호
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={handlePhoneChange}
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="010-1234-5678"
                    required
                  />
                </div>
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  사번
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="MASLABS-001"
                    required
                  />
                </div>
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="비밀번호 입력"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  로그인
                  <ChevronRight className="w-5 h-5 ml-2" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="#" className="text-sm text-gray-600 hover:text-green-600">
              비밀번호를 잊으셨나요?
            </a>
          </div>
        </div>
      </section>

      {/* 푸터 */}
      <footer className="mt-12 pb-8 text-center text-sm text-gray-500">
        <p>© 2025 MASLABS. All rights reserved.</p>
        <p className="mt-2">
          문의: admin@maslabs.kr | 02-1234-5678
        </p>
      </footer>
    </div>
  );
}
