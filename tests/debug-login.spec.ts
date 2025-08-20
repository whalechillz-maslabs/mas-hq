import { test, expect } from '@playwright/test';

test('로그인 디버깅 테스트', async ({ page }) => {
  console.log('🔍 로그인 디버깅 테스트 시작');
  
  // 로그인 페이지로 이동
  await page.goto('http://localhost:3000/login');
  
  // 페이지 로드 확인
  await expect(page.locator('h2:has-text("직원 로그인")')).toBeVisible();
  
  console.log('✅ 로그인 페이지 로드 완료');
  
  // 전화번호 입력
  await page.fill('input[type="tel"]', '010-6669-9000');
  
  // 비밀번호 입력
  await page.fill('input[type="password"]', '66699000');
  
  console.log('✅ 입력 완료: 010-6669-9000 / 66699000');
  
  // 로그인 버튼 클릭
  await page.click('button[type="submit"]');
  
  console.log('✅ 로그인 버튼 클릭 완료');
  
  // 잠시 대기
  await page.waitForTimeout(5000);
  
  // 현재 URL 확인
  const currentUrl = page.url();
  console.log('현재 URL:', currentUrl);
  
  // 에러 메시지 확인
  const errorElements = await page.locator('.error-message, .alert, [role="alert"], .text-red-500, .text-red-600, .text-red-700, .text-red-800, .text-red-900').all();
  
  if (errorElements.length > 0) {
    for (let i = 0; i < errorElements.length; i++) {
      const errorText = await errorElements[i].textContent();
      console.log(`에러 메시지 ${i + 1}:`, errorText);
    }
  } else {
    console.log('에러 메시지 없음');
  }
  
  // 특정 에러 메시지 확인
  const specificError = await page.locator('text=전화번호를 찾을 수 없습니다').count();
  console.log('"전화번호를 찾을 수 없습니다" 메시지 개수:', specificError);
  
  // 페이지의 모든 텍스트에서 에러 찾기
  const pageText = await page.locator('body').textContent();
  if (pageText && pageText.includes('전화번호를 찾을 수 없습니다')) {
    console.log('✅ "전화번호를 찾을 수 없습니다" 에러 메시지 발견');
  } else {
    console.log('❌ "전화번호를 찾을 수 없습니다" 에러 메시지 없음');
  }
  
  // 페이지 내용 확인
  const pageContent = await page.content();
  console.log('페이지 제목:', await page.title());
  
  // 스크린샷 캡처
  await page.screenshot({ 
    path: 'debug-login-test.png', 
    fullPage: true 
  });
  
  console.log('🎉 로그인 디버깅 테스트 완료!');
});
