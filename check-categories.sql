-- 카테고리별 업무 유형 통계
SELECT 
    category,
    COUNT(*) as total_types,
    SUM(CASE WHEN points > 0 THEN points ELSE 0 END) as total_bonus_points,
    SUM(CASE WHEN points < 0 THEN ABS(points) ELSE 0 END) as total_deduction_points,
    STRING_AGG(code || ' (' || points || '점)', ', ' ORDER BY points DESC) as type_list
FROM operation_types 
WHERE is_active = true
GROUP BY category 
ORDER BY category;

-- 포인트 타입별 분류
SELECT 
    CASE 
        WHEN points > 0 THEN '보너스'
        WHEN points < 0 THEN '차감'
        ELSE '기록'
    END as point_type,
    COUNT(*) as count,
    SUM(points) as total_points
FROM operation_types 
WHERE is_active = true
GROUP BY 
    CASE 
        WHEN points > 0 THEN '보너스'
        WHEN points < 0 THEN '차감'
        ELSE '기록'
    END
ORDER BY point_type;
