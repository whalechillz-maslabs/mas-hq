import { test, expect } from '@playwright/test';

test('스케줄 추가 중복 키 오류 진단', async ({ page }) => {
  // 로그인
  await page.goto('https://maslabs.kr/login');
  
  // 김탁수 계정으로 로그인
  await page.fill('input[name="phone"]', '010-6669-9000');
  await page.fill('input[name="password"]', '66699000');
  await page.click('button[type="submit"]');
  
  // 로그인 후 대시보드로 이동
  await page.waitForURL('**/quick-task');
  
  // 새 스케줄 추가 페이지로 이동
  await page.goto('https://maslabs.kr/schedules/add');
  await page.waitForLoadState('networkidle');
  
  console.log('=== 스케줄 추가 중복 키 오류 진단 시작 ===');
  
  // 콘솔 로그 수집 시작
  await page.addInitScript(() => {
    (window as any).consoleLogs = [];
    (window as any).jsErrors = [];
    
    const originalLog = console.log;
    const originalError = console.error;
    
    console.log = (...args) => {
      (window as any).consoleLogs.push({ type: 'log', args, timestamp: new Date().toISOString() });
      originalLog.apply(console, args);
    };
    
    console.error = (...args) => {
      (window as any).jsErrors.push({ type: 'error', args, timestamp: new Date().toISOString() });
      originalError.apply(console, args);
    };
  });
  
  // 페이지 로딩 상태 확인
  const loadingElement = page.locator('.animate-spin');
  if (await loadingElement.isVisible()) {
    console.log('페이지가 아직 로딩 중입니다. 잠시 대기...');
    await page.waitForTimeout(3000);
  }
  
  // 현재 설정된 값들 확인
  const currentDate = await page.locator('#scheduleDate').inputValue();
  const currentStartTime = await page.locator('#startTime').inputValue();
  const currentEndTime = await page.locator('#endTime').inputValue();
  
  console.log('현재 설정된 값들:', {
    date: currentDate,
    startTime: currentStartTime,
    endTime: currentEndTime
  });
  
  // 시작 시간을 09:00으로 설정
  await page.fill('#startTime', '09:00');
  
  // 종료 시간을 18:00으로 설정
  await page.fill('#endTime', '18:00');
  
  // 메모 입력
  await page.fill('#note', '테스트 스케줄 - 9시부터 6시까지');
  
  // 스케줄 추가 버튼 클릭
  console.log('스케줄 추가 버튼 클릭 시작...');
  await page.click('button:has-text("스케줄 추가")');
  
  // 네트워크 요청 대기
  await page.waitForTimeout(5000);
  
  // 콘솔 로그 확인
  console.log('=== 콘솔 로그 분석 ===');
  const consoleLogs = await page.evaluate(() => {
    return (window as any).consoleLogs || [];
  });
  
  if (consoleLogs.length > 0) {
    console.log('콘솔 로그:', consoleLogs);
  } else {
    console.log('콘솔 로그가 없습니다');
  }
  
  // JavaScript 오류 확인
  const jsErrors = await page.evaluate(() => {
    return (window as any).jsErrors || [];
  });
  
  if (jsErrors.length > 0) {
    console.log('JavaScript 오류:', jsErrors);
  } else {
    console.log('JavaScript 오류가 없습니다');
  }
  
  // 성공/오류 메시지 확인
  const successMessage = page.locator('text=/성공|추가되었습니다/');
  const errorMessage = page.locator('text=/오류|에러|실패|duplicate key|unique constraint/');
  
  if (await successMessage.isVisible()) {
    console.log('✅ 성공 메시지:', await successMessage.textContent());
  } else if (await errorMessage.isVisible()) {
    console.log('❌ 오류 메시지:', await errorMessage.textContent());
  } else {
    console.log('성공/오류 메시지가 표시되지 않았습니다');
  }
  
  // 기존 스케줄 섹션 확인
  const existingScheduleSection = page.locator('text=기존 스케줄');
  if (await existingScheduleSection.isVisible()) {
    console.log('✅ 기존 스케줄 섹션이 표시됩니다');
    
    // 기존 스케줄 카드 확인
    const scheduleCards = page.locator('div[class*="bg-white"], div[class*="bg-blue-100"]');
    const cardCount = await scheduleCards.count();
    console.log('기존 스케줄 카드 수:', cardCount);
    
    if (cardCount > 0) {
      for (let i = 0; i < Math.min(cardCount, 5); i++) {
        const card = scheduleCards.nth(i);
        const cardText = await card.textContent();
        console.log(`스케줄 카드 ${i + 1}: ${cardText}`);
      }
    }
  } else {
    console.log('❌ 기존 스케줄 섹션이 표시되지 않습니다');
  }
  
  // 시간대별 근무자 현황 확인
  const workerStatusSection = page.locator('text=시간대별 근무자 현황');
  if (await workerStatusSection.isVisible()) {
    console.log('✅ 시간대별 근무자 현황 섹션이 표시됩니다');
    
    // 각 시간대별 인원 수 확인
    const timeSlots = page.locator('div[class*="text-center"]');
    const timeSlotCount = await timeSlots.count();
    console.log('시간대별 슬롯 수:', timeSlotCount);
    
    for (let i = 0; i < Math.min(timeSlotCount, 10); i++) {
      const slot = timeSlots.nth(i);
      const slotText = await slot.textContent();
      console.log(`시간대 슬롯 ${i + 1}: ${slotText}`);
    }
  } else {
    console.log('❌ 시간대별 근무자 현황 섹션이 표시되지 않습니다');
  }
  
  console.log('=== 스케줄 추가 중복 키 오류 진단 완료 ===');
});
