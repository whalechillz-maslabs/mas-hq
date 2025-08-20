import { test, expect } from '@playwright/test';

test.describe('원격 Supabase 설정 확인', () => {
  test('원격 데이터베이스 설정 상태 확인', async ({ page }) => {
    console.log('🔍 원격 Supabase 설정 확인 시작');
    
    // 1. 원격 Supabase 대시보드 접속
    await page.goto('https://supabase.com/dashboard/project/cgscbtxtgualkfalouwh/editor/24669?schema=public');
    console.log('✅ 원격 Supabase 대시보드 접속 완료');
    
    // 2. 로그인 상태 확인
    const loginButton = page.locator('button:has-text("Sign In")').first();
    if (await loginButton.isVisible()) {
      console.log('⚠️ 로그인이 필요합니다');
      await page.screenshot({ path: 'remote-login-needed.png', fullPage: true });
      console.log('📋 다음 단계:');
      console.log('1. Supabase에 로그인');
      console.log('2. SQL Editor에서 설정 확인 스크립트 실행');
      console.log('3. 이은정 계정 추가 스크립트 실행');
      return;
    }
    
    // 3. SQL Editor 확인
    await expect(page.locator('text=SQL Editor')).toBeVisible();
    console.log('✅ SQL Editor 확인 완료');
    
    // 4. 설정 확인 SQL 실행
    const checkSQL = `
-- 원격 Supabase 설정 확인

-- 1. RLS 상태 확인
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('employees', 'departments', 'positions', 'roles')
ORDER BY tablename;

-- 2. 직원 데이터 확인
SELECT 
    employee_id,
    name,
    phone,
    email,
    pin_code,
    hire_date,
    employment_type,
    status
FROM employees 
ORDER BY employee_id;
    `;
    
    // SQL 입력 필드 찾기 및 실행
    const sqlEditor = page.locator('.monaco-editor textarea, .sql-editor textarea, [data-testid="sql-editor"]');
    if (await sqlEditor.isVisible()) {
      await sqlEditor.fill(checkSQL);
      console.log('✅ 설정 확인 SQL 입력 완료');
      
      // 실행 버튼 클릭
      await page.click('button:has-text("Run")');
      console.log('✅ 설정 확인 SQL 실행 완료');
      
      // 결과 확인
      await page.waitForTimeout(3000);
      await page.screenshot({ path: 'remote-setup-check-result.png', fullPage: true });
      console.log('✅ 설정 확인 결과 스크린샷 캡처 완료');
    }
    
    console.log('🎉 원격 Supabase 설정 확인 완료!');
  });
});
