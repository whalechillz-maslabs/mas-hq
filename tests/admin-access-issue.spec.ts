import { test, expect } from '@playwright/test';

test('관리자 접근 문제 진단 - 김탁수 로그인 후 직원별 스케줄 관리 접근 시 튕겨져 나오는 문제', async ({ page }) => {
  // 로그인
  await page.goto('https://maslabs.kr/login');
  
  // 김탁수 계정으로 로그인
  await page.fill('input[name="phone"]', '010-6669-9000');
  await page.fill('input[name="password"]', '66699000');
  await page.click('button[type="submit"]');
  
  // 로그인 후 대시보드로 이동
  await page.waitForURL('**/quick-task');
  
  console.log('=== 관리자 접근 문제 진단 시작 ===');
  
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
  
  // 1. 대시보드에서 사용자 정보 및 역할 확인
  console.log('=== 1. 대시보드 사용자 정보 및 역할 확인 ===');
  
  await page.goto('https://maslabs.kr/dashboard');
  await page.waitForLoadState('networkidle');
  
  // 페이지 로딩 상태 확인
  const loadingElement = page.locator('.animate-spin');
  if (await loadingElement.isVisible()) {
    console.log('대시보드가 아직 로딩 중입니다. 잠시 대기...');
    await page.waitForTimeout(3000);
  }
  
  // 사용자 정보 확인
  const userInfo = page.locator('text=/김탁수님/');
  if (await userInfo.isVisible()) {
    console.log('✅ 사용자 정보가 표시됩니다:', await userInfo.textContent());
  } else {
    console.log('❌ 사용자 정보가 표시되지 않습니다');
  }
  
  // 관리자 기능 링크 확인 (더 구체적인 선택자 사용)
  const adminLink = page.locator('button[title="직원별 스케줄 관리"]');
  if (await adminLink.isVisible()) {
    console.log('✅ 관리자 기능 링크가 표시됩니다');
    
    // 링크 클릭 전 현재 URL 확인
    const currentUrl = page.url();
    console.log('현재 URL (클릭 전):', currentUrl);
    
    // 관리자 링크 클릭
    console.log('관리자 링크 클릭 시작...');
    await adminLink.click();
    
    // 페이지 이동 대기
    await page.waitForTimeout(3000);
    
    // 클릭 후 URL 확인
    const newUrl = page.url();
    console.log('클릭 후 URL:', newUrl);
    
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
    
    // 로그인 페이지로 리다이렉트되었는지 확인
    if (newUrl.includes('/login')) {
      console.log('❌ 로그인 페이지로 리다이렉트되었습니다');
    } else if (newUrl.includes('/admin/employee-schedules')) {
      console.log('✅ 관리자 페이지에 정상적으로 접근했습니다');
    } else {
      console.log('⚠️ 다른 페이지로 이동했습니다:', newUrl);
    }
    
  } else {
    console.log('❌ 관리자 기능 링크가 표시되지 않습니다');
  }
  
  // 2. 직접 관리자 페이지 접근 시도
  console.log('=== 2. 직접 관리자 페이지 접근 시도 ===');
  
  await page.goto('https://maslabs.kr/admin/employee-schedules');
  await page.waitForLoadState('networkidle');
  
  // 페이지 로딩 상태 확인
  if (await loadingElement.isVisible()) {
    console.log('관리자 페이지가 아직 로딩 중입니다. 잠시 대기...');
    await page.waitForTimeout(3000);
  }
  
  // 현재 URL 확인
  const directAccessUrl = page.url();
  console.log('직접 접근 URL:', directAccessUrl);
  
  // 접근 권한 확인
  const accessDenied = page.locator('text=/접근 권한이 없습니다|Access denied|권한이 없습니다|403/');
  const notFound = page.locator('text=/404|Not Found|페이지를 찾을 수 없습니다/');
  const redirectToLogin = page.locator('text=/로그인|Login/');
  
  if (await accessDenied.isVisible()) {
    console.log('❌ 접근 권한이 없습니다:', await accessDenied.textContent());
  } else if (await notFound.isVisible()) {
    console.log('❌ 페이지를 찾을 수 없습니다:', await notFound.textContent());
  } else if (await redirectToLogin.isVisible()) {
    console.log('❌ 로그인 페이지로 리다이렉트되었습니다');
  } else {
    console.log('✅ 관리자 페이지에 접근할 수 있습니다');
    
    // 관리자 페이지 내용 확인 (더 구체적인 선택자 사용)
    const adminContent = page.locator('h3:has-text("직원별 스케줄 관리")');
    if (await adminContent.isVisible()) {
      console.log('✅ 관리자 기능이 표시됩니다:', await adminContent.textContent());
    } else {
      console.log('❌ 관리자 기능이 표시되지 않습니다');
    }
  }
  
  // 3. 사용자 역할 정보 재확인
  console.log('=== 3. 사용자 역할 정보 재확인 ===');
  
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
  
  // 4. 네트워크 요청 분석
  console.log('=== 4. 네트워크 요청 분석 ===');
  
  const networkRequests = await page.evaluate(() => {
    return performance.getEntriesByType('resource')
      .filter(entry => entry.name.includes('admin') || entry.name.includes('employee-schedules'))
      .map(entry => ({
        name: entry.name,
        type: (entry as any).initiatorType,
        duration: entry.duration
      }));
  });
  
  console.log('관리자 페이지 관련 네트워크 요청:', networkRequests);
  
  // 5. 콘솔 로그 및 오류 확인
  console.log('=== 5. 콘솔 로그 및 오류 확인 ===');
  
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
  
  // 6. 페이지 HTML 구조 분석
  console.log('=== 6. 페이지 HTML 구조 분석 ===');
  
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
  
  console.log('=== 관리자 접근 문제 진단 완료 ===');
});
