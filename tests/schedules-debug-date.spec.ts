import { test, expect } from '@playwright/test';

test('스케줄 추가 페이지에서 날짜 고정 원인 디버깅', async ({ page }) => {
  // 로그인
  await page.goto('https://www.maslabs.kr/login');
  
  // 김탁수 계정으로 로그인
  await page.fill('input[name="phone"]', '010-6669-9000');
  await page.fill('input[name="password"]', '66699000');
  await page.click('button[type="submit"]');
  
  // 로그인 후 스케줄 추가 페이지로 직접 이동
  await page.waitForURL('**/quick-task');
  
  console.log('=== 날짜 고정 원인 디버깅 시작 ===');
  
  // 1. 페이지 로드 전 콘솔 로그 수집 시작
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
  
  // 2. 스케줄 추가 페이지로 이동
  console.log('=== 2. 스케줄 추가 페이지로 이동 ===');
  await page.goto('https://www.maslabs.kr/schedules/add');
  await page.waitForLoadState('networkidle');
  
  // 3. 페이지 소스에서 모든 날짜 관련 정보 수집
  console.log('=== 3. 페이지 소스에서 날짜 관련 정보 수집 ===');
  
  const pageContent = await page.content();
  
  // 날짜 패턴 검색
  const datePatterns = [
    /2025-09-02/g,
    /2025-09-03/g,
    /9월 2일/g,
    /9월 3일/g,
    /September 2/g,
    /September 3/g,
    /scheduleDate.*=/g,
    /setScheduleDate.*/g,
    /useState.*Date/g
  ];
  
  datePatterns.forEach(pattern => {
    const matches = pageContent.match(pattern);
    if (matches) {
      console.log(`패턴 ${pattern.source} 발견:`, matches);
    }
  });
  
  // 4. 네트워크 요청에서 날짜 정보 확인
  console.log('=== 4. 네트워크 요청에서 날짜 정보 확인 ===');
  
  const networkRequests = await page.evaluate(() => {
    return performance.getEntriesByType('resource')
      .filter(entry => entry.name.includes('schedules') || entry.name.includes('add'))
      .map(entry => ({
        name: entry.name,
        type: (entry as any).initiatorType,
        duration: entry.duration
      }));
  });
  
  console.log('스케줄 관련 네트워크 요청:', networkRequests);
  
  // 5. localStorage에서 날짜 정보 확인
  console.log('=== 5. localStorage에서 날짜 정보 확인 ===');
  
  const localStorageData = await page.evaluate(() => {
    const data = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        try {
          data[key] = localStorage.getItem(key);
        } catch (e) {
          data[key] = 'Error reading value';
        }
      }
    }
    return data;
  });
  
  console.log('localStorage 데이터:', localStorageData);
  
  // 6. 콘솔 로그 확인
  console.log('=== 6. 콘솔 로그 확인 ===');
  
  const consoleLogs = await page.evaluate(() => {
    return (window as any).consoleLogs || [];
  });
  
  if (consoleLogs.length > 0) {
    console.log('콘솔 로그:', consoleLogs);
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
  
  // 8. 날짜 입력 필드 상세 분석
  console.log('=== 8. 날짜 입력 필드 상세 분석 ===');
  
  const dateInput = page.locator('input[type="date"]');
  const dateInputCount = await dateInput.count();
  console.log('날짜 입력 필드 수:', dateInputCount);
  
  if (dateInputCount > 0) {
    const input = dateInput.first();
    
    // 모든 속성 확인
    const attributes = await input.evaluate(el => {
      const attrs = {};
      for (let attr of el.attributes) {
        attrs[attr.name] = attr.value;
      }
      return attrs;
    });
    
    console.log('날짜 입력 필드 모든 속성:', attributes);
    
    // 현재 값과 기본값 확인
    const currentValue = await input.getAttribute('value');
    const defaultValue = await input.getAttribute('defaultValue');
    const min = await input.getAttribute('min');
    const max = await input.getAttribute('max');
    
    console.log('날짜 입력 필드 값들:');
    console.log('- current value:', currentValue);
    console.log('- default value:', defaultValue);
    console.log('- min:', min);
    console.log('- max:', max);
  }
  
  // 9. 스크린샷 저장
  console.log('=== 9. 스크린샷 저장 ===');
  await page.screenshot({ path: 'playwright-report/schedules-debug-date.png', fullPage: true });
  console.log('✅ 스크린샷이 저장되었습니다: playwright-report/schedules-debug-date.png');
  
  console.log('=== 날짜 고정 원인 디버깅 완료 ===');
});
