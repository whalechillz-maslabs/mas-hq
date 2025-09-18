const { chromium } = require('playwright');

async function testSlackNotification() {
  const browser = await chromium.launch({ 
    headless: false,
    channel: 'chrome'
  });
  
  const page = await browser.newPage();
  
  try {
    console.log('🔍 OP10 업무 등록 및 Slack 알림 테스트 시작...');
    
    // 네트워크 요청 모니터링
    const requests = [];
    page.on('request', request => {
      if (request.url().includes('/api/slack/notify')) {
        requests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
          postData: request.postData()
        });
      }
    });
    
    // 응답 모니터링
    const responses = [];
    page.on('response', response => {
      if (response.url().includes('/api/slack/notify')) {
        responses.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });
    
    // 콘솔 메시지 수집
    const consoleMessages = [];
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text()
      });
    });
    
    // 페이지 로드
    console.log('📱 https://maslabs.kr/tasks 로드 중...');
    await page.goto('https://maslabs.kr/tasks', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });
    
    // 로그인 필요시 대기
    console.log('⏳ 로그인 필요시 로그인해주세요...');
    await page.waitForTimeout(10000);
    
    // OP10 업무 카드 찾기
    console.log('🔍 OP10 업무 카드 찾는 중...');
    const op10Card = page.locator('text=OP10').first();
    
    if (await op10Card.isVisible()) {
      console.log('✅ OP10 업무 카드 발견');
      await op10Card.click();
      
      // 빠른 업무 입력 폼 대기
      await page.waitForTimeout(2000);
      
      // 업무명 입력
      const titleInput = page.locator('input[placeholder*="업무명"]').first();
      if (await titleInput.isVisible()) {
        await titleInput.fill('테스트 OP10 업무 - Slack 알림 확인');
        console.log('📝 업무명 입력 완료');
      }
      
      // 업무 내용 입력
      const notesInput = page.locator('textarea[placeholder*="업무 내용"]').first();
      if (await notesInput.isVisible()) {
        await notesInput.fill('이것은 Slack 알림 테스트를 위한 OP10 업무입니다. 투어 관련 내용을 포함합니다.');
        console.log('📝 업무 내용 입력 완료');
      }
      
      // 고객명 입력
      const customerInput = page.locator('input[placeholder*="고객명"]').first();
      if (await customerInput.isVisible()) {
        await customerInput.fill('테스트 고객');
        console.log('📝 고객명 입력 완료');
      }
      
      // 업무 추가 버튼 클릭
      const submitButton = page.locator('button:has-text("업무 추가")').first();
      if (await submitButton.isVisible()) {
        console.log('🚀 업무 추가 버튼 클릭...');
        await submitButton.click();
        
        // Slack API 호출 대기
        await page.waitForTimeout(5000);
        
        console.log('\n=== Slack API 요청 분석 ===');
        requests.forEach((req, index) => {
          console.log(`${index + 1}. ${req.method} ${req.url}`);
          if (req.postData) {
            try {
              const data = JSON.parse(req.postData);
              console.log('   요청 데이터:', JSON.stringify(data, null, 2));
            } catch (e) {
              console.log('   요청 데이터 (파싱 실패):', req.postData);
            }
          }
        });
        
        console.log('\n=== Slack API 응답 분석 ===');
        responses.forEach((res, index) => {
          console.log(`${index + 1}. ${res.status} ${res.statusText} - ${res.url}`);
        });
        
        console.log('\n=== 콘솔 메시지 ===');
        consoleMessages.forEach((msg, index) => {
          if (msg.type === 'error' || msg.text.includes('Slack') || msg.text.includes('알림')) {
            console.log(`${index + 1}. [${msg.type.toUpperCase()}] ${msg.text}`);
          }
        });
        
      } else {
        console.log('❌ 업무 추가 버튼을 찾을 수 없습니다');
      }
    } else {
      console.log('❌ OP10 업무 카드를 찾을 수 없습니다');
    }
    
    // 스크린샷 저장
    await page.screenshot({ path: 'slack-test-result.png' });
    console.log('\n📸 스크린샷 저장: slack-test-result.png');
    
    console.log('\n⏳ 10초 대기 후 브라우저 종료...');
    await page.waitForTimeout(10000);
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error);
  } finally {
    await browser.close();
  }
}

testSlackNotification();
