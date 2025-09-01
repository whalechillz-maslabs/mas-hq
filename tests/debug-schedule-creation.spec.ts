import { test, expect } from '@playwright/test';

test('스케줄 추가 문제 진단 - 9시-6시 설정 시 9-10시만 추가되는 문제', async ({ page }) => {
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
  
  console.log('=== 스케줄 추가 문제 진단 시작 ===');
  
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
  
  // HTML 구조 분석
  console.log('=== HTML 구조 분석 ===');
  
  // 모든 input 요소 찾기
  const allInputs = page.locator('input');
  const inputCount = await allInputs.count();
  console.log('전체 input 요소 수:', inputCount);
  
  for (let i = 0; i < inputCount; i++) {
    const input = allInputs.nth(i);
    const inputType = await input.getAttribute('type');
    const inputName = await input.getAttribute('name');
    const inputId = await input.getAttribute('id');
    const inputValue = await input.inputValue().catch(() => '값을 가져올 수 없음');
    
    console.log(`Input ${i + 1}: type="${inputType}", name="${inputName}", id="${inputId}", value="${inputValue}"`);
  }
  
  // 모든 textarea 요소 찾기
  const allTextareas = page.locator('textarea');
  const textareaCount = await allTextareas.count();
  console.log('전체 textarea 요소 수:', textareaCount);
  
  for (let i = 0; i < textareaCount; i++) {
    const textarea = allTextareas.nth(i);
    const textareaName = await textarea.getAttribute('name');
    const textareaId = await textarea.getAttribute('id');
    const textareaValue = await textarea.inputValue().catch(() => '값을 가져올 수 없음');
    
    console.log(`Textarea ${i + 1}: name="${textareaName}", id="${textareaId}", value="${textareaValue}"`);
  }
  
  // 시간 관련 input 요소 찾기
  const timeInputs = page.locator('input[type="time"]');
  const timeInputCount = await timeInputs.count();
  console.log('시간 input 요소 수:', timeInputCount);
  
  for (let i = 0; i < timeInputCount; i++) {
    const timeInput = timeInputs.nth(i);
    const timeInputName = await timeInput.getAttribute('name');
    const timeInputId = await timeInput.getAttribute('id');
    const timeInputValue = await timeInput.inputValue().catch(() => '값을 가져올 수 없음');
    
    console.log(`시간 Input ${i + 1}: name="${timeInputName}", id="${timeInputId}", value="${timeInputValue}"`);
  }
  
  // 날짜 input 요소 찾기
  const dateInputs = page.locator('input[type="date"]');
  const dateInputCount = await dateInputs.count();
  console.log('날짜 input 요소 수:', dateInputCount);
  
  for (let i = 0; i < dateInputCount; i++) {
    const dateInput = dateInputs.nth(i);
    const dateInputName = await dateInput.getAttribute('name');
    const dateInputId = await dateInput.getAttribute('id');
    const dateInputValue = await dateInput.inputValue().catch(() => '값을 가져올 수 없음');
    
    console.log(`날짜 Input ${i + 1}: name="${dateInputName}", id="${dateInputId}", value="${dateInputValue}"`);
  }
  
  // 스케줄 추가 버튼 찾기
  const addButton = page.locator('button:has-text("스케줄 추가")');
  if (await addButton.isVisible()) {
    console.log('스케줄 추가 버튼을 찾았습니다');
  } else {
    console.log('스케줄 추가 버튼을 찾을 수 없습니다');
  }
  
  // 기존 스케줄 섹션 확인
  const existingScheduleSection = page.locator('text=기존 스케줄');
  if (await existingScheduleSection.isVisible()) {
    console.log('기존 스케줄 섹션이 표시됩니다');
  } else {
    console.log('기존 스케줄 섹션이 표시되지 않습니다');
  }
  
  // 시간대별 근무자 현황 확인
  const workerStatusSection = page.locator('text=시간대별 근무자 현황');
  if (await workerStatusSection.isVisible()) {
    console.log('시간대별 근무자 현황 섹션이 표시됩니다');
  } else {
    console.log('시간대별 근무자 현황 섹션이 표시되지 않습니다');
  }
  
  console.log('=== HTML 구조 분석 완료 ===');
  
  // 실제 스케줄 추가 테스트
  console.log('=== 실제 스케줄 추가 테스트 시작 ===');
  
  // 시작 시간을 09:00으로 설정
  await page.fill('#startTime', '09:00');
  
  // 종료 시간을 18:00으로 설정
  await page.fill('#endTime', '18:00');
  
  // 설정된 값들 재확인
  const updatedStartTime = await page.locator('#startTime').inputValue();
  const updatedEndTime = await page.locator('#endTime').inputValue();
  
  console.log('업데이트된 값들:', {
    startTime: updatedStartTime,
    endTime: updatedEndTime
  });
  
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
  const errorMessage = page.locator('text=/오류|에러|실패/');
  
  if (await successMessage.isVisible()) {
    console.log('✅ 성공 메시지:', await successMessage.textContent());
  } else if (await errorMessage.isVisible()) {
    console.log('❌ 오류 메시지:', await errorMessage.textContent());
  } else {
    console.log('성공/오류 메시지가 표시되지 않았습니다');
  }
  
  // 기존 스케줄 섹션 재확인
  if (await existingScheduleSection.isVisible()) {
    console.log('기존 스케줄 섹션이 여전히 표시됩니다');
    
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
    console.log('기존 스케줄 섹션이 더 이상 표시되지 않습니다');
  }
  
  // 시간대별 근무자 현황 재확인
  if (await workerStatusSection.isVisible()) {
    console.log('시간대별 근무자 현황 섹션이 여전히 표시됩니다');
    
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
    console.log('시간대별 근무자 현황 섹션이 더 이상 표시되지 않습니다');
  }
  
  console.log('=== 스케줄 추가 문제 진단 완료 ===');
});
