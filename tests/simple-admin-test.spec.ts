import { test, expect } from '@playwright/test';

test.describe('간단한 관리자 로그인 테스트', () => {
  test('로그인 페이지 구조 확인', async ({ page }) => {
    console.log('🔍 로그인 페이지 구조 확인 시작');
    
    // 1. 로그인 페이지로 이동
    await page.goto('http://localhost:3000/login');
    console.log('✅ 로그인 페이지 접속 완료');
    
    // 2. 페이지 스크린샷 캡처
    await page.screenshot({ 
      path: 'login-page-structure.png', 
      fullPage: true 
    });
    console.log('✅ 로그인 페이지 스크린샷 캡처 완료');
    
    // 3. 페이지 내용 확인
    await expect(page.locator('h1:has-text("MASLABS")')).toBeVisible();
    console.log('✅ MASLABS 로고 확인');
    
    // 4. 로그인 방법 버튼들 확인
    const loginButtons = page.locator('button');
    const buttonCount = await loginButtons.count();
    console.log(`✅ 총 ${buttonCount}개의 버튼 발견`);
    
    // 5. 각 버튼의 텍스트 출력
    for (let i = 0; i < buttonCount; i++) {
      const buttonText = await loginButtons.nth(i).textContent();
      console.log(`버튼 ${i + 1}: "${buttonText}"`);
    }
    
    // 6. 전화번호 입력 필드 확인
    const phoneInput = page.locator('input[type="tel"]');
    if (await phoneInput.isVisible()) {
      console.log('✅ 전화번호 입력 필드 발견');
    } else {
      console.log('⚠️ 전화번호 입력 필드가 보이지 않음');
    }
    
    console.log('🎉 로그인 페이지 구조 확인 완료!');
  });

  test('관리자 로그인 시도', async ({ page }) => {
    console.log('🔍 관리자 로그인 시도 시작');
    
    // 1. 로그인 페이지로 이동
    await page.goto('http://localhost:3000/login');
    console.log('✅ 로그인 페이지 접속 완료');
    
    // 2. 페이지 로딩 대기
    await page.waitForLoadState('networkidle');
    console.log('✅ 페이지 로딩 완료');
    
    // 3. 전화번호 입력 (관리자 계정)
    await page.fill('input[type="tel"]', '010-6669-9000');
    console.log('✅ 관리자 전화번호 입력: 010-6669-9000');
    
    // 4. 비밀번호 입력
    await page.fill('input[type="password"]', '66699000');
    console.log('✅ 관리자 비밀번호 입력: 66699000');
    
    // 5. 로그인 버튼 클릭
    await page.click('button[type="submit"]');
    console.log('✅ 로그인 버튼 클릭');
    
    // 6. 결과 확인
    await page.waitForTimeout(3000);
    
    // 7. 현재 URL 확인
    const currentUrl = page.url();
    console.log(`현재 URL: ${currentUrl}`);
    
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ 로그인 성공 - 대시보드로 이동됨');
      
      // 8. 대시보드 내용 확인
      await expect(page.locator('text=오늘의 미션')).toBeVisible();
      console.log('✅ 대시보드 로딩 확인');
      
      // 9. 관리자 메뉴 확인
      const adminMenu = page.locator('text=관리자 기능');
      if (await adminMenu.isVisible()) {
        console.log('✅ 관리자 메뉴 표시 확인');
      } else {
        console.log('⚠️ 관리자 메뉴가 표시되지 않음');
      }
      
      // 10. 스크린샷 캡처
      await page.screenshot({ 
        path: 'admin-login-result.png', 
        fullPage: true 
      });
      console.log('✅ 로그인 결과 스크린샷 캡처 완료');
      
    } else {
      console.log('❌ 로그인 실패');
      
      // 11. 에러 메시지 확인
      const errorMessage = page.locator('.text-red-700, .text-red-600');
      if (await errorMessage.isVisible()) {
        const errorText = await errorMessage.textContent();
        console.log(`에러 메시지: ${errorText}`);
      }
      
      // 12. 스크린샷 캡처
      await page.screenshot({ 
        path: 'admin-login-failed.png', 
        fullPage: true 
      });
      console.log('✅ 로그인 실패 스크린샷 캡처 완료');
    }
    
    console.log('🎉 관리자 로그인 시도 완료!');
  });
});
