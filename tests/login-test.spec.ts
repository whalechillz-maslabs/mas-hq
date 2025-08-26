import { test, expect } from '@playwright/test';

test('로그인 페이지 테스트', async ({ page }) => {
  console.log('🔍 로그인 페이지 테스트 시작');
  
  // 로그인 페이지로 직접 이동
  await page.goto('http://localhost:3000/login');
  console.log('✅ 로그인 페이지 로드 완료');
  
  // 페이지 제목 확인
  const title = await page.title();
  console.log('📄 페이지 제목:', title);
  
  // 입력 필드 확인
  const inputs = await page.locator('input').count();
  console.log('🔢 입력 필드 개수:', inputs);
  
  if (inputs > 0) {
    const inputElements = await page.locator('input').all();
    for (let i = 0; i < inputElements.length; i++) {
      const type = await inputElements[i].getAttribute('type');
      const placeholder = await inputElements[i].getAttribute('placeholder');
      const name = await inputElements[i].getAttribute('name');
      console.log(`📥 입력 필드 ${i + 1}: type=${type}, placeholder=${placeholder}, name=${name}`);
    }
  }
  
  // 버튼 확인
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
  
  // 스크린샷 캡처
  await page.screenshot({ path: 'login-page-test.png', fullPage: true });
  console.log('📸 스크린샷 캡처 완료');
  
  console.log('🎉 로그인 페이지 테스트 완료!');
});
