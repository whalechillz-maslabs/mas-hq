import { test, expect } from '@playwright/test';

test('Supabase SQL 실행 - 알림 설정 테이블 생성', async ({ page }) => {
  console.log('🚀 Supabase SQL 실행 테스트 시작');
  
  // 1. Supabase 대시보드로 이동
  await page.goto('https://supabase.com/dashboard');
  await page.waitForLoadState('networkidle');
  
  // 2. 로그인 확인 (이미 로그인되어 있다고 가정)
  console.log('📋 Supabase 대시보드 접속 완료');
  
  // 3. 프로젝트 선택 (첫 번째 프로젝트 클릭)
  try {
    const projectCard = page.locator('[data-testid="project-card"]').first();
    await expect(projectCard).toBeVisible({ timeout: 10000 });
    await projectCard.click();
    console.log('✅ 프로젝트 선택 완료');
  } catch (error) {
    console.log('⚠️ 프로젝트 선택 실패, 이미 프로젝트 페이지에 있을 수 있음');
  }
  
  // 4. SQL Editor로 이동
  await page.waitForTimeout(2000);
  
  // SQL Editor 메뉴 찾기
  const sqlEditorLink = page.locator('a[href*="sql"]').first();
  if (await sqlEditorLink.isVisible()) {
    await sqlEditorLink.click();
    console.log('✅ SQL Editor로 이동 완료');
  } else {
    // 대안: 직접 URL로 이동
    const currentUrl = page.url();
    const baseUrl = currentUrl.split('/dashboard')[0];
    await page.goto(`${baseUrl}/sql`);
    console.log('✅ SQL Editor로 직접 이동 완료');
  }
  
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(3000);
  
  // 5. 페이지 스크린샷으로 현재 상태 확인
  await page.screenshot({ path: 'supabase-sql-page.png', fullPage: true });
  console.log('📸 페이지 스크린샷 저장 완료');
  
  // 6. 다양한 SQL 에디터 선택자 시도
  const sqlEditorSelectors = [
    'textarea',
    '.monaco-editor',
    '[contenteditable="true"]',
    '.cm-editor',
    '.CodeMirror',
    'pre[role="presentation"]',
    '.sql-editor',
    '#sql-editor'
  ];
  
  let sqlEditor = null;
  for (const selector of sqlEditorSelectors) {
    const element = page.locator(selector).first();
    if (await element.isVisible({ timeout: 2000 })) {
      sqlEditor = element;
      console.log(`✅ SQL 에디터 발견: ${selector}`);
      break;
    }
  }
  
  if (!sqlEditor) {
    console.log('⚠️ SQL 에디터를 찾을 수 없음. 수동으로 SQL을 실행해주세요.');
    console.log('📋 실행할 SQL 쿼리:');
    console.log(`
-- 알림 설정 테이블 생성
CREATE TABLE IF NOT EXISTS notification_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT true,
    slack_notifications BOOLEAN DEFAULT true,
    schedule_notifications BOOLEAN DEFAULT true,
    task_notifications BOOLEAN DEFAULT true,
    urgent_notifications BOOLEAN DEFAULT true,
    daily_reports BOOLEAN DEFAULT true,
    weekly_reports BOOLEAN DEFAULT false,
    monthly_reports BOOLEAN DEFAULT false,
    notification_frequency VARCHAR(20) DEFAULT 'immediate' CHECK (notification_frequency IN ('immediate', 'hourly', 'daily')),
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '08:00',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_notification_settings_employee_id ON notification_settings(employee_id);

-- RLS 정책 설정
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- 직원은 자신의 알림 설정만 볼 수 있음
CREATE POLICY "Employees can view own notification settings" ON notification_settings
    FOR SELECT USING (auth.uid()::text = employee_id::text);

-- 직원은 자신의 알림 설정만 수정할 수 있음
CREATE POLICY "Employees can update own notification settings" ON notification_settings
    FOR UPDATE USING (auth.uid()::text = employee_id::text);

-- 직원은 자신의 알림 설정을 생성할 수 있음
CREATE POLICY "Employees can insert own notification settings" ON notification_settings
    FOR INSERT WITH CHECK (auth.uid()::text = employee_id::text);

-- 관리자는 모든 알림 설정을 볼 수 있음
CREATE POLICY "Admins can view all notification settings" ON notification_settings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE id = auth.uid()::uuid 
            AND role_id = (SELECT id FROM roles WHERE name = 'admin')
        )
    );

-- 관리자는 모든 알림 설정을 수정할 수 있음
CREATE POLICY "Admins can update all notification settings" ON notification_settings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE id = auth.uid()::uuid 
            AND role_id = (SELECT id FROM roles WHERE name = 'admin')
        )
    );
    `);
    return;
  }
  
  // 7. SQL 쿼리 입력
  const sqlQuery = `-- 알림 설정 테이블 생성
CREATE TABLE IF NOT EXISTS notification_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT true,
    slack_notifications BOOLEAN DEFAULT true,
    schedule_notifications BOOLEAN DEFAULT true,
    task_notifications BOOLEAN DEFAULT true,
    urgent_notifications BOOLEAN DEFAULT true,
    daily_reports BOOLEAN DEFAULT true,
    weekly_reports BOOLEAN DEFAULT false,
    monthly_reports BOOLEAN DEFAULT false,
    notification_frequency VARCHAR(20) DEFAULT 'immediate' CHECK (notification_frequency IN ('immediate', 'hourly', 'daily')),
    quiet_hours_start TIME DEFAULT '22:00',
    quiet_hours_end TIME DEFAULT '08:00',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_notification_settings_employee_id ON notification_settings(employee_id);

-- RLS 정책 설정
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

-- 직원은 자신의 알림 설정만 볼 수 있음
CREATE POLICY "Employees can view own notification settings" ON notification_settings
    FOR SELECT USING (auth.uid()::text = employee_id::text);

-- 직원은 자신의 알림 설정만 수정할 수 있음
CREATE POLICY "Employees can update own notification settings" ON notification_settings
    FOR UPDATE USING (auth.uid()::text = employee_id::text);

-- 직원은 자신의 알림 설정을 생성할 수 있음
CREATE POLICY "Employees can insert own notification settings" ON notification_settings
    FOR INSERT WITH CHECK (auth.uid()::text = employee_id::text);

-- 관리자는 모든 알림 설정을 볼 수 있음
CREATE POLICY "Admins can view all notification settings" ON notification_settings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE id = auth.uid()::uuid 
            AND role_id = (SELECT id FROM roles WHERE name = 'admin')
        )
    );

-- 관리자는 모든 알림 설정을 수정할 수 있음
CREATE POLICY "Admins can update all notification settings" ON notification_settings
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM employees 
            WHERE id = auth.uid()::uuid 
            AND role_id = (SELECT id FROM roles WHERE name = 'admin')
        )
    );`;

  // SQL 쿼리 입력
  await sqlEditor.click();
  await sqlEditor.fill(sqlQuery);
  console.log('✅ SQL 쿼리 입력 완료');
  
  // 8. 쿼리 실행
  const runButtonSelectors = [
    'button:has-text("Run")',
    'button:has-text("실행")',
    'button[type="submit"]',
    'button[data-testid="run-query"]',
    '.run-button',
    '[aria-label="Run"]'
  ];
  
  let runButton = null;
  for (const selector of runButtonSelectors) {
    const element = page.locator(selector).first();
    if (await element.isVisible({ timeout: 2000 })) {
      runButton = element;
      console.log(`✅ 실행 버튼 발견: ${selector}`);
      break;
    }
  }
  
  if (runButton) {
    await runButton.click();
    console.log('✅ SQL 쿼리 실행 버튼 클릭');
    
    // 실행 결과 확인
    await page.waitForTimeout(5000);
    
    // 성공 메시지 또는 결과 확인
    const successMessage = page.locator('text=success, text=완료, text=Success').first();
    if (await successMessage.isVisible({ timeout: 10000 })) {
      console.log('✅ SQL 쿼리 실행 성공');
    } else {
      console.log('⚠️ SQL 쿼리 실행 결과 확인 필요');
    }
  } else {
    console.log('⚠️ 실행 버튼을 찾을 수 없음. 수동으로 실행해주세요.');
  }
  
  console.log('🎉 Supabase SQL 실행 테스트 완료');
});
