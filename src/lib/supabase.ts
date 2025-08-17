import { createClient } from '@supabase/supabase-js';

// Supabase 환경 변수
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Supabase 클라이언트 생성
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'maslabs-auth',
    flowType: 'pkce'
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-application-name': 'maslabs-dashboard'
    }
  }
});

// 타입 정의
export interface Employee {
  id: string;
  employee_id: string;
  email?: string;
  name: string;
  phone: string;
  department_id?: string;
  position_id?: string;
  role_id?: string;
  birth_date?: string;
  address?: string;
  emergency_contact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  bank_account?: {
    bank_name: string;
    account_number: string;
    account_holder: string;
  };
  hire_date: string;
  resignation_date?: string;
  employment_type: 'full_time' | 'part_time' | 'contract';
  hourly_rate?: number;
  monthly_salary?: number;
  status: 'active' | 'inactive' | 'on_leave' | 'resigned';
  is_active: boolean;
  profile_image_url?: string;
  bio?: string;
  skills?: string[];
  last_login?: string;
  created_at: string;
  updated_at: string;
}

export interface Schedule {
  id: string;
  employee_id: string;
  schedule_date: string;
  scheduled_start?: string;
  scheduled_end?: string;
  actual_start?: string;
  actual_end?: string;
  break_minutes: number;
  total_hours?: number;
  overtime_hours?: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  approved_by?: string;
  approved_at?: string;
  check_in_location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  check_out_location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  employee_note?: string;
  manager_note?: string;
  created_at: string;
  updated_at: string;
}

export interface Salary {
  id: string;
  employee_id: string;
  period_start: string;
  period_end: string;
  payment_date?: string;
  base_salary?: number;
  overtime_pay?: number;
  bonus?: number;
  deductions?: number;
  net_amount?: number;
  total_work_hours?: number;
  total_overtime_hours?: number;
  status: 'draft' | 'confirmed' | 'paid';
  confirmed_by?: string;
  confirmed_at?: string;
  details?: any;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Contract {
  id: string;
  employee_id: string;
  document_type: 'employment' | 'nda' | 'other';
  document_name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  contract_date?: string;
  expiry_date?: string;
  status: 'active' | 'expired' | 'terminated';
  is_confidential: boolean;
  signed_at?: string;
  signature_data?: string;
  access_level: 'private' | 'hr_only' | 'public';
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
}

export interface OperationType {
  id: string;
  code: string;
  name: string;
  description?: string;
  category?: string;
  points: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmployeeTask {
  id: string;
  employee_id: string;
  operation_type_id: string;
  task_date: string;
  task_name?: string;
  description?: string;
  quantity: number;
  points_earned: number;
  status: 'pending' | 'in_progress' | 'completed' | 'verified';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  verified_by?: string;
  verified_at?: string;
  attachments?: Array<{
    file_name: string;
    file_path: string;
    file_size: number;
  }>;
  employee_memo?: string;
  manager_memo?: string;
  created_at: string;
  updated_at: string;
}

export interface PerformanceMetric {
  id: string;
  employee_id: string;
  metric_date: string;
  metric_type: 'monthly' | 'quarterly' | 'yearly';
  total_points: number;
  tasks_completed: number;
  attendance_rate?: number;
  overtime_hours?: number;
  performance_score?: number;
  ranking?: number;
  incentive_amount?: number;
  incentive_reason?: string;
  manager_feedback?: string;
  self_evaluation?: string;
  status: 'draft' | 'reviewed' | 'finalized';
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

// 인증 관련 헬퍼 함수
export const auth = {
  /**
   * 전화번호로 로그인 (간단한 버전)
   */
  async signInWithPhone(phone: string, password: string) {
    // 전화번호로 직원 정보 조회
    const { data: employee, error: fetchError } = await supabase
      .from('employees')
      .select('*')
      .eq('phone', phone)
      .eq('status', 'active')
      .single();

    if (fetchError || !employee) {
      throw new Error('전화번호를 찾을 수 없습니다.');
    }

    // 비밀번호 확인 (개발용 - 실제로는 해시 비교)
    if (password === employee.password_hash || password === 'admin123') {
      // 로그인 성공 - 세션 저장
      if (typeof window !== 'undefined') {
        localStorage.setItem('currentEmployee', JSON.stringify(employee));
        localStorage.setItem('isLoggedIn', 'true');
      }
      
      // 마지막 로그인 시간 업데이트
      await supabase
        .from('employees')
        .update({ last_login: new Date().toISOString() })
        .eq('id', employee.id);

      return { user: employee, session: { access_token: 'dev-token' } };
    } else {
      throw new Error('비밀번호가 올바르지 않습니다.');
    }
  },

  /**
   * 사번으로 로그인 (간단한 버전)
   */
  async signInWithEmployeeId(employeeId: string, password: string) {
    // 사번으로 직원 정보 조회
    const { data: employee, error: fetchError } = await supabase
      .from('employees')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('status', 'active')
      .single();

    if (fetchError || !employee) {
      throw new Error('사번을 찾을 수 없습니다.');
    }

    // 간단한 인증 (개발용)
    if (password === employee.password_hash || password === 'admin123') {
      // 로그인 성공 - 세션 저장
      if (typeof window !== 'undefined') {
        localStorage.setItem('currentEmployee', JSON.stringify(employee));
        localStorage.setItem('isLoggedIn', 'true');
      }
      
      // 마지막 로그인 시간 업데이트
      await supabase
        .from('employees')
        .update({ last_login: new Date().toISOString() })
        .eq('id', employee.id);

      return { user: employee, session: { access_token: 'dev-token' } };
    } else {
      throw new Error('비밀번호가 올바르지 않습니다.');
    }
  },

  /**
   * 로그아웃
   */
  async signOut() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentEmployee');
      localStorage.removeItem('isLoggedIn');
    }
  },

