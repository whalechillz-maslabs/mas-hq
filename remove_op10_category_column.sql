-- employee_tasks 테이블에서 op10Category 컬럼 제거
-- 스키마 캐시 문제 해결을 위해

-- 먼저 인덱스 제거
DROP INDEX IF EXISTS idx_employee_tasks_op10_category;

-- 컬럼 제거
ALTER TABLE employee_tasks DROP COLUMN IF EXISTS op10Category;
