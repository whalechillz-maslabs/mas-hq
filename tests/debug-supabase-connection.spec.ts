import { test, expect } from '@playwright/test';

test.describe('Supabase 연결 디버깅', () => {
  test.beforeEach(async ({ page }) => {
    // 콘솔 로그 수집 시작
    page.on('console', msg => {
      console.log(`브라우저 콘솔: ${msg.type()}: ${msg.text()}`);
    });
    
    // 페이지 에러 수집
    page.on('pageerror', error => {
      console.log(`페이지 에러: ${error.message}`);
    });
    
    // 네트워크 요청 모니터링
    page.on('request', request => {
      console.log(`요청: ${request.method()} ${request.url()}`);
    });
    
    page.on('response', response => {
      if (response.status() >= 400) {
        console.log(`응답 에러: ${response.status()} ${response.url()}`);
        console.log(`응답 헤더:`, response.headers());
      }
    });
    
    // 원격 서버로 접속
    await page.goto('https://www.maslabs.kr/login');
    
    // 관리자 로그인
    await page.fill('input[type="tel"]', '010-6669-9000');
    await page.fill('input[type="password"]', '66699000');
    await page.click('button[type="submit"]');
    
    // 대시보드 로딩 대기
    await page.waitForURL('**/dashboard', { timeout: 15000 });
  });

  test('Supabase 연결 상태 확인', async ({ page }) => {
    console.log('🔍 Supabase 연결 상태 확인 시작');
    
    // 업무 기록 페이지로 이동
    await page.goto('https://www.maslabs.kr/tasks');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ 업무 기록 페이지 접근 완료');
    
    // 브라우저 콘솔에서 Supabase 객체 확인
    const supabaseStatus = await page.evaluate(() => {
      // @ts-ignore
      if (window.supabase) {
        return {
          exists: true,
          url: window.supabase.supabaseUrl,
          key: window.supabase.supabaseKey ? 'exists' : 'missing'
        };
      } else {
        return { exists: false };
      }
    });
    
    console.log('Supabase 상태:', supabaseStatus);
    
    // 간단한 업무 추가 테스트
    console.log('📝 간단한 업무 추가 테스트');
    
    // 업무 추가 버튼 클릭
    await page.click('button:has-text("업무 추가")');
    await page.waitForSelector('div[class*="fixed"]', { timeout: 10000 });
    
    const modal = page.locator('div[class*="fixed"]').first();
    
    // 최소한의 정보만 입력
    const testTaskTitle = `연결 테스트 ${Date.now()}`;
    
    await modal.locator('input[name="task_date"]').fill('2025-08-27');
    await modal.locator('select[name="operation_type_id"]').selectOption({ index: 1 });
    await modal.locator('input[name="title"]').fill(testTaskTitle);
    await modal.locator('textarea[name="notes"]').fill('연결 테스트');
    await modal.locator('input[name="customer_name"]').fill('테스트');
    await modal.locator('input[name="sales_amount"]').fill('1000');
    
    // 추가 버튼 클릭 전에 잠시 대기
    await page.waitForTimeout(2000);
    
    // 추가 버튼 클릭
    await modal.locator('button:has-text("추가")').click();
    
    // 응답 대기
    await page.waitForTimeout(5000);
    
    // 페이지 새로고침
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // 추가된 업무 확인
    const taskRow = page.locator('tr').filter({ hasText: testTaskTitle });
    const taskExists = await taskRow.count() > 0;
    
    if (taskExists) {
      console.log('✅ 업무가 성공적으로 추가됨');
    } else {
      console.log('❌ 업무 추가 실패');
      
      // 네트워크 요청 로그 확인
      const networkLogs = await page.evaluate(() => {
        // @ts-ignore
        return window.networkLogs || [];
      });
      
      console.log('네트워크 로그:', networkLogs);
    }
    
    // 스크린샷 캡처
    await page.screenshot({ 
      path: 'test-results/supabase-connection-debug.png',
      fullPage: true 
    });
    
    console.log('🎉 Supabase 연결 디버깅 완료!');
  });
});
