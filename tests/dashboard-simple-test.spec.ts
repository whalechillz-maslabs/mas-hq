import { test, expect } from '@playwright/test';

test('대시보드 상단 네비게이션에서 직원별 스케줄 관리 버튼 제거 확인', async ({ page }) => {
  console.log('🚀 대시보드 상단 네비게이션 테스트 시작');
  
  // 대시보드 페이지로 이동
  await page.goto('https://www.maslabs.kr/dashboard');
  console.log('✅ 대시보드 페이지 접근');
  
  // 페이지 로딩 대기
  await page.waitForLoadState('networkidle');
  
  // 상단 헤더에서 "직원별 스케줄 관리" 버튼이 없는지 확인
  const adminButton = page.locator('button[title="직원별 스케줄 관리"]');
  await expect(adminButton).not.toBeVisible();
  console.log('✅ 상단 네비게이션에서 직원별 스케줄 관리 버튼이 제거됨');
  
  // 페이지 스크린샷 저장
  await page.screenshot({ path: 'test-results/dashboard-navigation-removed.png' });
  console.log('✅ 스크린샷 저장 완료');
  
  console.log('✅ 대시보드 상단 네비게이션 테스트 완료');
});
