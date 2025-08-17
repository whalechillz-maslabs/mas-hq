-- ================================================
-- Supabase Dashboard에서 실행할 KPI 업무 유형 업데이트
-- 실행 방법: Supabase Dashboard → SQL Editor → 이 스크립트 실행
-- ================================================

-- 1. 기존 업무 유형 비활성화 (삭제 대신)
UPDATE operation_types SET is_active = false;

-- 2. 새로운 KPI 기반 업무 유형 추가
INSERT INTO operation_types (code, name, description, category, points, is_active) VALUES 

-- ====================================
-- 팀장 (OP) KPI 업무 유형
-- ====================================
('TL_SALES', '팀매출 달성률 측정', '팀 전체 매출 목표 대비 달성률 측정 (월간 기준)', 'team_lead', 50, true),
('TL_YOY', 'YOY 성장률 측정', '전년 대비 성장률 측정 (분기별 기준)', 'team_lead', 40, true),
('TL_SCHEDULE', '스케줄 컨펌', '팀원 스케줄 승인 및 관리 (일일 기준)', 'team_lead', 20, true),
('TL_CS', 'CS 해결', '고객 서비스 이슈 해결 (응답시간 기준)', 'team_lead', 30, true),
('TL_TRAINING', '교육 이수', '팀원 교육 및 자기계발 (월간 기준)', 'team_lead', 25, true),

-- ====================================
-- 팀원 (OP) KPI 업무 유형
-- ====================================
('TM_PHONE_SALE', '전화/온라인 성사', '전화 또는 온라인을 통한 판매 성사 (건당 +20P)', 'team_member', 20, true),
('TM_OFFLINE_SALE', '오프라인 단독 성사', '오프라인에서 단독으로 판매 성사 (건당 +40P)', 'team_member', 40, true),
('TM_OFFLINE_ASSIST', '오프라인 보조 참여', '오프라인 판매 보조 참여 (건당 +10P)', 'team_member', 10, true),
('TM_SITA_SATISFACTION', '시타 만족도', '고객 만족도 조사 (주간 +20P)', 'team_member', 20, true),
('TM_RETURN', '반품 발생', '반품 발생 시 KPI 차감 (건당 -20P)', 'team_member', -20, true),
('TM_RETURN_DEFENSE', '반품 방어 성공', '반품 방어 성공 시 보너스 (건당 +10P)', 'team_member', 10, true),

-- ====================================
-- 경영지원 KPI 업무 유형
-- ====================================
('MGMT_HIRING', '채용 TAT', '채용 프로세스 소요시간 관리', 'management', 30, true),
('MGMT_FUNNEL', '퍼널 방문자', '마케팅 퍼널 방문자 수 관리', 'management', 25, true),
('MGMT_AD_CONVERSION', '광고 전환율', '광고 캠페인 전환율 관리', 'management', 35, true),
('MGMT_CONTENT_VIEWS', '콘텐츠 조회', '콘텐츠 조회수 관리', 'management', 20, true),
('MGMT_AUTOMATION', '자동화/운영 지표', '업무 자동화 및 운영 효율성', 'management', 40, true),

-- ====================================
-- 판매·반품·방어 규칙 업무 유형
-- ====================================
('SALE_LEAD', '팀장 리드 판매', '팀장이 리드한 판매 (100% 인정)', 'sales', 100, true),
('SALE_INDIVIDUAL', '팀원 단독 판매', '팀원이 단독으로 성사한 판매', 'sales', 100, true),
('SALE_ASSIST', '보조 참여', '보조 참여 (교육 기회로만 기록)', 'sales', 0, true),
('RETURN_HANDLE', '반품 처리', '반품 발생 시 인센티브 100% 환수', 'returns', -100, true),
('DEFENSE_SUCCESS', '반품 방어 성공', '반품 방어 성공 시 보너스', 'defense', 10, true),
('DEFENSE_FAIL', '재반품 발생', '재반품 발생 시 방어자 보상 없음', 'defense', 0, true),

-- ====================================
-- 근무 스케줄 관련 업무 유형
-- ====================================
('SCHEDULE_PROPOSE', '스케줄 제안', '팀원이 스케줄 제안', 'schedule', 5, true),
('SCHEDULE_CONFIRM', '스케줄 컨펌', '팀장이 스케줄 승인', 'schedule', 10, true),
('SCHEDULE_APPROVE', '스케줄 확정', '상위 관리자가 스케줄 최종 확정', 'schedule', 15, true),

-- ====================================
-- 기타 업무 유형 (기존 유지)
-- ====================================
('ADMIN_DOCUMENT', '문서 작성', '일반 문서 작성', 'admin', 8, true),
('ADMIN_MEETING', '회의 참석', '업무 회의 참석', 'admin', 5, true),
('ADMIN_REPORT', '보고서 작성', '업무 보고서 작성', 'admin', 12, true),
('TRAINING_ATTEND', '교육 참석', '교육 프로그램 참석', 'training', 10, true),
('TRAINING_CONDUCT', '교육 진행', '교육 프로그램 진행', 'training', 15, true),
('QUALITY_CHECK', '품질 검사', '품질 관리 및 검사', 'quality', 8, true),
('MAINTENANCE', '시스템 유지보수', '시스템 및 장비 유지보수', 'maintenance', 12, true);

-- 3. 업데이트 확인
SELECT 
    code, 
    name, 
    category, 
    points,
    CASE 
        WHEN points > 0 THEN '보너스'
        WHEN points < 0 THEN '차감'
        ELSE '기록'
    END as point_type
FROM operation_types 
WHERE is_active = true
ORDER BY category, points DESC;

-- 4. 카테고리별 통계
SELECT 
    category,
    COUNT(*) as total_types,
    SUM(CASE WHEN points > 0 THEN points ELSE 0 END) as total_bonus_points,
    SUM(CASE WHEN points < 0 THEN ABS(points) ELSE 0 END) as total_deduction_points
FROM operation_types 
WHERE is_active = true
GROUP BY category 
ORDER BY category;
