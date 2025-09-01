import { test, expect } from '@playwright/test';

test('원격 서버 스케줄 추가 디버깅 테스트', async ({ page }) => {
  console.log('🚀 원격 서버 스케줄 추가 디버깅 테스트 시작');
  
  // 원격 서버의 직원별 스케줄 관리 페이지로 이동
  await page.goto('https://www.maslabs.kr/admin/employee-schedules');
  console.log('✅ 원격 서버 직원별 스케줄 관리 페이지 접근');
  
  // 페이지 로딩 대기
  await page.waitForLoadState('networkidle');
  
  // 1. 첫 번째 직원 선택
  const firstEmployee = page.locator('button:has-text("김탁수")').first();
  await firstEmployee.click();
  console.log('✅ 김탁수 직원 선택');
  
  // 2. 콘솔 로그 확인
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push(msg);
    console.log('📱 콘솔 메시지:', msg.text());
  });
  
  // 3. 네트워크 요청 모니터링
  const networkRequests = [];
  page.on('request', request => {
    if (request.url().includes('supabase')) {
      networkRequests.push(request);
      console.log('🌐 네트워크 요청:', request.url());
    }
  });
  
  // 4. 빈 시간대 클릭하여 스케줄 추가 시도
  const emptyTimeSlot = page.locator('.bg-gray-50').first();
  await emptyTimeSlot.click();
  console.log('✅ 빈 시간대 클릭');
  
  // 5. 잠시 대기하여 응답 확인
  await page.waitForTimeout(5000);
  
  // 6. 콘솔 로그 분석
  console.log('📊 총 콘솔 메시지 수:', consoleMessages.length);
  console.log('🌐 총 네트워크 요청 수:', networkRequests.length);
  
  // 7. 페이지 상태 확인
  const currentSchedules = page.locator('.bg-blue-200, .bg-blue-300, .bg-blue-400');
  const scheduleCount = await currentSchedules.count();
  console.log('📅 현재 표시된 스케줄 수:', scheduleCount);
  
  // 8. 페이지 스크린샷 저장
  await page.screenshot({ path: 'test-results/remote-debug-test.png' });
  console.log('✅ 디버깅 스크린샷 저장 완료');
  
  // 9. 페이지 소스 일부 확인
  const pageContent = await page.content();
  const hasError = pageContent.includes('error') || pageContent.includes('Error');
  console.log('❌ 페이지에 에러가 있는가:', hasError);
  
  console.log('✅ 원격 서버 스케줄 추가 디버깅 테스트 완료');
});
