'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, Save, ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AddSchedulePage() {
  const router = useRouter();
  const supabaseClient = supabase;
  
  const [formData, setFormData] = useState({
    schedule_date: '2025-08-20',
    scheduled_start: '10:00',
    scheduled_end: '17:00',
    employee_note: '정상 근무'
  });
  
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 현재 로그인한 사용자 정보 가져오기
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (!user) {
        alert('로그인이 필요합니다.');
        return;
      }

      // 사용자의 employee_id 가져오기
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('email', user.email)
        .single();

      if (!employee) {
        alert('직원 정보를 찾을 수 없습니다.');
        return;
      }

      // 스케줄 추가
      const { error } = await supabase
        .from('schedules')
        .insert({
          employee_id: employee.id,
          schedule_date: formData.schedule_date,
          scheduled_start: formData.scheduled_start,
          scheduled_end: formData.scheduled_end,
          status: 'approved',
          employee_note: formData.employee_note
        });

      if (error) throw error;

      alert('스케줄이 성공적으로 추가되었습니다!');
      router.push('/schedules');
    } catch (error) {
      console.error('스케줄 추가 오류:', error);
      alert('스케줄 추가 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto">
        {/* 헤더 */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors mr-3"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Calendar className="h-8 w-8 mr-3 text-blue-600" />
              스케줄 추가
            </h1>
          </div>
        </div>

        {/* 폼 */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 날짜 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                근무 날짜
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  value={formData.schedule_date}
                  onChange={(e) => setFormData({...formData, schedule_date: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* 시작 시간 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시작 시간
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="time"
                  value={formData.scheduled_start}
                  onChange={(e) => setFormData({...formData, scheduled_start: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* 종료 시간 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                종료 시간
              </label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="time"
                  value={formData.scheduled_end}
                  onChange={(e) => setFormData({...formData, scheduled_end: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* 메모 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                메모
              </label>
              <textarea
                value={formData.employee_note}
                onChange={(e) => setFormData({...formData, employee_note: e.target.value})}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                placeholder="근무 관련 메모를 입력하세요..."
              />
            </div>

            {/* 제출 버튼 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  스케줄 저장
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
