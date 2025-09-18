const { chromium } = require('playwright');

async function addOp10CategoryColumn() {
  console.log('🔧 op10Category 컬럼 추가 시작...');
  
  const browser = await chromium.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // Supabase 대시보드로 이동
    console.log('📱 Supabase 대시보드로 이동 중...');
    await page.goto('https://supabase.com/dashboard');
    
    // 로그인 페이지가 나타날 때까지 대기
    await page.waitForTimeout(3000);
    
    console.log('⏳ 수동 로그인을 기다리는 중...');
    console.log('👤 Supabase에 로그인해주세요.');
    console.log('🔗 로그인 후 프로젝트를 선택하고 SQL Editor로 이동해주세요.');
    
    // 5분 대기 (사용자가 로그인할 시간)
    await page.waitForTimeout(300000);
    
    console.log('✅ 로그인 완료 확인');
    
    // SQL Editor로 이동
    await page.goto('https://supabase.com/dashboard/project/_/sql');
    await page.waitForTimeout(2000);
    
    // SQL 입력
    const sqlQuery = `-- employee_tasks 테이블에 op10Category 컬럼 추가
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
WHERE op10Category IS NOT NULL;`;
    
    console.log('📝 SQL 쿼리 실행 중...');
    
    // SQL 에디터 찾기
    const sqlEditor = await page.locator('textarea, .monaco-editor, [contenteditable="true"]').first();
    await sqlEditor.fill(sqlQuery);
    
    // 실행 버튼 클릭
    const runButton = await page.locator('button:has-text("Run"), button:has-text("실행"), [data-testid="run-query"]').first();
    await runButton.click();
    
    // 결과 대기
    await page.waitForTimeout(3000);
    
    console.log('📊 결과 확인 중...');
    
    // 결과 스크린샷
    await page.screenshot({ path: 'op10-category-added.png', fullPage: true });
    console.log('📸 스크린샷 저장됨: op10-category-added.png');
    
    console.log('✅ op10Category 컬럼 추가 완료!');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    await page.screenshot({ path: 'error-screenshot.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

addOp10CategoryColumn().catch(console.error);
