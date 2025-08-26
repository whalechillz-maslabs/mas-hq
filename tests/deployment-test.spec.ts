import { test, expect } from '@playwright/test';

test.describe('배포 확인 테스트', () => {
  test('메인 페이지 로드 확인', async ({ page }) => {
    // 로컬 개발 서버 테스트
    await page.goto('http://localhost:3000');
    
    // 페이지가 로드되었는지 확인
    await expect(page).toHaveTitle(/MASLABS/);
    
    // 로그인 페이지로 리다이렉트되는지 확인
    await expect(page).toHaveURL(/.*login/);
  });

  test('로그인 페이지 UI 확인', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // 로그인 폼 요소들이 존재하는지 확인
    await expect(page.locator('input[type="text"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // 페이지 제목 확인
    await expect(page.locator('h1')).toContainText('로그인');
  });

  test('직원 로그인 테스트', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // 김탁수(WHA) 로그인 테스트
    await page.fill('input[type="text"]', '010-6669-9000');
    await page.fill('input[type="password"]', '66699000');
    await page.click('button[type="submit"]');
    
    // 로그인 성공 후 대시보드로 이동하는지 확인
    await page.waitForURL(/.*dashboard/);
    await expect(page.locator('h1')).toContainText('대시보드');
  });

  test('관리자 페이지 접근 테스트', async ({ page }) => {
    // 먼저 로그인
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="text"]', '010-6669-9000');
    await page.fill('input[type="password"]', '66699000');
    await page.click('button[type="submit"]');
    
    await page.waitForURL(/.*dashboard/);
    
    // 관리자 메뉴로 이동
    await page.click('text=직원 관리');
    await expect(page).toHaveURL(/.*admin\/employees/);
    
    // 직원 목록이 표시되는지 확인
    await expect(page.locator('h1')).toContainText('직원 관리');
  });

  test('스케줄 관리 페이지 테스트', async ({ page }) => {
    // 먼저 로그인
    await page.goto('http://localhost:3000/login');
    await page.fill('input[type="text"]', '010-6669-9000');
    await page.fill('input[type="password"]', '66699000');
    await page.click('button[type="submit"]');
    
    await page.waitForURL(/.*dashboard/);
    
    // 스케줄 관리 메뉴로 이동
    await page.click('text=스케줄 관리');
    await expect(page).toHaveURL(/.*admin\/employee-schedules/);
    
    // 스케줄 관리 페이지 요소들 확인
    await expect(page.locator('h1')).toContainText('직원별 스케줄 관리');
    await expect(page.locator('text=직원 목록')).toBeVisible();
  });

  test('반응형 디자인 확인', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // 데스크톱 뷰
    await page.setViewportSize({ width: 1920, height: 1080 });
    await expect(page.locator('form')).toBeVisible();
    
    // 태블릿 뷰
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('form')).toBeVisible();
    
    // 모바일 뷰
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator('form')).toBeVisible();
  });

  test('에러 페이지 처리 확인', async ({ page }) => {
    // 존재하지 않는 페이지 접근
    await page.goto('http://localhost:3000/nonexistent-page');
    
    // 404 페이지가 표시되는지 확인
    await expect(page.locator('h1')).toContainText('404');
  });
});

test.describe('성능 테스트', () => {
  test('페이지 로딩 속도 확인', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('http://localhost:3000/login');
    
    const loadTime = Date.now() - startTime;
    
    // 페이지 로딩이 3초 이내에 완료되는지 확인
    expect(loadTime).toBeLessThan(3000);
  });

  test('이미지 및 리소스 로딩 확인', async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    
    // 페이지의 모든 이미지가 로드되는지 확인
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < imageCount; i++) {
      await expect(images.nth(i)).toBeVisible();
    }
  });
});