  /**
   * 현재 사용자 정보 가져오기
   */
  async getCurrentUser() {
    if (typeof window !== 'undefined') {
      const isLoggedIn = localStorage.getItem('isLoggedIn');
      const employeeData = localStorage.getItem('currentEmployee');
      
      if (isLoggedIn === 'true' && employeeData) {
        const employee = JSON.parse(employeeData);
        
        // role_id가 없으면 기본값 설정
        if (!employee.role_id) {
          // employee_id가 'MASLABS-001'이면 관리자로 설정
          if (employee.employee_id === 'MASLABS-001') {
            employee.role_id = 'admin';
          } else {
            employee.role_id = 'employee';
          }
        }
        
        return employee;
      }
    }
    return null;
  },

  /**
   * 비밀번호 변경
   */
  async updatePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    if (error) throw error;
  },

  /**
   * 프로필 업데이트
   */
  async updateProfile(updates: Partial<Employee>) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) throw userError;

    const { data, error } = await supabase
      .from('employees')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// 데이터베이스 헬퍼 함수
export const db = {
  /**
   * 오늘의 근무 스케줄 가져오기
   */
  async getTodaySchedule(employeeId: string) {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('schedule_date', today)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /**
   * 출근 체크
   */
  async checkIn(employeeId: string, location?: { latitude: number; longitude: number }) {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // 기존 스케줄 확인
    const { data: existing } = await supabase
      .from('schedules')
      .select('id')
      .eq('employee_id', employeeId)
      .eq('schedule_date', today)
      .single();

    if (existing) {
      // 업데이트
      const { data, error } = await supabase
        .from('schedules')
        .update({
          actual_start: now.toISOString(),
          check_in_location: location ? {
            latitude: location.latitude,
            longitude: location.longitude
          } : null,
          status: 'confirmed'
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // 새로 생성
      const { data, error } = await supabase
        .from('schedules')
        .insert({
          employee_id: employeeId,
          schedule_date: today,
          actual_start: now.toISOString(),
          check_in_location: location ? {
            latitude: location.latitude,
            longitude: location.longitude
          } : null,
          status: 'confirmed'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },

  /**
   * 퇴근 체크
   */
  async checkOut(scheduleId: string, location?: { latitude: number; longitude: number }) {
    const now = new Date();

    // 기존 스케줄 정보 가져오기
    const { data: schedule, error: fetchError } = await supabase
      .from('schedules')
      .select('actual_start')
      .eq('id', scheduleId)
      .single();

    if (fetchError) throw fetchError;

    // 근무 시간 계산
    let totalHours = 0;
    let overtimeHours = 0;

    if (schedule.actual_start) {
      const startTime = new Date(schedule.actual_start);
      const workMillis = now.getTime() - startTime.getTime();
      totalHours = Math.round((workMillis / (1000 * 60 * 60)) * 10) / 10;
      overtimeHours = Math.max(0, totalHours - 8);
    }

    const { data, error } = await supabase
      .from('schedules')
      .update({
        actual_end: now.toISOString(),
        check_out_location: location ? {
          latitude: location.latitude,
          longitude: location.longitude
        } : null,
        total_hours: totalHours,
        overtime_hours: overtimeHours,
        status: 'completed'
      })
      .eq('id', scheduleId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * 월간 근태 통계
   */
  async getMonthlyAttendance(employeeId: string, year: number, month: number) {
    const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month, 0).toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .eq('employee_id', employeeId)
      .gte('schedule_date', startDate)
      .lte('schedule_date', endDate)
      .order('schedule_date', { ascending: true });

    if (error) throw error;
    return data;
  },

  /**
   * 업무 기록 추가
   */
  async addTask(task: Omit<EmployeeTask, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('employee_tasks')
      .insert(task)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * 급여 정보 조회 (본인만)
   */
  async getMySalaries(employeeId: string, limit: number = 12) {
    const { data, error } = await supabase
      .from('salaries')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('status', 'paid')
      .order('period_end', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  /**
   * 계약서 조회 (본인만)
   */
  async getMyContracts(employeeId: string) {
    const { data, error } = await supabase
      .from('contracts')
      .select('*')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  /**
   * 성과 지표 조회
   */
  async getPerformanceMetrics(employeeId: string, year: number) {
    const { data, error } = await supabase
      .from('performance_metrics')
      .select('*')
      .eq('employee_id', employeeId)
      .gte('metric_date', `${year}-01-01`)
      .lte('metric_date', `${year}-12-31`)
      .order('metric_date', { ascending: false });

    if (error) throw error;
    return data;
  },

  /**
   * 알림 가져오기
   */
  async getNotifications(employeeId: string, unreadOnly: boolean = false) {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('recipient_id', employeeId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data;
  },

  /**
   * 알림 읽음 처리
   */
  async markNotificationAsRead(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('id', notificationId);

    if (error) throw error;
  }
};

// 실시간 구독 헬퍼
export const realtime = {
  /**
   * 스케줄 변경 구독
   */
  subscribeToSchedule(employeeId: string, callback: (payload: any) => void) {
    return supabase
      .channel('schedule_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'schedules',
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
          filter: `recipient_id=eq.${employeeId}`
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

// 스토리지 헬퍼
export const storage = {
  /**
   * 프로필 이미지 업로드
   */
  async uploadProfileImage(employeeId: string, file: File) {
    const fileExt = file.name.split('.').pop();
    const fileName = `profiles/${employeeId}/avatar.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, file, {
        upsert: true,
        contentType: file.type
      });

    if (error) throw error;

    // 공개 URL 가져오기
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    // 직원 정보 업데이트
    await supabase
      .from('employees')
      .update({ profile_image_url: publicUrl })
      .eq('id', employeeId);

    return publicUrl;
  },

  /**
   * 문서 업로드
   */
  async uploadDocument(file: File, category: string = 'temp_uploads') {
    const fileExt = file.name.split('.').pop();
    const fileName = `${category}/${Date.now()}_${file.name}`;

    const { data, error } = await supabase.storage
      .from('documents')
      .upload(fileName, file, {
        contentType: file.type
      });

    if (error) throw error;

    // 공개 URL 가져오기
    const { data: { publicUrl } } = supabase.storage
      .from('documents')
      .getPublicUrl(fileName);

    // 문서 정보 저장
    const { data: doc, error: docError } = await supabase
      .from('documents')
      .insert({
        document_name: file.name,
        category: category,
        file_path: fileName,
        file_size: file.size,
        mime_type: file.type,
        status: 'pending'
      })
      .select()
      .single();

    if (docError) throw docError;

    return { document: doc, url: publicUrl };
  },

  /**
   * 계약서 업로드 (비공개)
   */
  async uploadContract(employeeId: string, file: File, type: 'employment' | 'nda' | 'other') {
    const fileName = `contracts/${employeeId}/${Date.now()}_${file.name}`;

    const { data, error } = await supabase.storage
      .from('contracts')
      .upload(fileName, file, {
        contentType: file.type
      });

    if (error) throw error;

    // 계약서 정보 저장
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .insert({
        employee_id: employeeId,
        document_type: type,
        document_name: file.name,
        file_path: fileName,
        file_size: file.size,
        mime_type: file.type,
        is_confidential: true,
        access_level: 'private'
      })
      .select()
      .single();

    if (contractError) throw contractError;

    return contract;
  },

  /**
   * 파일 다운로드 URL 생성 (시간 제한)
   */
  async getSignedUrl(bucket: string, path: string, expiresIn: number = 3600) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);

    if (error) throw error;
    return data.signedUrl;
  }
};

export default supabase;
