// ================================================
// 권한 관리 시스템
// ================================================

import { supabase } from './supabase';

export interface Permission {
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export interface TeamMember {
  team_member_id: string;
  employee_name: string;
  employee_id: string;
  department_name: string;
}

export interface MenuPermission {
  path: string;
  name: string;
  icon: string;
  description: string;
  roles: string[];
}

/**
 * 업무 권한 확인
 */
export const checkTaskPermission = async (
  userId: string, 
  taskId: string, 
  action: 'create' | 'read' | 'update' | 'delete'
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .rpc('check_task_permission', {
        p_user_id: userId,
        p_task_id: taskId,
        p_action: action
      });

    if (error) throw error;
    return data || false;
  } catch (error) {
    console.error('업무 권한 확인 실패:', error);
    return false;
  }
};

/**
 * 업무 유형 권한 확인
 */
export const checkOperationTypePermission = async (
  userId: string,
  operationTypeId: string,
  action: 'create' | 'read' | 'update' | 'delete'
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .rpc('check_operation_type_permission', {
        p_user_id: userId,
        p_operation_type_id: operationTypeId,
        p_action: action
      });

    if (error) throw error;
    return data || false;
  } catch (error) {
    console.error('업무 유형 권한 확인 실패:', error);
    return false;
  }
};

/**
 * 팀원 목록 조회
 */
export const getTeamMembers = async (teamLeadId: string): Promise<TeamMember[]> => {
  try {
    const { data, error } = await supabase
      .rpc('get_team_members', {
        p_team_lead_id: teamLeadId
      });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('팀원 목록 조회 실패:', error);
    return [];
  }
};

/**
 * 메뉴 권한 설정
 */
export const MENU_PERMISSIONS: MenuPermission[] = [
  // 일반 메뉴 (모든 사용자)
  {
    path: '/schedules',
    name: '근무 스케줄',
    icon: 'Calendar',
    description: '개인 근무 스케줄 확인 및 신청',
    roles: ['admin', 'manager', 'team_lead', 'employee', 'part_time']
  },
  {
    path: '/salary',
    name: '급여 조회',
    icon: 'DollarSign',
    description: '개인 급여 및 성과급 조회',
    roles: ['admin', 'manager', 'team_lead', 'employee', 'part_time']
  },
  {
    path: '/tasks',
    name: '업무 기록',
    icon: 'BarChart3',
    description: '개인 업무 기록 및 KPI 관리',
    roles: ['admin', 'manager', 'team_lead', 'employee', 'part_time']
  },
  {
    path: '/organization',
    name: '조직도',
    icon: 'Users',
    description: '회사 조직도 및 팀 구조 확인',
    roles: ['admin', 'manager', 'team_lead', 'employee', 'part_time']
  },
  {
    path: '/leave',
    name: '연차 신청',
    icon: 'CalendarDays',
    description: '연차 신청 및 잔여일 조회',
    roles: ['admin', 'manager', 'team_lead', 'employee', 'part_time']
  },
  
  // 관리자 전용 메뉴
  {
    path: '/admin/hr-policy',
    name: '인사정책 관리',
    icon: 'Award',
    description: '성과급 체계 및 KPI 관리',
    roles: ['admin']
  },
  {
    path: '/admin/team-evaluation',
    name: '팀원 평가',
    icon: 'Users',
    description: '팀원 KPI 측정 및 평가',
    roles: ['admin', 'manager']
  },
  {
    path: '/admin/attendance-management',
    name: '출근 관리',
    icon: 'Clock',
    description: '직원 출근체크 위치/시간 확인',
    roles: ['admin', 'manager']
  },
  {
    path: '/admin/brand',
    name: '브랜드 포트폴리오',
    icon: 'Package',
    description: '브랜드 굿즈 제작 진행 현황 및 포트폴리오 관리',
    roles: ['admin', 'manager']
  },
  {
    path: '/admin/employee-migration',
    name: '직원 데이터 관리',
    icon: 'Database',
    description: '직원 정보 마이그레이션 및 관리',
    roles: ['admin']
  }
];

/**
 * 사용자별 접근 가능한 메뉴 조회
 */
export const getUserAccessibleMenus = (userRole: string): MenuPermission[] => {
  return MENU_PERMISSIONS.filter(menu => 
    menu.roles.includes(userRole)
  );
};

/**
 * 특정 메뉴 접근 권한 확인
 */
export const canAccessMenu = (userRole: string, menuPath: string): boolean => {
  const menu = MENU_PERMISSIONS.find(m => m.path === menuPath);
  return menu ? menu.roles.includes(userRole) : false;
};

/**
 * 사용자별 사용 가능한 업무 유형 조회
 */
export const getAvailableOperationTypes = async (userId: string): Promise<any[]> => {
  try {
    // 사용자 정보 조회
    const { data: user, error: userError } = await supabase
      .from('employees')
      .select('role_id')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    // 권한에 따른 업무 유형 조회
    const { data, error } = await supabase
      .from('operation_type_permissions')
      .select(`
        operation_type:operation_types(*)
      `)
      .eq('role_id', user.role_id)
      .eq('can_create', true);

    if (error) throw error;
    return data?.map(item => item.operation_type) || [];
  } catch (error) {
    console.error('사용 가능한 업무 유형 조회 실패:', error);
    return [];
  }
};

/**
 * 역할별 권한 확인
 */
export const checkRolePermission = (userRole: string, requiredRole: string): boolean => {
  const roleHierarchy = {
    'admin': 5,
    'manager': 4,
    'team_lead': 3,
    'employee': 2,
    'part_time': 1
  };

  const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
  const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;

  return userLevel >= requiredLevel;
};

/**
 * 사용자별 업무 조회 권한 확인
 */
export const canViewAllTasks = (userRole: string): boolean => {
  return ['admin', 'manager', 'team_lead'].includes(userRole);
};

/**
 * 사용자별 업무 수정 권한 확인
 */
export const canEditTasks = (userRole: string): boolean => {
  return ['admin', 'manager', 'team_lead'].includes(userRole);
};

/**
 * 사용자별 업무 삭제 권한 확인
 */
export const canDeleteTasks = (userRole: string): boolean => {
  return ['admin'].includes(userRole);
};
