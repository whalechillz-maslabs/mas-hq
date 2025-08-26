-- ================================================
-- MASLABS 직원 대시보드 시스템 데이터베이스 스키마
-- Version: 1.0.0
-- Created: 2025-01-15
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
    phone VARCHAR(20) UNIQUE NOT NULL, -- 로그인 키
    password_hash TEXT, -- 비밀번호 해시
    pin_code VARCHAR(10), -- 핀번호 (로그인용)
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
    resignation_date DATE,
    employment_type VARCHAR(20) DEFAULT 'full_time', -- full_time, part_time, contract
    hourly_rate DECIMAL(10,2), -- 시급 (파트타임용)
    monthly_salary DECIMAL(12,2), -- 월급 (정규직용)
    
    -- 상태
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, on_leave, resigned
    is_active BOOLEAN DEFAULT true,
    
    -- 프로필
    nickname VARCHAR(50), -- 닉네임
    profile_image_url TEXT,
    bio TEXT,
    skills JSONB, -- ["스킬1", "스킬2"]
    
    -- 메타데이터
    user_meta JSONB DEFAULT '{}',
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_employees_phone ON employees(phone);
CREATE INDEX idx_employees_employee_id ON employees(employee_id);
CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_employees_status ON employees(status);

-- ====================================
-- 5. 근무 스케줄 (Schedules) 테이블
-- ====================================
CREATE TABLE IF NOT EXISTS schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    schedule_date DATE NOT NULL,
    
    -- 예정 시간
    scheduled_start TIME,
    scheduled_end TIME,
    
    -- 실제 시간
    actual_start TIMESTAMP WITH TIME ZONE,
    actual_end TIMESTAMP WITH TIME ZONE,
    
    -- 근무 정보
    break_minutes INTEGER DEFAULT 0,
    total_hours DECIMAL(4,2),
    overtime_hours DECIMAL(4,2),
    
    -- 상태
    status VARCHAR(20) DEFAULT 'pending', -- pending, confirmed, completed, cancelled
    approved_by UUID REFERENCES employees(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    
    -- 위치 정보
    check_in_location JSONB, -- {latitude, longitude, address}
    check_out_location JSONB,
    
    -- 메모
    employee_note TEXT,
    manager_note TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(employee_id, schedule_date)
);

-- 인덱스
CREATE INDEX idx_schedules_employee_date ON schedules(employee_id, schedule_date);
CREATE INDEX idx_schedules_date ON schedules(schedule_date);
CREATE INDEX idx_schedules_status ON schedules(status);

-- ====================================
-- 6. 급여 (Salaries) 테이블
-- ====================================
CREATE TABLE IF NOT EXISTS salaries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    
    -- 급여 기간
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    payment_date DATE,
    
    -- 급여 내역
    base_salary DECIMAL(12,2), -- 기본급
    overtime_pay DECIMAL(10,2), -- 연장근무 수당
    bonus DECIMAL(10,2), -- 보너스
    deductions DECIMAL(10,2), -- 공제액
    net_amount DECIMAL(12,2), -- 실수령액
    
    -- 근무 시간
    total_work_hours DECIMAL(6,2),
    total_overtime_hours DECIMAL(6,2),
    
    -- 상태
    status VARCHAR(20) DEFAULT 'draft', -- draft, confirmed, paid
    confirmed_by UUID REFERENCES employees(id),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    
    -- 상세 내역
    details JSONB, -- 세부 급여 항목
    
    -- 메모
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(employee_id, period_start, period_end)
);

-- 인덱스
CREATE INDEX idx_salaries_employee ON salaries(employee_id);
CREATE INDEX idx_salaries_period ON salaries(period_start, period_end);
CREATE INDEX idx_salaries_status ON salaries(status);

-- ====================================
-- 7. 계약서 (Contracts) 테이블
-- ====================================
CREATE TABLE IF NOT EXISTS contracts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    
    -- 문서 정보
    document_type VARCHAR(50) NOT NULL, -- employment, nda, other
    document_name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    
    -- 계약 정보
    contract_date DATE,
    expiry_date DATE,
    
    -- 상태
    status VARCHAR(20) DEFAULT 'active', -- active, expired, terminated
    is_confidential BOOLEAN DEFAULT true,
    
    -- 서명
    signed_at TIMESTAMP WITH TIME ZONE,
    signature_data TEXT, -- 전자서명 데이터
    
    -- 접근 제어
    access_level VARCHAR(20) DEFAULT 'private', -- private, hr_only, public
    
    uploaded_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_contracts_employee ON contracts(employee_id);
CREATE INDEX idx_contracts_type ON contracts(document_type);

