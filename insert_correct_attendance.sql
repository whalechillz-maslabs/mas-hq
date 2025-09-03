-- 허상원(HEO)의 9월 3일 정시 출근/퇴근 데이터 입력
-- 기존 테스트 데이터 삭제 후 정확한 데이터 입력

-- 1. 기존 9월 3일 허상원 데이터 삭제
DELETE FROM schedules 
WHERE employee_id = (SELECT id FROM employees WHERE employee_id = 'HEO') 
AND schedule_date = '2025-09-03';

-- 2. 정시 출근/퇴근 데이터 입력 (30분 단위)
-- 09:00-12:00 (3시간)
INSERT INTO schedules (
  employee_id, 
  schedule_date, 
  scheduled_start, 
  scheduled_end, 
  actual_start, 
  actual_end, 
  status, 
  total_hours
) VALUES 
-- 09:00-09:30
((SELECT id FROM employees WHERE employee_id = 'HEO'), '2025-09-03', '09:00', '09:30', '2025-09-03T09:00:00+09:00', '2025-09-03T09:30:00+09:00', 'completed', 0.5),
-- 09:30-10:00
((SELECT id FROM employees WHERE employee_id = 'HEO'), '2025-09-03', '09:30', '10:00', '2025-09-03T09:30:00+09:00', '2025-09-03T10:00:00+09:00', 'completed', 0.5),
-- 10:00-10:30
((SELECT id FROM employees WHERE employee_id = 'HEO'), '2025-09-03', '10:00', '10:30', '2025-09-03T10:00:00+09:00', '2025-09-03T10:30:00+09:00', 'completed', 0.5),
-- 10:30-11:00
((SELECT id FROM employees WHERE employee_id = 'HEO'), '2025-09-03', '10:30', '11:00', '2025-09-03T10:30:00+09:00', '2025-09-03T11:00:00+09:00', 'completed', 0.5),
-- 11:00-11:30
((SELECT id FROM employees WHERE employee_id = 'HEO'), '2025-09-03', '11:00', '11:30', '2025-09-03T11:00:00+09:00', '2025-09-03T11:30:00+09:00', 'completed', 0.5),
-- 11:30-12:00
((SELECT id FROM employees WHERE employee_id = 'HEO'), '2025-09-03', '11:30', '12:00', '2025-09-03T11:30:00+09:00', '2025-09-03T12:00:00+09:00', 'completed', 0.5),

-- 13:00-17:30 (4.5시간) - 점심시간 12:00-13:00 제외
-- 13:00-13:30
((SELECT id FROM employees WHERE employee_id = 'HEO'), '2025-09-03', '13:00', '13:30', '2025-09-03T13:00:00+09:00', '2025-09-03T13:30:00+09:00', 'completed', 0.5),
-- 13:30-14:00
((SELECT id FROM employees WHERE employee_id = 'HEO'), '2025-09-03', '13:30', '14:00', '2025-09-03T13:30:00+09:00', '2025-09-03T14:00:00+09:00', 'completed', 0.5),
-- 14:00-14:30
((SELECT id FROM employees WHERE employee_id = 'HEO'), '2025-09-03', '14:00', '14:30', '2025-09-03T14:00:00+09:00', '2025-09-03T14:30:00+09:00', 'completed', 0.5),
-- 14:30-15:00
((SELECT id FROM employees WHERE employee_id = 'HEO'), '2025-09-03', '14:30', '15:00', '2025-09-03T14:30:00+09:00', '2025-09-03T15:00:00+09:00', 'completed', 0.5),
-- 15:00-15:30
((SELECT id FROM employees WHERE employee_id = 'HEO'), '2025-09-03', '15:00', '15:30', '2025-09-03T15:00:00+09:00', '2025-09-03T15:30:00+09:00', 'completed', 0.5),
-- 15:30-16:00
((SELECT id FROM employees WHERE employee_id = 'HEO'), '2025-09-03', '15:30', '16:00', '2025-09-03T15:30:00+09:00', '2025-09-03T16:00:00+09:00', 'completed', 0.5),
-- 16:00-16:30
((SELECT id FROM employees WHERE employee_id = 'HEO'), '2025-09-03', '16:00', '16:30', '2025-09-03T16:00:00+09:00', '2025-09-03T16:30:00+09:00', 'completed', 0.5),
-- 16:30-17:00
((SELECT id FROM employees WHERE employee_id = 'HEO'), '2025-09-03', '16:30', '17:00', '2025-09-03T16:30:00+09:00', '2025-09-03T17:00:00+09:00', 'completed', 0.5),
-- 17:00-17:30
((SELECT id FROM employees WHERE employee_id = 'HEO'), '2025-09-03', '17:00', '17:30', '2025-09-03T17:00:00+09:00', '2025-09-03T17:30:00+09:00', 'completed', 0.5);

-- 3. 데이터 확인
SELECT 
  s.schedule_date,
  s.scheduled_start,
  s.scheduled_end,
  s.actual_start,
  s.actual_end,
  s.total_hours,
  s.status,
  e.name,
  e.employee_id
FROM schedules s
JOIN employees e ON s.employee_id = e.id
WHERE e.employee_id = 'HEO' 
AND s.schedule_date = '2025-09-03'
ORDER BY s.scheduled_start;

-- 4. 총 근무 시간 계산 확인
SELECT 
  COUNT(*) as total_schedules,
  SUM(s.total_hours) as total_hours,
  e.name,
  e.employee_id
FROM schedules s
JOIN employees e ON s.employee_id = e.id
WHERE e.employee_id = 'HEO' 
AND s.schedule_date = '2025-09-03'
GROUP BY e.id, e.name, e.employee_id;
