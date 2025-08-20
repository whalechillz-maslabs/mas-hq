import { test, expect } from '@playwright/test';

test.describe('스케줄 시스템 테스트', () => {
  test('이은정 스케줄 확인', async ({ page }) => {
    console.log('🔍 이은정 스케줄 확인 테스트 시작');
    
    // 1. 이은정으로 로그인
    await page.goto('http://localhost:3000/login');
    await page.click('text=전화번호');
    await page.fill('input[type="tel"]', '010-3243-3099');
    await page.fill('input[type="password"]', '32433099');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    console.log('✅ 이은정 로그인 완료');
    
    // 2. 스케줄 페이지로 이동
    await page.click('text=근무 스케줄');
    await page.waitForURL('**/schedules');
    console.log('✅ 스케줄 페이지 이동 완료');
    
    // 3. 8월 20일 스케줄 확인
    await expect(page.locator('text=이은정(STE)')).toBeVisible();
    await expect(page.locator('text=10:00 - 17:00')).toBeVisible();
    await expect(page.locator('text=정상 근무')).toBeVisible();
    console.log('✅ 8월 20일 스케줄 확인 완료');
    
    // 4. 달력 뷰 확인
    await page.click('button[aria-label="Calendar view"]');
    await expect(page.locator('text=이은정(STE)')).toBeVisible();
    console.log('✅ 달력 뷰 확인 완료');
    
    // 5. 리스트 뷰 확인
    await page.click('button[aria-label="List view"]');
    await expect(page.locator('text=이은정(STE)')).toBeVisible();
    console.log('✅ 리스트 뷰 확인 완료');
    
    // 6. 스크린샷 캡처
    await page.screenshot({ path: 'schedule-test-result.png', fullPage: true });
    console.log('✅ 스크린샷 캡처 완료');
    
    console.log('🎉 스케줄 시스템 테스트 완료!');
  });

  test('스케줄 추가 기능 테스트', async ({ page }) => {
    console.log('🔍 스케줄 추가 기능 테스트 시작');
    
    // 1. 이은정으로 로그인
    await page.goto('http://localhost:3000/login');
    await page.click('text=전화번호');
    await page.fill('input[type="tel"]', '010-3243-3099');
    await page.fill('input[type="password"]', '32433099');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    console.log('✅ 이은정 로그인 완료');
    
    // 2. 스케줄 추가 페이지로 이동
    await page.goto('http://localhost:3000/schedules/add');
    console.log('✅ 스케줄 추가 페이지 이동 완료');
    
    // 3. 폼 확인
    await expect(page.locator('input[type="date"]')).toBeVisible();
    await expect(page.locator('input[type="time"]')).toHaveCount(2);
    await expect(page.locator('textarea')).toBeVisible();
    console.log('✅ 스케줄 추가 폼 확인 완료');
    
    // 4. 스크린샷 캡처
    await page.screenshot({ path: 'schedule-add-form.png', fullPage: true });
    console.log('✅ 스크린샷 캡처 완료');
    
    console.log('🎉 스케줄 추가 기능 테스트 완료!');
  });
});
