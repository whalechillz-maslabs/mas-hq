import { test, expect } from '@playwright/test';

test('에러 확인 테스트', async ({ page }) => {
  console.log('🔍 에러 확인 테스트 시작');
  
  // 1. 로그인 페이지 접속
  await page.goto('http://localhost:3000/login');
  console.log('✅ 로그인 페이지 접속 완료');
  
  // 2. 페이지 콘텐츠 확인
  const pageContent = await page.textContent('body');
  console.log('📄 페이지 내용 (처음 500자):', pageContent?.substring(0, 500));
  
  // 3. 로그인 버튼들 확인
  const loginButtons = await page.locator('button').allTextContents();
  console.log('🔘 로그인 버튼들:', loginButtons);
  
  // 4. 입력 필드 확인
  const inputs = await page.locator('input').count();
  console.log('📝 입력 필드 개수:', inputs);
  
  // 5. 전화번호 로그인 시도
  try {
    await page.click('text=전화번호');
    console.log('✅ 전화번호 버튼 클릭 성공');
  } catch (error) {
    console.log('❌ 전화번호 버튼 클릭 실패:', error);
  }
  
  // 6. 전화번호 입력 시도
  try {
    await page.fill('input[type="tel"]', '010-6669-9000');
    console.log('✅ 전화번호 입력 성공');
  } catch (error) {
    console.log('❌ 전화번호 입력 실패:', error);
  }
  
  // 7. 비밀번호 입력 시도
  try {
    await page.fill('input[type="password"]', '66699000');
    console.log('✅ 비밀번호 입력 성공');
  } catch (error) {
    console.log('❌ 비밀번호 입력 실패:', error);
  }
  
  // 8. 로그인 버튼 클릭 시도
  try {
    await page.click('button[type="submit"]');
    console.log('✅ 로그인 버튼 클릭 성공');
  } catch (error) {
    console.log('❌ 로그인 버튼 클릭 실패:', error);
  }
  
  // 9. 페이지 이동 대기
  await page.waitForTimeout(3000);
  console.log('📍 현재 URL:', page.url());
  
  // 10. 콘솔 에러 확인
  const consoleErrors = await page.evaluate(() => {
    return window.consoleErrors || [];
  });
  console.log('🚨 콘솔 에러:', consoleErrors);
  
  // 11. 네트워크 에러 확인
  const networkErrors = await page.evaluate(() => {
    return window.networkErrors || [];
  });
  console.log('🌐 네트워크 에러:', networkErrors);
  
  // 12. 스크린샷 캡처
  await page.screenshot({ path: 'error-check.png', fullPage: true });
  console.log('✅ 에러 확인 스크린샷 캡처 완료');
  
  console.log('🎉 에러 확인 테스트 완료!');
});
