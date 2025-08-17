import { test, expect } from '@playwright/test';

test('업무 기록 페이지 스크린샷 캡처', async ({ page }) => {
  // 1. 로그인
  await page.goto('http://localhost:3000/login');
  await page.fill('input[type="tel"]', '010-6669-9000');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
  
  // 2. 업무 기록 페이지로 이동
  await page.goto('http://localhost:3000/tasks');
  await page.waitForLoadState('networkidle');
  
  // 3. 전체 페이지 스크린샷
  await page.screenshot({ 
    path: 'task-page-full.png', 
    fullPage: true 
  });
  
  // 4. 헤더 부분 스크린샷
  const header = page.locator('header');
  await header.screenshot({ 
    path: 'task-page-header.png' 
  });
  
  // 5. 통계 카드 부분 스크린샷
  const statsSection = page.locator('.grid.grid-cols-1.md\\:grid-cols-4.gap-6.mb-8');
  await statsSection.screenshot({ 
    path: 'task-page-stats.png' 
  });
  
  // 6. 필터 부분 스크린샷
  const filterSection = page.locator('.bg-white.rounded-lg.shadow.p-4.mb-6');
  await filterSection.screenshot({ 
    path: 'task-page-filter.png' 
  });
  
  // 7. 테이블 부분 스크린샷
  const tableSection = page.locator('table');
  await tableSection.screenshot({ 
    path: 'task-page-table.png' 
  });
  
  // 8. 업무 추가 버튼 클릭
  const addButton = page.locator('button').filter({ hasText: '업무 추가' });
  await addButton.first().click();
  
  // 9. 모달 스크린샷
  await page.waitForTimeout(1000);
  const modal = page.locator('.fixed.inset-0');
  await modal.screenshot({ 
    path: 'task-page-modal.png' 
  });
  
  // 10. 모달 닫기
  const closeButton = page.locator('button').filter({ hasText: '취소' });
  if (await closeButton.count() > 0) {
    await closeButton.first().click();
  }
  
  console.log('✅ 업무 기록 페이지 스크린샷 캡처 완료!');
  console.log('📸 캡처된 파일들:');
  console.log('  - task-page-full.png (전체 페이지)');
  console.log('  - task-page-header.png (헤더)');
  console.log('  - task-page-stats.png (통계 카드)');
  console.log('  - task-page-filter.png (필터)');
  console.log('  - task-page-table.png (테이블)');
  console.log('  - task-page-modal.png (업무 추가 모달)');
});
