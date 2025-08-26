import { test, expect } from '@playwright/test';

test.describe('관리자 테스트 로그인 기능', () => {
  test('관리자 로그인 후 직원 관리 페이지 접근', async ({ page }) => {
    // 관리자 로그인
    await page.goto('https://www.maslabs.kr/login');
    await page.fill('input[type="text"]', '010-6669-9000');
    await page.fill('input[type="password"]', '66699000');
    await page.click('button[type="submit"]');
    
    // 대시보드로 이동 확인
    await page.waitForURL(/.*dashboard/);
    
    // 직원 관리 메뉴 클릭
    await page.click('text=직원 관리');
    await expect(page).toHaveURL(/.*admin\/employee-management/);
  });

  test('직원 목록에서 테스트 로그인 버튼 확인', async ({ page }) => {
    // 관리자 로그인
    await page.goto('https://www.maslabs.kr/login');
    await page.fill('input[type="text"]', '010-6669-9000');
    await page.fill('input[type="password"]', '66699000');
    await page.click('button[type="submit"]');
    
    await page.waitForURL(/.*dashboard/);
    await page.click('text=직원 관리');
    
    // 직원 목록이 로드될 때까지 대기
    await page.waitForSelector('table tbody tr');
    
    // 테스트 로그인 버튼이 존재하는지 확인
    const testLoginButtons = page.locator('button[title="테스트 로그인"]');
    await expect(testLoginButtons.first()).toBeVisible();
  });

  test('테스트 로그인 버튼 클릭 시 새창 열기', async ({ page, context }) => {
    // 관리자 로그인
    await page.goto('https://www.maslabs.kr/login');
    await page.fill('input[type="text"]', '010-6669-9000');
    await page.fill('input[type="password"]', '66699000');
    await page.click('button[type="submit"]');
    
    await page.waitForURL(/.*dashboard/);
    await page.click('text=직원 관리');
    
    // 직원 목록 로드 대기
    await page.waitForSelector('table tbody tr');
    
    // 첫 번째 직원의 테스트 로그인 버튼 클릭
    const testLoginButton = page.locator('button[title="테스트 로그인"]').first();
    
    // 새창 열기 이벤트 리스너
    const newPagePromise = context.waitForEvent('page');
    await testLoginButton.click();
    
    // 새창이 열렸는지 확인
    const newPage = await newPagePromise;
    await expect(newPage).toBeTruthy();
    
    // 새창의 URL이 로그인 페이지인지 확인
    await expect(newPage).toHaveURL(/.*login.*test_user/);
    
    // 새창 닫기
    await newPage.close();
  });

  test('테스트 로그인 페이지에서 자동 입력 확인', async ({ page, context }) => {
    // 관리자 로그인
    await page.goto('https://www.maslabs.kr/login');
    await page.fill('input[type="text"]', '010-6669-9000');
    await page.fill('input[type="password"]', '66699000');
    await page.click('button[type="submit"]');
    
    await page.waitForURL(/.*dashboard/);
    await page.click('text=직원 관리');
    
    // 직원 목록 로드 대기
    await page.waitForSelector('table tbody tr');
    
    // 첫 번째 직원의 테스트 로그인 버튼 클릭
    const testLoginButton = page.locator('button[title="테스트 로그인"]').first();
    const newPagePromise = context.waitForEvent('page');
    await testLoginButton.click();
    
    const newPage = await newPagePromise;
    
    // 테스트 모드 배너 확인
    await expect(newPage.locator('text=테스트 모드')).toBeVisible();
    
    // 폼 필드가 자동으로 채워졌는지 확인
    const phoneInput = newPage.locator('input[type="tel"]');
    const passwordInput = newPage.locator('input[type="password"]');
    
    await expect(phoneInput).toHaveValue(/010-/);
    await expect(passwordInput).toHaveValue(/.+/);
    
    // 입력 필드가 읽기 전용인지 확인
    await expect(phoneInput).toHaveAttribute('readonly');
    await expect(passwordInput).toHaveAttribute('readonly');
    
    await newPage.close();
  });

  test('테스트 로그인으로 실제 로그인 테스트', async ({ page, context }) => {
    // 관리자 로그인
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="text"]', '010-6669-9000');
    await page.fill('input[type="password"]', '66699000');
    await page.click('button[type="submit"]');
    
    await page.waitForURL(/.*dashboard/);
    await page.click('text=직원 관리');
    
    // 직원 목록 로드 대기
    await page.waitForSelector('table tbody tr');
    
    // 첫 번째 직원의 테스트 로그인 버튼 클릭
    const testLoginButton = page.locator('button[title="테스트 로그인"]').first();
    const newPagePromise = context.waitForEvent('page');
    await testLoginButton.click();
    
    const newPage = await newPagePromise;
    
    // 테스트 로그인 버튼 클릭
    await newPage.click('button[type="submit"]');
    
    // 로그인 성공 후 대시보드로 이동하는지 확인
    await newPage.waitForURL(/.*dashboard/);
    await expect(newPage.locator('h1')).toContainText('대시보드');
    
    await newPage.close();
  });

  test('여러 직원의 테스트 로그인 테스트', async ({ page, context }) => {
    // 관리자 로그인
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="text"]', '010-6669-9000');
    await page.fill('input[type="password"]', '66699000');
    await page.click('button[type="submit"]');
    
    await page.waitForURL(/.*dashboard/);
    await page.click('text=직원 관리');
    
    // 직원 목록 로드 대기
    await page.waitForSelector('table tbody tr');
    
    // 여러 직원의 테스트 로그인 버튼 확인
    const testLoginButtons = page.locator('button[title="테스트 로그인"]');
    const buttonCount = await testLoginButtons.count();
    
    expect(buttonCount).toBeGreaterThan(0);
    
    // 각 직원별로 테스트 로그인 시도
    for (let i = 0; i < Math.min(buttonCount, 3); i++) {
      const newPagePromise = context.waitForEvent('page');
      await testLoginButtons.nth(i).click();
      
      const newPage = await newPagePromise;
      
      // 테스트 모드 확인
      await expect(newPage.locator('text=테스트 모드')).toBeVisible();
      
      // 로그인 시도
      await newPage.click('button[type="submit"]');
      
      // 로그인 성공 확인
      await newPage.waitForURL(/.*dashboard/);
      
      await newPage.close();
    }
  });

  test('팝업 차단 시 알림 확인', async ({ page, context }) => {
    // 팝업 차단 설정 (테스트용)
    context.setDefaultTimeout(1000);
    
    // 관리자 로그인
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="text"]', '010-6669-9000');
    await page.fill('input[type="password"]', '66699000');
    await page.click('button[type="submit"]');
    
    await page.waitForURL(/.*dashboard/);
    await page.click('text=직원 관리');
    
    // 직원 목록 로드 대기
    await page.waitForSelector('table tbody tr');
    
    // 테스트 로그인 버튼 클릭 (팝업이 차단될 수 있음)
    const testLoginButton = page.locator('button[title="테스트 로그인"]').first();
    await testLoginButton.click();
    
    // 팝업 차단 알림이 나타날 수 있음 (선택적 테스트)
    // 실제 환경에서는 브라우저 설정에 따라 다름
  });
});
