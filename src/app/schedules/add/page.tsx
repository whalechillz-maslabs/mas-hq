'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Calendar, Clock, Edit, Save, XCircle, User, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

export default function AddSchedulePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [scheduleDate, setScheduleDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('18:00');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const user = await getCurrentUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setCurrentUser(user);
      setLoading(false);
    };
    fetchUser();
  }, [router]);

  const getCurrentUser = async () => {
    if (typeof window !== 'undefined') {
      const isLoggedIn = localStorage.getItem('isLoggedIn');
      const employeeData = localStorage.getItem('currentEmployee');
      
      if (isLoggedIn === 'true' && employeeData) {
        return JSON.parse(employeeData);
      }
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    if (!currentUser?.id) {
      setError('사용자 정보를 찾을 수 없습니다. 다시 로그인해주세요.');
      setSubmitting(false);
      return;
    }

    try {
      const { data, error: insertError } = await supabase
        .from('schedules')
        .insert({
          employee_id: currentUser.id,
          schedule_date: scheduleDate,
          scheduled_start: startTime,
          scheduled_end: endTime,
          employee_note: note,
          status: 'approved', // 기본값으로 승인됨
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      setSuccess('스케줄이 성공적으로 추가되었습니다!');
      
      // 3초 후 스케줄 페이지로 이동
      setTimeout(() => {
        router.push('/schedules');
      }, 3000);
      
    } catch (err: any) {
      console.error('스케줄 추가 오류:', err);
      setError(`스케줄 추가 실패: ${err.message || '알 수 없는 오류'}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 sm:p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl p-6 sm:p-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.push('/schedules')}
            className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center">
            <Calendar className="h-8 w-8 mr-3 text-blue-600" />
            새 스케줄 추가
          </h1>
          <div className="w-10"></div> {/* 균형을 위한 빈 공간 */}
        </div>

        {/* 사용자 정보 */}
        {currentUser && (
          <div className="flex items-center justify-center mb-6 p-4 bg-blue-50 rounded-xl">
            <User className="w-5 h-5 mr-2 text-blue-600" />
            <span className="font-semibold text-blue-900">
              {currentUser.name} ({currentUser.employee_id})
            </span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 날짜 선택 */}
          <div>
            <label htmlFor="scheduleDate" className="block text-lg font-medium text-gray-700 mb-2">
              <Calendar className="inline-block w-5 h-5 mr-2 text-gray-500" />
              근무 날짜
            </label>
            <input
              type="date"
              id="scheduleDate"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
              required
              className="mt-1 block w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 text-lg"
            />
          </div>

          {/* 시간 선택 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label htmlFor="startTime" className="block text-lg font-medium text-gray-700 mb-2">
                <Clock className="inline-block w-5 h-5 mr-2 text-gray-500" />
                시작 시간
              </label>
              <input
                type="time"
                id="startTime"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="mt-1 block w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 text-lg"
              />
            </div>
            <div>
              <label htmlFor="endTime" className="block text-lg font-medium text-gray-700 mb-2">
                <Clock className="inline-block w-5 h-5 mr-2 text-gray-500" />
                종료 시간
              </label>
              <input
                type="time"
                id="endTime"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="mt-1 block w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 text-lg"
              />
            </div>
          </div>

          {/* 메모 */}
          <div>
            <label htmlFor="note" className="block text-lg font-medium text-gray-700 mb-2">
              <Edit className="inline-block w-5 h-5 mr-2 text-gray-500" />
              메모 (선택 사항)
            </label>
            <textarea
              id="note"
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="mt-1 block w-full p-3 border border-gray-300 rounded-xl shadow-sm focus:ring-blue-500 focus:border-blue-500 text-lg"
              placeholder="예: 정상 근무, 외근, 휴가, 회의 등"
            ></textarea>
          </div>

          {/* 오류 메시지 */}
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl relative flex items-center">
              <XCircle className="w-5 h-5 mr-2" />
              <span className="block sm:inline">{error}</span>
            </div>
          )}

          {/* 성공 메시지 */}
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl relative flex items-center">
              <Save className="w-5 h-5 mr-2" />
              <span className="block sm:inline">{success}</span>
            </div>
          )}

          {/* 버튼 */}
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={() => router.push('/schedules')}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-6 rounded-xl shadow-md transition-all duration-200 transform hover:scale-105"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg flex items-center justify-center transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  저장 중...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  스케줄 추가
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
