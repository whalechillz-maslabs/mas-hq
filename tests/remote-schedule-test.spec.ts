import { test, expect } from '@playwright/test';

test.describe('원격 서버 스케줄 관리 테스트', () => {
  test('직원별 스케줄 관리 - 점 표시 제거 및 스케줄 추가 테스트', async ({ page }) => {
    console.log('🚀 원격 서버 스케줄 관리 테스트 시작');
    
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
    
    // 4. 빈 시간대 클릭하여 스케줄 추가 테스트
    const emptyTimeSlot = page.locator('.bg-gray-50').first();
    await emptyTimeSlot.click();
    console.log('✅ 빈 시간대 클릭');
    
    // 5. 성공 메시지 확인
    const successMessage = page.locator('text="스케줄이 추가되었습니다."');
    await expect(successMessage).toBeVisible({ timeout: 10000 });
    console.log('✅ 스케줄 추가 성공 메시지 표시됨');
    
    // 6. 실제로 스케줄이 추가되었는지 확인
    await page.waitForTimeout(2000); // 데이터 로딩 대기
    
    // 스케줄이 추가된 셀 확인 (색상이 변경되었는지)
    const updatedCell = page.locator('.bg-blue-200, .bg-blue-300, .bg-blue-400').first();
    await expect(updatedCell).toBeVisible();
    console.log('✅ 스케줄이 실제로 추가되어 화면에 반영됨');
    
    // 페이지 스크린샷 저장
    await page.screenshot({ path: 'test-results/remote-schedule-test-success.png' });
    console.log('✅ 스크린샷 저장 완료');
    
    console.log('✅ 원격 서버 스케줄 관리 테스트 완료');
  });
  
  test('전체보기 모드에서 스케줄 표시 확인', async ({ page }) => {
    console.log('🔍 전체보기 모드 테스트 시작');
    
    await page.goto('https://www.maslabs.kr/admin/employee-schedules');
    await page.waitForLoadState('networkidle');
    
    // 전체 보기 모드로 전환
    const overviewButton = page.locator('button:has-text("전체 보기")');
    await overviewButton.click();
    console.log('✅ 전체 보기 모드로 전환');
    
    // 스케줄 그리드가 표시되는지 확인
    const scheduleGrid = page.locator('.grid.grid-cols-8');
    await expect(scheduleGrid).toBeVisible();
    console.log('✅ 전체보기 스케줄 그리드 표시됨');
    
    // 페이지 스크린샷 저장
    await page.screenshot({ path: 'test-results/remote-overview-test.png' });
    console.log('✅ 전체보기 스크린샷 저장 완료');
    
    console.log('✅ 전체보기 모드 테스트 완료');
  });
});
