-- employee_tasks 테이블에 op10Category 컬럼 추가
-- OP10 업무의 경우 마스골프, 싱싱골프, 공통으로 분류하기 위한 컬럼

ALTER TABLE employee_tasks 
ADD COLUMN IF NOT EXISTS op10Category VARCHAR(20) DEFAULT 'common';

-- 컬럼에 대한 코멘트 추가
COMMENT ON COLUMN employee_tasks.op10Category IS 'OP10 업무 분류: masgolf, singsingolf, common';

-- 기존 OP10 업무에 대해 기본값 설정
UPDATE employee_tasks 
SET op10Category = 'common' 
WHERE operation_type_id IN (
  SELECT id FROM operation_types WHERE code = 'OP10'
) AND op10Category IS NULL;

-- 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_employee_tasks_op10_category 
ON employee_tasks(op10Category) 
WHERE op10Category IS NOT NULL;
