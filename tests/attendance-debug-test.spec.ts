import { test, expect } from '@playwright/test';

test('출근 관리 기능 근본 원인 파악 디버깅', async ({ page }) => {
  // 로그인
  await page.goto('https://www.maslabs.kr/login');
  
  // 김탁수 계정으로 로그인
  await page.fill('input[name="phone"]', '010-6669-9000');
  await page.fill('input[name="password"]', '66699000');
  await page.click('button[type="submit"]');
  
  // 로그인 후 출근 관리 페이지로 이동
  await page.waitForURL('**/quick-task');
  await page.goto('https://www.maslabs.kr/attendance');
  
  console.log('=== 출근 관리 기능 근본 원인 파악 디버깅 시작 ===');
  
  // 페이지 로딩 확인
  await page.waitForLoadState('networkidle');
  
  // 1. 네트워크 요청 모니터링
  console.log('=== 1. 네트워크 요청 모니터링 ===');
  
  // 페이지 로드 후 네트워크 요청 확인
  await page.waitForTimeout(5000);
  
  const networkRequests = await page.evaluate(() => {
    return (window as any).performance?.getEntriesByType?.('resource') || [];
  });
  
  console.log('네트워크 요청 수:', networkRequests.length);
  
  // Supabase 관련 요청 찾기
  const supabaseRequests = networkRequests.filter((req: any) => 
    req.name?.includes('supabase') || req.name?.includes('schedules')
  );
  
  if (supabaseRequests.length > 0) {
    console.log('✅ Supabase 관련 요청 발견:', supabaseRequests.length, '개');
    supabaseRequests.forEach((req: any, index: number) => {
      console.log(`  ${index + 1}. ${req.name}`);
    });
  } else {
    console.log('❌ Supabase 관련 요청이 없습니다');
  }
  
  // 2. localStorage 상태 확인
  console.log('=== 2. localStorage 상태 확인 ===');
  
  const localStorageData = await page.evaluate(() => {
    return {
      isLoggedIn: localStorage.getItem('isLoggedIn'),
      currentEmployee: localStorage.getItem('currentEmployee'),
      hasCurrentEmployee: !!localStorage.getItem('currentEmployee')
    };
  });
  
  console.log('localStorage 상태:', localStorageData);
  
  if (localStorageData.hasCurrentEmployee) {
    console.log('✅ localStorage에 사용자 정보가 있습니다');
    
    try {
      const employeeData = JSON.parse(localStorageData.currentEmployee || '{}');
      console.log('사용자 데이터:', {
        id: employeeData.id,
        employee_id: employeeData.employee_id,
        name: employeeData.name
      });
    } catch (error) {
      console.log('❌ 사용자 데이터 파싱 오류:', error);
    }
  } else {
    console.log('❌ localStorage에 사용자 정보가 없습니다');
  }
  
  // 3. 페이지 소스에서 스케줄 데이터 확인
  console.log('=== 3. 페이지 소스에서 스케줄 데이터 확인 ===');
  
  const pageContent = await page.content();
  
  // 스케줄 관련 텍스트 검색
  const schedulePatterns = [
    /오늘 스케줄 수.*?(\d+)개/,
    /월간 기록 수.*?(\d+)개/,
    /스케줄.*?데이터/,
    /schedules.*?table/
  ];
  
  schedulePatterns.forEach(pattern => {
    const matches = pageContent.match(pattern);
    if (matches) {
      console.log(`✅ 패턴 발견: ${pattern.source}`, matches);
    } else {
      console.log(`❌ 패턴 누락: ${pattern.source}`);
    }
  });
  
  // 4. JavaScript 변수 상태 확인
  console.log('=== 4. JavaScript 변수 상태 확인 ===');
  
  const jsState = await page.evaluate(() => {
    return {
      hasCurrentUser: !!(window as any).currentUser,
      hasTodaySchedules: !!(window as any).todaySchedules,
      hasMonthlyRecords: !!(window as any).monthlyRecords,
      hasLoading: !!(window as any).loading,
      currentUserKeys: (window as any).currentUser ? Object.keys((window as any).currentUser) : [],
      todaySchedulesLength: (window as any).todaySchedules?.length || 0,
      monthlyRecordsLength: (window as any).monthlyRecords?.length || 0
    };
  });
  
  console.log('JavaScript 상태:', jsState);
  
  // 5. Supabase 클라이언트 상태 확인
  console.log('=== 5. Supabase 클라이언트 상태 확인 ===');
  
  const supabaseState = await page.evaluate(() => {
    return {
      hasSupabase: !!(window as any).supabase,
      hasAuth: !!(window as any).supabase?.auth,
      hasFrom: !!(window as any).supabase?.from,
      supabaseKeys: (window as any).supabase ? Object.keys((window as any).supabase) : []
    };
  });
  
  console.log('Supabase 상태:', supabaseState);
  
  // 6. 에러 및 경고 확인
  console.log('=== 6. 에러 및 경고 확인 ===');
  
  const consoleErrors = await page.evaluate(() => {
    return (window as any).jsErrors || [];
  });
  
  if (consoleErrors.length > 0) {
    console.log('JavaScript 오류:', consoleErrors);
  } else {
    console.log('JavaScript 오류가 없습니다.');
  }
  
  // 7. 스크린샷 저장
  console.log('=== 7. 스크린샷 저장 ===');
  await page.screenshot({ path: 'playwright-report/attendance-debug-test.png', fullPage: true });
  console.log('✅ 스크린샷이 저장되었습니다: playwright-report/attendance-debug-test.png');
  
  console.log('=== 출근 관리 기능 근본 원인 파악 디버깅 완료 ===');
});
