-- Supabase 스키마 캐시 초기화 및 op10Category 컬럼 재확인

-- 1. 기존 컬럼이 있다면 삭제
ALTER TABLE employee_tasks DROP COLUMN IF EXISTS op10Category;

-- 2. 인덱스 삭제
DROP INDEX IF EXISTS idx_employee_tasks_op10_category;

-- 3. 테이블 새로고침을 위한 더미 쿼리
SELECT COUNT(*) FROM employee_tasks LIMIT 1;

-- 4. 컬럼 다시 추가
ALTER TABLE employee_tasks 
ADD COLUMN op10Category VARCHAR(20) DEFAULT 'common';

-- 5. 컬럼 코멘트 추가
COMMENT ON COLUMN employee_tasks.op10Category IS 'OP10 업무 분류: masgolf, singsingolf, common';

-- 6. 기존 OP10 업무에 기본값 설정
UPDATE employee_tasks
SET op10Category = 'common'
WHERE operation_type_id IN (
  SELECT id FROM operation_types WHERE code = 'OP10'
);

-- 7. 인덱스 재생성
CREATE INDEX idx_employee_tasks_op10_category
ON employee_tasks(op10Category)
WHERE op10Category IS NOT NULL;

-- 8. 컬럼 존재 확인
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'employee_tasks' 
AND column_name = 'op10Category';
