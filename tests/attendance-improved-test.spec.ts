import { test, expect } from '@playwright/test';

test('개선된 출근 관리 기능 테스트', async ({ page }) => {
  // 로그인
  await page.goto('https://www.maslabs.kr/login');
  
  // 김탁수 계정으로 로그인
  await page.fill('input[name="phone"]', '010-6669-9000');
  await page.fill('input[name="password"]', '66699000');
  await page.click('button[type="submit"]');
  
  // 로그인 후 출근 관리 페이지로 이동
  await page.waitForURL('**/quick-task');
  await page.goto('https://www.maslabs.kr/attendance');
  
  console.log('=== 개선된 출근 관리 기능 테스트 시작 ===');
  
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
  
  // 2. 현재 시간 표시 확인
  console.log('=== 2. 현재 시간 표시 확인 ===');
  
  const currentTimeElement = page.locator('text=/현재 시간/');
  if (await currentTimeElement.isVisible()) {
    console.log('✅ 현재 시간 섹션이 표시됩니다');
    
    const timeText = page.locator('p.text-sm.font-semibold.text-gray-900');
    if (await timeText.isVisible()) {
      const timeContent = await timeText.textContent();
      console.log('현재 시간 내용:', timeContent?.trim());
      
      if (timeContent?.includes('2025년') && timeContent?.includes('시') && timeContent?.includes('분')) {
        console.log('✅ 현재 시간이 올바른 형식으로 표시됩니다');
      } else {
        console.log('❌ 현재 시간 형식이 올바르지 않습니다');
      }
    }
  } else {
    console.log('❌ 현재 시간 섹션을 찾을 수 없습니다');
  }
  
  // 3. 디버깅 정보 확인
  console.log('=== 3. 디버깅 정보 확인 ===');
  
  const debugInfo = page.locator('text=디버깅 정보');
  if (await debugInfo.isVisible()) {
    console.log('✅ 디버깅 정보 섹션이 표시됩니다');
    
    // 사용자 정보 확인
    const userIdElement = page.locator('text=/사용자 ID:/');
    if (await userIdElement.isVisible()) {
      const userIdText = await userIdElement.textContent();
      console.log('사용자 ID:', userIdText?.trim());
    }
    
    const userNameElement = page.locator('text=/사용자 이름:/');
    if (await userNameElement.isVisible()) {
      const userNameText = await userNameElement.textContent();
      console.log('사용자 이름:', userNameText?.trim());
    }
    
    const uuidElement = page.locator('text=/UUID:/');
    if (await uuidElement.isVisible()) {
      const uuidText = await uuidElement.textContent();
      console.log('UUID:', uuidText?.trim());
    }
    
    // 스케줄 정보 확인
    const scheduleCountElement = page.locator('text=/오늘 스케줄 수:/');
    if (await scheduleCountElement.isVisible()) {
      const scheduleCountText = await scheduleCountElement.textContent();
      console.log('오늘 스케줄 수:', scheduleCountText?.trim());
      
      // 스케줄 수가 0보다 큰지 확인
      const countMatch = scheduleCountText?.match(/(\d+)개/);
      if (countMatch && parseInt(countMatch[1]) > 0) {
        console.log('✅ 오늘 스케줄이 정상적으로 로드되었습니다');
      } else {
        console.log('❌ 오늘 스케줄이 로드되지 않았습니다');
      }
    }
    
    const monthlyRecordElement = page.locator('text=/월간 기록 수:/');
    if (await monthlyRecordElement.isVisible()) {
      const monthlyRecordText = await monthlyRecordElement.textContent();
      console.log('월간 기록 수:', monthlyRecordText?.trim());
    }
  } else {
    console.log('❌ 디버깅 정보 섹션을 찾을 수 없습니다');
  }
  
  // 4. 오늘 근무 요약 확인
  console.log('=== 4. 오늘 근무 요약 확인 ===');
  
  const workSummaryTitle = page.locator('h3:has-text("오늘 근무 요약")');
  if (await workSummaryTitle.isVisible()) {
    console.log('✅ 오늘 근무 요약 섹션이 표시됩니다');
    
    // 총 근무 시간 확인
    const totalWorkTimeElement = page.locator('text=/총 근무 시간/');
    if (await totalWorkTimeElement.isVisible()) {
      const totalWorkTimeText = await totalWorkTimeElement.textContent();
      console.log('총 근무 시간:', totalWorkTimeText?.trim());
      
      // 근무 시간이 표시되는지 확인
      const timeValue = page.locator('div.text-2xl.font-bold.text-blue-600');
      if (await timeValue.isVisible()) {
        const timeContent = await timeValue.textContent();
        console.log('근무 시간 값:', timeContent?.trim());
        
        if (timeContent && timeContent !== '0h 0m') {
          console.log('✅ 근무 시간이 정상적으로 계산되었습니다');
        } else {
          console.log('❌ 근무 시간이 0으로 표시됩니다');
        }
      }
    }
    
    // 완료된 근무 확인
    const completedWorkElement = page.locator('text=/완료된 근무/');
    if (await completedWorkElement.isVisible()) {
      const completedWorkText = await completedWorkElement.textContent();
      console.log('완료된 근무:', completedWorkText?.trim());
    }
    
    // 진행 중인 근무 확인
    const inProgressElement = page.locator('text=/진행 중/');
    if (await inProgressElement.isVisible()) {
      const inProgressText = await inProgressElement.textContent();
      console.log('진행 중인 근무:', inProgressText?.trim());
    }
    
    // 대기 중인 근무 확인
    const pendingElement = page.locator('text=/대기 중/');
    if (await pendingElement.isVisible()) {
      const pendingText = await pendingElement.textContent();
      console.log('대기 중인 근무:', pendingText?.trim());
    }
  } else {
    console.log('❌ 오늘 근무 요약 섹션을 찾을 수 없습니다');
  }
  
  // 5. 출근 관리 인터페이스 확인
  console.log('=== 5. 출근 관리 인터페이스 확인 ===');
  
  const attendanceTitle = page.locator('h3:has-text("간단한 출근 관리")');
  if (await attendanceTitle.isVisible()) {
    console.log('✅ 간단한 출근 관리 섹션이 표시됩니다');
    
    // 현재 상태 확인
    const currentStatusElement = page.locator('text=/현재 상태:/');
    if (await currentStatusElement.isVisible()) {
      const currentStatusText = await currentStatusElement.textContent();
      console.log('현재 상태:', currentStatusText?.trim());
    }
    
    // 출근 체크 버튼 확인
    const clockInButton = page.locator('button:has-text("출근 체크")');
    if (await clockInButton.isVisible()) {
      console.log('✅ 출근 체크 버튼이 표시됩니다');
      
      // 버튼 클릭 테스트
      console.log('=== 출근 체크 버튼 클릭 테스트 ===');
      await clockInButton.click();
      
      // 클릭 후 상태 변화 확인
      await page.waitForTimeout(3000);
      
      const newStatusElement = page.locator('text=/현재 상태:/');
      if (await newStatusElement.isVisible()) {
        const newStatusText = await newStatusElement.textContent();
        console.log('클릭 후 현재 상태:', newStatusText?.trim());
        
        if (newStatusText?.includes('근무 중')) {
          console.log('✅ 출근 체크가 성공적으로 처리되었습니다');
        } else {
          console.log('❌ 출근 체크 처리 후 상태가 변경되지 않았습니다');
        }
      }
    } else {
      console.log('❌ 출근 체크 버튼을 찾을 수 없습니다');
    }
  } else {
    console.log('❌ 간단한 출근 관리 섹션을 찾을 수 없습니다');
  }
  
  // 6. 오늘의 근무 스케줄 확인
  console.log('=== 6. 오늘의 근무 스케줄 확인 ===');
  
  const scheduleTitle = page.locator('h2:has-text("오늘의 근무 스케줄")');
  if (await scheduleTitle.isVisible()) {
    console.log('✅ 오늘의 근무 스케줄 섹션이 표시됩니다');
    
    // 스케줄 내용 확인
    const scheduleContent = page.locator('text=오늘 등록된 근무 스케줄이 없습니다');
    if (await scheduleContent.isVisible()) {
      console.log('❌ 오늘 등록된 근무 스케줄이 없습니다');
    } else {
      console.log('✅ 오늘의 근무 스케줄이 표시됩니다');
      
      // 스케줄 카드 확인
      const scheduleCards = page.locator('div.bg-white.rounded-lg.border.p-4.shadow-sm');
      const cardCount = await scheduleCards.count();
      console.log('스케줄 카드 수:', cardCount);
      
      if (cardCount > 0) {
        console.log('✅ 스케줄 카드가 정상적으로 표시됩니다');
        
        // 첫 번째 카드 분석
        const firstCard = scheduleCards.first();
        const cardText = await firstCard.textContent();
        console.log('첫 번째 카드 내용:', cardText?.trim());
      }
    }
  } else {
    console.log('❌ 오늘의 근무 스케줄 섹션을 찾을 수 없습니다');
  }
  
  // 7. 콘솔 로그 확인
  console.log('=== 7. 콘솔 로그 확인 ===');
  
  // 잠시 대기하여 로그 수집
  await page.waitForTimeout(3000);
  
  const consoleLogs = await page.evaluate(() => {
    return (window as any).consoleLogs || [];
  });
  
  if (consoleLogs.length > 0) {
    console.log('수집된 콘솔 로그:', consoleLogs);
    
    // 출근 관련 로그 확인
    const attendanceLogs = consoleLogs.filter(log => 
      log.args.some(arg => 
        typeof arg === 'string' && 
        (arg.includes('출근') || arg.includes('attendance') || arg.includes('clock') || arg.includes('스케줄'))
      )
    );
    
    if (attendanceLogs.length > 0) {
      console.log('✅ 출근 관련 로그 발견:', attendanceLogs);
    } else {
      console.log('❌ 출근 관련 로그가 없습니다');
    }
  } else {
    console.log('콘솔 로그가 없습니다.');
  }
  
  // 8. JavaScript 오류 확인
  const jsErrors = await page.evaluate(() => {
    return (window as any).jsErrors || [];
  });
  
  if (jsErrors.length > 0) {
    console.log('JavaScript 오류:', jsErrors);
  } else {
    console.log('JavaScript 오류가 없습니다.');
  }
  
  // 9. 스크린샷 저장
  console.log('=== 9. 스크린샷 저장 ===');
  await page.screenshot({ path: 'playwright-report/attendance-improved-test.png', fullPage: true });
  console.log('✅ 스크린샷이 저장되었습니다: playwright-report/attendance-improved-test.png');
  
  console.log('=== 개선된 출근 관리 기능 테스트 완료 ===');
});
