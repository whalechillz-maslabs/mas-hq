import { test, expect } from '@playwright/test';

test.describe('빠른 업무 입력 페이지 기본 테스트', () => {
  test('페이지 로딩 및 기본 구조 확인', async ({ page }) => {
    console.log('🚀 빠른 업무 입력 페이지 기본 테스트 시작');
    
    // 1. 로그인
    await page.goto('https://www.maslabs.kr/login');
    await page.waitForLoadState('networkidle');
    
    // 허상원 계정으로 로그인
    await page.fill('input[type="tel"]', '010-8948-4501');
    await page.fill('input[type="password"]', '89484501');
    await page.click('button[type="submit"]');
    
    // 로그인 후 빠른 업무 입력 페이지로 이동
    await page.waitForURL('**/quick-task');
    console.log('✅ 로그인 완료, 빠른 업무 입력 페이지 접근');
    
    // 2. 페이지 제목 확인
    const pageTitle = page.locator('h1');
    await expect(pageTitle).toContainText('오늘 업무');
    console.log('✅ 페이지 제목 확인됨');
    
    // 3. 통계 카드 확인
    const statsCards = page.locator('.grid.grid-cols-3 > div');
    await expect(statsCards).toHaveCount(3);
    console.log('✅ 통계 카드 3개 확인됨');
    
    // 4. 업무 유형 버튼들 확인
    const operationButtons = page.locator('button').filter({ hasText: /OP\d+/ });
    const buttonCount = await operationButtons.count();
    console.log(`📊 업무 유형 버튼 개수: ${buttonCount}`);
    
    // 5. 첫 번째 업무 유형 버튼 클릭 테스트
    if (buttonCount > 0) {
      const firstButton = operationButtons.first();
      const buttonText = await firstButton.textContent();
      console.log(`🔍 첫 번째 버튼 텍스트: ${buttonText}`);
      
      await firstButton.click();
      await page.waitForTimeout(1000);
      
      // 폼이 나타나는지 확인
      const form = page.locator('form');
      await expect(form).toBeVisible();
      console.log('✅ 업무 입력 폼이 표시됨');
    }
    
    // 6. 스크린샷 저장
    await page.screenshot({ path: 'test-results/quick-task-page.png' });
    console.log('📸 스크린샷 저장됨');
    
    console.log('🎉 기본 테스트 완료!');
  });
});
