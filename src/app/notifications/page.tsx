'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  Bell, ArrowLeft, Save, Settings, Mail, MessageSquare, 
  Calendar, AlertTriangle, CheckCircle, X, Eye, EyeOff
} from 'lucide-react';

interface NotificationSettings {
  id?: string;
  employee_id: string;
  email_notifications: boolean;
  slack_notifications: boolean;
  schedule_notifications: boolean;
  task_notifications: boolean;
  urgent_notifications: boolean;
  daily_reports: boolean;
  weekly_reports: boolean;
  monthly_reports: boolean;
  notification_frequency: 'immediate' | 'hourly' | 'daily';
  quiet_hours_start: string;
  quiet_hours_end: string;
  created_at?: string;
  updated_at?: string;
}

export default function NotificationSettingsPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [settings, setSettings] = useState<NotificationSettings>({
    employee_id: '',
    email_notifications: true,
    slack_notifications: true,
    schedule_notifications: true,
    task_notifications: true,
    urgent_notifications: true,
    daily_reports: true,
    weekly_reports: false,
    monthly_reports: false,
    notification_frequency: 'immediate',
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadNotificationSettings();
    }
  }, [currentUser]);

  const checkAuth = async () => {
    if (typeof window !== 'undefined') {
      const isLoggedIn = localStorage.getItem('isLoggedIn');
      const employeeData = localStorage.getItem('currentEmployee');
      
      if (isLoggedIn === 'true' && employeeData) {
        const user = JSON.parse(employeeData);
        setCurrentUser(user);
      } else {
        router.push('/login');
      }
    }
  };

  const loadNotificationSettings = async () => {
    try {
      if (!currentUser) return;

      const { data, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('employee_id', currentUser.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings(data);
      } else {
        // 기본 설정으로 초기화
        setSettings(prev => ({
          ...prev,
          employee_id: currentUser.id
        }));
      }
    } catch (error) {
      console.error('알림 설정 로드 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingChange = (key: keyof NotificationSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = async () => {
    if (!currentUser) return;

    setIsSaving(true);
    try {
      const settingsData = {
        ...settings,
        employee_id: currentUser.id,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('notification_settings')
        .upsert(settingsData, { 
          onConflict: 'employee_id',
          ignoreDuplicates: false 
        });

      if (error) throw error;

      alert('알림 설정이 성공적으로 저장되었습니다.');
    } catch (error) {
      console.error('알림 설정 저장 오류:', error);
      alert('알림 설정 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const resetToDefaults = () => {
    setSettings({
      employee_id: currentUser?.id || '',
      email_notifications: true,
      slack_notifications: true,
      schedule_notifications: true,
      task_notifications: true,
      urgent_notifications: true,
      daily_reports: true,
      weekly_reports: false,
      monthly_reports: false,
      notification_frequency: 'immediate',
      quiet_hours_start: '22:00',
      quiet_hours_end: '08:00'
    });
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
              <h1 className="text-2xl font-bold text-gray-900">알림 설정</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="bg-gray-600 text-white px-6 py-3 rounded-xl hover:bg-gray-700 flex items-center font-semibold transition-all duration-200 shadow-lg"
              >
                {showPreview ? <EyeOff className="h-5 w-5 mr-2" /> : <Eye className="h-5 w-5 mr-2" />}
                {showPreview ? '미리보기 숨기기' : '미리보기'}
              </button>
              <button
                onClick={resetToDefaults}
                className="bg-yellow-600 text-white px-6 py-3 rounded-xl hover:bg-yellow-700 flex items-center font-semibold transition-all duration-200 shadow-lg"
              >
                <Settings className="h-5 w-5 mr-2" />
                기본값으로 초기화
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 flex items-center font-semibold transition-all duration-200 shadow-lg disabled:opacity-50"
              >
                <Save className="h-5 w-5 mr-2" />
                {isSaving ? '저장 중...' : '저장'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 알림 설정 카드 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <Bell className="h-6 w-6 mr-3 text-indigo-600" />
                알림 설정
              </h2>

              {/* 기본 알림 설정 */}
              <div className="space-y-6">
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">기본 알림</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center">
                        <Mail className="h-5 w-5 text-blue-500 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900">이메일 알림</p>
                          <p className="text-sm text-gray-500">이메일로 알림을 받습니다</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.email_notifications}
                          onChange={(e) => handleSettingChange('email_notifications', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center">
                        <MessageSquare className="h-5 w-5 text-green-500 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900">Slack 알림</p>
                          <p className="text-sm text-gray-500">Slack으로 알림을 받습니다</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.slack_notifications}
                          onChange={(e) => handleSettingChange('slack_notifications', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* 업무별 알림 설정 */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">업무별 알림</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 text-purple-500 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900">스케줄 알림</p>
                          <p className="text-sm text-gray-500">스케줄 변경 및 생성 알림</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.schedule_notifications}
                          onChange={(e) => handleSettingChange('schedule_notifications', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900">업무 알림</p>
                          <p className="text-sm text-gray-500">업무 생성 및 완료 알림</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.task_notifications}
                          onChange={(e) => handleSettingChange('task_notifications', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center">
                        <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900">긴급 알림</p>
                          <p className="text-sm text-gray-500">긴급 업무 및 중요 알림</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.urgent_notifications}
                          onChange={(e) => handleSettingChange('urgent_notifications', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* 보고서 알림 설정 */}
                <div className="border-b border-gray-200 pb-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">보고서 알림</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 text-blue-500 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900">일일 보고서</p>
                          <p className="text-sm text-gray-500">매일 스케줄 변경 보고서</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.daily_reports}
                          onChange={(e) => handleSettingChange('daily_reports', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 text-green-500 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900">주간 보고서</p>
                          <p className="text-sm text-gray-500">매주 성과 요약 보고서</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.weekly_reports}
                          onChange={(e) => handleSettingChange('weekly_reports', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center">
                        <Calendar className="h-5 w-5 text-purple-500 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900">월간 보고서</p>
                          <p className="text-sm text-gray-500">매월 성과 요약 보고서</p>
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={settings.monthly_reports}
                          onChange={(e) => handleSettingChange('monthly_reports', e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* 알림 빈도 설정 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">알림 빈도</h3>
                  <div className="p-4 bg-gray-50 rounded-xl">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      알림 수신 빈도
                    </label>
                    <select
                      value={settings.notification_frequency}
                      onChange={(e) => handleSettingChange('notification_frequency', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="immediate">즉시</option>
                      <option value="hourly">시간별</option>
                      <option value="daily">일별</option>
                    </select>
                  </div>
                </div>

                {/* 방해 금지 시간 설정 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">방해 금지 시간</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        시작 시간
                      </label>
                      <input
                        type="time"
                        value={settings.quiet_hours_start}
                        onChange={(e) => handleSettingChange('quiet_hours_start', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        종료 시간
                      </label>
                      <input
                        type="time"
                        value={settings.quiet_hours_end}
                        onChange={(e) => handleSettingChange('quiet_hours_end', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 미리보기 및 요약 */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                <Eye className="h-5 w-5 mr-2 text-indigo-600" />
                설정 요약
              </h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-xl">
                  <h4 className="font-semibold text-blue-900 mb-2">활성 알림</h4>
                  <div className="space-y-2 text-sm">
                    {settings.email_notifications && (
                      <div className="flex items-center text-blue-700">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        이메일 알림
                      </div>
                    )}
                    {settings.slack_notifications && (
                      <div className="flex items-center text-blue-700">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Slack 알림
                      </div>
                    )}
                    {settings.schedule_notifications && (
                      <div className="flex items-center text-blue-700">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        스케줄 알림
                      </div>
                    )}
                    {settings.task_notifications && (
                      <div className="flex items-center text-blue-700">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        업무 알림
                      </div>
                    )}
                    {settings.urgent_notifications && (
                      <div className="flex items-center text-blue-700">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        긴급 알림
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-xl">
                  <h4 className="font-semibold text-green-900 mb-2">보고서</h4>
                  <div className="space-y-2 text-sm">
                    {settings.daily_reports && (
                      <div className="flex items-center text-green-700">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        일일 보고서
                      </div>
                    )}
                    {settings.weekly_reports && (
                      <div className="flex items-center text-green-700">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        주간 보고서
                      </div>
                    )}
                    {settings.monthly_reports && (
                      <div className="flex items-center text-green-700">
                        <CheckCircle className="h-4 w-4 mr-2" />
                        월간 보고서
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-purple-50 rounded-xl">
                  <h4 className="font-semibold text-purple-900 mb-2">설정</h4>
                  <div className="space-y-2 text-sm text-purple-700">
                    <div>빈도: {settings.notification_frequency === 'immediate' ? '즉시' : 
                              settings.notification_frequency === 'hourly' ? '시간별' : '일별'}</div>
                    <div>방해금지: {settings.quiet_hours_start} - {settings.quiet_hours_end}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
