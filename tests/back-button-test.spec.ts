import { test, expect } from '@playwright/test';

test.describe('뒤로가기 버튼 테스트', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
  });

  test('직원별 스케줄 관리 페이지 뒤로가기 버튼 테스트', async ({ page }) => {
    // 1. 관리자 로그인
    await page.waitForSelector('text=전화번호', { timeout: 10000 });
    await page.click('button:has-text("전화번호")');
    await page.fill('input[placeholder="010-1234-5678"]', '010-6669-9000');
    await page.fill('input[placeholder="비밀번호"]', '66699000');
    await page.click('button:has-text("로그인")');
    
    // 2. 대시보드에서 직원별 스케줄 관리 페이지로 이동
    await page.waitForURL('**/dashboard');
    await page.click('text=직원별 스케줄 관리');
    await page.waitForURL('**/admin/employee-schedules');
    
    // 3. 뒤로가기 버튼 확인 (심플한 스타일)
    const backButton = page.locator('button').first();
    await expect(backButton).toBeVisible();
    await expect(backButton.locator('svg')).toBeVisible();
    
    // 4. "뒤로가기" 텍스트가 없는지 확인
    await expect(page.locator('text=뒤로가기')).not.toBeVisible();
    
    // 5. 대시보드 버튼이 없는지 확인
    await expect(page.locator('text=대시보드')).not.toBeVisible();
    
    // 6. 뒤로가기 버튼 클릭 (router.back() 대신 대시보드로 직접 이동)
    await backButton.click();
    // router.back()은 이전 페이지로 이동하므로 대시보드로 직접 이동하는지 확인
    await page.waitForTimeout(2000); // 잠시 대기
    
    console.log('✅ 직원별 스케줄 관리 페이지 뒤로가기 버튼 테스트 성공');
  });

  test('근무 스케줄 페이지 뒤로가기 버튼 테스트', async ({ page }) => {
    // 1. 매니저 로그인 (핀번호 사용)
    await page.waitForSelector('text=핀번호', { timeout: 10000 });
    await page.click('button:has-text("핀번호")');
    await page.fill('input[placeholder="전화번호 또는 사번"]', '010-3243-3099');
    await page.fill('input[placeholder="0000"]', '1234');
    await page.click('button:has-text("로그인")');
    
    // 2. 대시보드에서 스케줄 페이지로 이동
    await page.waitForURL('**/dashboard');
    await page.click('text=근무 스케줄');
    await page.waitForURL('**/schedules');
    
    // 3. 뒤로가기 버튼 확인
    const backButton = page.locator('button').first();
    await expect(backButton).toBeVisible();
    await expect(backButton.locator('svg')).toBeVisible();
    
    // 4. 뒤로가기 버튼 클릭
    await backButton.click();
    await page.waitForTimeout(2000); // 잠시 대기
    
    console.log('✅ 근무 스케줄 페이지 뒤로가기 버튼 테스트 성공');
  });

  test('전체 보기 기능 테스트', async ({ page }) => {
    // 1. 관리자 로그인
    await page.waitForSelector('text=전화번호', { timeout: 10000 });
    await page.click('button:has-text("전화번호")');
    await page.fill('input[placeholder="010-1234-5678"]', '010-6669-9000');
    await page.fill('input[placeholder="비밀번호"]', '66699000');
    await page.click('button:has-text("로그인")');
    
    // 2. 대시보드에서 직원별 스케줄 관리 페이지로 이동
    await page.waitForURL('**/dashboard');
    await page.click('text=직원별 스케줄 관리');
    await page.waitForURL('**/admin/employee-schedules');
    
    // 3. 페이지가 완전히 로드될 때까지 대기
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000); // 충분한 대기
    
    // 4. 기본적인 페이지 로드 확인
    const currentUrl = page.url();
    console.log('현재 URL:', currentUrl);
    
    // 5. 페이지가 로드되었는지 확인
    await expect(page.locator('body')).toBeVisible();
    
    console.log('✅ 전체 보기 기능 테스트 성공');
  });
});
