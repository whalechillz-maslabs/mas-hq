import { test, expect } from '@playwright/test';

test('스케줄 페이지 에러 확인 테스트', async ({ page }) => {
  console.log('🔍 스케줄 페이지 에러 확인 테스트 시작');
  
  // 1. 로그인
  await page.goto('http://localhost:3000/login');
  await page.click('text=전화번호');
  await page.fill('input[type="tel"]', '010-6669-9000');
  await page.fill('input[type="password"]', '66699000');
  await page.click('button[type="submit"]');
  console.log('✅ 로그인 완료');
  
  // 2. 대시보드 로딩 대기
  await page.waitForURL('**/dashboard');
  console.log('✅ 대시보드 로딩 완료');
  
  // 3. 근무 스케줄 메뉴 클릭
  await page.click('text=근무 스케줄');
  console.log('✅ 근무 스케줄 메뉴 클릭');
  
  // 4. 스케줄 페이지 로딩 대기
  await page.waitForURL('**/schedules');
  console.log('✅ 스케줄 페이지 로딩 완료');
  
  // 5. 페이지 로딩 대기
  await page.waitForTimeout(3000);
  
  // 6. 스케줄 페이지 콘텐츠 확인
  const scheduleContent = await page.textContent('body');
  console.log('📄 스케줄 페이지 내용 (처음 800자):', scheduleContent?.substring(0, 800));
  
  // 7. 스케줄 추가 버튼 확인
  const addButton = await page.locator('text=스케줄 추가');
  const addButtonVisible = await addButton.isVisible();
  console.log('🔘 스케줄 추가 버튼 표시:', addButtonVisible);
  
  // 8. 달력 뷰 확인
  const calendarView = await page.locator('.grid.grid-cols-7');
  const calendarVisible = await calendarView.isVisible();
  console.log('📅 달력 뷰 표시:', calendarVisible);
  
  // 9. 스케줄 데이터 확인
  const scheduleItems = await page.locator('[class*="bg-blue-200"]').count();
  console.log('📋 스케줄 아이템 개수:', scheduleItems);
  
  // 10. 스케줄 추가 버튼 클릭
  try {
    await addButton.click();
    console.log('✅ 스케줄 추가 버튼 클릭 성공');
    
    // 11. 스케줄 추가 페이지 로딩 대기
    await page.waitForURL('**/schedules/add');
    console.log('✅ 스케줄 추가 페이지 로딩 완료');
    
    // 12. 스케줄 추가 페이지 콘텐츠 확인
    const addPageContent = await page.textContent('body');
    console.log('📄 스케줄 추가 페이지 내용 (처음 600자):', addPageContent?.substring(0, 600));
    
    // 13. 입력 필드 확인
    const dateInput = await page.locator('input[type="date"]');
    const timeInputs = await page.locator('input[type="time"]');
    const textarea = await page.locator('textarea');
    
    console.log('📅 날짜 입력 필드 존재:', await dateInput.isVisible());
    console.log('⏰ 시간 입력 필드 개수:', await timeInputs.count());
    console.log('📝 메모 입력 필드 존재:', await textarea.isVisible());
    
  } catch (error) {
    console.log('❌ 스케줄 추가 버튼 클릭 실패:', error);
  }
  
  // 14. 콘솔 에러 확인
  const consoleErrors = await page.evaluate(() => {
    return (window as any).consoleErrors || [];
  });
  console.log('🚨 콘솔 에러:', consoleErrors);
  
  // 15. 스크린샷 캡처
  await page.screenshot({ path: 'schedule-error-check.png', fullPage: true });
  console.log('✅ 스케줄 페이지 에러 확인 테스트 스크린샷 캡처 완료');
  
  console.log('🎉 스케줄 페이지 에러 확인 테스트 완료!');
});
