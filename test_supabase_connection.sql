-- ========================================
-- Supabase 연결 테스트 스크립트
-- 실행일: 2025-01-27
-- 설명: 기본 테이블 존재 여부 확인
-- ========================================

-- 1. 기본 테이블들 존재 여부 확인
SELECT 
    'Table Existence Check' as section,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('employees', 'contracts', 'hourly_wages', 'payslips', 'schedules')
ORDER BY table_name;

-- 2. contracts 테이블 구조 확인
SELECT 
    'Contracts Table Structure' as section,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'contracts'
ORDER BY ordinal_position;

-- 3. employees 테이블 구조 확인
SELECT 
    'Employees Table Structure' as section,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'employees'
ORDER BY ordinal_position;

-- 4. 최형호 직원 정보 확인
SELECT 
    '최형호 직원 정보' as section,
    id,
    name,
    employee_id,
    employment_type,
    hire_date
FROM employees 
WHERE name = '최형호';

-- 5. 완료 메시지
SELECT 'Supabase 연결 테스트 완료' as result;

