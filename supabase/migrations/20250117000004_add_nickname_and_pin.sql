-- ================================================
-- 닉네임과 핀번호 컬럼 추가
-- Version: 2.1.2
-- Created: 2025-01-17
-- ================================================

-- employees 테이블에 nickname과 pin_code 컬럼 추가
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS nickname VARCHAR(50),
ADD COLUMN IF NOT EXISTS pin_code VARCHAR(4);

-- 기존 박진 계정에 기본 닉네임과 핀번호 설정
UPDATE employees 
SET 
    nickname = 'JIN',
    pin_code = '1234'
WHERE employee_id = 'MASLABS-004';

-- 확인용 쿼리
SELECT 
    '컬럼 추가 완료' as status,
    e.employee_id,
    e.name,
    e.nickname,
    e.pin_code
FROM employees e 
WHERE e.employee_id = 'MASLABS-004';
