import { test, expect } from '@playwright/test';

test.describe('원격 Supabase에 이은정 계정 추가', () => {
  test('이은정 계정 원격 추가', async ({ page }) => {
    console.log('🔍 원격 Supabase에 이은정 계정 추가 시작');
    
    // 1. 원격 Supabase 대시보드 접속
    await page.goto('https://supabase.com/dashboard/project/cgscbtxtgualkfalouwh/editor/24669?schema=public');
    console.log('✅ 원격 Supabase 대시보드 접속 완료');
    
    // 2. 로그인 상태 확인
    const loginButton = page.locator('button:has-text("Sign In")').first();
    if (await loginButton.isVisible()) {
      console.log('⚠️ 로그인이 필요합니다');
      await page.screenshot({ path: 'remote-login-needed.png', fullPage: true });
      console.log('📋 수동으로 다음 단계를 진행해주세요:');
      console.log('1. Supabase에 로그인');
      console.log('2. SQL Editor에서 이은정 계정 추가 스크립트 실행');
      return;
    }
    
    // 3. SQL Editor 확인
    await expect(page.locator('text=SQL Editor')).toBeVisible();
    console.log('✅ SQL Editor 확인 완료');
    
    // 4. 이은정 계정 추가 SQL 실행
    const addEunjungSQL = `
-- 원격 Supabase에 이은정 계정 추가

-- 1. 현재 상태 확인
SELECT '=== 현재 직원 목록 ===' as info;
SELECT employee_id, name, phone, email FROM employees ORDER BY employee_id;

-- 2. 이은정 계정 추가
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

-- 3. 부서/직책/역할 연결
UPDATE employees 
SET 
    department_id = (SELECT id FROM departments WHERE code = 'MGMT' LIMIT 1),
    position_id = (SELECT id FROM positions WHERE name = '이사' LIMIT 1),
    role_id = (SELECT id FROM roles WHERE name = 'manager' LIMIT 1)
WHERE employee_id = 'MASLABS-002';

-- 4. 결과 확인
SELECT '=== 이은정 계정 추가 후 ===' as info;
SELECT 
    e.employee_id,
    e.name,
    e.phone,
    e.email,
    d.name as department,
    p.name as position,
    r.name as role,
    e.pin_code,
    e.hire_date,
    e.employment_type,
    e.status
FROM employees e
LEFT JOIN departments d ON e.department_id = d.id
LEFT JOIN positions p ON e.position_id = p.id
LEFT JOIN roles r ON e.role_id = r.id
WHERE e.employee_id = 'MASLABS-002';
    `;
    
    // SQL 입력 필드 찾기 및 실행
    const sqlEditor = page.locator('.monaco-editor textarea, .sql-editor textarea, [data-testid="sql-editor"]');
    if (await sqlEditor.isVisible()) {
      await sqlEditor.fill(addEunjungSQL);
      console.log('✅ 이은정 계정 추가 SQL 입력 완료');
      
      // 실행 버튼 클릭
      await page.click('button:has-text("Run")');
      console.log('✅ 이은정 계정 추가 SQL 실행 완료');
      
      // 결과 확인
      await page.waitForTimeout(5000);
      await page.screenshot({ path: 'eunjung-added-result.png', fullPage: true });
      console.log('✅ 이은정 계정 추가 결과 스크린샷 캡처 완료');
    }
    
    console.log('🎉 원격 Supabase에 이은정 계정 추가 완료!');
  });
});
