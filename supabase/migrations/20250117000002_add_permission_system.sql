-- ================================================
-- 권한 관리 시스템 즉시 구현
-- Version: 2.1.0
-- Created: 2025-01-17
-- ================================================

-- 1. 팀 구조 테이블 생성
CREATE TABLE IF NOT EXISTS team_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_lead_id UUID NOT NULL REFERENCES employees(id),
    team_member_id UUID NOT NULL REFERENCES employees(id),
    department_id UUID REFERENCES departments(id),
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_lead_id, team_member_id, start_date)
);

-- 2. 업무 유형별 권한 테이블 생성
CREATE TABLE IF NOT EXISTS operation_type_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    operation_type_id UUID NOT NULL REFERENCES operation_types(id),
    role_id UUID NOT NULL REFERENCES roles(id),
    can_create BOOLEAN DEFAULT false,
    can_read BOOLEAN DEFAULT false,
    can_update BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(operation_type_id, role_id)
);

-- 3. 권한 데이터 삽입
INSERT INTO operation_type_permissions (operation_type_id, role_id, can_create, can_read, can_update, can_delete) 
SELECT 
    ot.id,
    r.id,
    CASE 
        -- 관리자: 모든 업무 유형 사용 가능
        WHEN r.name = 'admin' THEN true
        -- 매니저: 팀 관련 업무 유형만
        WHEN r.name = 'manager' AND ot.category IN ('team_lead', 'team_member', 'schedule', 'admin', 'training', 'quality') THEN true
        -- 팀 리더: 팀 관련 업무 유형만
        WHEN r.name = 'team_lead' AND ot.category IN ('team_lead', 'team_member', 'schedule', 'admin', 'training', 'quality') THEN true
        -- 일반 직원: 일반 업무 유형만
        WHEN r.name = 'employee' AND ot.category IN ('team_member', 'admin', 'training', 'quality', 'maintenance') THEN true
        -- 파트타임: 제한된 업무 유형만
        WHEN r.name = 'part_time' AND ot.category IN ('team_member', 'admin', 'quality') THEN true
        ELSE false
    END as can_create,
    true as can_read, -- 모든 역할이 읽기 가능
    CASE 
        WHEN r.name = 'admin' THEN true
        WHEN r.name IN ('manager', 'team_lead') THEN true
        WHEN r.name IN ('employee', 'part_time') THEN false
        ELSE false
    END as can_update,
    CASE 
        WHEN r.name = 'admin' THEN true
        ELSE false
    END as can_delete
FROM operation_types ot
CROSS JOIN roles r
WHERE ot.is_active = true;

-- 4. 권한 확인 함수 생성
CREATE OR REPLACE FUNCTION check_task_permission(
    p_user_id UUID,
    p_task_id UUID,
    p_action TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_role TEXT;
    v_task_employee_id UUID;
    v_is_team_lead BOOLEAN;
    v_is_team_member BOOLEAN;
BEGIN
    -- 사용자 역할 조회
    SELECT r.name INTO v_user_role
    FROM employees e
    JOIN roles r ON e.role_id = r.id
    WHERE e.id = p_user_id;
    
    -- 관리자는 모든 권한
    IF v_user_role = 'admin' THEN
        RETURN true;
    END IF;
    
    -- 업무 정보 조회
    SELECT employee_id INTO v_task_employee_id
    FROM employee_tasks
    WHERE id = p_task_id;
    
    -- 본인 업무는 읽기/수정 가능
    IF v_task_employee_id = p_user_id AND p_action IN ('read', 'update') THEN
        RETURN true;
    END IF;
    
    -- 팀장/매니저는 팀원 업무 조회 가능
    IF v_user_role IN ('manager', 'team_lead') THEN
        -- 팀원인지 확인
        SELECT EXISTS(
            SELECT 1 FROM team_members 
            WHERE team_lead_id = p_user_id 
            AND team_member_id = v_task_employee_id 
            AND is_active = true
        ) INTO v_is_team_member;
        
        IF v_is_team_member THEN
            RETURN true;
        END IF;
    END IF;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql;

-- 5. 업무 유형 권한 확인 함수
CREATE OR REPLACE FUNCTION check_operation_type_permission(
    p_user_id UUID,
    p_operation_type_id UUID,
    p_action TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_role_id UUID;
    v_permission BOOLEAN;
BEGIN
    -- 사용자 역할 ID 조회
    SELECT role_id INTO v_user_role_id
    FROM employees
    WHERE id = p_user_id;
    
    -- 권한 확인
    SELECT 
        CASE p_action
            WHEN 'create' THEN can_create
            WHEN 'read' THEN can_read
            WHEN 'update' THEN can_update
            WHEN 'delete' THEN can_delete
            ELSE false
        END INTO v_permission
    FROM operation_type_permissions
    WHERE operation_type_id = p_operation_type_id
    AND role_id = v_user_role_id;
    
    RETURN COALESCE(v_permission, false);
END;
$$ LANGUAGE plpgsql;

-- 6. 팀원 조회 함수
CREATE OR REPLACE FUNCTION get_team_members(p_team_lead_id UUID)
RETURNS TABLE (
    team_member_id UUID,
    employee_name TEXT,
    employee_id TEXT,
    department_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        tm.team_member_id,
        e.name,
        e.employee_id,
        d.name as department_name
    FROM team_members tm
    JOIN employees e ON tm.team_member_id = e.id
    LEFT JOIN departments d ON e.department_id = d.id
    WHERE tm.team_lead_id = p_team_lead_id
    AND tm.is_active = true
    AND e.is_active = true;
END;
$$ LANGUAGE plpgsql;

-- 7. 샘플 팀 구조 데이터 (관리자를 팀장으로 설정)
INSERT INTO team_members (team_lead_id, team_member_id, department_id)
SELECT 
    (SELECT id FROM employees WHERE employee_id = 'MASLABS-001') as team_lead_id,
    e.id as team_member_id,
    e.department_id
FROM employees e
WHERE e.employee_id != 'MASLABS-001'
AND e.is_active = true
ON CONFLICT DO NOTHING;

-- 8. 인덱스 생성
CREATE INDEX idx_team_members_lead ON team_members(team_lead_id, is_active);
CREATE INDEX idx_team_members_member ON team_members(team_member_id, is_active);
CREATE INDEX idx_operation_permissions_type ON operation_type_permissions(operation_type_id);
CREATE INDEX idx_operation_permissions_role ON operation_type_permissions(role_id);

-- 9. 권한 확인 뷰 생성
CREATE OR REPLACE VIEW user_permissions_summary AS
SELECT 
    e.name as employee_name,
    e.employee_id,
    r.name as role_name,
    d.name as department_name,
    COUNT(tm.team_member_id) as team_members_count,
    COUNT(otp.operation_type_id) as available_task_types
FROM employees e
JOIN roles r ON e.role_id = r.id
LEFT JOIN departments d ON e.department_id = d.id
LEFT JOIN team_members tm ON e.id = tm.team_lead_id AND tm.is_active = true
LEFT JOIN operation_type_permissions otp ON r.id = otp.role_id AND otp.can_create = true
WHERE e.is_active = true
GROUP BY e.id, e.name, e.employee_id, r.name, d.name
ORDER BY r.name, e.name;
