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
  net_salary?: number;
  created_at: string;
  updated_at: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  manager_id?: string;
  created_at: string;
  updated_at: string;
}

export interface Position {
  id: string;
  name: string;
  description?: string;
  level?: number;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions?: string[];
  created_at: string;
  updated_at: string;
}

export interface EmployeeTask {
  id: string;
  employee_id: string;
  operation_type: string;
  title: string;
  customer_name?: string;
  sales_amount?: number;
  points?: number;
  notes?: string;
  achievement_status: 'pending' | 'completed' | 'refunded';
  created_at: string;
  updated_at: string;
}

export interface OperationType {
  id: string;
  code: string;
  name: string;
  description: string;
  points: number;
  created_at: string;
  updated_at: string;
}

// 인증 헬퍼 함수
export const auth = {
  /**
   * 전화번호로 로그인 (localStorage 기반만 사용)
   */
  async signInWithPhone(phone: string, password: string) {
    try {
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

      // 기본 패스워드: 전화번호 뒷 8자리 (예: 010-6669-9000 -> 66699000)
      const defaultPassword = phone.replace(/\D/g, '').slice(-8);
      
      // 비밀번호 확인 (개발용 - 실제로는 해시 비교)
      if (password === employee.password_hash || 
          password === defaultPassword) {
        
        // localStorage에 사용자 정보 저장
        if (typeof window !== 'undefined') {
          localStorage.setItem('currentEmployee', JSON.stringify(employee));
          localStorage.setItem('isLoggedIn', 'true');
          console.log('✅ 로그인 성공 - localStorage에 사용자 정보 저장됨');
        }
        
        // 마지막 로그인 시간 업데이트
        await supabase
          .from('employees')
          .update({ last_login: new Date().toISOString() })
          .eq('id', employee.id);

        return { user: employee, session: { access_token: 'local-token' } };
      } else {
        throw new Error('비밀번호가 올바르지 않습니다.');
      }
    } catch (error) {
      console.error('로그인 오류:', error);
      throw error;
    }
  },

  /**
   * 사번으로 로그인 (localStorage 기반만 사용)
   */
  async signInWithEmployeeId(employeeId: string, password: string) {
    try {
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

      // 기본 패스워드: 전화번호 뒷 8자리
      const defaultPassword = employee.phone.replace(/\D/g, '').slice(-8);
      
      // 간단한 인증 (개발용)
      if (password === employee.password_hash || 
          password === defaultPassword) {
        // 로그인 성공 - 세션 저장
        if (typeof window !== 'undefined') {
          localStorage.setItem('currentEmployee', JSON.stringify(employee));
          localStorage.setItem('isLoggedIn', 'true');
          console.log('✅ 로그인 성공 - localStorage에 사용자 정보 저장됨');
        }
        
        // 마지막 로그인 시간 업데이트
        await supabase
          .from('employees')
          .update({ last_login: new Date().toISOString() })
          .eq('id', employee.id);

        return { user: employee, session: { access_token: 'local-token' } };
      } else {
        throw new Error('비밀번호가 올바르지 않습니다.');
      }
    } catch (error) {
      console.error('로그인 오류:', error);
      throw error;
    }
  },

  /**
   * 핀번호로 로그인 (사용자 식별자 + 핀번호)
   */
  async signInWithPin(userIdentifier: string, pinCode: string) {
    try {
      // 사용자 식별자로 직원 찾기 (전화번호 또는 사번)
      let employee;
      
      // 전화번호로 검색
      const { data: phoneData, error: phoneError } = await supabase
        .from('employees')
        .select('*')
        .eq('phone', userIdentifier)
        .single();
      
      if (phoneData && !phoneError) {
        employee = phoneData;
      } else {
        // 사번으로 검색
        const { data: employeeData, error: employeeError } = await supabase
          .from('employees')
          .select('*')
          .eq('employee_id', userIdentifier)
          .single();
        
        if (employeeError || !employeeData) {
          throw new Error('사용자를 찾을 수 없습니다.');
        }
        employee = employeeData;
      }
      
      // 핀번호 확인
      if (employee.pin_code === pinCode) {
        // 로그인 성공
        if (typeof window !== 'undefined') {
          localStorage.setItem('currentEmployee', JSON.stringify(employee));
          localStorage.setItem('isLoggedIn', 'true');
          localStorage.setItem('lastActivity', Date.now().toString());
        }
        return { user: employee, session: { access_token: 'local-token' } };
      } else {
        throw new Error('핀번호가 올바르지 않습니다.');
      }
    } catch (error: any) {
      if (error.message) {
        throw error;
      } else {
        throw new Error('로그인에 실패했습니다.');
      }
    }
  },

  /**
   * 로그아웃
   */
  async signOut() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('currentEmployee');
      localStorage.removeItem('isLoggedIn');
      console.log('✅ 로그아웃 완료 - localStorage 정리됨');
    }
  },

  /**
   * 현재 사용자 정보 가져오기 (localStorage 기반)
   */
  async getCurrentUser() {
    try {
      // localStorage에서 사용자 정보 가져오기
      if (typeof window !== 'undefined') {
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        const employeeData = localStorage.getItem('currentEmployee');
        
        if (isLoggedIn === 'true' && employeeData) {
          const employee = JSON.parse(employeeData);
          console.log('✅ getCurrentUser - localStorage에서 사용자 정보 로드됨');
          return employee;
        }
      }
      
      console.log('❌ getCurrentUser - 로그인된 사용자 없음');
      return null;
    } catch (error) {
      console.error('getCurrentUser 오류:', error);
      return null;
    }
  },

  /**
   * 비밀번호 변경 (localStorage 기반 사용자용)
   */
  async updatePassword(newPassword: string) {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        throw new Error('로그인된 사용자가 없습니다.');
      }

      // 데이터베이스에서 비밀번호 업데이트
      const { error } = await supabase
        .from('employees')
        .update({ password_hash: newPassword })
        .eq('id', currentUser.id);

      if (error) throw error;
      
      console.log('✅ 비밀번호 변경 완료');
      return { success: true };
    } catch (error) {
      console.error('비밀번호 변경 오류:', error);
      throw error;
    }
  },

  /**
   * 프로필 업데이트 (localStorage 기반 사용자용)
   */
  async updateProfile(updates: Partial<Employee>) {
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        throw new Error('로그인된 사용자가 없습니다.');
      }

      const { data, error } = await supabase
        .from('employees')
        .update(updates)
        .eq('id', currentUser.id)
        .select()
        .single();

      if (error) throw error;
      
      // localStorage 업데이트
      if (typeof window !== 'undefined') {
        const updatedEmployee = { ...currentUser, ...data };
        localStorage.setItem('currentEmployee', JSON.stringify(updatedEmployee));
        console.log('✅ 프로필 업데이트 완료 - localStorage 업데이트됨');
      }
      
      return data;
    } catch (error) {
      console.error('프로필 업데이트 오류:', error);
      throw error;
    }
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
   * 이번 달 근무 스케줄 가져오기
   */
  async getMonthlySchedules(employeeId: string, year: number, month: number) {
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
   * 직원 업무 목록 가져오기
   */
  async getEmployeeTasks(employeeId: string, status?: string) {
    let query = supabase
      .from('employee_tasks')
      .select('*')
      .eq('employee_id', employeeId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('achievement_status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  /**
   * 직원 정보 가져오기
   */
  async getEmployee(employeeId: string) {
    const { data, error } = await supabase
      .from('employees')
      .select(`
        *,
        department:departments(name),
        position:positions(name),
        role:roles(name)
      `)
      .eq('id', employeeId)
      .single();

    if (error) throw error;
    return data;
  }
};
