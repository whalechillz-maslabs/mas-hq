import { test, expect } from '@playwright/test';

test('네트워크 에러 확인 테스트', async ({ page }) => {
  console.log('🔍 네트워크 에러 확인 테스트 시작');
  
  // 네트워크 요청 모니터링 설정
  await page.route('**/*', async (route) => {
    try {
      await route.continue();
    } catch (error) {
      console.log('🚨 네트워크 요청 에러:', error);
    }
  });
  
  // 콘솔 에러 모니터링
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      console.log('🚨 콘솔 에러:', msg.text());
    }
  });
  
  // 페이지 에러 모니터링
  page.on('pageerror', (error) => {
    console.log('🚨 페이지 에러:', error.message);
  });
  
  // 1. 로그인 페이지로 이동
  await page.goto('http://localhost:3000/login');
  console.log('✅ 로그인 페이지 접속 완료');
  
  // 2. 로그인
  await page.click('text=전화번호');
  await page.fill('input[type="tel"]', '010-6669-9000');
  await page.fill('input[type="password"]', '66699000');
  await page.click('button[type="submit"]');
  console.log('✅ 로그인 완료');
  
  // 3. 대시보드 로딩 대기
  await page.waitForURL('**/dashboard');
  console.log('✅ 대시보드 로딩 완료');
  
  // 4. 페이지 로딩 대기
  await page.waitForTimeout(5000);
  
  // 5. 네트워크 요청 확인
  const networkRequests = await page.evaluate(() => {
    return (window as any).performance?.getEntriesByType('resource')?.map((entry: any) => ({
      name: entry.name,
      duration: entry.duration,
      transferSize: entry.transferSize,
      failed: entry.failed
    })) || [];
  });
  
  console.log('🌐 네트워크 요청 개수:', networkRequests.length);
  
  // 6. 실패한 요청 확인
  const failedRequests = networkRequests.filter((req: any) => req.failed);
  console.log('❌ 실패한 네트워크 요청:', failedRequests);
  
  // 7. Supabase 연결 확인
  const supabaseRequests = networkRequests.filter((req: any) => 
    req.name.includes('127.0.0.1:54321') || req.name.includes('localhost:54321')
  );
  console.log('🔗 Supabase 요청:', supabaseRequests);
  
  // 8. 근무 스케줄 페이지 접속
  await page.click('text=근무 스케줄');
  await page.waitForURL('**/schedules');
  console.log('✅ 스케줄 페이지 접속 완료');
  
  // 9. 추가 대기
  await page.waitForTimeout(3000);
  
  // 10. 스케줄 데이터 요청 확인
  const scheduleRequests = await page.evaluate(() => {
    return (window as any).performance?.getEntriesByType('resource')?.filter((entry: any) => 
      entry.name.includes('schedules') || entry.name.includes('supabase')
    ) || [];
  });
  
  console.log('📅 스케줄 관련 요청:', scheduleRequests);
  
  // 11. 스크린샷 캡처
  await page.screenshot({ path: 'network-error-check.png', fullPage: true });
  console.log('✅ 네트워크 에러 확인 테스트 스크린샷 캡처 완료');
  
  console.log('🎉 네트워크 에러 확인 테스트 완료!');
});
