-- MASLABS 근태관리 시스템 데이터베이스 스키마
-- 기반: go2.singsinggolf.kr 시스템에서 추출 및 수정

-- ====================================
-- 1. 역할 (Roles) 테이블
-- ====================================
CREATE TABLE IF NOT EXISTS roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 기본 역할 추가
INSERT INTO roles (name, description, permissions) VALUES 
('admin', '관리자', '{"all": true}'),
('hr_manager', 'HR 매니저', '{"attendance": true, "employee": true, "reports": true}'),
('team_lead', '팀장', '{"attendance": true, "team_reports": true}'),
('employee', '직원', '{"self_attendance": true, "self_info": true}')
ON CONFLICT (name) DO NOTHING;

-- ====================================
-- 2. 부서 (Departments) 테이블
-- ====================================
CREATE TABLE IF NOT EXISTS departments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE,
    parent_id UUID REFERENCES departments(id),
    manager_id UUID,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- 3. 직급 (Positions) 테이블
-- ====================================
CREATE TABLE IF NOT EXISTS positions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    level INTEGER NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 기본 직급 추가
INSERT INTO positions (name, level, description) VALUES 
('대표이사', 1, 'CEO'),
('이사', 2, 'Director'),
('부장', 3, 'General Manager'),
('차장', 4, 'Deputy General Manager'),
('과장', 5, 'Manager'),
('대리', 6, 'Assistant Manager'),
('주임', 7, 'Senior Staff'),
('사원', 8, 'Staff'),
('인턴', 9, 'Intern')
ON CONFLICT DO NOTHING;

-- ====================================
-- 4. 직원 (Employees) 테이블
-- ====================================
CREATE TABLE IF NOT EXISTS employees (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id VARCHAR(20) UNIQUE NOT NULL, -- 사번
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    department_id UUID REFERENCES departments(id),
    position_id UUID REFERENCES positions(id),
    role_id UUID REFERENCES roles(id),
    hire_date DATE NOT NULL,
    resignation_date DATE,
    birth_date DATE,
    address TEXT,
    emergency_contact JSONB, -- {name, phone, relationship}
    bank_account JSONB, -- {bank_name, account_number, account_holder}
    is_active BOOLEAN DEFAULT true,
    profile_image_url TEXT,
    user_meta JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- 5. 근무 유형 (Work Types) 테이블
-- ====================================
CREATE TABLE IF NOT EXISTS work_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    color VARCHAR(7), -- HEX color
    is_paid BOOLEAN DEFAULT true,
    is_counted_as_work BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 기본 근무 유형 추가
INSERT INTO work_types (name, code, color, is_paid, is_counted_as_work) VALUES 
('정상근무', 'NORMAL', '#4CAF50', true, true),
('연장근무', 'OVERTIME', '#FF9800', true, true),
('휴일근무', 'HOLIDAY', '#2196F3', true, true),
('연차휴가', 'ANNUAL', '#9C27B0', true, false),
('병가', 'SICK', '#F44336', true, false),
('출장', 'BUSINESS_TRIP', '#00BCD4', true, true),
('재택근무', 'REMOTE', '#8BC34A', true, true),
('반차', 'HALF_DAY', '#FFEB3B', true, false),
('경조사', 'FAMILY_EVENT', '#795548', true, false),
('무급휴가', 'UNPAID', '#9E9E9E', false, false)
ON CONFLICT (code) DO NOTHING;

-- ====================================
-- 6. 근태 기록 (Attendance) 테이블
-- ====================================
CREATE TABLE IF NOT EXISTS attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id),
    work_date DATE NOT NULL,
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    work_type_id UUID REFERENCES work_types(id),
    work_hours DECIMAL(4,2), -- 실제 근무 시간
    overtime_hours DECIMAL(4,2), -- 연장 근무 시간
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
    location JSONB, -- {latitude, longitude, address}
    device_info JSONB, -- {ip, user_agent, device_type}
    notes TEXT,
    approved_by UUID REFERENCES employees(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, work_date)
);

-- 인덱스 추가
CREATE INDEX idx_attendance_employee_date ON attendance(employee_id, work_date);
CREATE INDEX idx_attendance_work_date ON attendance(work_date);
CREATE INDEX idx_attendance_status ON attendance(status);

