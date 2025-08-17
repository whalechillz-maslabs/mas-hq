import { test, expect } from '@playwright/test';

test('직접 로그인 테스트', async ({ page }) => {
  // 콘솔 로그 수집
  page.on('console', msg => console.log('브라우저 콘솔:', msg.text()));
  
  // 로그인 페이지로 이동
  await page.goto('/login');
  
  // 브라우저에서 직접 로그인 함수 호출
  await page.evaluate(() => {
    // 전화번호 입력
    const phoneInput = document.querySelector('input[type="tel"]') as HTMLInputElement;
    if (phoneInput) {
      phoneInput.value = '010-6669-9000';
      phoneInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    // 비밀번호 입력
    const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
    if (passwordInput) {
      passwordInput.value = '';
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    // 로그인 버튼 클릭
    const loginButton = document.querySelector('button') as HTMLButtonElement;
    if (loginButton && loginButton.textContent?.includes('로그인')) {
      loginButton.click();
    }
  });
  
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
  await page.screenshot({ path: 'direct-login-result.png' });
  
  // 페이지의 모든 텍스트 출력
  const allText = await page.locator('body').textContent();
  console.log('페이지의 모든 텍스트:', allText?.substring(0, 500));
});
