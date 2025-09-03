'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { TrendingUp, Users, FileText, Package } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [stats] = useState({
    monthlyVisitors: 12540,
    blogViews: 8210,
    newConsultations: 18,
    contentUploads: 24
  });

  useEffect(() => {
    const checkUser = () => {
      // localStorage 기반 인증 상태 확인
      const isLoggedIn = localStorage.getItem('isLoggedIn');
      const currentEmployee = localStorage.getItem('currentEmployee');
      
      if (isLoggedIn === 'true' && currentEmployee) {
        router.push('/dashboard');
      }
    };
    checkUser();
  }, [router]);

  const handleComingSoon = (e: React.MouseEvent) => {
    e.preventDefault();
    alert('준비 중인 서비스입니다. 곧 만나보실 수 있습니다!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* 헤더 */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-indigo-600">MASLABS</h1>
            </div>
            <div className="flex space-x-4">
              <Link 
                href="/login"
                className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-500"
              >
                로그인
              </Link>
              <button
                onClick={handleComingSoon}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 cursor-pointer"
              >
                회원가입
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 브랜드 메시지 */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            &ldquo;골퍼들은 공을 멀리 보냈을 때 살아 있음을 느낀다&rdquo;
          </h2>
          <p className="text-xl text-gray-600">
            MASGOLF - 혁신적인 골프 경험을 제공합니다
          </p>
        </div>

        {/* KPI 하이라이트 */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h3 className="text-2xl font-semibold text-gray-900 mb-6">
            ▶ 오늘의 주요 수치
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* 월 방문자 수 */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">월 방문자 수</p>
                  <p className="text-3xl font-bold mt-2">
                    {stats.monthlyVisitors.toLocaleString()}명
                  </p>
                </div>
                <Users className="h-12 w-12 text-blue-200" />
              </div>
            </div>

            {/* 블로그 조회수 */}
            <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">블로그 조회수</p>
                  <p className="text-3xl font-bold mt-2">
                    {stats.blogViews.toLocaleString()}회
                  </p>
                </div>
                <FileText className="h-12 w-12 text-green-200" />
              </div>
            </div>

            {/* 신규 상담 */}
            <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">신규 상담</p>
                  <p className="text-3xl font-bold mt-2">
                    {stats.newConsultations}건
                  </p>
                </div>
                <TrendingUp className="h-12 w-12 text-purple-200" />
              </div>
            </div>

            {/* 콘텐츠 업로드 */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100">콘텐츠 업로드</p>
                  <p className="text-3xl font-bold mt-2">
                    {stats.contentUploads}편
                  </p>
                </div>
                <Package className="h-12 w-12 text-orange-200" />
              </div>
            </div>
          </div>

          {/* 추가 정보 섹션 */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <h4 className="text-lg font-semibold text-gray-900">긍정적 사고</h4>
                <p className="text-gray-600 mt-2">
                  모든 도전을 기회로 바꾸는 마인드셋
                </p>
              </div>
              <div className="text-center">
                <h4 className="text-lg font-semibold text-gray-900">창의적 열정</h4>
                <p className="text-gray-600 mt-2">
                  혁신적인 솔루션으로 고객 가치 창출
                </p>
              </div>
              <div className="text-center">
                <h4 className="text-lg font-semibold text-gray-900">헌신</h4>
                <p className="text-gray-600 mt-2">
                  고객의 성공이 우리의 성공입니다
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA 섹션 */}
        <div className="mt-12 text-center">
          <h3 className="text-2xl font-semibold text-gray-900 mb-4">
            MASLABS 직원이신가요?
          </h3>
          <p className="text-gray-600 mb-8">
            로그인하여 개인 대시보드와 팀 성과를 확인하세요
          </p>
          <div className="flex justify-center space-x-4">
            <Link
              href="/login"
              className="px-8 py-3 text-lg font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 transition-colors"
            >
              직원 로그인
            </Link>
            <button
              onClick={handleComingSoon}
              className="px-8 py-3 text-lg font-medium text-indigo-600 border-2 border-indigo-600 rounded-md hover:bg-indigo-50 transition-colors cursor-pointer"
            >
              더 알아보기
            </button>
          </div>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="bg-gray-800 text-white mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p>&copy; 2024 MASLABS. All rights reserved.</p>
            <p className="mt-2 text-gray-400">혁신과 열정으로 만드는 미래</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
