const { chromium } = require('playwright');

async function debugConsole() {
  const browser = await chromium.launch({ 
    headless: false,
    channel: 'chrome'
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('🔍 브라우저 콘솔 에러 확인 중...');
    
    // 콘솔 메시지 수집
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        location: msg.location()
      });
    });
    
    // 페이지 에러 수집
    const pageErrors = [];
    page.on('pageerror', error => {
      pageErrors.push({
        message: error.message,
        stack: error.stack
      });
    });
    
    // 네트워크 에러 수집
    const networkErrors = [];
    page.on('response', response => {
      if (!response.ok()) {
        networkErrors.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });
    
    // 페이지 로드
    console.log('📱 https://maslabs.kr/tasks 로드 중...');
    await page.goto('https://maslabs.kr/tasks', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // 5초 대기 (에러 수집)
    await page.waitForTimeout(5000);
    
    console.log('\n=== 콘솔 메시지 ===');
    consoleMessages.forEach((msg, index) => {
      console.log(`${index + 1}. [${msg.type.toUpperCase()}] ${msg.text}`);
      if (msg.location.url) {
        console.log(`   위치: ${msg.location.url}:${msg.location.lineNumber}`);
      }
    });
    
    console.log('\n=== 페이지 에러 ===');
    pageErrors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.message}`);
      if (error.stack) {
        console.log(`   스택: ${error.stack.split('\n')[0]}`);
      }
    });
    
    console.log('\n=== 네트워크 에러 ===');
    networkErrors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.status} ${error.statusText} - ${error.url}`);
    });
    
    // 스크린샷 저장
    await page.screenshot({ path: 'debug-console-error.png' });
    console.log('\n📸 스크린샷 저장: debug-console-error.png');
    
    // HTML 저장
    const html = await page.content();
    require('fs').writeFileSync('debug-console-page.html', html);
    console.log('📄 HTML 저장: debug-console-page.html');
    
  } catch (error) {
    console.error('❌ 디버깅 중 오류 발생:', error);
  } finally {
    await browser.close();
  }
}

debugConsole();
