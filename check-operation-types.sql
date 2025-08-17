-- 현재 업무 유형 상태 확인
SELECT 
    code, 
    name, 
    category, 
    points,
    is_active,
    CASE 
        WHEN points > 0 THEN '보너스'
        WHEN points < 0 THEN '차감'
        ELSE '기록'
    END as point_type
FROM operation_types 
ORDER BY category, points DESC;

-- 카테고리별 통계
SELECT 
    category,
    COUNT(*) as total_types,
    SUM(CASE WHEN points > 0 THEN points ELSE 0 END) as total_bonus_points,
    SUM(CASE WHEN points < 0 THEN ABS(points) ELSE 0 END) as total_deduction_points,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_types
FROM operation_types 
GROUP BY category 
ORDER BY category;
