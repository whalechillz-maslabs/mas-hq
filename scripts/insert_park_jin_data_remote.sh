#!/bin/bash

# ================================================
# 박진(JIN) 데이터 삽입 스크립트 (원격 Supabase)
# ================================================

echo "🔍 박진(JIN) 데이터 삽입 시작 (원격 Supabase)..."

# 1. Supabase CLI 로그인 확인
echo "📡 Supabase CLI 상태 확인 중..."
npx supabase status

# 2. SQL 파일 내용을 직접 실행
echo "🗄️ 박진 데이터 삽입 중..."

# SQL 파일 내용을 변수에 저장
SQL_CONTENT="
-- ================================================
-- 박진(JIN) 계정 및 관련 데이터 삽입
-- ================================================

-- 1. 박진 직원 정보 삽입
INSERT INTO employees (
    id,
    employee_id,
    name,
    phone,
    email,
    department,
    position,
    role_id,
    hire_date,
    status,
    hourly_rate,
    bank_account,
    bank_name,
    password_hash,
    pin_code,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'MASLABS-004',
    '박진(JIN)',
    '010-9132-4337',
    'park.jin@maslabs.kr',
    'OP팀',
    '파트타임',
    'part_time',
    '2025-07-29',
    'active',
    12000,
    '19007131399',
    '우리은행',
    '91324337',
    '1234',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT (employee_id) DO UPDATE SET
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    department = EXCLUDED.department,
    position = EXCLUDED.position,
    role_id = EXCLUDED.role_id,
    hire_date = EXCLUDED.hire_date,
    status = EXCLUDED.status,
    hourly_rate = EXCLUDED.hourly_rate,
    bank_account = EXCLUDED.bank_account,
    bank_name = EXCLUDED.bank_name,
    password_hash = EXCLUDED.password_hash,
    pin_code = EXCLUDED.pin_code,
    updated_at = CURRENT_TIMESTAMP;

-- 확인용 쿼리
SELECT '박진(JIN) 데이터 삽입 완료' as status;
SELECT 
    e.name,
    e.employee_id,
    e.department,
    e.position,
    e.hourly_rate,
    e.bank_account,
    e.bank_name,
    e.password_hash,
    e.pin_code
FROM employees e 
WHERE e.employee_id = 'MASLABS-004';
"

# 3. SQL 실행
echo "$SQL_CONTENT" | npx supabase db reset --linked

echo "✅ 데이터 삽입 완료!"
echo ""
echo "📋 박진(JIN) 계정 정보:"
echo "   - 전화번호: 010-9132-4337"
echo "   - 기본 패스워드: 91324337 (전화번호 8자리)"
echo "   - 기본 핀번호: 1234"
echo "   - 사번: MASLABS-004"
echo "   - 부서: OP팀"
echo "   - 직책: 파트타임"
echo "   - 시급: 12,000원"
echo "   - 은행: 우리은행 19007131399"
echo ""
echo "🎯 테스트 방법:"
echo "   1. http://localhost:3000/login 접속"
echo "   2. 전화번호: 010-9132-4337"
echo "   3. 패스워드: 91324337"
echo "   4. 또는 핀번호: 1234"
echo ""
echo "🚀 테스트 실행: npm run test:park-jin"
