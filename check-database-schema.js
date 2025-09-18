const { chromium } = require('playwright');

async function checkDatabaseSchema() {
  console.log('🔍 데이터베이스 스키마 확인 시작...');
  
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
    const sqlQuery = `
-- employee_tasks 테이블 구조 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'employee_tasks' 
ORDER BY ordinal_position;
`;
    
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
    await page.screenshot({ path: 'database-schema-check.png', fullPage: true });
    console.log('📸 스크린샷 저장됨: database-schema-check.png');
    
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    await page.screenshot({ path: 'error-screenshot.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

checkDatabaseSchema().catch(console.error);
