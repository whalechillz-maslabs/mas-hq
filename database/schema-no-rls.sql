-- ================================================
-- MASLABS 직원 대시보드 시스템 데이터베이스 스키마 (테스트용)
-- Version: 1.0.0 - No RLS
-- Created: 2025-01-17
-- ================================================

-- ====================================
-- 1. 부서 (Departments) 테이블
-- ====================================
CREATE TABLE IF NOT EXISTS departments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 기본 부서 데이터
INSERT INTO departments (name, code, description) VALUES 
('운영팀', 'HQ', '본사 운영 관리'),
('개발팀', 'DEV', '소프트웨어 개발'),
('디자인팀', 'DESIGN', '디자인 및 UI/UX'),
('마케팅팀', 'MARKETING', '마케팅 및 홍보'),
('싱싱팀', 'SING', '싱싱 관련 업무'),
('마스팀', 'MAS', '마스 관련 업무')
ON CONFLICT (code) DO NOTHING;

-- ====================================
-- 2. 직급 (Positions) 테이블
-- ====================================
CREATE TABLE IF NOT EXISTS positions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    level INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 기본 직급 데이터
INSERT INTO positions (name, level, description) VALUES 
('대표이사', 1, 'CEO'),
('이사', 2, 'Director'),
('부장', 3, 'General Manager'),
('차장', 4, 'Deputy General Manager'),
('과장', 5, 'Manager'),
('대리', 6, 'Assistant Manager'),
('주임', 7, 'Senior Staff'),
('사원', 8, 'Staff'),
('인턴', 9, 'Intern'),
('파트타임', 10, 'Part-time')
ON CONFLICT DO NOTHING;

-- ====================================
-- 3. 역할 (Roles) 테이블 - 권한 관리
-- ====================================
CREATE TABLE IF NOT EXISTS roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 기본 역할 데이터
INSERT INTO roles (name, description, permissions) VALUES 
('admin', '시스템 관리자', '{"all": true}'),
('manager', '매니저/팀장', '{"employees": true, "schedules": true, "salaries": true, "tasks": true}'),
('team_lead', '팀 리더', '{"team_schedules": true, "team_tasks": true, "team_reports": true}'),
('employee', '일반 직원', '{"self": true, "view_schedules": true}'),
('part_time', '파트타임 직원', '{"self": true, "view_schedules": true}')
ON CONFLICT (name) DO NOTHING;

-- ====================================
-- 4. 직원 (Employees) 테이블
-- ====================================
CREATE TABLE IF NOT EXISTS employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id VARCHAR(20) UNIQUE NOT NULL, -- MASLABS-001 형식
    email VARCHAR(255) UNIQUE,
    name VARCHAR(100) NOT NULL,
    nickname VARCHAR(50), -- 닉네임 추가
    phone VARCHAR(20) UNIQUE NOT NULL, -- 로그인 키
    password_hash TEXT, -- 비밀번호 해시
    pin_code VARCHAR(4), -- 핀번호 추가
    department_id UUID REFERENCES departments(id),
    position_id UUID REFERENCES positions(id),
    role_id UUID REFERENCES roles(id),
    
    -- 개인 정보
    birth_date DATE,
    address TEXT,
    emergency_contact JSONB, -- {name, phone, relationship}
    bank_account JSONB, -- {bank_name, account_number, account_holder}
    
    -- 고용 정보
    hire_date DATE NOT NULL,
    employment_type VARCHAR(20) DEFAULT 'full_time', -- full_time, part_time, contract
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, terminated
    hourly_rate DECIMAL(10,2), -- 시급 (파트타임용)
    
    -- 시스템 정보
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- 5. 근무 스케줄 (Schedules) 테이블
-- ====================================
CREATE TABLE IF NOT EXISTS schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    schedule_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    break_time INTEGER DEFAULT 0, -- 분 단위
    work_hours DECIMAL(4,2),
    status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, checked_in, checked_out, absent
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, schedule_date)
);

-- ====================================
-- 6. 업무 기록 (Employee Tasks) 테이블
-- ====================================
CREATE TABLE IF NOT EXISTS employee_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    task_date DATE NOT NULL,
    operation_type_id UUID, -- 작업 유형 참조
    description TEXT NOT NULL,
    start_time TIME,
    end_time TIME,
    duration_hours DECIMAL(4,2),
    status VARCHAR(20) DEFAULT 'completed', -- pending, in_progress, completed, cancelled
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
    tags TEXT[], -- 태그 배열
    attachments JSONB, -- 첨부파일 정보
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- 7. 급여 (Salaries) 테이블
-- ====================================
CREATE TABLE IF NOT EXISTS salaries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    base_salary DECIMAL(12,2),
    overtime_pay DECIMAL(12,2) DEFAULT 0,
    bonus DECIMAL(12,2) DEFAULT 0,
    deductions DECIMAL(12,2) DEFAULT 0,
    net_salary DECIMAL(12,2),
    payment_date DATE,
    status VARCHAR(20) DEFAULT 'pending', -- pending, paid, cancelled
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, period_start, period_end)
);

