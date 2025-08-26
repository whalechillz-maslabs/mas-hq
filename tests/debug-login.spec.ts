import { test, expect } from '@playwright/test';

test('로그인 디버깅 테스트', async ({ page }) => {
  console.log('🔍 로그인 디버깅 테스트 시작');
  
  // 로그인 페이지로 이동
  await page.goto('http://localhost:3000/login');
  console.log('✅ 로그인 페이지 로드 완료');
  
  // 현재 URL 확인
  console.log('📍 현재 URL:', page.url());
  
  // 로그인 시도
  await page.fill('input[name="phone"]', '010-6669-9000');
  await page.fill('input[name="password"]', '66699000');
  console.log('📝 로그인 정보 입력 완료');
  
  // 로그인 버튼 클릭
  await page.click('button[type="submit"]');
  console.log('🔘 로그인 버튼 클릭 완료');
  
  // 페이지 변화 대기
  await page.waitForTimeout(3000);
  
  // 로그인 후 URL 확인
  console.log('📍 로그인 후 URL:', page.url());
  
  // 페이지 제목 확인
  const title = await page.title();
  console.log('📄 페이지 제목:', title);
  
  // 에러 메시지 확인
  const errorMessages = await page.locator('text=error, text=Error, text=오류, text=실패').count();
  console.log('❌ 에러 메시지 개수:', errorMessages);
  
  if (errorMessages > 0) {
    const errors = await page.locator('text=error, text=Error, text=오류, text=실패').all();
    for (let i = 0; i < errors.length; i++) {
      const errorText = await errors[i].textContent();
      console.log(`❌ 에러 ${i + 1}:`, errorText);
    }
  }
  
  // 성공 메시지 확인
  const successMessages = await page.locator('text=success, text=Success, text=성공, text=환영').count();
  console.log('✅ 성공 메시지 개수:', successMessages);
  
  if (successMessages > 0) {
    const successes = await page.locator('text=success, text=Success, text=성공, text=환영').all();
    for (let i = 0; i < successes.length; i++) {
      const successText = await successes[i].textContent();
      console.log(`✅ 성공 ${i + 1}:`, successText);
    }
  }
  
  // 스크린샷 캡처
  await page.screenshot({ path: 'login-debug.png', fullPage: true });
  console.log('📸 스크린샷 캡처 완료');
  
  console.log('🎉 로그인 디버깅 테스트 완료!');
});
