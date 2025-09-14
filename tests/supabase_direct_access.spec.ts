import { test, expect } from '@playwright/test';

test.describe('Supabase 직접 접근 테스트', () => {
  test('Supabase 프로젝트 직접 접근 및 테이블 생성', async ({ page }) => {
    console.log('🚀 Supabase 프로젝트 직접 접근 시작...');

    // 1. Supabase 프로젝트 대시보드로 직접 이동
    // 실제 프로젝트 URL로 변경 (예: https://supabase.com/dashboard/project/your-project-id)
    const projectUrl = 'https://supabase.com/dashboard/project/cgscbtxtgualkfalouwh';
    
    try {
      await page.goto(projectUrl);
      console.log('✅ Supabase 프로젝트 페이지 접근');
      
      // 페이지 로드 대기
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      // 현재 URL 확인
      const currentUrl = page.url();
      console.log('현재 URL:', currentUrl);
      
      // 로그인이 필요한지 확인
      if (currentUrl.includes('login') || currentUrl.includes('signin')) {
        console.log('🔐 로그인이 필요합니다.');
        console.log('수동으로 로그인 후 다시 시도해주세요.');
        return;
      }
      
      // 2. SQL Editor 찾기
      console.log('🔍 SQL Editor 찾는 중...');
      
      // 여러 가능한 선택자로 SQL Editor 찾기
      const sqlEditorSelectors = [
        'text=SQL Editor',
        'a[href*="sql"]',
        'button:has-text("SQL")',
        '[data-testid*="sql"]',
        '.sql-editor'
      ];
      
      let sqlEditorFound = false;
      for (const selector of sqlEditorSelectors) {
        const element = page.locator(selector).first();
        if (await element.isVisible()) {
          await element.click();
          console.log(`✅ SQL Editor 찾음: ${selector}`);
          sqlEditorFound = true;
          break;
        }
      }
      
      if (!sqlEditorFound) {
        console.log('❌ SQL Editor를 찾을 수 없습니다.');
        console.log('사이드바 메뉴를 확인해주세요.');
        
        // 현재 페이지의 모든 링크 출력
        const links = await page.locator('a').all();
        console.log('사용 가능한 링크들:');
        for (let i = 0; i < Math.min(links.length, 10); i++) {
          const text = await links[i].textContent();
          const href = await links[i].getAttribute('href');
          console.log(`  - ${text}: ${href}`);
        }
        return;
      }
      
      // SQL Editor 로드 대기
      await page.waitForTimeout(3000);
      
      // 3. attendance 테이블 생성 SQL 입력
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
      const sqlEditorSelectors2 = [
        'textarea',
        '.monaco-editor',
        '[contenteditable="true"]',
        '.CodeMirror',
        'pre[contenteditable]'
      ];
      
      let sqlEditorInput = false;
      for (const selector of sqlEditorSelectors2) {
        const element = page.locator(selector).first();
        if (await element.isVisible()) {
          await element.click();
          await element.fill(createTableSQL);
          console.log(`✅ SQL 입력 완료: ${selector}`);
          sqlEditorInput = true;
          break;
        }
      }
      
      if (!sqlEditorInput) {
        console.log('❌ SQL 에디터를 찾을 수 없습니다.');
        return;
      }
      
      // 4. SQL 실행
      console.log('▶️ SQL 실행 중...');
      
      // 실행 버튼 찾기
      const runButtonSelectors = [
        'button:has-text("Run")',
        'button:has-text("Execute")',
        'button[title*="Run"]',
        'button[aria-label*="Run"]',
        '.run-button',
        '[data-testid*="run"]'
      ];
      
      let runButtonClicked = false;
      for (const selector of runButtonSelectors) {
        const element = page.locator(selector).first();
        if (await element.isVisible()) {
          await element.click();
          console.log(`✅ SQL 실행 버튼 클릭: ${selector}`);
          runButtonClicked = true;
          break;
        }
      }
      
      if (!runButtonClicked) {
        // Ctrl+Enter로 실행 시도
        await page.keyboard.press('Control+Enter');
        console.log('✅ Ctrl+Enter로 SQL 실행');
      }
      
      // 실행 결과 대기
      await page.waitForTimeout(5000);
      
      // 5. 실행 결과 확인
      console.log('🔍 실행 결과 확인 중...');
      
      // 페이지의 모든 텍스트에서 성공/실패 메시지 찾기
      const pageContent = await page.textContent('body');
      
      if (pageContent.includes('success') || pageContent.includes('Success')) {
        console.log('✅ 테이블 생성 성공!');
      } else if (pageContent.includes('error') || pageContent.includes('Error')) {
        console.log('❌ 테이블 생성 실패');
      } else {
        console.log('⚠️ 실행 결과를 확인할 수 없습니다.');
      }
      
      // 스크린샷 저장
      await page.screenshot({ path: 'test-results/supabase-direct-access-result.png' });
      console.log('📸 스크린샷 저장 완료');
      
    } catch (error) {
      console.error('❌ Supabase 접근 중 오류:', error);
      
      // 오류 발생 시 스크린샷 저장
      await page.screenshot({ path: 'test-results/supabase-error.png' });
    }
  });
});
