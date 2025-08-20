-- STE 부서 삭제하고 마스팀, 싱싱팀 추가

-- 1. 기존 departments 데이터 삭제
DELETE FROM public.departments;

-- 2. 새로운 departments 데이터 삽입
COPY public.departments (id, name, code, description, is_active, created_at, updated_at) FROM stdin;
cd1bf40d-6d5f-48ad-8256-9469eb8692db	경영지원팀	MGMT	경영 및 행정 지원	t	2025-08-19 23:20:19.68522+00	2025-08-19 23:20:19.68522+00
8354d709-a44f-499e-909f-d5ec1a8048c7	개발팀	DEV	소프트웨어 개발	t	2025-08-19 23:20:19.68522+00	2025-08-19 23:20:19.68522+00
2a060f6d-69c1-44d6-942b-0743e46bdca7	디자인팀	DESIGN	디자인 및 UI/UX	t	2025-08-19 23:20:19.68522+00	2025-08-19 23:20:19.68522+00
ce3a48cc-dc02-4c50-97ce-a0b91b996380	마케팅팀	MARKETING	마케팅 및 홍보	t	2025-08-19 23:20:19.68522+00	2025-08-19 23:20:19.68522+00
8d45c20c-7626-416e-9821-882ca9b285dc	매장운영팀	STORE	매장 운영 및 관리	t	2025-08-19 23:20:19.68522+00	2025-08-19 23:20:19.68522+00
0af79f9f-7c9c-4686-a889-1699f0024228	본사	HQ	본사 직원	t	2025-08-19 23:20:19.68522+00	2025-08-19 23:20:19.68522+00
a1b2c3d4-e5f6-7890-abcd-ef1234567890	마스팀	MAS	마스팀 운영	t	2025-08-20 03:10:00.000000+00	2025-08-20 03:10:00.000000+00
b2c3d4e5-f6g7-8901-bcde-f23456789012	싱싱팀	SING	싱싱팀 운영	t	2025-08-20 03:10:00.000000+00	2025-08-20 03:10:00.000000+00
\.

-- 3. 이은정 계정의 부서를 마스팀으로 변경
UPDATE employees 
SET department_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
WHERE employee_id = 'MASLABS-002';

-- 4. 확인 쿼리
SELECT 
    e.employee_id,
    e.name,
    e.nickname,
    e.phone,
    d.name as department_name,
    p.name as position_name,
    r.name as role_name,
    e.pin_code
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
LEFT JOIN positions p ON e.position_id = p.id
LEFT JOIN roles r ON e.role_id = r.id
ORDER BY e.employee_id;