-- ====================================
-- 8. 계약서 (Contracts) 테이블
-- ====================================
CREATE TABLE IF NOT EXISTS contracts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    contract_type VARCHAR(50) NOT NULL, -- full_time, part_time, contract, internship
    start_date DATE NOT NULL,
    end_date DATE,
    base_salary DECIMAL(12,2),
    working_hours_per_week INTEGER,
    probation_period_months INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active', -- active, expired, terminated
    document_url TEXT,
    terms_and_conditions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- 9. 문서 (Documents) 테이블
-- ====================================
CREATE TABLE IF NOT EXISTS documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100), -- policy, manual, form, announcement
    document_type VARCHAR(50), -- pdf, doc, image, video
    file_url TEXT,
    file_size BIGINT,
    description TEXT,
    tags TEXT[],
    is_public BOOLEAN DEFAULT false,
    created_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- 10. 성과 지표 (Performance Metrics) 테이블
-- ====================================
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    metric_date DATE NOT NULL,
    metric_type VARCHAR(50) NOT NULL, -- productivity, quality, attendance, teamwork
    metric_value DECIMAL(5,2),
    target_value DECIMAL(5,2),
    unit VARCHAR(20), -- %, hours, count, score
    notes TEXT,
    evaluated_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, metric_date, metric_type)
);

-- ====================================
-- 11. 알림 (Notifications) 테이블
-- ====================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recipient_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- schedule, task, salary, announcement, system
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, urgent
    action_url TEXT, -- 클릭 시 이동할 URL
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- 12. 감사 로그 (Audit Logs) 테이블
-- ====================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES employees(id),
    action VARCHAR(100) NOT NULL, -- create, update, delete, login, logout
    entity_type VARCHAR(50), -- employee, schedule, task, salary
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- 13. 세션 (Sessions) 테이블
-- ====================================
CREATE TABLE IF NOT EXISTS sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- 14. 팀 멤버 (Team Members) 테이블
-- ====================================
CREATE TABLE IF NOT EXISTS team_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    team_lead_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    team_member_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE,
    role_in_team VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_lead_id, team_member_id, start_date)
);

-- ====================================
-- 15. 작업 유형 (Operation Types) 테이블
-- ====================================
CREATE TABLE IF NOT EXISTS operation_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50), -- golf, maintenance, admin, customer_service
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- 16. 작업 유형 권한 (Operation Type Permissions) 테이블
-- ====================================
CREATE TABLE IF NOT EXISTS operation_type_permissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    operation_type_id UUID REFERENCES operation_types(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    can_create BOOLEAN DEFAULT false,
    can_read BOOLEAN DEFAULT true,
    can_update BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(operation_type_id, role_id)
);

-- ====================================
-- 기본 작업 유형 데이터
-- ====================================
INSERT INTO operation_types (code, name, description, category) VALUES 
('GOLF_LESSON', '골프 레슨', '골프 레슨 제공', 'golf'),
('GOLF_CLUB_FITTING', '골프 클럽 피팅', '골프 클럽 피팅 서비스', 'golf'),
('GOLF_CLUB_REPAIR', '골프 클럽 수리', '골프 클럽 수리 및 정비', 'maintenance'),
('GOLF_CLUB_SALES', '골프 클럽 판매', '골프 클럽 및 용품 판매', 'sales'),
('CUSTOMER_SERVICE', '고객 서비스', '고객 문의 및 상담', 'customer_service'),
('ADMIN_WORK', '행정 업무', '일반 행정 업무', 'admin'),
('INVENTORY_MANAGEMENT', '재고 관리', '상품 재고 관리', 'admin'),
('CLEANING', '청소', '시설 청소 및 정리', 'maintenance'),
('EQUIPMENT_MAINTENANCE', '장비 정비', '골프장 장비 정비', 'maintenance'),
('MARKETING', '마케팅', '마케팅 및 홍보 활동', 'marketing')
ON CONFLICT (code) DO NOTHING;

