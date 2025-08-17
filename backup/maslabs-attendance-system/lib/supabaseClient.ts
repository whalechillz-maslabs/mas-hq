import { createClient } from '@supabase/supabase-js';

// 환경 변수에서 Supabase 설정 가져오기
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Supabase 클라이언트 생성
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-application-name': 'maslabs-attendance'
    }
  }
});

// 인증 헬퍼 함수들
export const auth = {
  /**
   * 로그인
   */
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    return data;
  },

  /**
   * 로그아웃
   */
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  /**
   * 현재 사용자 가져오기
   */
  async getUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  /**
   * 세션 가져오기
   */
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
  },

  /**
   * 비밀번호 재설정 이메일 전송
   */
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    if (error) throw error;
  },

  /**
   * 비밀번호 업데이트
   */
  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) throw error;
  },

  /**
   * 사용자 메타데이터 업데이트
   */
  async updateUserMetadata(metadata: any) {
    const { error } = await supabase.auth.updateUser({
      data: metadata
    });
    if (error) throw error;
  }
};

// 데이터베이스 헬퍼 함수들
export const db = {
  /**
   * 직원 정보 가져오기
   */
  async getEmployee(userId: string) {
    const { data, error } = await supabase
      .from('employees')
      .select(`
        *,
        department:departments(name, code),
        position:positions(name, level),
        role:roles(name, description)
      `)
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * 오늘의 근태 정보 가져오기
   */
  async getTodayAttendance(employeeId: string) {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('work_date', today)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // 데이터가 없는 경우는 무시
    return data;
  },

  /**
   * 출근 체크
   */
  async checkIn(employeeId: string, location?: { latitude: number; longitude: number }) {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('attendance')
      .insert({
        employee_id: employeeId,
        work_date: today,
        check_in_time: now.toISOString(),
        work_type_id: '1', // 정상근무
        status: 'pending',
        location: location ? {
          latitude: location.latitude,
          longitude: location.longitude
        } : null,
        device_info: {
          user_agent: navigator.userAgent,
          platform: navigator.platform
        }
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * 퇴근 체크
   */
  async checkOut(attendanceId: string) {
    const now = new Date();
    
    // 기존 출근 기록 가져오기
    const { data: attendance, error: fetchError } = await supabase
      .from('attendance')
      .select('check_in_time')
      .eq('id', attendanceId)
      .single();
    
    if (fetchError) throw fetchError;
    
    // 근무 시간 계산
    const checkInTime = new Date(attendance.check_in_time);
    const workHours = (now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60);
    const overtimeHours = Math.max(0, workHours - 9); // 9시간 (8시간 + 1시간 휴식) 초과분
    
    const { data, error } = await supabase
      .from('attendance')
      .update({
        check_out_time: now.toISOString(),
        work_hours: Math.round(workHours * 10) / 10,
        overtime_hours: Math.round(overtimeHours * 10) / 10
      })
      .eq('id', attendanceId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * 휴가 신청
   */
  async requestLeave(leaveData: {
    employeeId: string;
    workTypeId: string;
    startDate: string;
    endDate: string;
    reason?: string;
    halfDayType?: 'AM' | 'PM';
  }) {
    const { data, error } = await supabase
      .from('leave_requests')
      .insert({
        employee_id: leaveData.employeeId,
        work_type_id: leaveData.workTypeId,
        start_date: leaveData.startDate,
        end_date: leaveData.endDate,
        reason: leaveData.reason,
        half_day_type: leaveData.halfDayType,
        status: 'pending'
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  /**
   * 근태 통계 가져오기
   */
  async getAttendanceStats(employeeId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', employeeId)
      .gte('work_date', startDate)
      .lte('work_date', endDate);
    
    if (error) throw error;
    
    // 통계 계산
    const stats = {
      totalDays: data.length,
      presentDays: data.filter(d => d.status === 'approved').length,
      lateDays: data.filter(d => {
        if (!d.check_in_time) return false;
        const checkIn = new Date(d.check_in_time);
        return checkIn.getHours() > 9 || (checkIn.getHours() === 9 && checkIn.getMinutes() > 0);
      }).length,
      absentDays: 0, // 계산 로직 추가 필요
      totalWorkHours: data.reduce((sum, d) => sum + (d.work_hours || 0), 0),
      totalOvertimeHours: data.reduce((sum, d) => sum + (d.overtime_hours || 0), 0)
    };
    
    return stats;
  }
};

// 실시간 구독 헬퍼 함수들
export const realtime = {
  /**
   * 근태 변경 사항 구독
   */
  subscribeToAttendance(employeeId: string, callback: (payload: any) => void) {
    return supabase
      .channel('attendance_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'attendance',
          filter: `employee_id=eq.${employeeId}`
        },
        callback
      )
      .subscribe();
  },

  /**
   * 알림 구독
   */
  subscribeToNotifications(employeeId: string, callback: (payload: any) => void) {
    return supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `employee_id=eq.${employeeId}`
        },
        callback
      )
      .subscribe();
  },

  /**
   * 구독 해제
   */
  unsubscribe(channel: any) {
    supabase.removeChannel(channel);
  }
};

// 스토리지 헬퍼 함수들
export const storage = {
  /**
   * 프로필 이미지 업로드
   */
  async uploadProfileImage(employeeId: string, file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `${employeeId}/profile.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('profiles')
      .upload(fileName, file, {
        upsert: true
      });
    
    if (error) throw error;
    
    // 공개 URL 가져오기
    const { data: { publicUrl } } = supabase.storage
      .from('profiles')
      .getPublicUrl(fileName);
    
    return publicUrl;
  },

  /**
   * 첨부파일 업로드
   */
  async uploadAttachment(file: File, folder: string = 'attachments') {
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('documents')
      .upload(fileName, file);
    
    if (error) throw error;
    
    // 공개 URL 가져오기
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName);
    
    return publicUrl;
  },

  /**
   * 파일 삭제
   */
  async deleteFile(bucket: string, path: string) {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);
    
    if (error) throw error;
  }
};

export default supabase;
