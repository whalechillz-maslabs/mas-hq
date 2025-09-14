import { test, expect } from '@playwright/test';

test.describe('Supabase 대시보드 테이블 생성', () => {
  test('Supabase 대시보드 로그인 및 attendance 테이블 생성', async ({ page }) => {
    console.log('🚀 Supabase 대시보드 접근 시작...');

    // 1. Supabase 대시보드 로그인 페이지로 이동
    await page.goto('https://supabase.com/dashboard');
    
    // 페이지 로드 대기
    await page.waitForLoadState('networkidle');
    
    // 로그인 버튼 클릭
    const signInButton = page.locator('text=Sign in').first();
    if (await signInButton.isVisible()) {
      await signInButton.click();
      console.log('✅ 로그인 버튼 클릭');
    } else {
      console.log('❌ 로그인 버튼을 찾을 수 없습니다.');
      return;
    }

    // 로그인 폼 대기
    await page.waitForTimeout(3000);
    
    // 이메일 입력 (실제 이메일로 변경 필요)
    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.isVisible()) {
      await emailInput.fill('your-email@example.com'); // 실제 이메일로 변경
      console.log('✅ 이메일 입력');
    }

    // 비밀번호 입력 (실제 비밀번호로 변경 필요)
    const passwordInput = page.locator('input[type="password"]').first();
    if (await passwordInput.isVisible()) {
      await passwordInput.fill('your-password'); // 실제 비밀번호로 변경
      console.log('✅ 비밀번호 입력');
    }

    // 로그인 버튼 클릭
    const loginButton = page.locator('button[type="submit"]').first();
    if (await loginButton.isVisible()) {
      await loginButton.click();
      console.log('✅ 로그인 시도');
    }

    // 로그인 완료 대기
    await page.waitForTimeout(5000);

    // 2. 프로젝트 선택 (MASLABS 프로젝트)
    console.log('🔍 MASLABS 프로젝트 찾는 중...');
    
    // 프로젝트 목록에서 MASLABS 프로젝트 찾기
    const projectLink = page.locator('text=MASLABS').first();
    if (await projectLink.isVisible()) {
      await projectLink.click();
      console.log('✅ MASLABS 프로젝트 선택');
    } else {
      console.log('❌ MASLABS 프로젝트를 찾을 수 없습니다.');
      return;
    }

    // 프로젝트 로드 대기
    await page.waitForTimeout(3000);

    // 3. SQL Editor로 이동
    console.log('🔍 SQL Editor 찾는 중...');
    
    // 사이드바에서 SQL Editor 클릭
    const sqlEditorLink = page.locator('text=SQL Editor').first();
    if (await sqlEditorLink.isVisible()) {
      await sqlEditorLink.click();
      console.log('✅ SQL Editor 클릭');
    } else {
      // 다른 방법으로 SQL Editor 찾기
      const sqlLink = page.locator('a[href*="sql"]').first();
      if (await sqlLink.isVisible()) {
        await sqlLink.click();
        console.log('✅ SQL Editor 링크 클릭');
      } else {
        console.log('❌ SQL Editor를 찾을 수 없습니다.');
        return;
      }
    }

    // SQL Editor 로드 대기
    await page.waitForTimeout(3000);

    // 4. attendance 테이블 생성 SQL 입력
    console.log('📝 attendance 테이블 생성 SQL 입력 중...');
    
    const createTableSQL = `-- attendance 테이블 생성
CREATE TABLE IF NOT EXISTS attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in_time TIME,
  check_out_time TIME,
  break_start_time TIME,
  break_end_time TIME,
  total_hours DECIMAL(4,2),
  overtime_hours DECIMAL(4,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'present',
  location JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(employee_id, date)
);

-- RLS 정책 설정
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attendance_select_policy" ON attendance
  FOR SELECT USING (true);

CREATE POLICY "attendance_insert_policy" ON attendance
  FOR INSERT WITH CHECK (true);

CREATE POLICY "attendance_update_policy" ON attendance
  FOR UPDATE USING (true);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);`;

    // SQL 에디터 찾기
    const sqlEditor = page.locator('textarea, .monaco-editor, [contenteditable="true"]').first();
    if (await sqlEditor.isVisible()) {
      await sqlEditor.click();
      await sqlEditor.fill(createTableSQL);
      console.log('✅ SQL 입력 완료');
    } else {
      console.log('❌ SQL 에디터를 찾을 수 없습니다.');
      return;
    }

    // 5. SQL 실행
    console.log('▶️ SQL 실행 중...');
    
    // 실행 버튼 찾기
    const runButton = page.locator('button:has-text("Run"), button:has-text("Execute"), button[title*="Run"]').first();
    if (await runButton.isVisible()) {
      await runButton.click();
      console.log('✅ SQL 실행 버튼 클릭');
    } else {
      // Ctrl+Enter로 실행 시도
      await page.keyboard.press('Control+Enter');
      console.log('✅ Ctrl+Enter로 SQL 실행');
    }

    // 실행 결과 대기
    await page.waitForTimeout(5000);

    // 6. 실행 결과 확인
    console.log('🔍 실행 결과 확인 중...');
    
    // 성공 메시지 확인
    const successMessage = page.locator('text=success, text=Success, text=완료').first();
    if (await successMessage.isVisible()) {
      console.log('✅ 테이블 생성 성공!');
    } else {
      // 오류 메시지 확인
      const errorMessage = page.locator('text=error, text=Error, text=오류').first();
      if (await errorMessage.isVisible()) {
        console.log('❌ 테이블 생성 실패');
        const errorText = await errorMessage.textContent();
        console.log('오류 내용:', errorText);
      } else {
        console.log('⚠️ 실행 결과를 확인할 수 없습니다.');
      }
    }

    // 7. 테이블 생성 확인
    console.log('🔍 테이블 생성 확인 중...');
    
    // Table Editor로 이동하여 확인
    const tableEditorLink = page.locator('text=Table Editor').first();
    if (await tableEditorLink.isVisible()) {
      await tableEditorLink.click();
      await page.waitForTimeout(3000);
      
      // attendance 테이블 확인
      const attendanceTable = page.locator('text=attendance').first();
      if (await attendanceTable.isVisible()) {
        console.log('✅ attendance 테이블이 성공적으로 생성되었습니다!');
      } else {
        console.log('❌ attendance 테이블을 찾을 수 없습니다.');
      }
    }

    // 스크린샷 저장
    await page.screenshot({ path: 'test-results/supabase-dashboard-result.png' });
    console.log('📸 스크린샷 저장 완료');

  });
});