-- ====================================
-- 7. 휴가 신청 (Leave Requests) 테이블
-- ====================================
CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id),
    work_type_id UUID NOT NULL REFERENCES work_types(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    half_day_type VARCHAR(10), -- AM, PM, or NULL for full day
    reason TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, cancelled
    approved_by UUID REFERENCES employees(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    attachments JSONB, -- [{file_name, file_url, file_size}]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- 8. 휴가 잔여 (Leave Balance) 테이블
-- ====================================
CREATE TABLE IF NOT EXISTS leave_balance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id),
    year INTEGER NOT NULL,
    work_type_id UUID NOT NULL REFERENCES work_types(id),
    total_days DECIMAL(4,1) NOT NULL, -- 총 부여 일수
    used_days DECIMAL(4,1) DEFAULT 0, -- 사용 일수
    remaining_days DECIMAL(4,1) GENERATED ALWAYS AS (total_days - used_days) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, year, work_type_id)
);

-- ====================================
-- 9. 근무 일정 (Work Schedule) 테이블
-- ====================================
CREATE TABLE IF NOT EXISTS work_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    break_time_minutes INTEGER DEFAULT 60,
    work_days VARCHAR(20) DEFAULT '1,2,3,4,5', -- 1=Mon, 7=Sun
    is_default BOOLEAN DEFAULT false,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 기본 근무 일정
INSERT INTO work_schedules (name, start_time, end_time, break_time_minutes, is_default) VALUES 
('표준 근무', '09:00', '18:00', 60, true),
('조조 근무', '07:00', '16:00', 60, false),
('오후 근무', '13:00', '22:00', 60, false)
ON CONFLICT DO NOTHING;

-- ====================================
-- 10. 직원별 근무 일정 할당
-- ====================================
CREATE TABLE IF NOT EXISTS employee_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id),
    schedule_id UUID NOT NULL REFERENCES work_schedules(id),
    start_date DATE NOT NULL,
    end_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(employee_id, start_date)
);

-- ====================================
-- 11. 공휴일 (Holidays) 테이블
-- ====================================
CREATE TABLE IF NOT EXISTS holidays (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    holiday_date DATE NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    is_paid BOOLEAN DEFAULT true,
    country VARCHAR(2) DEFAULT 'KR',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- 12. 알림 (Notifications) 테이블
-- ====================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id),
    type VARCHAR(50) NOT NULL, -- attendance_reminder, leave_approved, etc.
    title VARCHAR(200) NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- 13. 근태 집계 (Attendance Summary) 뷰
-- ====================================
CREATE OR REPLACE VIEW attendance_summary AS
SELECT 
    e.id as employee_id,
    e.name,
    e.employee_id as employee_number,
    d.name as department,
    p.name as position,
    DATE_TRUNC('month', a.work_date) as month,
    COUNT(CASE WHEN a.status = 'approved' THEN 1 END) as approved_days,
    SUM(a.work_hours) as total_work_hours,
    SUM(a.overtime_hours) as total_overtime_hours
FROM employees e
LEFT JOIN attendance a ON e.id = a.employee_id
LEFT JOIN departments d ON e.department_id = d.id
LEFT JOIN positions p ON e.position_id = p.id
GROUP BY e.id, e.name, e.employee_id, d.name, p.name, DATE_TRUNC('month', a.work_date);

-- ====================================
-- 트리거 함수들
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
CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON leave_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_balance_updated_at BEFORE UPDATE ON leave_balance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ====================================
-- Row Level Security (RLS) 정책
-- ====================================

-- 직원 테이블 RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can view their own data" ON employees
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "HR can view all employees" ON employees
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM employees e
            JOIN roles r ON e.role_id = r.id
            WHERE e.id::text = auth.uid()::text
            AND (r.name = 'admin' OR r.name = 'hr_manager')
        )
    );

-- 근태 테이블 RLS
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Employees can view own attendance" ON attendance
    FOR SELECT USING (employee_id::text = auth.uid()::text);

CREATE POLICY "Managers can manage attendance" ON attendance
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM employees e
            JOIN roles r ON e.role_id = r.id
            WHERE e.id::text = auth.uid()::text
            AND r.name IN ('admin', 'hr_manager', 'team_lead')
        )
    );

-- ====================================
-- 인덱스 최적화
-- ====================================
CREATE INDEX idx_employees_department ON employees(department_id);
CREATE INDEX idx_employees_position ON employees(position_id);
CREATE INDEX idx_employees_active ON employees(is_active);
CREATE INDEX idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_notifications_employee ON notifications(employee_id, is_read);

-- ====================================
-- 기본 데이터 설정 완료
-- ====================================
