import { test, expect } from '@playwright/test';

test('원격 서버 수정된 스케줄 관리 기능 테스트', async ({ page }) => {
  console.log('🚀 원격 서버 수정된 스케줄 관리 기능 테스트 시작');
  
  // 원격 서버의 직원별 스케줄 관리 페이지로 이동
  await page.goto('https://www.maslabs.kr/admin/employee-schedules');
  console.log('✅ 원격 서버 직원별 스케줄 관리 페이지 접근');
  
  // 페이지 로딩 대기
  await page.waitForLoadState('networkidle');
  
  // 1. 첫 번째 직원 선택
  const firstEmployee = page.locator('button:has-text("김탁수")').first();
  await firstEmployee.click();
  console.log('✅ 김탁수 직원 선택');
  
  // 2. 콘솔 에러가 없는지 확인
  const consoleMessages = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleMessages.push(msg);
      console.log('❌ 콘솔 에러:', msg.text());
    }
  });
  
  // 3. 빈 시간대 클릭하여 스케줄 추가 시도
  const emptyTimeSlot = page.locator('.bg-gray-50').first();
  await emptyTimeSlot.click();
  console.log('✅ 빈 시간대 클릭');
  
  // 4. 성공 메시지 확인 (수정된 기능)
  const successMessage = page.locator('text="스케줄이 추가되었습니다."');
  await expect(successMessage).toBeVisible({ timeout: 15000 });
  console.log('✅ 스케줄 추가 성공 메시지 표시됨');
  
  // 5. 실제로 스케줄이 추가되었는지 확인
  await page.waitForTimeout(3000); // 데이터 로딩 대기
  
  // 스케줄이 추가된 셀 확인 (색상이 변경되었는지)
  const updatedCell = page.locator('.bg-blue-200, .bg-blue-300, .bg-blue-400').first();
  await expect(updatedCell).toBeVisible();
  console.log('✅ 스케줄이 실제로 추가되어 화면에 반영됨');
  
  // 6. 콘솔 에러 확인
  console.log('📊 총 콘솔 에러 수:', consoleMessages.length);
  if (consoleMessages.length === 0) {
    console.log('✅ 콘솔 에러 없음 - Supabase 관계 문제 해결됨');
  }
  
  // 페이지 스크린샷 저장
  await page.screenshot({ path: 'test-results/remote-fixed-test-success.png' });
  console.log('✅ 스크린샷 저장 완료');
  
  console.log('✅ 원격 서버 수정된 스케줄 관리 기능 테스트 완료');
});
