-- 싱싱 업무 유형 추가
INSERT INTO operation_types (id, code, name, category, points, description, target_roles, created_at, updated_at)
VALUES 
  ('op11', 'OP11', '전화 판매(싱싱)', 'sales', 20, '싱싱 리무진 버스 투어상품 전화 판매', '["singsing", "mas"]', NOW(), NOW()),
  ('op12', 'OP12', 'CS 응대(싱싱)', 'customer_service', 8, '싱싱 리무진 버스 투어상품 고객 서비스', '["singsing", "mas"]', NOW(), NOW());

-- 기존 업무 유형에 싱싱팀 권한 추가 (선택사항)
UPDATE operation_types 
SET target_roles = '["mas", "singsing"]'
WHERE code IN ('OP1', 'OP2', 'OP3', 'OP4', 'OP5', 'OP6', 'OP7', 'OP9', 'OP10');

-- 결과 확인
SELECT * FROM operation_types ORDER BY code;
