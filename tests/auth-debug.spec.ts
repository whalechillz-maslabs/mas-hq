import { test, expect } from '@playwright/test';

test('인증 디버깅 테스트', async ({ page }) => {
  console.log('🔍 인증 디버깅 테스트 시작');
  
  // 1. 로그인 페이지로 이동
  await page.goto('http://localhost:3001/login');
  console.log('✅ 로그인 페이지 접속 완료');
  
  // 2. 로그인 방법 선택 (전화번호)
  await page.click('text=전화번호');
  console.log('✅ 전화번호 로그인 방법 선택');
  
  // 3. 전화번호 입력 (관리자 계정)
  await page.fill('input[type="tel"]', '010-6669-9000');
  console.log('✅ 관리자 전화번호 입력: 010-6669-9000');
  
  // 4. 비밀번호 입력
  await page.fill('input[type="password"]', '66699000');
  console.log('✅ 관리자 비밀번호 입력: 66699000');
  
  // 5. 로그인 버튼 클릭
  await page.click('button[type="submit"]');
  console.log('✅ 로그인 버튼 클릭');
  
  // 6. 페이지 변화 대기
  await page.waitForTimeout(3000);
  console.log('📍 로그인 후 URL:', page.url());
  
  // 7. 로컬 스토리지 확인
  const isLoggedIn = await page.evaluate(() => localStorage.getItem('isLoggedIn'));
  const currentEmployee = await page.evaluate(() => localStorage.getItem('currentEmployee'));
  
  console.log('🔐 로그인 상태:', isLoggedIn);
  console.log('👤 직원 데이터:', currentEmployee);
  
  // 8. 대시보드로 이동
  await page.goto('http://localhost:3001/dashboard');
  console.log('✅ 대시보드 페이지 접속');
  
  // 9. 페이지 로딩 대기
  await page.waitForTimeout(5000);
  console.log('📍 대시보드 URL:', page.url());
  
  // 10. 대시보드 내용 확인
  const dashboardContent = await page.textContent('body');
  console.log('📄 대시보드 내용 (처음 1000자):', dashboardContent?.substring(0, 1000));
  
  // 11. KPI 데이터 확인
  const kpiElements = await page.locator('[class*="text-2xl"]').allTextContents();
  console.log('📊 KPI 요소들:', kpiElements);
  
  // 12. 스크린샷 캡처
  await page.screenshot({ path: 'auth-debug.png', fullPage: true });
  console.log('✅ 인증 디버그 스크린샷 캡처 완료');
  
  console.log('🎉 인증 디버깅 테스트 완료!');
});
