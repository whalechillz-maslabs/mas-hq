import { test, expect } from '@playwright/test';

test.describe('업무 추가 데이터베이스 입력 문제 진단', () => {
  test.beforeEach(async ({ page }) => {
    // 배포 서버로 접속
    await page.goto('https://www.maslabs.kr/login');
    
    // 관리자 로그인
    await page.fill('input[type="tel"]', '010-6669-9000');
    await page.fill('input[type="password"]', '66699000');
    await page.click('button[type="submit"]');
    
    // 대시보드 로딩 대기
    await page.waitForURL('**/dashboard', { timeout: 15000 });
  });

  test('업무 추가 후 데이터베이스 입력 확인', async ({ page }) => {
    console.log('🔍 업무 추가 데이터베이스 입력 문제 진단 시작');
    
    // 업무 기록 페이지로 이동
    await page.goto('https://www.maslabs.kr/tasks');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ 업무 기록 페이지 접근 완료');
    
    // 초기 업무 개수 확인
    const initialTaskRows = page.locator('tbody tr');
    const initialTaskCount = await initialTaskRows.count();
    console.log('📊 초기 업무 개수:', initialTaskCount);
    
    // 1. 업무 추가 모달 열기
    await page.click('button:has-text("업무 추가")');
    await page.waitForSelector('div[class*="fixed"]', { timeout: 10000 });
    
    console.log('✅ 업무 추가 모달 열림');
    
    const modal = page.locator('div[class*="fixed"]').first();
    
    // 2. 업무 정보 입력
    const testTaskTitle = `테스트 업무 ${Date.now()}`; // 고유한 제목
    
    // 날짜 입력
    await modal.locator('input[name="task_date"]').fill('2025-08-27');
    
    // 업무 유형 선택 (OP3)
    await modal.locator('select[name="operation_type_id"]').selectOption('13353cf8-5a66-4b53-b954-793e584fefd0');
    
    // 업무명 입력
    await modal.locator('input[name="title"]').fill(testTaskTitle);
    
    // 설명 입력
    await modal.locator('textarea[name="notes"]').fill('데이터베이스 입력 테스트용 업무');
    
    // 고객명 입력
    await modal.locator('input[name="customer_name"]').fill('테스트 고객');
    
    // 매출 금액 입력
    await modal.locator('input[name="sales_amount"]').fill('1000000');
    
    // 우선순위 선택
    await modal.locator('select[name="task_priority"]').selectOption('high');
    
    console.log('✅ 업무 정보 입력 완료');
    
    // 3. 추가 버튼 클릭
    await modal.locator('button:has-text("추가")').click();
    await page.waitForLoadState('networkidle');
    
    console.log('✅ 추가 버튼 클릭 완료');
    
    // 4. 페이지 새로고침으로 업무 목록 업데이트
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    console.log('✅ 페이지 새로고침 완료');
    
    // 5. 업무가 추가되었는지 확인
    const finalTaskRows = page.locator('tbody tr');
    const finalTaskCount = await finalTaskRows.count();
    console.log('📊 최종 업무 개수:', finalTaskCount);
    
    // 6. 추가된 업무 찾기
    const addedTask = page.locator('tr').filter({ hasText: testTaskTitle });
    const addedTaskCount = await addedTask.count();
    console.log('📊 추가된 업무 개수:', addedTaskCount);
    
    if (addedTaskCount > 0) {
      console.log('✅ 업무가 성공적으로 추가됨');
      
      // 추가된 업무의 상세 정보 확인
      const taskTitle = await addedTask.locator('td').nth(2).textContent();
      const taskStatus = await addedTask.locator('td').nth(7).textContent();
      const taskSales = await addedTask.locator('td').nth(4).textContent();
      
      console.log('📋 추가된 업무 정보:');
      console.log('  - 제목:', taskTitle);
      console.log('  - 상태:', taskStatus);
      console.log('  - 매출:', taskSales);
      
      expect(taskTitle).toContain(testTaskTitle);
      expect(taskStatus).toContain('대기');
      expect(taskSales).toContain('1,000,000');
      
    } else {
      console.log('❌ 업무가 추가되지 않음');
      
      // 에러 메시지 확인
      const errorMessages = page.locator('div').filter({ hasText: /error|Error|오류|실패/ });
      const errorCount = await errorMessages.count();
      console.log('📊 에러 메시지 개수:', errorCount);
      
      if (errorCount > 0) {
        for (let i = 0; i < errorCount; i++) {
          const errorText = await errorMessages.nth(i).textContent();
          console.log(`📋 에러 메시지 ${i+1}:`, errorText);
        }
      }
      
      // 콘솔 로그 확인
      const consoleLogs = await page.evaluate(() => {
        return window.console.logs || [];
      });
      console.log('📋 콘솔 로그:', consoleLogs);
    }
    
    // 7. 통계 업데이트 확인
    const totalTasksElement = page.locator('p').filter({ hasText: '건' }).first();
    const totalTasksText = await totalTasksElement.textContent();
    console.log('📊 총 업무 수:', totalTasksText);
    
    // 8. 스크린샷 캡처
    await page.screenshot({ 
      path: 'test-results/debug-task-insertion-result.png',
      fullPage: true 
    });
    
    console.log('🎉 업무 추가 데이터베이스 입력 문제 진단 완료!');
  });
});
