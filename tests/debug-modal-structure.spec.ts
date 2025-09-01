import { test, expect } from '@playwright/test';

test('스케줄 모달 구조 디버깅', async ({ page }) => {
  // 로그인
  await page.goto('https://maslabs.kr/login');
  
  // 김탁수 계정으로 로그인
  await page.fill('input[name="phone"]', '010-6669-9000');
  await page.fill('input[name="password"]', '66699000');
  await page.click('button[type="submit"]');
  
  // 로그인 후 대시보드로 이동
  await page.waitForURL('**/quick-task');
  
  // 직원별 스케줄 관리 페이지로 이동
  await page.goto('https://maslabs.kr/admin/employee-schedules');
  await page.waitForLoadState('networkidle');
  
  // 개별 관리 버튼 클릭
  await page.click('button:has-text("개별 관리")');
  await page.waitForTimeout(2000);
  
  // 직원 목록에서 하상희 선택
  await page.click('button:has-text("하상희HA디자인팀 • 대리")');
  await page.waitForTimeout(2000);
  
  // 하상희가 선택되었는지 확인
  const selectedEmployee = page.locator('button:has-text("하상희HA디자인팀 • 대리")');
  const buttonClass = await selectedEmployee.getAttribute('class');
  console.log('하상희 버튼 클래스:', buttonClass);
  
  // 빈 시간 슬롯 클릭
  const emptyTimeSlot = page.locator('div[class*="bg-gray-50"]').first();
  if (await emptyTimeSlot.isVisible()) {
    console.log('빈 시간 슬롯을 찾았습니다');
    
    // 클릭 전 페이지 상태 스크린샷
    await page.screenshot({ path: 'test-results/before-click.png' });
    
    // 시간 슬롯 클릭
    await emptyTimeSlot.click();
    await page.waitForTimeout(2000);
    
    // 클릭 후 페이지 상태 스크린샷
    await page.screenshot({ path: 'test-results/after-click.png' });
    
    // 페이지의 모든 요소 검사
    console.log('=== 페이지 전체 HTML 구조 분석 ===');
    
    // body 전체 내용 확인
    const bodyContent = await page.locator('body').textContent();
    console.log('Body 내용 일부:', bodyContent?.substring(0, 1000));
    
    // 모든 div 요소 찾기
    const allDivs = page.locator('div');
    const divCount = await allDivs.count();
    console.log('총 div 요소 수:', divCount);
    
    // 모달 관련 클래스를 가진 요소 찾기
    const modalElements = page.locator('div[class*="modal"], div[class*="Modal"], div[class*="fixed"], div[class*="absolute"]');
    const modalCount = await modalElements.count();
    console.log('모달 관련 요소 수:', modalCount);
    
    for (let i = 0; i < Math.min(modalCount, 10); i++) {
      const element = modalElements.nth(i);
      const elementClass = await element.getAttribute('class');
      const elementText = await element.textContent();
      console.log(`모달 관련 요소 ${i + 1}: 클래스="${elementClass}", 텍스트="${elementText?.substring(0, 100)}"`);
    }
    
    // z-index가 높은 요소 찾기
    const highZIndexElements = page.locator('div[style*="z-index"], div[class*="z-"]');
    const zIndexCount = await highZIndexElements.count();
    console.log('높은 z-index 요소 수:', zIndexCount);
    
    for (let i = 0; i < Math.min(zIndexCount, 5); i++) {
      const element = highZIndexElements.nth(i);
      const elementClass = await element.getAttribute('class');
      const elementStyle = await element.getAttribute('style');
      console.log(`높은 z-index 요소 ${i + 1}: 클래스="${elementClass}", 스타일="${elementStyle}"`);
    }
    
    // 스케줄 관련 텍스트 찾기
    const scheduleTexts = page.locator('text=/스케줄|추가|수정|삭제/');
    const scheduleCount = await scheduleTexts.count();
    console.log('스케줄 관련 텍스트 수:', scheduleCount);
    
    for (let i = 0; i < Math.min(scheduleCount, 10); i++) {
      const text = await scheduleTexts.nth(i).textContent();
      console.log(`스케줄 관련 텍스트 ${i + 1}: ${text}`);
    }
    
    // 모든 input 요소 찾기
    const allInputs = page.locator('input, textarea, select');
    const inputCount = await allInputs.count();
    console.log('총 입력 요소 수:', inputCount);
    
    for (let i = 0; i < Math.min(inputCount, 5); i++) {
      const input = allInputs.nth(i);
      const inputType = await input.getAttribute('type');
      const inputPlaceholder = await input.getAttribute('placeholder');
      const inputClass = await input.getAttribute('class');
      console.log(`입력 요소 ${i + 1}: type=${inputType}, placeholder=${inputPlaceholder}, class=${inputClass}`);
    }
    
    // 모든 button 요소 찾기
    const allButtons = page.locator('button');
    const buttonCount = await allButtons.count();
    console.log('총 버튼 수:', buttonCount);
    
    for (let i = 0; i < Math.min(buttonCount, 10); i++) {
      const button = allButtons.nth(i);
      const buttonText = await button.textContent();
      const buttonClass = await button.getAttribute('class');
      console.log(`버튼 ${i + 1}: 텍스트="${buttonText}", 클래스="${buttonClass}"`);
    }
    
    // 네트워크 요청 확인
    console.log('=== 네트워크 요청 분석 ===');
    const networkRequests = await page.evaluate(() => {
      return performance.getEntriesByType('resource').map(entry => ({
        name: entry.name,
        type: entry.initiatorType
      }));
    });
    
    console.log('네트워크 요청:', networkRequests.slice(0, 10));
    
    // 콘솔 로그 확인
    console.log('=== 콘솔 로그 분석 ===');
    const consoleLogs = await page.evaluate(() => {
      return window.consoleLogs || [];
    });
    
    if (consoleLogs.length > 0) {
      console.log('콘솔 로그:', consoleLogs);
    } else {
      console.log('콘솔 로그가 없습니다');
    }
    
    // JavaScript 오류 확인
    const jsErrors = await page.evaluate(() => {
      return window.jsErrors || [];
    });
    
    if (jsErrors.length > 0) {
      console.log('JavaScript 오류:', jsErrors);
    } else {
      console.log('JavaScript 오류가 없습니다');
    }
    
  } else {
    console.log('빈 시간 슬롯을 찾을 수 없음');
  }
  
  console.log('모달 구조 디버깅 완료');
});
