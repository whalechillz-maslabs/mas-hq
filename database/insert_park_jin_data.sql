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
    '91324337', -- 기본 패스워드: 전화번호 8자리
    '1234', -- 기본 핀번호
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

-- 2. 박진의 근무 스케줄 삽입
INSERT INTO schedules (
    id,
    employee_id,
    work_date,
    start_time,
    end_time,
    total_hours,
    work_type,
    status,
    notes,
    created_at,
    updated_at
) VALUES 
-- 2025년 7월 29일
(gen_random_uuid(), (SELECT id FROM employees WHERE employee_id = 'MASLABS-004'), '2025-07-29', '15:00:00', '17:00:00', 2.0, 'part_time', 'completed', '면접, 교육', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- 2025년 8월 4일
(gen_random_uuid(), (SELECT id FROM employees WHERE employee_id = 'MASLABS-004'), '2025-08-04', '09:00:00', '12:00:00', 3.0, 'part_time', 'completed', '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- 2025년 8월 6일
(gen_random_uuid(), (SELECT id FROM employees WHERE employee_id = 'MASLABS-004'), '2025-08-06', '09:00:00', '15:30:00', 6.5, 'part_time', 'completed', '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- 2025년 8월 8일
(gen_random_uuid(), (SELECT id FROM employees WHERE employee_id = 'MASLABS-004'), '2025-08-08', '09:00:00', '12:00:00', 3.0, 'part_time', 'completed', 'OJT(JH)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- 2025년 8월 11일
(gen_random_uuid(), (SELECT id FROM employees WHERE employee_id = 'MASLABS-004'), '2025-08-11', '09:00:00', '12:00:00', 3.0, 'part_time', 'completed', 'as입고,출고 인트라교육', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- 2025년 8월 18일 (결제 완료)
(gen_random_uuid(), (SELECT id FROM employees WHERE employee_id = 'MASLABS-004'), '2025-08-18', '09:00:00', '12:00:00', 3.0, 'part_time', 'completed', '21만원 결제 완료', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- 향후 스케줄 (월수금 9-12시)
(gen_random_uuid(), (SELECT id FROM employees WHERE employee_id = 'MASLABS-004'), '2025-08-20', '09:00:00', '12:00:00', 3.0, 'part_time', 'scheduled', '월수금 정기 근무', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), (SELECT id FROM employees WHERE employee_id = 'MASLABS-004'), '2025-08-22', '09:00:00', '12:00:00', 3.0, 'part_time', 'scheduled', '월수금 정기 근무', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), (SELECT id FROM employees WHERE employee_id = 'MASLABS-004'), '2025-08-25', '09:00:00', '12:00:00', 3.0, 'part_time', 'scheduled', '월수금 정기 근무', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), (SELECT id FROM employees WHERE employee_id = 'MASLABS-004'), '2025-08-27', '09:00:00', '12:00:00', 3.0, 'part_time', 'scheduled', '월수금 정기 근무', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
(gen_random_uuid(), (SELECT id FROM employees WHERE employee_id = 'MASLABS-004'), '2025-08-29', '09:00:00', '12:00:00', 3.0, 'part_time', 'scheduled', '월수금 정기 근무', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 3. 박진의 업무 기록 삽입
INSERT INTO employee_tasks (
    id,
    employee_id,
    operation_type_id,
    task_date,
    task_name,
    description,
    quantity,
    points_earned,
    status,
    employee_memo,
    created_at,
    updated_at
) VALUES 
-- 2025년 7월 29일 업무
(gen_random_uuid(), (SELECT id FROM employees WHERE employee_id = 'MASLABS-004'), (SELECT id FROM operation_types WHERE code = 'TRAINING_ATTEND'), '2025-07-29', '신입 교육', '면접 및 신입 교육 진행', 1, 10, 'completed', '면접, 교육', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- 2025년 8월 4일 업무
(gen_random_uuid(), (SELECT id FROM employees WHERE employee_id = 'MASLABS-004'), (SELECT id FROM operation_types WHERE code = 'ADMIN_DOCUMENT'), '2025-08-04', '문서 작성', '업무 관련 문서 작성', 1, 6, 'completed', '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- 2025년 8월 6일 업무
(gen_random_uuid(), (SELECT id FROM employees WHERE employee_id = 'MASLABS-004'), (SELECT id FROM operation_types WHERE code = 'ADMIN_MEETING'), '2025-08-06', '회의 참석', '팀 회의 및 업무 논의', 1, 8, 'completed', '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- 2025년 8월 8일 업무
(gen_random_uuid(), (SELECT id FROM employees WHERE employee_id = 'MASLABS-004'), (SELECT id FROM operation_types WHERE code = 'TRAINING_ATTEND'), '2025-08-08', 'OJT 교육', 'JH와 함께하는 OJT 교육', 1, 10, 'completed', 'OJT(JH)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- 2025년 8월 11일 업무
(gen_random_uuid(), (SELECT id FROM employees WHERE employee_id = 'MASLABS-004'), (SELECT id FROM operation_types WHERE code = 'ADMIN_DOCUMENT'), '2025-08-11', '입출고 관리', 'as입고,출고 및 인트라교육', 1, 6, 'completed', 'as입고,출고 인트라교육', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 4. 박진의 급여 정보 삽입
INSERT INTO salary_records (
    id,
    employee_id,
    payment_date,
    base_salary,
    overtime_pay,
    bonus,
    deductions,
    net_salary,
    payment_status,
    payment_method,
    notes,
    created_at,
    updated_at
) VALUES 
-- 8월 18일 결제 (21만원)
(gen_random_uuid(), (SELECT id FROM employees WHERE employee_id = 'MASLABS-004'), '2025-08-18', 210000, 0, 0, 0, 210000, 'paid', 'bank_transfer', '21만원 결제 완료', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 5. 박진의 성과 지표 삽입
INSERT INTO performance_metrics (
    id,
    employee_id,
    evaluation_date,
    period,
    phone_sales_score,
    online_sales_score,
    offline_sales_score,
    customer_satisfaction_score,
    content_views_score,
    total_score,
    performance_rating,
    manager_feedback,
    improvement_areas,
    strengths,
    incentive_amount,
    incentive_reason,
    status,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM employees WHERE employee_id = 'MASLABS-004'),
    '2025-08-01',
    'monthly',
    75,
    80,
    70,
    85,
    78,
    77.6,
    'B',
    '신입으로서 적극적인 학습 태도가 좋습니다. 업무 숙련도를 더욱 향상시키면 좋겠습니다.',
    ARRAY['업무 숙련도 향상', '제품 지식 심화'],
    ARRAY['적극적인 학습 태도', '팀워크', '시간 준수'],
    50000,
    '신입 적응도 우수 및 팀워크 기여',
    'finalized',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- 6. 보안 각서 데이터 삽입
INSERT INTO security_agreements (
    id,
    employee_id,
    agreement_date,
    agreement_type,
    content,
    signature_data,
    status,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM employees WHERE employee_id = 'MASLABS-004'),
    '2025-07-29',
    'confidentiality',
    'MASLABS 기밀정보 보호 각서

1. 업무상 알게 된 모든 기밀정보는 엄격히 보호합니다.
2. 회사 정보를 외부에 유출하지 않습니다.
3. 업무 종료 후에도 기밀유지 의무를 준수합니다.
4. 위반 시 법적 책임을 집니다.

박진(JIN) 서명',
    '박진(JIN)',
    'signed',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- 7. 박진의 출근 기록 삽입
INSERT INTO attendance_records (
    id,
    employee_id,
    check_in_time,
    check_out_time,
    work_date,
    total_hours,
    location_data,
    status,
    notes,
    created_at,
    updated_at
) VALUES 
-- 2025년 7월 29일
(gen_random_uuid(), (SELECT id FROM employees WHERE employee_id = 'MASLABS-004'), '2025-07-29 15:00:00', '2025-07-29 17:00:00', '2025-07-29', 2.0, '{"latitude": 37.5665, "longitude": 126.9780}', 'completed', '면접, 교육', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- 2025년 8월 4일
(gen_random_uuid(), (SELECT id FROM employees WHERE employee_id = 'MASLABS-004'), '2025-08-04 09:00:00', '2025-08-04 12:00:00', '2025-08-04', 3.0, '{"latitude": 37.5665, "longitude": 126.9780}', 'completed', '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- 2025년 8월 6일
(gen_random_uuid(), (SELECT id FROM employees WHERE employee_id = 'MASLABS-004'), '2025-08-06 09:00:00', '2025-08-06 15:30:00', '2025-08-06', 6.5, '{"latitude": 37.5665, "longitude": 126.9780}', 'completed', '', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- 2025년 8월 8일
(gen_random_uuid(), (SELECT id FROM employees WHERE employee_id = 'MASLABS-004'), '2025-08-08 09:00:00', '2025-08-08 12:00:00', '2025-08-08', 3.0, '{"latitude": 37.5665, "longitude": 126.9780}', 'completed', 'OJT(JH)', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),

-- 2025년 8월 11일
(gen_random_uuid(), (SELECT id FROM employees WHERE employee_id = 'MASLABS-004'), '2025-08-11 09:00:00', '2025-08-11 12:00:00', '2025-08-11', 3.0, '{"latitude": 37.5665, "longitude": 126.9780}', 'completed', 'as입고,출고 인트라교육', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- 8. 박진의 급여명세서 데이터 삽입
INSERT INTO salary_statements (
    id,
    employee_id,
    statement_date,
    base_hours,
    overtime_hours,
    hourly_rate,
    base_salary,
    overtime_pay,
    bonus,
    deductions,
    net_salary,
    payment_date,
    status,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    (SELECT id FROM employees WHERE employee_id = 'MASLABS-004'),
    '2025-08-18',
    17.5, -- 총 근무시간 (2+3+6.5+3+3)
    0,
    12000,
    210000, -- 17.5 * 12000
    0,
    0,
    0,
    210000,
    '2025-08-18',
    'paid',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);

-- 확인용 쿼리
SELECT '박진(JIN) 데이터 삽입 완료' as status;
SELECT 
    e.name,
    e.employee_id,
    e.department,
    e.position,
    e.hourly_rate,
    e.bank_account,
    e.bank_name
FROM employees e 
WHERE e.employee_id = 'MASLABS-004';
