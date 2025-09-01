import { test, expect } from '@playwright/test';

test.describe('스케줄 관리 UX 개선사항 테스트', () => {
  test('빠른 스케줄 추가 기능 테스트', async ({ page }) => {
    console.log('🚀 빠른 스케줄 추가 기능 테스트 시작');
    
    // 직원별 스케줄 관리 페이지로 이동
    await page.goto('https://www.maslabs.kr/admin/employee-schedules');
    console.log('✅ 직원별 스케줄 관리 페이지 접근');
    
    // 페이지 로딩 대기
    await page.waitForLoadState('networkidle');
    
    // 개별 관리 모드 확인
    const individualButton = page.locator('button:has-text("개별 관리")');
    await expect(individualButton).toBeVisible();
    
    // 직원 목록에서 첫 번째 직원 선택
    const firstEmployee = page.locator('button:has-text("김탁수")').first();
    await firstEmployee.click();
    console.log('✅ 첫 번째 직원 선택');
    
    // 빈 시간대 클릭 (스케줄 추가 테스트)
    const emptyTimeSlot = page.locator('.bg-gray-50').first();
    await emptyTimeSlot.click();
    console.log('✅ 빈 시간대 클릭');
    
    // 모달이 나타나지 않고 바로 스케줄이 추가되는지 확인
    const modal = page.locator('.fixed.inset-0.bg-black.bg-opacity-50');
    await expect(modal).not.toBeVisible();
    console.log('✅ 모달 없이 바로 스케줄 추가됨');
    
    // 페이지 스크린샷 저장
    await page.screenshot({ path: 'test-results/schedule-quick-add.png' });
    console.log('✅ 스크린샷 저장 완료');
    
    console.log('✅ 빠른 스케줄 추가 기능 테스트 완료');
  });
  
  test('전체보기 모드에서 수정/삭제 기능 테스트', async ({ page }) => {
    console.log('🔍 전체보기 모드 수정/삭제 기능 테스트 시작');
    
    await page.goto('https://www.maslabs.kr/admin/employee-schedules');
    await page.waitForLoadState('networkidle');
    
    // 전체 보기 모드로 전환
    const overviewButton = page.locator('button:has-text("전체 보기")');
    await overviewButton.click();
    console.log('✅ 전체 보기 모드로 전환');
    
    // 스케줄이 있는 셀에 호버하여 수정/삭제 버튼 표시 확인
    const scheduleCell = page.locator('.bg-blue-200, .bg-blue-300, .bg-blue-400').first();
    await scheduleCell.hover();
    
    // 수정/삭제 버튼이 나타나는지 확인
    const editButton = page.locator('button[title="수정"]');
    const deleteButton = page.locator('button[title="삭제"]');
    
    // 버튼들이 표시되는지 확인 (호버 후)
    await expect(editButton).toBeVisible();
    await expect(deleteButton).toBeVisible();
    console.log('✅ 수정/삭제 버튼이 호버 시 표시됨');
    
    // 페이지 스크린샷 저장
    await page.screenshot({ path: 'test-results/schedule-overview-edit.png' });
    console.log('✅ 스크린샷 저장 완료');
    
    console.log('✅ 전체보기 모드 수정/삭제 기능 테스트 완료');
  });
  
  test('30분 단위 스케줄 설정 확인', async ({ page }) => {
    console.log('⏰ 30분 단위 스케줄 설정 테스트 시작');
    
    await page.goto('https://www.maslabs.kr/admin/employee-schedules');
    await page.waitForLoadState('networkidle');
    
    // 시간대 정의 확인 (30분 단위)
    const timeSlots = page.locator('.text-sm.font-medium.text-center');
    await expect(timeSlots).toHaveCount(21); // 9:00부터 19:00까지 30분 단위
    
    // 9:00, 9:30, 10:00 등 시간대 확인
    const nineAM = page.locator('text="9:00"');
    const nineThirty = page.locator('text="9:30"');
    const tenAM = page.locator('text="10:00"');
    
    await expect(nineAM).toBeVisible();
    await expect(nineThirty).toBeVisible();
    await expect(tenAM).toBeVisible();
    console.log('✅ 30분 단위 시간대 설정 확인됨');
    
    // 18:00, 19:00 시간대 확인 (확장된 시간대)
    const sixPM = page.locator('text="18:00"');
    const sevenPM = page.locator('text="19:00"');
    
    await expect(sixPM).toBeVisible();
    await expect(sevenPM).toBeVisible();
    console.log('✅ 18-19시 시간대 확장 확인됨');
    
    console.log('✅ 30분 단위 스케줄 설정 테스트 완료');
  });
});
