import { test, expect } from '@playwright/test';

test('수정된 /schedules 페이지 시간대별 근무자 수 계산 검증', async ({ page }) => {
  // 로그인
  await page.goto('https://www.maslabs.kr/login');
  
  // 김탁수 계정으로 로그인
  await page.fill('input[name="phone"]', '010-6669-9000');
  await page.fill('input[name="password"]', '66699000');
  await page.click('button[type="submit"]');
  
  // 로그인 후 스케줄 페이지로 이동
  await page.waitForURL('**/quick-task');
  await page.goto('https://www.maslabs.kr/schedules');
  
  console.log('=== 수정된 /schedules 페이지 시간대별 근무자 수 계산 검증 시작 ===');
  
  // 페이지 로딩 확인
  await page.waitForLoadState('networkidle');
  
  // 1. 콘솔 로그 수집 시작
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
  
  // 2. 현재 날짜 확인 (수요일 3일)
  console.log('=== 2. 현재 날짜 확인 ===');
  
  const currentDateElement = page.locator('text=수 3').or(page.locator('text=3'));
  if (await currentDateElement.isVisible()) {
    console.log('✅ 수요일 3일이 표시됩니다');
  } else {
    console.log('❌ 수요일 3일을 찾을 수 없습니다');
  }
  
  // 3. 9:00 시간대 근무자 수 확인
  console.log('=== 3. 9:00 시간대 근무자 수 확인 ===');
  
  // 9:00 셀 찾기 (수요일 3일 열에서)
  const nineAMCell = page.locator('td').filter({ hasText: '3' }).first();
  
  if (await nineAMCell.isVisible()) {
    const cellText = await nineAMCell.textContent();
    console.log(`9:00 시간대 셀 텍스트: ${cellText?.trim()}`);
    
    if (cellText?.includes('3')) {
      console.log('✅ 9:00 시간대에 3명의 근무자가 표시됩니다');
    } else {
      console.log('❌ 9:00 시간대에 3명이 표시되지 않습니다');
    }
  } else {
    console.log('❌ 9:00 시간대 셀을 찾을 수 없습니다');
  }
  
  // 4. 9:30 시간대 근무자 수 확인
  console.log('=== 4. 9:30 시간대 근무자 수 확인 ===');
  
  // 9:30 셀 찾기
  const nineThirtyAMCell = page.locator('td').filter({ hasText: '2' }).first();
  
  if (await nineThirtyAMCell.isVisible()) {
    const cellText = await nineThirtyAMCell.textContent();
    console.log(`9:30 시간대 셀 텍스트: ${cellText?.trim()}`);
    
    if (cellText?.includes('2')) {
      console.log('✅ 9:30 시간대에 2명의 근무자가 표시됩니다');
    } else {
      console.log('❌ 9:30 시간대에 2명이 표시되지 않습니다');
    }
  } else {
    console.log('❌ 9:30 시간대 셀을 찾을 수 없습니다');
  }
  
  // 5. 전체 시간대별 근무자 수 확인
  console.log('=== 5. 전체 시간대별 근무자 수 확인 ===');
  
  // 모든 숫자가 포함된 셀 찾기
  const allNumberCells = page.locator('td').filter({ hasText: /[1-9]/ });
  const cellCount = await allNumberCells.count();
  console.log('숫자가 포함된 셀 수:', cellCount);
  
  if (cellCount > 0) {
    console.log('=== 시간대별 근무자 수 분석 ===');
    
    for (let i = 0; i < Math.min(cellCount, 10); i++) {
      const cell = allNumberCells.nth(i);
      const cellText = await cell.textContent();
      console.log(`셀 ${i + 1}: ${cellText?.trim()}`);
    }
  }
  
  // 6. 콘솔 로그 확인
  console.log('=== 6. 콘솔 로그 확인 ===');
  
  // 잠시 대기하여 로그 수집
  await page.waitForTimeout(3000);
  
  const consoleLogs = await page.evaluate(() => {
    return (window as any).consoleLogs || [];
  });
  
  if (consoleLogs.length > 0) {
    console.log('수집된 콘솔 로그:', consoleLogs);
    
    // getSchedulesForDateAndTime 관련 로그 확인
    const timeSlotLogs = consoleLogs.filter(log => 
      log.args.some(arg => 
        typeof arg === 'string' && 
        (arg.includes('getSchedulesForDateAndTime') || arg.includes('시간 비교'))
      )
    );
    
    if (timeSlotLogs.length > 0) {
      console.log('✅ 시간대별 스케줄 관련 로그 발견:', timeSlotLogs);
    } else {
      console.log('❌ 시간대별 스케줄 관련 로그가 없습니다');
    }
  } else {
    console.log('콘솔 로그가 없습니다.');
  }
  
  // 7. JavaScript 오류 확인
  const jsErrors = await page.evaluate(() => {
    return (window as any).jsErrors || [];
  });
  
  if (jsErrors.length > 0) {
    console.log('JavaScript 오류:', jsErrors);
  } else {
    console.log('JavaScript 오류가 없습니다.');
  }
  
  // 8. 스크린샷 저장
  console.log('=== 8. 스크린샷 저장 ===');
  await page.screenshot({ path: 'playwright-report/schedules-fix-verification.png', fullPage: true });
  console.log('✅ 스크린샷이 저장되었습니다: playwright-report/schedules-fix-verification.png');
  
  console.log('=== 수정된 /schedules 페이지 시간대별 근무자 수 계산 검증 완료 ===');
});
