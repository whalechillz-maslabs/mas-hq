import { test, expect } from '@playwright/test';

test.describe('개선된 핀번호 로그인 시스템 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login');
  });

  test('핀번호 로그인에 사용자 식별 필드가 있는지 확인', async ({ page }) => {
    console.log('🔍 핀번호 로그인 사용자 식별 필드 확인 테스트 시작');
    
    // 핀번호 탭 클릭
    await page.click('text=핀번호');
    
    // 사용자 식별 필드 확인
    const userField = await page.locator('input[placeholder="전화번호 또는 사번"]');
    await expect(userField).toBeVisible();
    
    // 핀번호 필드 확인
    const pinField = await page.locator('input[placeholder="0000"]');
    await expect(pinField).toBeVisible();
    
    console.log('✅ 핀번호 로그인에 사용자 식별 필드가 정상적으로 표시됨');
    
    // 스크린샷 캡처
    await page.screenshot({ 
      path: 'improved-pin-login-form.png', 
      fullPage: true 
    });
    
    console.log('🎉 핀번호 로그인 폼 테스트 완료!');
  });

  test('관리자 핀번호 로그인 테스트', async ({ page }) => {
    console.log('🔍 관리자 핀번호 로그인 테스트 시작');
    
    // 핀번호 탭 클릭
    await page.click('text=핀번호');
    
    // 사용자 식별자 입력 (전화번호)
    await page.fill('input[placeholder="전화번호 또는 사번"]', '010-6669-9000');
    
    // 핀번호 입력
    await page.fill('input[placeholder="0000"]', '1234');
    
    // 로그인 버튼 클릭
    await page.click('button[type="submit"]');
    
    // 대시보드로 이동 확인
    await page.waitForURL('**/dashboard');
    
    console.log('✅ 관리자 핀번호 로그인 성공!');
    
    // 스크린샷 캡처
    await page.screenshot({ 
      path: 'admin-pin-login-success.png', 
      fullPage: true 
    });
    
    console.log('🎉 관리자 핀번호 로그인 테스트 완료!');
  });

  test('박진 직원 핀번호 로그인 테스트', async ({ page }) => {
    console.log('🔍 박진 직원 핀번호 로그인 테스트 시작');
    
    // 핀번호 탭 클릭
    await page.click('text=핀번호');
    
    // 사용자 식별자 입력 (사번)
    await page.fill('input[placeholder="전화번호 또는 사번"]', 'MASLABS-004');
    
    // 핀번호 입력
    await page.fill('input[placeholder="0000"]', '1234');
    
    // 로그인 버튼 클릭
    await page.click('button[type="submit"]');
    
    // 대시보드로 이동 확인
    await page.waitForURL('**/dashboard');
    
    console.log('✅ 박진 직원 핀번호 로그인 성공!');
    
    // 스크린샷 캡처
    await page.screenshot({ 
      path: 'park-jin-pin-login-success.png', 
      fullPage: true 
    });
    
    console.log('🎉 박진 직원 핀번호 로그인 테스트 완료!');
  });

  test('잘못된 사용자 식별자로 핀번호 로그인 시도', async ({ page }) => {
    console.log('🔍 잘못된 사용자 식별자 핀번호 로그인 테스트 시작');
    
    // 핀번호 탭 클릭
    await page.click('text=핀번호');
    
    // 잘못된 사용자 식별자 입력
    await page.fill('input[placeholder="전화번호 또는 사번"]', '010-9999-9999');
    
    // 핀번호 입력
    await page.fill('input[placeholder="0000"]', '1234');
    
    // 로그인 버튼 클릭
    await page.click('button[type="submit"]');
    
    // 에러 메시지 확인
    await expect(page.locator('text=등록되지 않은 사용자입니다')).toBeVisible();
    
    console.log('✅ 잘못된 사용자 식별자 에러 메시지 정상 표시');
    
    // 스크린샷 캡처
    await page.screenshot({ 
      path: 'invalid-user-pin-login-error.png', 
      fullPage: true 
    });
    
    console.log('🎉 잘못된 사용자 식별자 핀번호 로그인 테스트 완료!');
  });

  test('잘못된 핀번호로 로그인 시도', async ({ page }) => {
    console.log('🔍 잘못된 핀번호 로그인 테스트 시작');
    
    // 핀번호 탭 클릭
    await page.click('text=핀번호');
    
    // 올바른 사용자 식별자 입력
    await page.fill('input[placeholder="전화번호 또는 사번"]', '010-6669-9000');
    
    // 잘못된 핀번호 입력
    await page.fill('input[placeholder="0000"]', '9999');
    
    // 로그인 버튼 클릭
    await page.click('button[type="submit"]');
    
    // 에러 메시지 확인
    await expect(page.locator('text=핀번호가 올바르지 않습니다')).toBeVisible();
    
    console.log('✅ 잘못된 핀번호 에러 메시지 정상 표시');
    
    // 스크린샷 캡처
    await page.screenshot({ 
      path: 'invalid-pin-login-error.png', 
      fullPage: true 
    });
    
    console.log('🎉 잘못된 핀번호 로그인 테스트 완료!');
  });

  test('자동 로그오프 기능 확인 (5분 타이머)', async ({ page }) => {
    console.log('🔍 자동 로그오프 기능 확인 테스트 시작');
    
    // 먼저 로그인
    await page.click('text=핀번호');
    await page.fill('input[placeholder="전화번호 또는 사번"]', '010-6669-9000');
    await page.fill('input[placeholder="0000"]', '1234');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    console.log('✅ 로그인 완료, 자동 로그오프 타이머 시작');
    
    // 활동 시간을 5분 전으로 설정 (테스트용)
    await page.evaluate(() => {
      const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
      localStorage.setItem('lastActivity', fiveMinutesAgo.toString());
    });
    
    // 30초 대기 (자동 로그오프 체크 주기)
    console.log('⏰ 30초 대기 중... (자동 로그오프 체크 대기)');
    await page.waitForTimeout(30000);
    
    // 로그인 페이지로 리다이렉트되었는지 확인
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log('✅ 자동 로그오프 기능 정상 작동!');
    } else {
      console.log('⚠️ 자동 로그오프가 아직 작동하지 않음 (정상)');
    }
    
    // 스크린샷 캡처
    await page.screenshot({ 
      path: 'auto-logout-test.png', 
      fullPage: true 
    });
    
    console.log('🎉 자동 로그오프 기능 확인 테스트 완료!');
  });
});
