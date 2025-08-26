-- 모든 업무 유형 점수 및 설명 업데이트
-- 새로운 점수 체계 적용

-- OP1 전화 판매(신규) - 20점
UPDATE operation_types
SET
    points = 20,
    description = '신규 고객 전화 판매',
    updated_at = CURRENT_TIMESTAMP
WHERE code = 'OP1';

-- OP2 전화 판매(재구매/부품) - 15점
UPDATE operation_types
SET
    points = 15,
    description = '재구매/부품 전화 판매',
    updated_at = CURRENT_TIMESTAMP
WHERE code = 'OP2';

-- OP3 오프라인 판매(신규) - 40점
UPDATE operation_types
SET
    points = 40,
    description = '신규 고객 오프라인 판매(시타 메인 or 단독판매)',
    updated_at = CURRENT_TIMESTAMP
WHERE code = 'OP3';

-- OP4 오프라인 판매(재구매/부품) - 30점
UPDATE operation_types
SET
    points = 30,
    description = '재구매/부품 오프라인 판매(시타 메인 or 단독판매)',
    updated_at = CURRENT_TIMESTAMP
WHERE code = 'OP4';

-- OP5 CS 응대(기본) - 8점 (이미 업데이트됨)
UPDATE operation_types
SET
    points = 8,
    description = '1. 오프라인 판매(시타 동반/보조): 매장 방문 고객 응대 보조, 팀장 리드하에 보조 참여
2. 인트라넷 등록 업무: 거래 성사를 위한 팀장 연결 전까지 통화
3. 프로모션 설명, 인트라넷/노션 정보 입력, 시타예약 입력',
    updated_at = CURRENT_TIMESTAMP
WHERE code = 'OP5';

-- OP6 A/S 처리(고급) - 15점
UPDATE operation_types
SET
    points = 15,
    description = '고급 A/S 처리',
    updated_at = CURRENT_TIMESTAMP
WHERE code = 'OP6';

-- OP7 환불 방어 - 25점
UPDATE operation_types
SET
    points = 25,
    description = '환불 방어 성공',
    updated_at = CURRENT_TIMESTAMP
WHERE code = 'OP7';

-- OP8 환불 처리 - -판매 점수 (기존 판매 점수 그대로 차감)
UPDATE operation_types
SET
    points = -10, -- 기본 차감 점수 (실제로는 기존 판매 점수만큼 차감)
    description = '기존 판매 점수 그대로 차감',
    updated_at = CURRENT_TIMESTAMP
WHERE code = 'OP8';

-- OP9 택배 입고/출고/회수 - 8점
UPDATE operation_types
SET
    points = 8,
    description = '상품 관련 택배 처리',
    updated_at = CURRENT_TIMESTAMP
WHERE code = 'OP9';

-- OP10 기타 택배/서비스 - 5점
UPDATE operation_types
SET
    points = 5,
    description = '음료/소모품/선물 등 기타',
    updated_at = CURRENT_TIMESTAMP
WHERE code = 'OP10';

-- 업데이트 결과 확인
SELECT code, name, points, description FROM operation_types ORDER BY code;
