import { test, expect } from '@playwright/test';

test.describe('업무 추가 모달 폼 필드 확인', () => {
  test.beforeEach(async ({ page }) => {
    // 배포 서버로 접속
    await page.goto('https://www.maslabs.kr/login');
    
    // 관리자 로그인
    await page.fill('input[type="tel"]', '010-6669-9000');
    await page.fill('input[type="password"]', '66699000');
    await page.click('button[type="submit"]');
    
    // 대시보드 로딩 대기
    await page.waitForURL('**/dashboard', { timeout: 15000 });
  });

  test('업무 추가 모달 폼 필드 확인', async ({ page }) => {
    console.log('🔍 업무 추가 모달 폼 필드 확인 시작');
    
    // 업무 기록 페이지로 이동
    await page.goto('https://www.maslabs.kr/tasks');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ 업무 기록 페이지 접근 완료');
    
    // 업무 추가 버튼 클릭
    await page.click('button:has-text("업무 추가")');
    await page.waitForSelector('div[class*="fixed"]', { timeout: 10000 });
    
    console.log('✅ 업무 추가 모달 열림');
    
    // 모달 내의 모든 폼 요소 확인
    const modal = page.locator('div[class*="fixed"]').first();
    
    // 모든 input 요소 확인
    const inputs = modal.locator('input');
    const inputCount = await inputs.count();
    console.log('📝 Input 요소 개수:', inputCount);
    
    for (let i = 0; i < inputCount; i++) {
      const input = inputs.nth(i);
      const name = await input.getAttribute('name');
      const type = await input.getAttribute('type');
      const placeholder = await input.getAttribute('placeholder');
      console.log(`📝 Input ${i}: name="${name}", type="${type}", placeholder="${placeholder}"`);
    }
    
    // 모든 select 요소 확인
    const selects = modal.locator('select');
    const selectCount = await selects.count();
    console.log('📋 Select 요소 개수:', selectCount);
    
    for (let i = 0; i < selectCount; i++) {
      const select = selects.nth(i);
      const name = await select.getAttribute('name');
      console.log(`📋 Select ${i}: name="${name}"`);
      
      // 옵션들 확인
      const options = select.locator('option');
      const optionCount = await options.count();
      console.log(`📋 Select ${i} 옵션 개수:`, optionCount);
      
      for (let j = 0; j < Math.min(optionCount, 5); j++) {
        const option = options.nth(j);
        const value = await option.getAttribute('value');
        const text = await option.textContent();
        console.log(`📋 Select ${i} Option ${j}: value="${value}", text="${text}"`);
      }
    }
    
    // 모든 label 요소 확인
    const labels = modal.locator('label');
    const labelCount = await labels.count();
    console.log('🏷️ Label 요소 개수:', labelCount);
    
    for (let i = 0; i < labelCount; i++) {
      const label = labels.nth(i);
      const text = await label.textContent();
      const forAttr = await label.getAttribute('for');
      console.log(`🏷️ Label ${i}: text="${text}", for="${forAttr}"`);
    }
    
    // 모달 스크린샷
    await page.screenshot({ 
      path: 'test-results/debug-form-fields-modal.png',
      fullPage: true 
    });
    
    console.log('🎉 폼 필드 확인 완료!');
  });
});
