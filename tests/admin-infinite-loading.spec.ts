import { test, expect } from '@playwright/test';

test('관리자 페이지 무한 로딩 문제 진단', async ({ page }) => {
  // 로그인
  await page.goto('https://maslabs.kr/login');
  
  // 김탁수 계정으로 로그인
  await page.fill('input[name="phone"]', '010-6669-9000');
  await page.fill('input[name="password"]', '66699000');
  await page.click('button[type="submit"]');
  
  // 로그인 후 대시보드로 이동
  await page.waitForURL('**/quick-task');
  
  console.log('=== 관리자 페이지 무한 로딩 문제 진단 시작 ===');
  
  // 콘솔 로그 수집 시작
  await page.addInitScript(() => {
    (window as any).consoleLogs = [];
    (window as any).jsErrors = [];
    (window as any).consoleErrors = [];
    
    const originalLog = console.log;
    const originalError = console.error;
    
    console.log = (...args) => {
      (window as any).consoleLogs.push({ type: 'log', args, timestamp: new Date().toISOString() });
      originalLog.apply(console, args);
    };
    
    console.error = (...args) => {
      (window as any).jsErrors.push({ type: 'error', args, timestamp: new Date().toISOString() });
      (window as any).consoleErrors.push({ type: 'error', args, timestamp: new Date().toISOString() });
      originalError.apply(console, args);
    };
  });
  
  // 관리자 페이지로 직접 이동
  console.log('=== 관리자 페이지 직접 접근 ===');
  
  await page.goto('https://maslabs.kr/admin/employee-schedules');
  
  // 초기 로딩 상태 확인
  console.log('페이지 로딩 시작...');
  
  // 로딩 스피너 확인
  const loadingSpinner = page.locator('.animate-spin, [class*="animate-spin"]');
  const loadingText = page.locator('text=로딩 중...');
  
  if (await loadingSpinner.isVisible()) {
    console.log('✅ 로딩 스피너가 표시됩니다');
  } else {
    console.log('❌ 로딩 스피너가 표시되지 않습니다');
  }
  
  if (await loadingText.isVisible()) {
    console.log('✅ "로딩 중..." 텍스트가 표시됩니다');
  } else {
    console.log('❌ "로딩 중..." 텍스트가 표시되지 않습니다');
  }
  
  // 10초 대기하여 로딩 상태 변화 확인
  console.log('10초 대기하여 로딩 상태 변화 확인...');
  await page.waitForTimeout(10000);
  
  // 로딩 상태 재확인
  if (await loadingSpinner.isVisible()) {
    console.log('⚠️ 10초 후에도 로딩 스피너가 계속 표시됩니다 (무한 로딩 의심)');
  } else {
    console.log('✅ 10초 후 로딩 스피너가 사라졌습니다');
  }
  
  if (await loadingText.isVisible()) {
    console.log('⚠️ 10초 후에도 "로딩 중..." 텍스트가 계속 표시됩니다 (무한 로딩 의심)');
  } else {
    console.log('✅ 10초 후 "로딩 중..." 텍스트가 사라졌습니다');
  }
  
  // 현재 URL 확인
  const currentUrl = page.url();
  console.log('현재 URL:', currentUrl);
  
  // 페이지 제목 확인
  const pageTitle = page.locator('h1, h2, .text-3xl, .text-2xl');
  const titleCount = await pageTitle.count();
  console.log('페이지 제목 요소 수:', titleCount);
  
  if (titleCount > 0) {
    for (let i = 0; i < Math.min(titleCount, 3); i++) {
      const title = pageTitle.nth(i);
      const titleText = await title.textContent();
      console.log(`페이지 제목 ${i + 1}: ${titleText}`);
    }
  }
  
  // 오류 메시지 확인
  const errorMessage = page.locator('text=/오류|에러|Error|권한|접근|Access/');
  if (await errorMessage.isVisible()) {
    console.log('❌ 오류 메시지가 표시됩니다:', await errorMessage.textContent());
  } else {
    console.log('✅ 오류 메시지가 표시되지 않습니다');
  }
  
  // 3. 콘솔 로그 및 오류 확인
  console.log('=== 콘솔 로그 및 오류 확인 ===');
  
  const consoleLogs = await page.evaluate(() => {
    return (window as any).consoleLogs || [];
  });
  
  if (consoleLogs.length > 0) {
    console.log('콘솔 로그:', consoleLogs);
  } else {
    console.log('콘솔 로그가 없습니다');
  }
  
  const jsErrors = await page.evaluate(() => {
    return (window as any).jsErrors || [];
  });
  
  if (jsErrors.length > 0) {
    console.log('JavaScript 오류:', jsErrors);
  } else {
    console.log('JavaScript 오류가 없습니다');
  }
  
  // 4. 네트워크 요청 분석
  console.log('=== 네트워크 요청 분석 ===');
  
  const networkRequests = await page.evaluate(() => {
    return performance.getEntriesByType('resource')
      .filter(entry => entry.name.includes('admin') || entry.name.includes('employee-schedules') || entry.name.includes('employees'))
      .map(entry => ({
        name: entry.name,
        type: (entry as any).initiatorType,
        duration: entry.duration
      }));
  });
  
  console.log('관리자 페이지 관련 네트워크 요청:', networkRequests);
  
  // 5. 페이지 HTML 구조 분석
  console.log('=== 페이지 HTML 구조 분석 ===');
  
  // body 전체 내용 확인
  const bodyContent = await page.locator('body').textContent();
  console.log('Body 내용 일부:', bodyContent?.substring(0, 1000));
  
  // 페이지에 있는 모든 텍스트 찾기
  const allTexts = page.locator('text=/.*/');
  const textCount = await allTexts.count();
  console.log('페이지에 있는 텍스트 요소 수:', textCount);
  
  if (textCount > 0) {
    for (let i = 0; i < Math.min(textCount, 10); i++) {
      const text = allTexts.nth(i);
      const textContent = await text.textContent();
      console.log(`텍스트 ${i + 1}: ${textContent}`);
    }
  }
  
  // 6. 사용자 역할 정보 재확인
  console.log('=== 사용자 역할 정보 재확인 ===');
  
  // localStorage에서 사용자 정보 재확인
  const userRoleInfo = await page.evaluate(() => {
    const currentEmployee = localStorage.getItem('currentEmployee');
    if (currentEmployee) {
      const parsed = JSON.parse(currentEmployee);
      return {
        id: parsed.id,
        employee_id: parsed.employee_id,
        name: parsed.name,
        role_id: parsed.role_id,
        department_id: parsed.department_id,
        position_id: parsed.position_id
      };
    }
    return null;
  });
  
  console.log('사용자 역할 정보:', userRoleInfo);
  
  console.log('=== 관리자 페이지 무한 로딩 문제 진단 완료 ===');
});
