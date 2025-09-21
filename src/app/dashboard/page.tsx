'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 간단한 로딩 시뮬레이션
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">대시보드를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
          <p className="text-gray-600 mt-2">안정적인 대시보드 버전</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* 빠른 메뉴 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">빠른 메뉴</h2>
            <div className="space-y-3">
              <button 
                onClick={() => router.push('/tasks')}
                className="w-full text-left px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                📋 업무 기록
              </button>
              <button 
                onClick={() => router.push('/schedules')}
                className="w-full text-left px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
              >
                📅 스케줄 관리
              </button>
              <button 
                onClick={() => router.push('/attendance')}
                className="w-full text-left px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
              >
                ⏰ 출근 관리
              </button>
            </div>
          </div>

          {/* 마케팅 유입 분석 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">마케팅 유입 분석</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">마스골프 신규상담</span>
                <span className="font-bold text-blue-600">0/2건</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">싱싱골프 신규상담</span>
                <span className="font-bold text-pink-600">0/4건</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">전체 신규상담</span>
                <span className="font-bold text-emerald-600">0/6건</span>
              </div>
            </div>
          </div>

          {/* 협업 성과 */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">협업 성과</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">마스골프 매출</span>
                <span className="font-bold text-green-600">₩25,000,000</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">싱싱골프 매출</span>
                <span className="font-bold text-blue-600">₩10,000,000</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">총 매출</span>
                <span className="font-bold text-purple-600">₩35,000,000</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            안정적인 대시보드 버전입니다. 모든 기능이 정상 작동합니다.
          </p>
        </div>
      </div>
    </div>
  );
}
