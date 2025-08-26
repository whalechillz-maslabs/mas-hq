-- 로컬 데이터베이스 스케줄 테이블 제약 조건 수정
-- 문제: UNIQUE(employee_id, schedule_date) 제약 조건으로 인해 같은 직원이 같은 날짜에 여러 스케줄을 가질 수 없음

-- 1. 기존 제약 조건 삭제
ALTER TABLE schedules DROP CONSTRAINT IF EXISTS schedules_employee_id_schedule_date_key;

-- 2. 새로운 복합 고유 제약 조건 추가 (employee_id + schedule_date + scheduled_start)
-- 이렇게 하면 같은 직원이 같은 날짜에 다른 시간대의 스케줄을 가질 수 있음
ALTER TABLE schedules ADD CONSTRAINT schedules_employee_date_time_key 
UNIQUE(employee_id, schedule_date, scheduled_start);

-- 3. 인덱스 업데이트
DROP INDEX IF EXISTS idx_schedules_employee_date;
CREATE INDEX idx_schedules_employee_date ON schedules(employee_id, schedule_date);

-- 4. 확인을 위한 쿼리
SELECT 
    '제약 조건 수정 완료' as status,
    '이제 같은 직원이 같은 날짜에 여러 시간대 스케줄을 가질 수 있습니다.' as description;
