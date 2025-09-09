import { test, expect } from '@playwright/test';

test.describe('간단한 시스템 테스트', () => {
  test('로그인 페이지 접속 확인', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // 페이지 제목 확인
    await expect(page).toHaveTitle(/MASLABS/);
    
    // 로그인 폼 확인
    await expect(page.locator('input[name="phone"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('로그인 테스트 (PC)', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // 김탁수 계정으로 로그인
    await page.fill('input[name="phone"]', '010-6669-9000');
    await page.fill('input[name="password"]', '66699000');
    await page.click('button[type="submit"]');
    
    // PC에서는 대시보드로 리다이렉트
    await expect(page).toHaveURL(/.*dashboard/);
    
    // 대시보드 요소 확인 (MASLABS 로고 확인)
    await expect(page.locator('h1')).toContainText('MASLABS');
  });

  test('직원 관리 페이지 접속', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // 로그인
    await page.fill('input[name="phone"]', '010-6669-9000');
    await page.fill('input[name="password"]', '66699000');
    await page.click('button[type="submit"]');
    
    // 직원 관리 페이지로 이동
    await page.goto('http://localhost:3000/admin/employee-management');
    
    // 직원 목록 확인
    await expect(page.locator('h1')).toContainText('직원 관리');
    
    // 직원 이름들 확인
    await expect(page.locator('text=김탁수')).toBeVisible();
    await expect(page.locator('text=이은정')).toBeVisible();
    await expect(page.locator('text=허상원')).toBeVisible();
    await expect(page.locator('text=최형호')).toBeVisible();
    await expect(page.locator('text=나수진')).toBeVisible();
    await expect(page.locator('text=하상희')).toBeVisible();
  });

  test('시급 관리 페이지 접속', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // 로그인
    await page.fill('input[name="phone"]', '010-6669-9000');
    await page.fill('input[name="password"]', '66699000');
    await page.click('button[type="submit"]');
    
    // 시급 관리 페이지로 이동
    await page.goto('http://localhost:3000/admin/hourly-wages');
    
    // 시급 관리 페이지 확인
    await expect(page.locator('h1')).toContainText('시급 관리');
    
    // 파트타임 직원들의 시급 확인
    await expect(page.locator('text=허상원')).toBeVisible();
    await expect(page.locator('text=하상희')).toBeVisible();
  });

  test('급여 조회 페이지 접속', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // 로그인
    await page.fill('input[name="phone"]', '010-6669-9000');
    await page.fill('input[name="password"]', '66699000');
    await page.click('button[type="submit"]');
    
    // 급여 조회 페이지로 이동
    await page.goto('http://localhost:3000/salary');
    
    // 급여 조회 페이지 확인
    await expect(page.locator('h1')).toContainText('급여 조회');
    
    // 급여 조회 페이지 기본 요소 확인
    await expect(page.locator('text=급여 조회')).toBeVisible();
  });

  test('모바일 로그인 테스트', async ({ browser }) => {
    // 모바일 컨텍스트 생성
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
    });
    const page = await context.newPage();
    
    await page.goto('http://localhost:3000/login');
    
    // 김탁수 계정으로 로그인
    await page.fill('input[name="phone"]', '010-6669-9000');
    await page.fill('input[name="password"]', '66699000');
    await page.click('button[type="submit"]');
    
    // 모바일에서는 업무 입력 페이지로 리다이렉트
    await expect(page).toHaveURL(/.*tasks/);
    
    // 업무 기록 페이지 요소 확인
    await expect(page.locator('h1')).toContainText('업무 기록');
    
    await context.close();
  });
});