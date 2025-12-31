-- ========================================
-- 복지 연차 정책 테이블 생성
-- 실행일: 2025-12-19
-- 설명: 복지 연차(1월 1일 등) 정책 관리 테이블
-- ========================================

-- 1. 복지 연차 정책 테이블 생성
CREATE TABLE IF NOT EXISTS welfare_leave_policy (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    year INTEGER NOT NULL,
    date DATE NOT NULL, -- 복지 연차 날짜 (예: 2026-01-01)
    description TEXT NOT NULL, -- 설명 (예: "신정 복지 연차")
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(year, date)
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_welfare_leave_policy_year ON welfare_leave_policy(year);
CREATE INDEX IF NOT EXISTS idx_welfare_leave_policy_date ON welfare_leave_policy(date);

-- 3. 업데이트 트리거 추가
CREATE TRIGGER update_welfare_leave_policy_updated_at 
    BEFORE UPDATE ON welfare_leave_policy 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4. 초기 데이터 (2026년 1월 1일)
INSERT INTO welfare_leave_policy (year, date, description)
VALUES (2026, '2026-01-01', '신정 복지 연차')
ON CONFLICT (year, date) DO NOTHING;

-- 5. RLS 정책 설정
ALTER TABLE welfare_leave_policy ENABLE ROW LEVEL SECURITY;

-- 관리자는 모든 데이터 접근 가능
CREATE POLICY "관리자는 모든 복지 연차 정책 접근 가능" ON welfare_leave_policy
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE employees.id = auth.uid()::UUID
            AND employees.role_id IN (
                SELECT id FROM roles WHERE name = 'admin'
            )
        )
    );

-- 직원은 조회만 가능
CREATE POLICY "직원은 복지 연차 정책 조회 가능" ON welfare_leave_policy
    FOR SELECT USING (true);

-- 6. 확인 쿼리
SELECT 
    '복지 연차 정책 확인' as section,
    year,
    date,
    description,
    is_active
FROM welfare_leave_policy
ORDER BY year DESC, date ASC;

