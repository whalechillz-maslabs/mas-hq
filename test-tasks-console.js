const { chromium } = require('playwright');

async function testTasksConsole() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  // 콘솔 로그 수집
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text(),
      location: msg.location()
    });
  });
  
  // 페이지 오류 수집
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push({
      message: error.message,
      stack: error.stack
    });
  });
  
  try {
    console.log('🔍 /tasks 페이지 콘솔 오류 확인...');
    
    await page.goto('https://www.maslabs.kr/tasks');
    await page.waitForLoadState('networkidle');
    
    // 3초 대기하여 모든 로그 수집
    await page.waitForTimeout(3000);
    
    console.log('\n📊 콘솔 로그:');
    consoleLogs.forEach((log, index) => {
      console.log(`${index + 1}. [${log.type}] ${log.text}`);
    });
    
    console.log('\n🚨 페이지 오류:');
    pageErrors.forEach((error, index) => {
      console.log(`${index + 1}. ${error.message}`);
      if (error.stack) {
        console.log(`   Stack: ${error.stack.split('\n')[0]}`);
      }
    });
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error.message);
  } finally {
    await browser.close();
  }
}

testTasksConsole();
