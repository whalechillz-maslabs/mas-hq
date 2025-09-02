import { test, expect } from '@playwright/test';

test('배포 완료 확인 - 날짜 고정 문제 해결 검증', async ({ page }) => {
  // 로그인
  await page.goto('https://www.maslabs.kr/login');
  
  // 김탁수 계정으로 로그인
  await page.fill('input[name="phone"]', '010-6669-9000');
  await page.fill('input[name="password"]', '66699000');
  await page.click('button[type="submit"]');
  
  // 로그인 후 스케줄 추가 페이지로 직접 이동
  await page.waitForURL('**/quick-task');
  
  console.log('=== 배포 완료 확인 테스트 시작 ===');
  
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
  
  // 3. 현재 날짜 확인
  console.log('=== 3. 현재 날짜 확인 ===');
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD 형식
  console.log('현재 날짜 (YYYY-MM-DD):', todayStr);
  console.log('현재 날짜 (한국 시간):', today.toLocaleDateString('ko-KR'));
  
  // 4. 날짜 입력 필드 확인
  console.log('=== 4. 날짜 입력 필드 확인 ===');
  
  const dateInput = page.locator('input[type="date"]');
  const dateInputCount = await dateInput.count();
  console.log('날짜 입력 필드 수:', dateInputCount);
  
  if (dateInputCount > 0) {
    const input = dateInput.first();
    
    // 현재 설정된 값 확인
    const currentValue = await input.getAttribute('value');
    console.log('현재 설정된 날짜 값:', currentValue);
    
    // 5. 배포 완료 여부 확인
    console.log('=== 5. 배포 완료 여부 확인 ===');
    
    if (currentValue === '2025-09-02') {
      console.log('❌ 아직 이전 코드가 배포되어 있습니다.');
      console.log('날짜가 여전히 2025-09-02로 고정되어 있습니다.');
    } else if (currentValue === '2025-09-03') {
      console.log('✅ 배포가 완료되었습니다!');
      console.log('날짜가 현재 날짜(2025-09-03)로 올바르게 설정되었습니다.');
    } else if (currentValue === todayStr) {
      console.log('✅ 배포가 완료되었습니다!');
      console.log('날짜가 현재 날짜로 올바르게 설정되었습니다.');
    } else {
      console.log('⚠️ 예상과 다른 날짜가 설정되어 있습니다:', currentValue);
    }
    
    // 6. 콘솔 로그에서 수정된 로직 확인
    console.log('=== 6. 콘솔 로그에서 수정된 로직 확인 ===');
    
    // 잠시 대기하여 로그 수집
    await page.waitForTimeout(3000);
    
    const consoleLogs = await page.evaluate(() => {
      return (window as any).consoleLogs || [];
    });
    
    if (consoleLogs.length > 0) {
      console.log('수집된 콘솔 로그:', consoleLogs);
      
      // 수정된 로직의 로그 확인
      const dateLogs = consoleLogs.filter(log => 
        log.args.some(arg => 
          typeof arg === 'string' && 
          (arg.includes('한국 시간 기준 날짜 설정') || 
           arg.includes('컴포넌트 마운트 후 날짜 강제 업데이트'))
        )
      );
      
      if (dateLogs.length > 0) {
        console.log('✅ 수정된 날짜 설정 로직이 작동하고 있습니다!');
        dateLogs.forEach(log => {
          console.log('날짜 설정 로그:', log.args);
        });
      } else {
        console.log('❌ 수정된 날짜 설정 로직이 작동하지 않습니다.');
      }
    } else {
      console.log('콘솔 로그가 없습니다.');
    }
    
    // 7. JavaScript 오류 확인
    console.log('=== 7. JavaScript 오류 확인 ===');
    
    const jsErrors = await page.evaluate(() => {
      return (window as any).jsErrors || [];
    });
    
    if (jsErrors.length > 0) {
      console.log('JavaScript 오류:', jsErrors);
    } else {
      console.log('JavaScript 오류가 없습니다.');
    }
    
    // 8. 네트워크 요청에서 날짜 정보 확인
    console.log('=== 8. 네트워크 요청에서 날짜 정보 확인 ===');
    
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
    
    // 9. 스크린샷 저장
    console.log('=== 9. 스크린샷 저장 ===');
    await page.screenshot({ path: 'playwright-report/schedules-deployment-verification.png', fullPage: true });
    console.log('✅ 스크린샷이 저장되었습니다: playwright-report/schedules-deployment-verification.png');
    
  } else {
    console.log('❌ 날짜 입력 필드를 찾을 수 없습니다.');
  }
  
  console.log('=== 배포 완료 확인 테스트 완료 ===');
});
