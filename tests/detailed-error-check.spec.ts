import { test, expect } from '@playwright/test';

test('상세 에러 확인 테스트', async ({ page }) => {
  console.log('🔍 상세 에러 확인 테스트 시작');
  
  // 콘솔 에러 수집
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('🚨 콘솔 에러:', msg.text());
    }
  });
  
  // 네트워크 에러 수집
  page.on('response', response => {
    if (!response.ok()) {
      console.log('🌐 네트워크 에러:', response.url(), response.status(), response.statusText());
    }
  });
  
  // 페이지 에러 수집
  page.on('pageerror', error => {
    console.log('📄 페이지 에러:', error.message);
  });
  
  // 1. 로그인 페이지 접속
  await page.goto('http://localhost:3000/login');
  console.log('✅ 로그인 페이지 접속 완료');
  
  // 2. 페이지 로딩 대기
  await page.waitForTimeout(2000);
  
  // 3. DOM 구조 확인
  const bodyHTML = await page.innerHTML('body');
  console.log('📄 DOM 구조 (처음 1000자):', bodyHTML.substring(0, 1000));
  
  // 4. 로그인 폼 요소들 확인
  const buttons = await page.locator('button').allTextContents();
  console.log('🔘 버튼들:', buttons);
  
  const inputs = await page.locator('input').count();
  console.log('📝 입력 필드 개수:', inputs);
  
  // 5. 전화번호 로그인 시도
  try {
    // 전화번호 버튼 찾기
    const phoneButton = page.locator('text=전화번호').first();
    await phoneButton.waitFor({ timeout: 5000 });
    await phoneButton.click();
    console.log('✅ 전화번호 버튼 클릭 성공');
  } catch (error) {
    console.log('❌ 전화번호 버튼 클릭 실패:', error);
    
    // 대안: 모든 버튼 중에서 전화번호 관련 버튼 찾기
    const allButtons = await page.locator('button').all();
    for (let i = 0; i < allButtons.length; i++) {
      const buttonText = await allButtons[i].textContent();
      if (buttonText?.includes('전화번호')) {
        await allButtons[i].click();
        console.log('✅ 대안 방법으로 전화번호 버튼 클릭 성공');
        break;
      }
    }
  }
  
  // 6. 입력 필드 확인 및 입력
  try {
    const telInput = page.locator('input[type="tel"]').first();
    await telInput.waitFor({ timeout: 5000 });
    await telInput.fill('010-6669-9000');
    console.log('✅ 전화번호 입력 성공');
  } catch (error) {
    console.log('❌ 전화번호 입력 실패:', error);
  }
  
  try {
    const passwordInput = page.locator('input[type="password"]').first();
    await passwordInput.waitFor({ timeout: 5000 });
    await passwordInput.fill('66699000');
    console.log('✅ 비밀번호 입력 성공');
  } catch (error) {
    console.log('❌ 비밀번호 입력 실패:', error);
  }
  
  // 7. 로그인 시도
  try {
    const submitButton = page.locator('button[type="submit"]').first();
    await submitButton.waitFor({ timeout: 5000 });
    await submitButton.click();
    console.log('✅ 로그인 버튼 클릭 성공');
  } catch (error) {
    console.log('❌ 로그인 버튼 클릭 실패:', error);
  }
  
  // 8. 페이지 변화 대기
  await page.waitForTimeout(5000);
  console.log('📍 현재 URL:', page.url());
  
  // 9. 성공/실패 메시지 확인
  const successMessage = await page.locator('text=성공').count();
  const errorMessage = await page.locator('text=실패').count();
  const errorText = await page.locator('text=오류').count();
  
  console.log('✅ 성공 메시지 개수:', successMessage);
  console.log('❌ 실패 메시지 개수:', errorMessage);
  console.log('🚨 오류 메시지 개수:', errorText);
  
  // 10. 현재 페이지 내용 확인
  const currentContent = await page.textContent('body');
  console.log('📄 현재 페이지 내용 (처음 500자):', currentContent?.substring(0, 500));
  
  // 11. 스크린샷 캡처
  await page.screenshot({ path: 'detailed-error-check.png', fullPage: true });
  console.log('✅ 상세 에러 확인 스크린샷 캡처 완료');
  
  console.log('🎉 상세 에러 확인 테스트 완료!');
});
