import { test, expect } from '@playwright/test';

test('다른 사람 스케줄 표시 문제 진단', async ({ page }) => {
  // 로그인
  await page.goto('https://maslabs.kr/login');
  
  // 김탁수 계정으로 로그인
  await page.fill('input[name="phone"]', '010-6669-9000');
  await page.fill('input[name="password"]', '66699000');
  await page.click('button[type="submit"]');
  
  // 로그인 후 대시보드로 이동
  await page.waitForURL('**/quick-task');
  
  // 스케줄 페이지로 이동
  await page.goto('https://maslabs.kr/schedules');
  await page.waitForLoadState('networkidle');
  
  console.log('=== 스케줄 페이지 진단 시작 ===');
  
  // 페이지 로딩 상태 확인
  const loadingElement = page.locator('.animate-spin');
  if (await loadingElement.isVisible()) {
    console.log('페이지가 아직 로딩 중입니다. 잠시 대기...');
    await page.waitForTimeout(3000);
  }
  
  // 현재 표시된 스케줄 개수 확인
  const scheduleCells = page.locator('div[class*="bg-blue"], div[class*="bg-gray"]');
  const scheduleCount = await scheduleCells.count();
  console.log('현재 표시된 스케줄 셀 개수:', scheduleCount);
  
  // 네트워크 요청 확인
  console.log('=== 네트워크 요청 분석 ===');
  const networkRequests = await page.evaluate(() => {
    return performance.getEntriesByType('resource')
      .filter(entry => entry.name.includes('schedules'))
      .map(entry => ({
        name: entry.name,
        type: entry.initiatorType,
        duration: entry.duration
      }));
  });
  
  console.log('스케줄 관련 네트워크 요청:', networkRequests);
  
  // 콘솔 로그 확인
  console.log('=== 콘솔 로그 분석 ===');
  const consoleLogs = await page.evaluate(() => {
    return window.consoleLogs || [];
  });
  
  if (consoleLogs.length > 0) {
    console.log('콘솔 로그:', consoleLogs);
  } else {
    console.log('콘솔 로그가 없습니다');
  }
  
  // JavaScript 오류 확인
  const jsErrors = await page.evaluate(() => {
    return window.jsErrors || [];
  });
  
  if (jsErrors.length > 0) {
    console.log('JavaScript 오류:', jsErrors);
  } else {
    console.log('JavaScript 오류가 없습니다');
  }
  
  // 페이지 HTML 구조 분석
  console.log('=== 페이지 HTML 구조 분석 ===');
  
  // body 전체 내용 확인
  const bodyContent = await page.locator('body').textContent();
  console.log('Body 내용 일부:', bodyContent?.substring(0, 1000));
  
  // 스케줄 관련 텍스트 찾기
  const scheduleTexts = page.locator('text=/스케줄|근무|시간/');
  const scheduleTextCount = await scheduleTexts.count();
  console.log('스케줄 관련 텍스트 수:', scheduleTextCount);
  
  for (let i = 0; i < Math.min(scheduleTextCount, 10); i++) {
    const text = await scheduleTexts.nth(i).textContent();
    console.log(`스케줄 관련 텍스트 ${i + 1}: ${text}`);
  }
  
  // 시간 슬롯 확인
  const timeSlots = page.locator('div[class*="text-center"]');
  const timeSlotCount = await timeSlots.count();
  console.log('시간 슬롯 요소 수:', timeSlotCount);
  
  // 스케줄 그리드 확인
  const scheduleGrid = page.locator('div[class*="grid grid-cols-8"]');
  const gridCount = await scheduleGrid.count();
  console.log('스케줄 그리드 수:', gridCount);
  
  // 빈 시간 슬롯과 채워진 시간 슬롯 비교
  const emptySlots = page.locator('div[class*="bg-gray-50"]');
  const filledSlots = page.locator('div[class*="bg-blue"], div[class*="bg-gray-300"]');
  
  const emptyCount = await emptySlots.count();
  const filledCount = await filledSlots.count();
  
  console.log('빈 시간 슬롯 수:', emptyCount);
  console.log('채워진 시간 슬롯 수:', filledCount);
  
  // 채워진 슬롯의 상세 정보
  if (filledCount > 0) {
    console.log('=== 채워진 슬롯 상세 정보 ===');
    for (let i = 0; i < Math.min(filledCount, 5); i++) {
      const slot = filledSlots.nth(i);
      const slotClass = await slot.getAttribute('class');
      const slotText = await slot.textContent();
      console.log(`슬롯 ${i + 1}: 클래스="${slotClass}", 텍스트="${slotText}"`);
    }
  }
  
  // 새 스케줄 추가 페이지로 이동하여 기존 스케줄 확인
  console.log('=== 새 스케줄 추가 페이지로 이동 ===');
  await page.goto('https://maslabs.kr/schedules/add');
  await page.waitForLoadState('networkidle');
  
  // 기존 스케줄 목록 확인
  const existingSchedules = page.locator('div[class*="bg-white"], div[class*="bg-blue-100"]');
  const existingCount = await existingSchedules.count();
  console.log('기존 스케줄 카드 수:', existingCount);
  
  if (existingCount > 0) {
    console.log('=== 기존 스케줄 상세 정보 ===');
    for (let i = 0; i < Math.min(existingCount, 5); i++) {
      const schedule = existingSchedules.nth(i);
      const scheduleText = await schedule.textContent();
      console.log(`스케줄 ${i + 1}: ${scheduleText}`);
    }
  }
  
  console.log('=== 스케줄 가시성 진단 완료 ===');
});
