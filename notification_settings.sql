-- 알림 설정 테이블 생성
CREATE TABLE IF NOT EXISTS notification_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT true,
    slack_notifications BOOLEAN DEFAULT true,
    schedule_notifications BOOLEAN DEFAULT true,
    task_notifications BOOLEAN DEFAULT true,
    urgent_notifications BOOLEAN DEFAULT true,
    daily_reports BOOLEAN DEFAULT true,
    weekly_reports BOOLEAN DEFAULT false,
    monthly_reports BOOLEAN DEFAULT false,
    notification_frequency VARCHAR(20) DEFAULT 'immediate' CHECK (notification_frequency IN ('immediate', 'hourly', 'daily')),
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '08:00',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_notification_settings_employee_id ON notification_settings(employee_id);

-- RLS 정책 설정
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- 직원은 자신의 알림 설정만 볼 수 있음
CREATE POLICY "Employees can view own notification settings" ON notification_settings
    FOR SELECT USING (auth.uid()::text = employee_id::text);

-- 직원은 자신의 알림 설정만 수정할 수 있음
CREATE POLICY "Employees can update own notification settings" ON notification_settings
    FOR UPDATE USING (auth.uid()::text = employee_id::text);

-- 직원은 자신의 알림 설정을 생성할 수 있음
CREATE POLICY "Employees can insert own notification settings" ON notification_settings
    FOR INSERT WITH CHECK (auth.uid()::text = employee_id::text);

-- 관리자는 모든 알림 설정을 볼 수 있음
CREATE POLICY "Admins can view all notification settings" ON notification_settings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE id = auth.uid()::uuid 
            AND role_id = (SELECT id FROM roles WHERE name = 'admin')
        )
    );

-- 관리자는 모든 알림 설정을 수정할 수 있음
CREATE POLICY "Admins can update all notification settings" ON notification_settings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE id = auth.uid()::uuid 
            AND role_id = (SELECT id FROM roles WHERE name = 'admin')
        )
    );
