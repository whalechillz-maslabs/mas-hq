const { chromium } = require('playwright');

async function testSlackNotification() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('🔍 슬랙 알림 테스트 시작...');
    
    // /tasks 페이지로 이동
    await page.goto('https://www.maslabs.kr/tasks');
    await page.waitForLoadState('networkidle');
    
    // 페이지 스크린샷
    await page.screenshot({ path: 'tasks-page.png' });
    console.log('📸 페이지 스크린샷 저장: tasks-page.png');
    
    // 모든 카드 요소 찾기
    const cards = await page.locator('[class*="card"], [class*="Card"]').all();
    console.log(`🔍 발견된 카드 수: ${cards.length}`);
    
    // OP5 관련 텍스트 찾기
    const op5Texts = [
      'OP5',
      'CS 응대',
      '제품안내',
      '시타보조'
    ];
    
    for (const text of op5Texts) {
      const element = await page.locator(`text=${text}`).first();
      if (await element.isVisible()) {
        console.log(`✅ "${text}" 텍스트 발견`);
        try {
          await element.click();
          console.log(`✅ "${text}" 클릭 성공`);
          await page.waitForTimeout(2000);
          break;
        } catch (e) {
          console.log(`❌ "${text}" 클릭 실패:`, e.message);
        }
      } else {
        console.log(`❌ "${text}" 텍스트 없음`);
      }
    }
    
    // 빠른 업무 입력 폼 확인
    const quickForm = await page.locator('text=빠른 업무 입력');
    if (await quickForm.isVisible()) {
      console.log('✅ 빠른 업무 입력 폼이 나타났습니다.');
      
      // 폼 스크린샷
      await page.screenshot({ path: 'quick-form.png' });
      console.log('📸 폼 스크린샷 저장: quick-form.png');
      
      // 업무명 입력
      const titleInput = await page.locator('input[type="text"]').first();
      if (await titleInput.isVisible()) {
        await titleInput.fill('테스트 CS 응대 - Playwright');
        console.log('📝 업무명 입력 완료');
      }
      
      // 고객명 입력
      const customerInput = await page.locator('input[placeholder*="고객명"]');
      if (await customerInput.isVisible()) {
        await customerInput.fill('테스트고객');
        console.log('📝 고객명 입력 완료');
      }
      
      // 매출 금액 입력
      const salesInput = await page.locator('input[type="number"]');
      if (await salesInput.isVisible()) {
        await salesInput.fill('100000');
        console.log('📝 매출 금액 입력 완료');
      }
      
      // 제출 버튼 찾기 및 클릭
      const submitButton = await page.locator('button[type="submit"], button:has-text("등록"), button:has-text("추가")').first();
      if (await submitButton.isVisible()) {
        console.log('🚀 업무 등록 버튼 클릭 중...');
        await submitButton.click();
        
        // 성공 메시지 대기
        await page.waitForTimeout(5000);
        
        // 결과 스크린샷
        await page.screenshot({ path: 'after-submit.png' });
        console.log('📸 제출 후 스크린샷 저장: after-submit.png');
        
        console.log('✅ 업무 등록 완료!');
        console.log('📨 슬랙 알림이 전송되었는지 확인해주세요.');
      } else {
        console.log('❌ 제출 버튼을 찾을 수 없습니다.');
      }
    } else {
      console.log('❌ 빠른 업무 입력 폼이 나타나지 않았습니다.');
    }
    
  } catch (error) {
    console.error('❌ 테스트 중 오류 발생:', error.message);
  } finally {
    await browser.close();
  }
}

testSlackNotification();
