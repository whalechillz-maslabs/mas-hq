import { test, expect } from '@playwright/test';

test('업무 페이지 기본 접근 테스트', async ({ page }) => {
  // 로그인
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="tel"]', '010-6669-9000');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  
  // 대시보드로 이동
  await page.waitForURL('**/dashboard');
  
  // 업무 기록 페이지로 직접 이동
  await page.goto('http://localhost:3000/tasks');
  
  // 페이지 로딩 대기
  await page.waitForLoadState('networkidle');
  
  // 스크린샷 촬영
  await page.screenshot({ path: 'task-page-screenshot.png', fullPage: true });
  
  // 기본 요소들 확인
  await expect(page.locator('h1')).toContainText('업무 기록');
  
  // 업무 추가 버튼 찾기 (여러 방법으로 시도)
  const addButton = page.locator('button').filter({ hasText: '업무 추가' });
  
  if (await addButton.count() > 0) {
    console.log('업무 추가 버튼을 찾았습니다!');
    await addButton.first().click();
    
    // 모달 확인
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'task-modal-screenshot.png' });
    
    // 모달 닫기
    const closeButton = page.locator('button').filter({ hasText: '취소' });
    if (await closeButton.count() > 0) {
      await closeButton.first().click();
    }
  } else {
    console.log('업무 추가 버튼을 찾을 수 없습니다.');
  }
  
  // 통계 카드 확인
  const statsCards = page.locator('.bg-white.rounded-lg.shadow');
  console.log(`통계 카드 개수: ${await statsCards.count()}`);
  
  // 테이블 확인
  const table = page.locator('table');
  if (await table.count() > 0) {
    console.log('업무 목록 테이블이 있습니다.');
  } else {
    console.log('업무 목록 테이블이 없습니다.');
  }
});
