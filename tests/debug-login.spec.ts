import { test, expect } from '@playwright/test';

test('로그인 디버깅 테스트', async ({ page }) => {
  console.log('🔍 로그인 디버깅 테스트 시작');
  
  // 1. 로그인 페이지로 이동
  await page.goto('http://localhost:3000/login');
  console.log('✅ 로그인 페이지 접속 완료');
  
  // 2. 페이지 URL 확인
  console.log('📍 현재 URL:', page.url());
  
  // 3. 로그인 방법 선택 (전화번호)
  await page.click('text=전화번호');
  console.log('✅ 전화번호 로그인 방법 선택');
  
  // 4. 전화번호 입력 (관리자 계정)
  await page.fill('input[type="tel"]', '010-6669-9000');
  console.log('✅ 관리자 전화번호 입력: 010-6669-9000');
  
  // 5. 비밀번호 입력
  await page.fill('input[type="password"]', '66699000');
  console.log('✅ 관리자 비밀번호 입력: 66699000');
  
  // 6. 로그인 버튼 클릭
  await page.click('button[type="submit"]');
  console.log('✅ 로그인 버튼 클릭');
  
  // 7. 페이지 변화 대기
  await page.waitForTimeout(3000);
  console.log('📍 로그인 후 URL:', page.url());
  
  // 8. 페이지 내용 확인
  const pageContent = await page.textContent('body');
  console.log('📄 페이지 내용 (처음 1000자):', pageContent?.substring(0, 1000));
  
  // 9. 에러 메시지 확인
  const errorMessages = await page.locator('[class*="error"], [class*="Error"]').allTextContents();
  console.log('❌ 에러 메시지들:', errorMessages);
  
  // 10. 성공 메시지 확인
  const successMessages = await page.locator('[class*="success"], [class*="Success"]').allTextContents();
  console.log('✅ 성공 메시지들:', successMessages);
  
  // 11. 스크린샷 캡처
  await page.screenshot({ path: 'debug-login.png', fullPage: true });
  console.log('✅ 디버그 스크린샷 캡처 완료');
  
  console.log('🎉 로그인 디버깅 테스트 완료!');
});
