import { test, expect } from '@playwright/test';

test.describe('통일된 패스워드 로그인 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login');
  });

  test('관리자 계정 로그인 테스트 (전화번호 + 전화번호 뒷 8자리)', async ({ page }) => {
    console.log('🔍 관리자 계정 로그인 테스트 시작');
    
    // 관리자 계정으로 로그인 (전화번호 뒷 8자리: 66699000)
    await page.fill('input[type="tel"]', '010-6669-9000');
    await page.fill('input[type="password"]', '66699000');
    await page.click('button[type="submit"]');
    
    // 로그인 결과 확인
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log('현재 URL:', currentUrl);
    
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ 관리자 계정 로그인 성공!');
      
      // 대시보드에서 관리자 정보 확인
      await expect(page.locator('text=시스템 관리자')).toBeVisible();
      
      // 스크린샷 캡처
      await page.screenshot({ 
        path: 'admin-login-success.png', 
        fullPage: true 
      });
    } else {
      console.log('❌ 관리자 계정 로그인 실패');
      
      // 에러 메시지 확인
      const errorMessage = await page.locator('.error-message, .alert, [role="alert"]').textContent();
      console.log('에러 메시지:', errorMessage);
      
      // 스크린샷 캡처
      await page.screenshot({ 
        path: 'admin-login-failed.png', 
        fullPage: true 
      });
    }
  });

  test('관리자 계정 로그인 테스트 (핀번호)', async ({ page }) => {
    console.log('🔍 관리자 계정 핀번호 로그인 테스트 시작');
    
    // 핀번호 로그인 탭 선택
    await page.click('text=핀번호');
    
    // 기본 핀번호 입력
    await page.fill('input[placeholder="0000"]', '1234');
    await page.click('button[type="submit"]');
    
    // 로그인 결과 확인
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log('현재 URL:', currentUrl);
    
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ 관리자 계정 핀번호 로그인 성공!');
      
      // 스크린샷 캡처
      await page.screenshot({ 
        path: 'admin-login-pin-success.png', 
        fullPage: true 
      });
    } else {
      console.log('❌ 관리자 계정 핀번호 로그인 실패');
      
      // 스크린샷 캡처
      await page.screenshot({ 
        path: 'admin-login-pin-failed.png', 
        fullPage: true 
      });
    }
  });

  test('박진 계정 로그인 테스트 (전화번호 + 전화번호 뒷 8자리)', async ({ page }) => {
    console.log('🔍 박진 계정 로그인 테스트 시작');
    
    // 박진 계정으로 로그인 (전화번호 뒷 8자리: 91324337)
    await page.fill('input[type="tel"]', '010-9132-4337');
    await page.fill('input[type="password"]', '91324337');
    await page.click('button[type="submit"]');
    
    // 로그인 결과 확인
    await page.waitForTimeout(3000);
    
    const currentUrl = page.url();
    console.log('현재 URL:', currentUrl);
    
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ 박진 계정 로그인 성공!');
      
      // 대시보드에서 박진 정보 확인
      await expect(page.locator('text=박진(JIN)')).toBeVisible();
      
      // 스크린샷 캡처
      await page.screenshot({ 
        path: 'park-jin-login-success.png', 
        fullPage: true 
      });
    } else {
      console.log('❌ 박진 계정 로그인 실패');
      
      // 에러 메시지 확인
      const errorMessage = await page.locator('.error-message, .alert, [role="alert"]').textContent();
      console.log('에러 메시지:', errorMessage);
      
      // 스크린샷 캡처
      await page.screenshot({ 
        path: 'park-jin-login-failed.png', 
        fullPage: true 
      });
    }
  });
});