-- ====================================
-- 8. 업무 유형 (Operation Types) 테이블
-- ====================================
CREATE TABLE IF NOT EXISTS operation_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL, -- OP1, OP2, etc.
    name VARCHAR(100) NOT NULL,
    description TEXT,
    category VARCHAR(50), -- sales, admin, development, etc.
    points INTEGER DEFAULT 0, -- 성과 포인트
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 기본 업무 유형
INSERT INTO operation_types (code, name, category, points) VALUES 
('OP1', '고객 응대', 'sales', 10),
('OP2', '재고 관리', 'admin', 8),
('OP3', '매출 관리', 'sales', 12),
('OP4', '문서 작성', 'admin', 6),
('OP5', '프로젝트 개발', 'development', 15),
('OP6', '디자인 작업', 'design', 12),
('OP7', '마케팅 캠페인', 'marketing', 14),
('OP8', '교육 진행', 'training', 10),
('OP9', '품질 검사', 'quality', 8),
('OP10', '기타 업무', 'other', 5)
ON CONFLICT (code) DO NOTHING;

-- ====================================
-- 9. 직원 업무 기록 (Employee Tasks) 테이블
-- ====================================
CREATE TABLE IF NOT EXISTS employee_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    operation_type_id UUID NOT NULL REFERENCES operation_types(id),
    
    -- 업무 정보
    task_date DATE NOT NULL,
    task_name VARCHAR(255),
    description TEXT,
    
    -- 성과
    quantity INTEGER DEFAULT 1,
    points_earned INTEGER DEFAULT 0,
    
    -- 상태
    status VARCHAR(20) DEFAULT 'pending', -- pending, in_progress, completed, verified
    priority VARCHAR(10) DEFAULT 'normal', -- low, normal, high, urgent
    
    -- 검증
    verified_by UUID REFERENCES employees(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    
    -- 첨부파일
    attachments JSONB, -- [{file_name, file_path, file_size}]
    
    -- 메모
    employee_memo TEXT,
    manager_memo TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_tasks_employee_date ON employee_tasks(employee_id, task_date);
CREATE INDEX idx_tasks_operation_type ON employee_tasks(operation_type_id);
CREATE INDEX idx_tasks_status ON employee_tasks(status);

-- ====================================
-- 10. 성과 지표 (Performance Metrics) 테이블
-- ====================================
CREATE TABLE IF NOT EXISTS performance_metrics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    
    -- 측정 기간
    metric_date DATE NOT NULL,
    metric_type VARCHAR(50) NOT NULL, -- monthly, quarterly, yearly
    
    -- 성과 지표
    total_points INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    attendance_rate DECIMAL(5,2), -- 출근율 %
    overtime_hours DECIMAL(6,2),
    
    -- 평가
    performance_score DECIMAL(5,2), -- 0-100
    ranking INTEGER, -- 순위
    
    -- 인센티브
    incentive_amount DECIMAL(10,2),
    incentive_reason TEXT,
    
    -- 피드백
    manager_feedback TEXT,
    self_evaluation TEXT,
    
    -- 상태
    status VARCHAR(20) DEFAULT 'draft', -- draft, reviewed, finalized
    reviewed_by UUID REFERENCES employees(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(employee_id, metric_date, metric_type)
);

-- 인덱스
CREATE INDEX idx_metrics_employee ON performance_metrics(employee_id);
CREATE INDEX idx_metrics_date ON performance_metrics(metric_date);

-- ====================================
-- 11. 문서 관리 (Documents) 테이블
-- ====================================
CREATE TABLE IF NOT EXISTS documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- 문서 정보
    document_name VARCHAR(255) NOT NULL,
    document_type VARCHAR(50), -- manual, guide, policy, report, etc.
    category VARCHAR(50), -- docs, manuals, backups, temp_uploads
    
    -- 파일 정보
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    
    -- 접근 제어
    access_level VARCHAR(20) DEFAULT 'internal', -- public, internal, restricted, private
    department_id UUID REFERENCES departments(id),
    
    -- 버전 관리
    version VARCHAR(20),
    is_latest BOOLEAN DEFAULT true,
    
    -- 상태
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, archived
    approved_by UUID REFERENCES employees(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    
    -- 메타데이터
    tags JSONB, -- ["태그1", "태그2"]
    metadata JSONB,
    
    uploaded_by UUID REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_documents_category ON documents(category);
CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_status ON documents(status);

-- ====================================
-- 12. 알림 (Notifications) 테이블
-- ====================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- 수신자
    recipient_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    
    -- 알림 정보
    type VARCHAR(50) NOT NULL, -- schedule, salary, task, document, system
    title VARCHAR(200) NOT NULL,
    message TEXT,
    
    -- 관련 데이터
    related_id UUID, -- 관련 레코드 ID
    related_type VARCHAR(50), -- 관련 테이블명
    action_url TEXT, -- 클릭 시 이동할 URL
    
    -- 상태
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- 우선순위
    priority VARCHAR(10) DEFAULT 'normal', -- low, normal, high, urgent
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_notifications_recipient ON notifications(recipient_id, is_read);
CREATE INDEX idx_notifications_type ON notifications(type);

-- ====================================
-- 13. 감사 로그 (Audit Logs) 테이블
-- ====================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- 행위자
    user_id UUID REFERENCES employees(id),
    user_name VARCHAR(100),
    user_role VARCHAR(50),
    
    -- 액션
    action VARCHAR(50) NOT NULL, -- create, read, update, delete, login, logout
    entity_type VARCHAR(50), -- 테이블명
    entity_id UUID, -- 레코드 ID
    
    -- 변경 내용
    old_values JSONB,
    new_values JSONB,
    
    -- 컨텍스트
    ip_address INET,
    user_agent TEXT,
    request_method VARCHAR(10),
    request_path TEXT,
    
    -- 결과
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at);

-- ====================================
-- 14. 세션 (Sessions) 테이블
-- ====================================
CREATE TABLE IF NOT EXISTS sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    
    -- 세션 정보
    session_token TEXT UNIQUE NOT NULL,
    refresh_token TEXT,
    
    -- 디바이스 정보
    device_info JSONB, -- {type, os, browser, version}
    ip_address INET,
    
    -- 유효 기간
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- 상태
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스
CREATE INDEX idx_sessions_employee ON sessions(employee_id);
CREATE INDEX idx_sessions_token ON sessions(session_token);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- ====================================
-- 뷰 (Views)
-- ====================================

-- 직원 상세 정보 뷰
CREATE OR REPLACE VIEW employee_details AS
SELECT 
    e.id,
    e.employee_id,
    e.name,
    e.email,
    e.phone,
    e.status,
    d.name as department_name,
    p.name as position_name,
    r.name as role_name,
    e.hire_date,
    e.employment_type,
    e.last_login
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
LEFT JOIN positions p ON e.position_id = p.id
LEFT JOIN roles r ON e.role_id = r.id;

-- 월별 근태 요약 뷰
CREATE OR REPLACE VIEW monthly_attendance_summary AS
SELECT 
    employee_id,
    DATE_TRUNC('month', schedule_date) as month,
    COUNT(*) as total_days,
    COUNT(CASE WHEN status = 'completed' THEN 1 END) as worked_days,
    SUM(total_hours) as total_hours,
    SUM(overtime_hours) as overtime_hours
FROM schedules
WHERE status IN ('completed', 'confirmed')
GROUP BY employee_id, DATE_TRUNC('month', schedule_date);

-- 업무 성과 요약 뷰
CREATE OR REPLACE VIEW task_performance_summary AS
SELECT 
    et.employee_id,
    DATE_TRUNC('month', et.task_date) as month,
    COUNT(*) as total_tasks,
    COUNT(CASE WHEN et.status = 'completed' THEN 1 END) as completed_tasks,
    SUM(et.points_earned) as total_points,
    STRING_AGG(DISTINCT ot.name, ', ') as task_types
FROM employee_tasks et
JOIN operation_types ot ON et.operation_type_id = ot.id
GROUP BY et.employee_id, DATE_TRUNC('month', et.task_date);

-- ====================================
-- 트리거 함수
-- ====================================

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 각 테이블에 트리거 적용
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN 
        SELECT table_name 
        FROM information_schema.columns 
        WHERE column_name = 'updated_at' 
        AND table_schema = 'public'
    LOOP
        EXECUTE format('
            CREATE TRIGGER update_%I_updated_at 
            BEFORE UPDATE ON %I 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column()',
            t, t);
    END LOOP;
END $$;

-- 직원 ID 자동 생성 트리거
CREATE OR REPLACE FUNCTION generate_employee_id()
RETURNS TRIGGER AS $$
DECLARE
    next_number INTEGER;
BEGIN
    -- MASLABS-XXX 형식으로 생성
    SELECT COALESCE(MAX(SUBSTRING(employee_id FROM 9)::INTEGER), 0) + 1
    INTO next_number
    FROM employees
    WHERE employee_id LIKE 'MASLABS-%';
    
    NEW.employee_id = 'MASLABS-' || LPAD(next_number::TEXT, 3, '0');
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER generate_employee_id_trigger
BEFORE INSERT ON employees
FOR EACH ROW
WHEN (NEW.employee_id IS NULL)
EXECUTE FUNCTION generate_employee_id();

-- 감사 로그 트리거
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (
        user_id,
        action,
        entity_type,
        entity_id,
        old_values,
        new_values
    ) VALUES (
        current_setting('app.current_user_id', true)::UUID,
        TG_OP,
        TG_TABLE_NAME,
        CASE 
            WHEN TG_OP = 'DELETE' THEN OLD.id
            ELSE NEW.id
        END,
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
    );
    
    RETURN CASE
        WHEN TG_OP = 'DELETE' THEN OLD
        ELSE NEW
    END;
END;
$$ language 'plpgsql';

-- 중요 테이블에 감사 로그 트리거 적용
CREATE TRIGGER audit_employees AFTER INSERT OR UPDATE OR DELETE ON employees
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_salaries AFTER INSERT OR UPDATE OR DELETE ON salaries
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
CREATE TRIGGER audit_contracts AFTER INSERT OR UPDATE OR DELETE ON contracts
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- ====================================
-- Row Level Security (RLS) 정책
-- ====================================

-- 모든 테이블에 RLS 활성화
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE salaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 직원 테이블 정책
CREATE POLICY "Employees can view own profile" ON employees
    FOR SELECT USING (id = auth.uid()::UUID OR auth.uid()::UUID IN (
        SELECT id FROM employees WHERE role_id IN (
            SELECT id FROM roles WHERE name IN ('admin', 'manager')
        )
    ));

CREATE POLICY "Managers can update employees" ON employees
    FOR UPDATE USING (auth.uid()::UUID IN (
        SELECT id FROM employees WHERE role_id IN (
            SELECT id FROM roles WHERE name IN ('admin', 'manager')
        )
    ));

-- 급여 테이블 정책 (본인만 조회 가능)
CREATE POLICY "Employees can view own salary" ON salaries
    FOR SELECT USING (employee_id = auth.uid()::UUID OR auth.uid()::UUID IN (
        SELECT id FROM employees WHERE role_id IN (
            SELECT id FROM roles WHERE name = 'admin'
        )
    ));

-- 계약서 테이블 정책 (본인 + HR만 조회)
CREATE POLICY "View own contracts" ON contracts
    FOR SELECT USING (employee_id = auth.uid()::UUID OR auth.uid()::UUID IN (
        SELECT id FROM employees WHERE role_id IN (
            SELECT id FROM roles WHERE name IN ('admin', 'manager')
        )
    ));

-- ====================================
-- 초기 데이터 설정
-- ====================================

-- 초기 직원 데이터 생성
INSERT INTO employees (
    employee_id,
    email,
    name,
    phone,
    password_hash,
    pin_code,
    department_id,
    position_id,
    role_id,
    hire_date,
    employment_type,
    status,
    is_active,
    nickname
) VALUES 
(
    'MASLABS-001',
    'admin@maslabs.kr',
    '시스템 관리자',
    '010-6669-9000',
    '66699000',
    '1234',
    (SELECT id FROM departments WHERE code = 'HQ'),
    (SELECT id FROM positions WHERE name = '대표이사'),
    (SELECT id FROM roles WHERE name = 'admin'),
    '2025-08-19',
    'full_time',
    'active',
    true,
    '관리자'
),
(
    'MASLABS-004',
    'eunjung@maslabs.kr',
    '이은정',
    '010-1234-5678',
    '12345678',
    '1234',
    (SELECT id FROM departments WHERE code = 'HQ'),
    (SELECT id FROM positions WHERE name = '사원'),
    (SELECT id FROM roles WHERE name = 'employee'),
    '2025-08-19',
    'full_time',
    'active',
    true,
    '은정'
),
(
    'MASLABS-005',
    'park.jin@maslabs.kr',
    '박진',
    '010-9876-5432',
    '12345678',
    '1234',
    (SELECT id FROM departments WHERE code = 'MAS'),
    (SELECT id FROM positions WHERE name = '파트타임'),
    (SELECT id FROM roles WHERE name = 'employee'),
    '2025-08-20',
    'part_time',
    'active',
    true,
    '박진'
) ON CONFLICT (employee_id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    pin_code = EXCLUDED.pin_code,
    updated_at = NOW();

-- ====================================
-- 인덱스 최적화
-- ====================================
CREATE INDEX IF NOT EXISTS idx_schedules_search ON schedules(employee_id, schedule_date, status);
CREATE INDEX IF NOT EXISTS idx_tasks_search ON employee_tasks(employee_id, task_date, status);
CREATE INDEX IF NOT EXISTS idx_salaries_search ON salaries(employee_id, period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_performance_search ON performance_metrics(employee_id, metric_date);

-- ====================================
-- 권한 설정
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
    RAISE NOTICE 'MASLABS 직원 대시보드 데이터베이스 스키마 생성 완료';
    RAISE NOTICE '총 14개 테이블, 3개 뷰, 다수의 트리거 및 정책 생성됨';
END $$;
