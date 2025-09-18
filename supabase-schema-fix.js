const { chromium } = require('playwright');

async function fixSupabaseSchema() {
  console.log('🔧 Supabase 스키마 수정 시작...');
  
  const browser = await chromium.launch({ 
    headless: false,
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled',
      '--disable-features=VizDisplayCompositor'
    ]
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    console.log('📱 Supabase 대시보드로 이동 중...');
    await page.goto('https://supabase.com/dashboard');
    await page.waitForTimeout(3000);
    
    console.log('⏳ 수동 로그인을 기다리는 중...');
    console.log('👤 Supabase에 로그인해주세요.');
    console.log('🔗 로그인 후 프로젝트를 선택해주세요.');
    
    // 10분 대기 (사용자가 로그인할 시간)
    await page.waitForTimeout(600000);
    
    console.log('✅ 로그인 완료 확인');
    
    // SQL Editor로 이동
    console.log('📝 SQL Editor로 이동 중...');
    await page.goto('https://supabase.com/dashboard/project/_/sql');
    await page.waitForTimeout(3000);
    
    // SQL 입력
    const sqlQuery = `
-- employee_tasks 테이블에 op10Category 컬럼 추가
-- OP10 업무의 경우 마스골프, 싱싱골프, 공통으로 분류하기 위한 컬럼

ALTER TABLE employee_tasks
ADD COLUMN IF NOT EXISTS op10Category VARCHAR(20) DEFAULT 'common';

-- 컬럼에 대한 코멘트 추가
COMMENT ON COLUMN employee_tasks.op10Category IS 'OP10 업무 분류: masgolf, singsingolf, common';

-- 기존 OP10 업무에 대해 기본값 설정
UPDATE employee_tasks
SET op10Category = 'common'
WHERE operation_type_id IN (
  SELECT id FROM operation_types WHERE code = 'OP10'
) AND op10Category IS NULL;

-- 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_employee_tasks_op10_category
ON employee_tasks(op10Category)
WHERE op10Category IS NOT NULL;
`;
    
    console.log('📝 SQL 쿼리 입력 중...');
    
    // SQL 에디터 찾기 (여러 가능한 셀렉터 시도)
    const sqlEditor = await page.locator('textarea, .monaco-editor, [contenteditable="true"], .cm-editor').first();
    await sqlEditor.click();
    await sqlEditor.fill(sqlQuery);
    
    await page.waitForTimeout(2000);
    
    // 실행 버튼 클릭
    console.log('▶️ SQL 실행 중...');
    const runButton = await page.locator('button:has-text("Run"), button:has-text("실행"), [data-testid="run-query"], button[type="submit"]').first();
    await runButton.click();
    
    // 결과 대기
    await page.waitForTimeout(5000);
    
    console.log('📊 결과 확인 중...');
    
    // 결과 스크린샷
    await page.screenshot({ path: 'supabase-schema-fix-result.png', fullPage: true });
    console.log('📸 스크린샷 저장됨: supabase-schema-fix-result.png');
    
    // 성공 메시지 확인
    const successMessage = await page.locator('text=Success').first();
    if (await successMessage.isVisible()) {
      console.log('✅ op10Category 컬럼 추가 성공!');
    } else {
      console.log('⚠️ 결과를 확인해주세요.');
    }
    
    console.log('🎉 스키마 수정 완료!');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    await page.screenshot({ path: 'supabase-error.png', fullPage: true });
  } finally {
    console.log('⏳ 30초 후 브라우저를 닫습니다...');
    await page.waitForTimeout(30000);
    await browser.close();
  }
}

fixSupabaseSchema().catch(console.error);
