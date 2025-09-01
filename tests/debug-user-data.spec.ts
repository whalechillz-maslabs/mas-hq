import { test, expect } from '@playwright/test';

test('사용자 데이터 구조 확인 - localStorage currentEmployee', async ({ page }) => {
  // 로그인
  await page.goto('https://maslabs.kr/login');
  
  // 김탁수 계정으로 로그인
  await page.fill('input[name="phone"]', '010-6669-9000');
  await page.fill('input[name="password"]', '66699000');
  await page.click('button[type="submit"]');
  
  // 로그인 후 대시보드로 이동
  await page.waitForURL('**/quick-task');
  
  // localStorage 데이터 확인
  console.log('=== localStorage 데이터 구조 확인 ===');
  
  const localStorageData = await page.evaluate(() => {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const currentEmployee = localStorage.getItem('currentEmployee');
    
    console.log('isLoggedIn:', isLoggedIn);
    console.log('currentEmployee:', currentEmployee);
    
    if (currentEmployee) {
      const parsed = JSON.parse(currentEmployee);
      console.log('parsed currentEmployee:', parsed);
      console.log('parsed currentEmployee keys:', Object.keys(parsed));
      console.log('parsed currentEmployee.id:', parsed.id);
      console.log('parsed currentEmployee.employee_id:', parsed.employee_id);
      console.log('parsed currentEmployee.name:', parsed.name);
      
      return {
        isLoggedIn,
        currentEmployee: parsed,
        keys: Object.keys(parsed)
      };
    }
    
    return {
      isLoggedIn,
      currentEmployee: null,
      keys: []
    };
  });
  
  console.log('localStorage 데이터:', localStorageData);
  
  // 새 스케줄 추가 페이지로 이동하여 currentUser 상태 확인
  await page.goto('https://maslabs.kr/schedules/add');
  await page.waitForLoadState('networkidle');
  
  // 콘솔 로그 수집 시작
  await page.addInitScript(() => {
    (window as any).consoleLogs = [];
    
    const originalLog = console.log;
    
    console.log = (...args) => {
      (window as any).consoleLogs.push({ type: 'log', args, timestamp: new Date().toISOString() });
      originalLog.apply(console, args);
    };
  });
  
  // 페이지 로딩 상태 확인
  const loadingElement = page.locator('.animate-spin');
  if (await loadingElement.isVisible()) {
    console.log('페이지가 아직 로딩 중입니다. 잠시 대기...');
    await page.waitForTimeout(3000);
  }
  
  // 사용자 정보 표시 확인
  const userInfo = page.locator('text=/김탁수.*WHA/');
  if (await userInfo.isVisible()) {
    console.log('사용자 정보가 표시됩니다:', await userInfo.textContent());
  } else {
    console.log('사용자 정보가 표시되지 않습니다');
  }
  
  // 콘솔 로그 확인
  console.log('=== 페이지 콘솔 로그 확인 ===');
  const consoleLogs = await page.evaluate(() => {
    return (window as any).consoleLogs || [];
  });
  
  if (consoleLogs.length > 0) {
    console.log('콘솔 로그:', consoleLogs);
  } else {
    console.log('콘솔 로그가 없습니다');
  }
  
  console.log('=== 사용자 데이터 구조 확인 완료 ===');
});
