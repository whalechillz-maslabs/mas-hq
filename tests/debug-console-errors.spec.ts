import { test, expect } from '@playwright/test';

test.describe('브라우저 콘솔 에러 확인', () => {
  test.beforeEach(async ({ page }) => {
    // 콘솔 로그 수집 시작
    page.on('console', msg => {
      console.log(`브라우저 콘솔: ${msg.type()}: ${msg.text()}`);
    });
    
    // 페이지 에러 수집
    page.on('pageerror', error => {
      console.log(`페이지 에러: ${error.message}`);
    });
    
    // 배포 서버로 접속
    await page.goto('https://www.maslabs.kr/login');
    
    // 관리자 로그인
    await page.fill('input[type="tel"]', '010-6669-9000');
    await page.fill('input[type="password"]', '66699000');
    await page.click('button[type="submit"]');
    
    // 대시보드 로딩 대기
    await page.waitForURL('**/dashboard', { timeout: 15000 });
  });

  test('업무 추가 시 콘솔 에러 확인', async ({ page }) => {
    console.log('🔍 업무 추가 시 콘솔 에러 확인 시작');
    
    // 업무 기록 페이지로 이동
    await page.goto('https://www.maslabs.kr/tasks');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ 업무 기록 페이지 접근 완료');
    
    // 1. 업무 추가 모달 열기
    await page.click('button:has-text("업무 추가")');
    await page.waitForSelector('div[class*="fixed"]', { timeout: 10000 });
    
    console.log('✅ 업무 추가 모달 열림');
    
    const modal = page.locator('div[class*="fixed"]').first();
    
    // 2. 업무 정보 입력
    const testTaskTitle = `콘솔 에러 테스트 업무 ${Date.now()}`;
    
    // 날짜 입력
    await modal.locator('input[name="task_date"]').fill('2025-08-27');
    
    // 업무 유형 선택 (OP3)
    await modal.locator('select[name="operation_type_id"]').selectOption('13353cf8-5a66-4b53-b954-793e584fefd0');
    
    // 업무명 입력
    await modal.locator('input[name="title"]').fill(testTaskTitle);
    
    // 설명 입력
    await modal.locator('textarea[name="notes"]').fill('콘솔 에러 확인용 업무');
    
    // 고객명 입력
    await modal.locator('input[name="customer_name"]').fill('테스트 고객');
    
    // 매출 금액 입력
    await modal.locator('input[name="sales_amount"]').fill('1000000');
    
    // 우선순위 선택
    await modal.locator('select[name="task_priority"]').selectOption('high');
    
    console.log('✅ 업무 정보 입력 완료');
    
    // 3. 추가 버튼 클릭 (에러 확인)
    await modal.locator('button:has-text("추가")').click();
    
    // 잠시 대기하여 에러 메시지 수집
    await page.waitForTimeout(3000);
    
    console.log('✅ 추가 버튼 클릭 완료');
    
    // 4. 네트워크 요청 확인
    const networkRequests = await page.evaluate(() => {
      return window.performance.getEntriesByType('resource')
        .filter(entry => entry.name.includes('supabase'))
        .map(entry => ({
          name: entry.name,
          duration: entry.duration,
          transferSize: entry.transferSize
        }));
    });
    
    console.log('📊 Supabase 네트워크 요청:', networkRequests);
    
    // 5. 페이지 새로고침
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // 6. 업무가 추가되었는지 확인
    const taskRows = page.locator('tbody tr');
    const taskCount = await taskRows.count();
    console.log('📊 최종 업무 개수:', taskCount);
    
    // 7. 스크린샷 캡처
    await page.screenshot({ 
      path: 'test-results/debug-console-errors-result.png',
      fullPage: true 
    });
    
    console.log('🎉 콘솔 에러 확인 완료!');
  });
});
