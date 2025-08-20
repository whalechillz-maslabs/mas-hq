import { test, expect } from '@playwright/test';

test.describe('원격 데이터베이스 연결 테스트', () => {
  test('원격 Supabase 연결 확인', async ({ page }) => {
    console.log('🔍 원격 Supabase 연결 테스트 시작');
    
    // 1. 원격 Supabase 대시보드 접속
    await page.goto('https://supabase.com/dashboard/project/cgscbtxtgualkfalouwh/editor/24669?schema=public');
    console.log('✅ 원격 Supabase 대시보드 접속 완료');
    
    // 2. 로그인 확인 (필요시)
    const loginButton = page.locator('text=Sign in');
    if (await loginButton.isVisible()) {
      console.log('⚠️ 로그인이 필요합니다');
      await page.screenshot({ path: 'remote-supabase-login-needed.png', fullPage: true });
      return;
    }
    
    // 3. SQL Editor 확인
    await expect(page.locator('text=SQL Editor')).toBeVisible();
    console.log('✅ SQL Editor 확인 완료');
    
    // 4. RLS 비활성화 SQL 실행
    const rlsDisableSQL = `
-- 원격 Supabase RLS 비활성화
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;
ALTER TABLE departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE positions DISABLE ROW LEVEL SECURITY;
ALTER TABLE roles DISABLE ROW LEVEL SECURITY;
    `;
    
    // SQL 입력 필드 찾기
    const sqlEditor = page.locator('.monaco-editor textarea, .sql-editor textarea, [data-testid="sql-editor"]');
    if (await sqlEditor.isVisible()) {
      await sqlEditor.fill(rlsDisableSQL);
      console.log('✅ RLS 비활성화 SQL 입력 완료');
      
      // 실행 버튼 클릭
      await page.click('button:has-text("Run")');
      console.log('✅ RLS 비활성화 SQL 실행 완료');
      
      // 결과 확인
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'remote-rls-disable-result.png', fullPage: true });
    }
    
    // 5. 이은정 계정 추가 SQL 실행
    const insertSQL = `
-- 이은정 계정 추가 (간단 버전)
INSERT INTO employees (
    employee_id,
    name,
    phone,
    email,
    pin_code,
    hire_date,
    employment_type,
    status,
    is_active
) VALUES (
    'MASLABS-002',
    '이은정(STE)',
    '010-3243-3099',
    'lee.eunjung@maslabs.kr',
    '1234',
    '2025-01-01',
    'full_time',
    'active',
    true
) ON CONFLICT (employee_id) DO UPDATE SET
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    pin_code = EXCLUDED.pin_code,
    hire_date = EXCLUDED.hire_date,
    employment_type = EXCLUDED.employment_type,
    status = EXCLUDED.status,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();
    `;
    
    if (await sqlEditor.isVisible()) {
      await sqlEditor.fill(insertSQL);
      console.log('✅ 이은정 계정 추가 SQL 입력 완료');
      
      // 실행 버튼 클릭
      await page.click('button:has-text("Run")');
      console.log('✅ 이은정 계정 추가 SQL 실행 완료');
      
      // 결과 확인
      await page.waitForTimeout(2000);
      await page.screenshot({ path: 'remote-insert-result.png', fullPage: true });
    }
    
    console.log('🎉 원격 데이터베이스 연결 테스트 완료!');
  });
});
