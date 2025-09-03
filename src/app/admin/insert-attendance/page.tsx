'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';

export default function InsertAttendancePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');

  const insertCorrectAttendance = async () => {
    try {
      setIsLoading(true);
      setMessage('🚀 정확한 출근 데이터 입력 시작...');
      setMessageType('info');

      // 1. 허상원의 UUID 조회
      const { data: employee, error: employeeError } = await supabase
        .from('employees')
        .select('id')
        .eq('employee_id', 'HEO')
        .single();

      if (employeeError || !employee) {
        throw new Error('허상원 직원을 찾을 수 없습니다.');
      }

      // 2. 기존 9월 3일 데이터 삭제
      setMessage('🗑️ 기존 테스트 데이터 삭제 중...');
      const { error: deleteError } = await supabase
        .from('schedules')
        .delete()
        .eq('schedule_date', '2025-09-03')
        .eq('employee_id', employee.id);

      if (deleteError) {
        throw new Error(`기존 데이터 삭제 오류: ${deleteError.message}`);
      }

      // 3. 정시 출근/퇴근 데이터 입력
      setMessage('📝 정시 출근/퇴근 데이터 입력 중...');
      
      const schedules = [
        // 09:00-12:00 (3시간)
        { start: '09:00', end: '09:30', actual_start: '2025-09-03T09:00:00+09:00', actual_end: '2025-09-03T09:30:00+09:00' },
        { start: '09:30', end: '10:00', actual_start: '2025-09-03T09:30:00+09:00', actual_end: '2025-09-03T10:00:00+09:00' },
        { start: '10:00', end: '10:30', actual_start: '2025-09-03T10:00:00+09:00', actual_end: '2025-09-03T10:30:00+09:00' },
        { start: '10:30', end: '11:00', actual_start: '2025-09-03T10:30:00+09:00', actual_end: '2025-09-03T11:00:00+09:00' },
        { start: '11:00', end: '11:30', actual_start: '2025-09-03T11:00:00+09:00', actual_end: '2025-09-03T11:30:00+09:00' },
        { start: '11:30', end: '12:00', actual_start: '2025-09-03T11:30:00+09:00', actual_end: '2025-09-03T12:00:00+09:00' },
        
        // 13:00-17:30 (4.5시간) - 점심시간 12:00-13:00 제외
        { start: '13:00', end: '13:30', actual_start: '2025-09-03T13:00:00+09:00', actual_end: '2025-09-03T13:30:00+09:00' },
        { start: '13:30', end: '14:00', actual_start: '2025-09-03T13:30:00+09:00', actual_end: '2025-09-03T14:00:00+09:00' },
        { start: '14:00', end: '14:30', actual_start: '2025-09-03T14:00:00+09:00', actual_end: '2025-09-03T14:30:00+09:00' },
        { start: '14:30', end: '15:00', actual_start: '2025-09-03T14:30:00+09:00', actual_end: '2025-09-03T15:00:00+09:00' },
        { start: '15:00', end: '15:30', actual_start: '2025-09-03T15:00:00+09:00', actual_end: '2025-09-03T15:30:00+09:00' },
        { start: '15:30', end: '16:00', actual_start: '2025-09-03T15:30:00+09:00', actual_end: '2025-09-03T16:00:00+09:00' },
        { start: '16:00', end: '16:30', actual_start: '2025-09-03T16:00:00+09:00', actual_end: '2025-09-03T16:30:00+09:00' },
        { start: '16:30', end: '17:00', actual_start: '2025-09-03T16:30:00+09:00', actual_end: '2025-09-03T17:00:00+09:00' },
        { start: '17:00', end: '17:30', actual_start: '2025-09-03T17:00:00+09:00', actual_end: '2025-09-03T17:30:00+09:00' }
      ];

      for (const schedule of schedules) {
        const { error: insertError } = await supabase
          .from('schedules')
          .insert({
            employee_id: employee.id,
            schedule_date: '2025-09-03',
            scheduled_start: schedule.start,
            scheduled_end: schedule.end,
            actual_start: schedule.actual_start,
            actual_end: schedule.actual_end,
            status: 'completed',
            total_hours: 0.5
          });

        if (insertError) {
          throw new Error(`스케줄 입력 오류: ${insertError.message}`);
        }
      }

      // 4. 입력된 데이터 확인
      setMessage('🔍 입력된 데이터 확인 중...');
      const { data: insertedData, error: selectError } = await supabase
        .from('schedules')
        .select(`
          schedule_date,
          scheduled_start,
          scheduled_end,
          actual_start,
          actual_end,
          total_hours,
          status
        `)
        .eq('schedule_date', '2025-09-03')
        .eq('employee_id', employee.id)
        .order('scheduled_start');

      if (selectError) {
        throw new Error(`데이터 조회 오류: ${selectError.message}`);
      }

      const totalHours = insertedData.reduce((sum, record) => sum + record.total_hours, 0);
      
      setMessage(`🎉 정확한 출근 데이터 입력 완료! 총 ${insertedData.length}개 스케줄, ${totalHours}시간`);
      setMessageType('success');

    } catch (error: any) {
      setMessage(`❌ 오류 발생: ${error.message}`);
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            📝 출근 데이터 입력 관리
          </h1>

          <div className="space-y-6">
            {/* 현재 상태 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-blue-900 mb-4 flex items-center">
                <Clock className="h-6 w-6 mr-2" />
                현재 상황
              </h2>
              <div className="space-y-2 text-blue-800">
                <p>• 허상원(HEO)의 9월 3일 출근 데이터가 부정확함</p>
                <p>• "완료된 시간 5.9시간"이 표시되는 문제</p>
                <p>• 정시 출근(09:00) → 정시 퇴근(17:30) 데이터 필요</p>
                <p>• 점심시간 12:00-13:00 제외, 총 7.5시간 근무</p>
              </div>
            </div>

            {/* 데이터 입력 버튼 */}
            <div className="text-center">
              <button
                onClick={insertCorrectAttendance}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-8 py-4 rounded-xl text-xl font-bold disabled:opacity-50 shadow-lg transform hover:scale-105 transition-all"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    처리중...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    <CheckCircle className="h-6 w-6 mr-3" />
                    정시 출근/퇴근 데이터 입력
                  </span>
                )}
              </button>
            </div>

            {/* 메시지 표시 */}
            {message && (
              <div className={`p-4 rounded-lg border ${
                messageType === 'success' 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : messageType === 'error'
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}>
                <div className="flex items-center">
                  {messageType === 'success' ? (
                    <CheckCircle className="h-5 w-5 mr-2" />
                  ) : messageType === 'error' ? (
                    <AlertCircle className="h-5 w-5 mr-2" />
                  ) : (
                    <Clock className="h-5 w-5 mr-2" />
                  )}
                  <span className="font-medium">{message}</span>
                </div>
              </div>
            )}

            {/* 입력될 데이터 미리보기 */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">📋 입력될 데이터 미리보기</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-lg border">
                  <h4 className="font-semibold text-blue-600 mb-2">오전 근무 (09:00-12:00)</h4>
                  <p className="text-sm text-gray-600">3시간, 6개 스케줄</p>
                  <p className="text-xs text-gray-500">정시 출근 → 정시 퇴근</p>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                  <h4 className="font-semibold text-green-600 mb-2">오후 근무 (13:00-17:30)</h4>
                  <p className="text-sm text-gray-600">4.5시간, 9개 스케줄</p>
                  <p className="text-xs text-gray-500">점심시간 12:00-13:00 제외</p>
                </div>
              </div>
              <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                <p className="text-sm text-blue-800 font-medium">
                  💡 총 근무시간: 7.5시간 (15개 30분 스케줄)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
