import { test, expect } from '@playwright/test';

test.describe('Supabase SQL 쿼리 확인', () => {
  test('Supabase 대시보드에서 환불 처리 데이터 확인', async ({ page }) => {
    console.log('🔍 Supabase 대시보드에서 환불 처리 데이터 확인 시작');
    
    // Supabase 대시보드로 이동
    await page.goto('https://supabase.com/dashboard');
    
    console.log('✅ Supabase 대시보드 접속 완료');
    console.log('📋 수동으로 로그인 후 다음 SQL 쿼리를 실행하세요:');
    console.log('');
    console.log('-- 환불 처리 업무 확인');
    console.log('SELECT ');
    console.log('    et.id,');
    console.log('    et.title,');
    console.log('    et.quantity,');
    console.log('    et.sales_amount,');
    console.log('    ot.code as operation_code,');
    console.log('    ot.points as operation_points,');
    console.log('    (ot.points * et.quantity) as calculated_points');
    console.log('FROM employee_tasks et');
    console.log('JOIN operation_types ot ON et.operation_type_id = ot.id');
    console.log('WHERE et.title LIKE \'%환불 처리%\'');
    console.log('ORDER BY et.created_at DESC');
    console.log('LIMIT 5;');
    console.log('');
    console.log('🔍 확인할 점:');
    console.log('1. quantity가 음수인지 확인');
    console.log('2. calculated_points가 음수인지 확인');
    console.log('3. 원본 업무의 점수가 정확히 차감되는지 확인');
    
    // 60초 대기 (수동 확인용)
    await page.waitForTimeout(60000);
  });
});
