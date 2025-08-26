import { test, expect } from '@playwright/test';

test('스케줄 페이지 구조 확인', async ({ page }) => {
  console.log('🔍 스케줄 페이지 구조 확인 시작');
  
  // 로그인
  await page.goto('http://localhost:3000/login');
  await page.fill('input[name="phone"]', '010-6669-9000');
  await page.fill('input[name="password"]', '66699000');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  console.log('✅ 로그인 완료');
  
  // 스케줄 페이지로 이동
  await page.goto('http://localhost:3000/schedules');
  await page.waitForLoadState('networkidle');
  console.log('✅ 스케줄 페이지 이동 완료');
  
  // 현재 URL 확인
  console.log('📍 현재 URL:', page.url());
  
  // 페이지 제목 확인
  const title = await page.title();
  console.log('📄 페이지 제목:', title);
  
  // 페이지 내용 확인
  const content = await page.content();
  console.log('📝 페이지 내용 길이:', content.length);
  
  // 모든 버튼 확인
  const buttons = await page.locator('button').count();
  console.log('🔘 버튼 개수:', buttons);
  
  if (buttons > 0) {
    const buttonElements = await page.locator('button').all();
    for (let i = 0; i < buttonElements.length; i++) {
      const text = await buttonElements[i].textContent();
      const type = await buttonElements[i].getAttribute('type');
      console.log(`🔘 버튼 ${i + 1}: text="${text?.trim()}", type=${type}`);
    }
  }
  
  // 모든 입력 필드 확인
  const inputs = await page.locator('input').count();
  console.log('📥 입력 필드 개수:', inputs);
  
  if (inputs > 0) {
    const inputElements = await page.locator('input').all();
    for (let i = 0; i < inputElements.length; i++) {
      const type = await inputElements[i].getAttribute('type');
      const placeholder = await inputElements[i].getAttribute('placeholder');
      const name = await inputElements[i].getAttribute('name');
      console.log(`📥 입력 필드 ${i + 1}: type=${type}, placeholder=${placeholder}, name=${name}`);
    }
  }
  
  // 모든 div 요소 확인 (스케줄 그리드 관련)
  const divs = await page.locator('div').count();
  console.log('📦 div 요소 개수:', divs);
  
  // data-date 속성을 가진 요소 확인
  const dateElements = await page.locator('[data-date]').count();
  console.log('📅 data-date 속성을 가진 요소 개수:', dateElements);
  
  if (dateElements > 0) {
    const dateElementList = await page.locator('[data-date]').all();
    for (let i = 0; i < dateElementList.length; i++) {
      const date = await dateElementList[i].getAttribute('data-date');
      const text = await dateElementList[i].textContent();
      console.log(`📅 data-date 요소 ${i + 1}: date=${date}, text="${text?.trim()}"`);
    }
  }
  
  // data-time 속성을 가진 요소 확인
  const timeElements = await page.locator('[data-time]').count();
  console.log('⏰ data-time 속성을 가진 요소 개수:', timeElements);
  
  if (timeElements > 0) {
    const timeElementList = await page.locator('[data-time]').all();
    for (let i = 0; i < timeElementList.length; i++) {
      const time = await timeElementList[i].getAttribute('data-time');
      const text = await timeElementList[i].textContent();
      console.log(`⏰ data-time 요소 ${i + 1}: time=${time}, text="${text?.trim()}"`);
    }
  }
  
  // 스크린샷 캡처
  await page.screenshot({ path: 'schedule-page-debug.png', fullPage: true });
  console.log('📸 스크린샷 캡처 완료');
  
  console.log('🎉 스케줄 페이지 구조 확인 완료!');
});
