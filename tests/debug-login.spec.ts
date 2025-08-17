import { test, expect } from '@playwright/test';

test('로그인 디버깅 테스트', async ({ page }) => {
  // 콘솔 로그 수집
  page.on('console', msg => console.log('브라우저 콘솔:', msg.text()));
  
  // 로그인 페이지로 이동
  await page.goto('/login');
  
  // 페이지 스크린샷 저장
  await page.screenshot({ path: 'login-page.png' });
  
  // 전화번호 입력
  await page.fill('input[type="tel"]', '010-6669-9000');
  
  // 비밀번호 입력
  await page.fill('input[type="password"]', '');
  
  // 버튼 찾기 시도
  const button = page.locator('button:has-text("로그인")');
  console.log('로그인 버튼 찾기:', await button.count());
  
  // 폼 제출 시도 1: 버튼 클릭
  console.log('로그인 버튼 클릭 시도...');
  await button.click();
  
  // 잠시 대기
  await page.waitForTimeout(2000);
  
  // 폼 제출 시도 2: Enter 키
  console.log('Enter 키로 폼 제출 시도...');
  await page.press('input[type="password"]', 'Enter');
  
  // 5초 대기
  await page.waitForTimeout(5000);
  
  // 현재 URL 확인
  const currentUrl = page.url();
  console.log('현재 URL:', currentUrl);
  
  // 페이지 제목 확인
  const pageTitle = await page.title();
  console.log('페이지 제목:', pageTitle);
  
  // 페이지 내용 확인
  const pageContent = await page.content();
  console.log('페이지 내용 길이:', pageContent.length);
  
  // 에러 메시지 확인
  const errorText = await page.locator('text=전화번호를 찾을 수 없습니다').count();
  console.log('에러 메시지 개수:', errorText);
  
  // 성공 메시지 확인
  const successText = await page.locator('text=직원 대시보드').count();
  console.log('대시보드 텍스트 개수:', successText);
  
  // 현재 페이지 스크린샷 저장
  await page.screenshot({ path: 'after-login.png' });
  
  // 페이지의 모든 텍스트 출력
  const allText = await page.locator('body').textContent();
  console.log('페이지의 모든 텍스트:', allText?.substring(0, 500));
});