-- ====================================
-- 작업 유형 권한 설정
-- ====================================
INSERT INTO operation_type_permissions (operation_type_id, role_id, can_create, can_read, can_update, can_delete)
SELECT 
    ot.id as operation_type_id,
    r.id as role_id,
    CASE 
        WHEN r.name IN ('admin', 'manager') THEN true
        WHEN r.name = 'team_lead' AND ot.category IN ('golf', 'customer_service') THEN true
        WHEN r.name = 'employee' AND ot.category IN ('golf', 'customer_service') THEN true
        WHEN r.name = 'part_time' AND ot.category IN ('golf', 'customer_service') THEN true
        ELSE false
    END as can_create,
    true as can_read,
    CASE 
        WHEN r.name IN ('admin', 'manager') THEN true
        WHEN r.name = 'team_lead' AND ot.category IN ('golf', 'customer_service') THEN true
        WHEN r.name = 'employee' AND ot.category IN ('golf', 'customer_service') THEN true
        WHEN r.name = 'part_time' AND ot.category IN ('golf', 'customer_service') THEN true
        ELSE false
    END as can_update,
    CASE 
        WHEN r.name IN ('admin', 'manager') THEN true
        ELSE false
    END as can_delete
FROM operation_types ot
CROSS JOIN roles r
ON CONFLICT (operation_type_id, role_id) DO NOTHING;

-- ====================================
-- 초기 데이터 설정
-- ====================================

-- 관리자 계정 생성
INSERT INTO employees (
    employee_id,
    email,
    name,
    phone,
    department_id,
    position_id,
    role_id,
    hire_date,
    employment_type,
    status,
    password_hash
) VALUES (
    'MASLABS-001',
    'admin@maslabs.kr',
    '시스템 관리자',
    '010-6669-9000',
    (SELECT id FROM departments WHERE code = 'MGMT'),
    (SELECT id FROM positions WHERE name = '대표이사'),
    (SELECT id FROM roles WHERE name = 'admin'),
    '2025-01-01',
    'full_time',
    'active',
    '66699000'
) ON CONFLICT (employee_id) DO UPDATE SET
    password_hash = '66699000',
    updated_at = CURRENT_TIMESTAMP;

-- 박진 계정 생성
INSERT INTO employees (
    employee_id,
    email,
    name,
    phone,
    department_id,
    position_id,
    role_id,
    hire_date,
    employment_type,
    status,
    hourly_rate,
    password_hash,
    nickname,
    pin_code
) VALUES (
    'MASLABS-004',
    'park.jin@maslabs.kr',
    '박진(JIN)',
    '010-9132-4337',
    (SELECT id FROM departments WHERE code = 'STORE'),
    (SELECT id FROM positions WHERE name = '파트타임'),
    (SELECT id FROM roles WHERE name = 'part_time'),
    '2025-07-29',
    'part_time',
    'active',
    12000,
    '91324337',
    'JIN',
    '1234'
) ON CONFLICT (employee_id) DO UPDATE SET
    password_hash = '91324337',
    nickname = 'JIN',
    pin_code = '1234',
    updated_at = CURRENT_TIMESTAMP;

-- ====================================
-- 인덱스 최적화
-- ====================================
CREATE INDEX IF NOT EXISTS idx_employees_phone ON employees(phone);
CREATE INDEX IF NOT EXISTS idx_employees_employee_id ON employees(employee_id);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);

CREATE INDEX IF NOT EXISTS idx_schedules_employee_date ON schedules(employee_id, schedule_date);
CREATE INDEX IF NOT EXISTS idx_schedules_date ON schedules(schedule_date);
CREATE INDEX IF NOT EXISTS idx_schedules_status ON schedules(status);

CREATE INDEX IF NOT EXISTS idx_tasks_employee_date ON employee_tasks(employee_id, task_date);
CREATE INDEX IF NOT EXISTS idx_tasks_operation_type ON employee_tasks(operation_type_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON employee_tasks(status);

CREATE INDEX IF NOT EXISTS idx_salaries_employee ON salaries(employee_id);
CREATE INDEX IF NOT EXISTS idx_salaries_period ON salaries(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_salaries_status ON salaries(status);

CREATE INDEX IF NOT EXISTS idx_documents_category ON documents(category);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(is_public);

CREATE INDEX IF NOT EXISTS idx_metrics_employee ON performance_metrics(employee_id);
CREATE INDEX IF NOT EXISTS idx_metrics_date ON performance_metrics(metric_date);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_sessions_employee ON sessions(employee_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_team_members_lead ON team_members(team_lead_id);
CREATE INDEX IF NOT EXISTS idx_team_members_member ON team_members(team_member_id);

CREATE INDEX IF NOT EXISTS idx_operation_permissions_type ON operation_type_permissions(operation_type_id);
CREATE INDEX IF NOT EXISTS idx_operation_permissions_role ON operation_type_permissions(role_id);

-- ====================================
-- 권한 설정 (RLS 없음)
-- ====================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ====================================
-- 완료 메시지
-- ====================================
DO $$
BEGIN
    RAISE NOTICE 'MASLABS 직원 대시보드 데이터베이스 스키마 생성 완료 (RLS 비활성화)';
    RAISE NOTICE '총 16개 테이블, 다수의 인덱스 생성됨';
END $$;
