-- ========================================
-- 복지 연차 정책 RLS 활성화 수정
-- 실행일: 2025-12-19
-- 설명: RLS가 비활성화된 경우 다시 활성화
-- ========================================

-- 1. 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "관리자는 모든 복지 연차 정책 접근 가능" ON welfare_leave_policy;
DROP POLICY IF EXISTS "직원은 복지 연차 정책 조회 가능" ON welfare_leave_policy;

-- 2. RLS 활성화
ALTER TABLE welfare_leave_policy ENABLE ROW LEVEL SECURITY;

-- 3. 관리자 정책 생성
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

-- 4. 직원 조회 정책 생성
CREATE POLICY "직원은 복지 연차 정책 조회 가능" ON welfare_leave_policy
    FOR SELECT USING (true);

-- 5. RLS 활성화 상태 확인
SELECT 
    'RLS 활성화 상태 확인' as section,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'welfare_leave_policy';

-- 6. 생성된 정책 확인
SELECT 
    '생성된 RLS 정책 확인' as section,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE tablename = 'welfare_leave_policy'
ORDER BY policyname;

