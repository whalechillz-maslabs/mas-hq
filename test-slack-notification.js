const { chromium } = require('playwright');

async function testSlackNotification() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🔍 슬랙 알림 테스트 시작...');
    
    // /tasks 페이지로 이동
    await page.goto('https://www.maslabs.kr/tasks');
    await page.waitForLoadState('networkidle');
    
    // 로그인 확인
    const title = await page.title();
    console.log('📄 페이지 제목:', title);
    
    if (title.includes('Login')) {
      console.log('❌ 로그인이 필요합니다. 수동으로 로그인해주세요.');
      console.log('⏳ 30초 대기 중... (로그인 시간)');
      await page.waitForTimeout(30000);
    }
    
    // OP5 카드 찾기 및 클릭
    console.log('🔍 OP5 카드 찾는 중...');
    const op5Card = await page.locator('text=CS 응대 (제품안내, 시타보조)').first();
    
    if (await op5Card.isVisible()) {
      console.log('✅ OP5 카드 발견, 클릭 중...');
      await op5Card.click();
      await page.waitForTimeout(2000);
      
      // 빠른 업무 입력 폼이 나타났는지 확인
      const quickForm = await page.locator('text=빠른 업무 입력');
      if (await quickForm.isVisible()) {
        console.log('✅ 빠른 업무 입력 폼이 나타났습니다.');
        
        // 업무명 입력
        await page.fill('input[placeholder*="업무명"]', '테스트 CS 응대');
        
        // 고객명 입력
        await page.fill('input[placeholder*="고객명"]', '테스트고객');
        
        // 매출 금액 입력
        await page.fill('input[type="number"]', '100000');
        
        // 고객 유형 선택 (신규 고객이 기본값)
        console.log('📝 폼 데이터 입력 완료');
        
        // 제출 버튼 클릭
        const submitButton = await page.locator('button[type="submit"]');
        if (await submitButton.isVisible()) {
          console.log('🚀 업무 등록 버튼 클릭 중...');
          await submitButton.click();
          
          // 성공 메시지 대기
          await page.waitForTimeout(3000);
          
          // 성공 알림 확인
          const successMessage = await page.locator('text=성공적으로').first();
          if (await successMessage.isVisible()) {
            console.log('✅ 업무 등록 성공!');
            console.log('📨 슬랙 알림이 전송되었는지 확인해주세요.');
          } else {
            console.log('❓ 성공 메시지를 찾을 수 없습니다.');
          }
        } else {
          console.log('❌ 제출 버튼을 찾을 수 없습니다.');
        }
      } else {
        console.log('❌ 빠른 업무 입력 폼이 나타나지 않았습니다.');
      }
    } else {
      console.log('❌ OP5 카드를 찾을 수 없습니다.');
    }
    
    // 5초 대기
    await page.waitForTimeout(5000);
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error.message);
  } finally {
    await browser.close();
  }
}

testSlackNotification();