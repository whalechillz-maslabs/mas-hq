import { test, expect } from '@playwright/test';

test('원격 서버에서 점 표시 제거 확인', async ({ page }) => {
  console.log('🚀 원격 서버 점 표시 제거 테스트 시작');
  
  // 원격 서버의 직원별 스케줄 관리 페이지로 이동
  await page.goto('https://www.maslabs.kr/admin/employee-schedules');
  console.log('✅ 원격 서버 직원별 스케줄 관리 페이지 접근');
  
  // 페이지 로딩 대기
  await page.waitForLoadState('networkidle');
  
  // 1. 직원 목록에서 불필요한 점이 없는지 확인
  const employeeButtons = page.locator('button:has-text("김탁수"), button:has-text("나수진"), button:has-text("박진")');
  await expect(employeeButtons).toHaveCount(3);
  
  // 직원 버튼 내부에 점이 없는지 확인
  for (const button of await employeeButtons.all()) {
    const dotElements = button.locator('text="."');
    await expect(dotElements).toHaveCount(0);
  }
  console.log('✅ 직원 목록에서 불필요한 점 표시 제거됨');
  
  // 2. 첫 번째 직원 선택
  const firstEmployee = page.locator('button:has-text("김탁수")').first();
  await firstEmployee.click();
  console.log('✅ 김탁수 직원 선택');
  
  // 3. 우상단에 점이 없는지 확인
  const employeeInfo = page.locator('h3:has-text("김탁수 (WHA)")');
  await expect(employeeInfo).toBeVisible();
  
  // 직원 정보 아래에 점이 없는지 확인
  const infoSection = page.locator('.bg-blue-50');
  const dotInInfo = infoSection.locator('text="."');
  await expect(dotInInfo).toHaveCount(0);
  console.log('✅ 우상단 직원 정보에서 점 표시 제거됨');
  
  // 페이지 스크린샷 저장
  await page.screenshot({ path: 'test-results/remote-dot-removal-success.png' });
  console.log('✅ 스크린샷 저장 완료');
  
  console.log('✅ 원격 서버 점 표시 제거 테스트 완료');
});
