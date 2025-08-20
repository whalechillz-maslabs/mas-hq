import { test, expect } from '@playwright/test';

test('관리자 로그인 및 UI 확인', async ({ page }) => {
  console.log('🔍 관리자 로그인 및 UI 확인 테스트 시작');
  
  // 1. 로그인 페이지로 이동
  await page.goto('http://localhost:3000/login');
  console.log('✅ 로그인 페이지 접속 완료');
  
  // 2. 페이지 스크린샷
  await page.screenshot({ path: 'login-page.png', fullPage: true });
  console.log('✅ 로그인 페이지 스크린샷 완료');
  
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
  
  // 7. 대시보드 로딩 대기
  await page.waitForURL('**/dashboard');
  console.log('✅ 대시보드 페이지 로딩 완료');
  
  // 8. 대시보드 스크린샷
  await page.screenshot({ path: 'dashboard-page.png', fullPage: true });
  console.log('✅ 대시보드 페이지 스크린샷 완료');
  
  // 9. 페이지 내용 확인 (실제 텍스트 찾기)
  const pageContent = await page.textContent('body');
  console.log('📄 페이지 내용:', pageContent?.substring(0, 500));
  
  // 10. 모든 버튼 텍스트 확인
  const buttons = await page.locator('button').allTextContents();
  console.log('🔘 버튼 텍스트들:', buttons);
  
  // 11. 모든 텍스트 확인
  const allText = await page.locator('*').allTextContents();
  console.log('📝 모든 텍스트 (처음 10개):', allText.slice(0, 10));
  
  console.log('🎉 관리자 로그인 및 UI 확인 테스트 완료!');
});
