const { chromium } = require('playwright');

async function testTasksPage() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🔍 /tasks 페이지 테스트 시작...');
    
    // /tasks 페이지로 직접 이동
    await page.goto('https://www.maslabs.kr/tasks');
    
    // 페이지 로드 대기
    await page.waitForLoadState('networkidle');
    
    // 페이지 제목 확인
    const title = await page.title();
    console.log('📄 페이지 제목:', title);
    
    // URL 확인
    const url = page.url();
    console.log('🌐 현재 URL:', url);
    
    // 페이지 내용 확인
    const bodyText = await page.textContent('body');
    console.log('📝 페이지 내용 (처음 200자):', bodyText.substring(0, 200));
    
    // 오류 메시지 확인
    const errorElement = await page.$('text=Application error');
    if (errorElement) {
      console.log('❌ 오류 메시지 발견!');
      const errorText = await errorElement.textContent();
      console.log('🚨 오류 내용:', errorText);
    } else {
      console.log('✅ 오류 메시지 없음');
    }
    
    // 콘솔 로그 확인
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('🔴 콘솔 오류:', msg.text());
      }
    });
    
    // 5초 대기
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error.message);
  } finally {
    await browser.close();
  }
}

testTasksPage();
