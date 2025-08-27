import { test, expect } from '@playwright/test';

test.describe('원격 서버 OP1-4 업무 및 환불 테스트', () => {
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

  test('OP1-4 업무 추가 및 환불 테스트', async ({ page }) => {
    console.log('🔍 OP1-4 업무 및 환불 테스트 시작');
    
    // 업무 기록 페이지로 이동
    await page.goto('https://www.maslabs.kr/tasks');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ 업무 기록 페이지 접근 완료');
    
    // 기존 업무 확인
    const existingTasks = await page.locator('tbody tr').count();
    console.log(`📊 기존 업무 개수: ${existingTasks}`);
    
    // OP1-4 업무 추가 테스트
    const testTasks = [
      { code: 'OP1', name: '전화 판매(신규)', points: 20 },
      { code: 'OP2', name: '전화 판매(재구매)', points: 15 },
      { code: 'OP3', name: '오프라인 판매(신규)', points: 40 },
      { code: 'OP4', name: '오프라인 판매(재구매)', points: 30 }
    ];
    
    for (const task of testTasks) {
      console.log(`\n📝 ${task.code} 업무 추가 테스트`);
      
      // 업무 추가 버튼 클릭
      await page.click('button:has-text("업무 추가")');
      await page.waitForSelector('div[class*="fixed"]', { timeout: 10000 });
      
      const modal = page.locator('div[class*="fixed"]').first();
      
      // 업무 정보 입력
      const testTaskTitle = `${task.code} 테스트 업무 ${Date.now()}`;
      
      await modal.locator('input[name="task_date"]').fill('2025-08-27');
      
      // 업무 유형 선택 (OP1-4)
      const operationTypeSelect = modal.locator('select[name="operation_type_id"]');
      await operationTypeSelect.selectOption({ index: task.code === 'OP1' ? 1 : task.code === 'OP2' ? 2 : task.code === 'OP3' ? 3 : 4 });
      
      await modal.locator('input[name="title"]').fill(testTaskTitle);
      await modal.locator('textarea[name="notes"]').fill(`${task.code} 테스트용 업무`);
      await modal.locator('input[name="customer_name"]').fill('테스트 고객');
      await modal.locator('input[name="sales_amount"]').fill('1000000');
      await modal.locator('select[name="task_priority"]').selectOption('high');
      
      // 추가 버튼 클릭
      await modal.locator('button:has-text("추가")').click();
      await page.waitForLoadState('networkidle');
      
      console.log(`✅ ${task.code} 업무 추가 완료`);
      
      // 페이지 새로고침
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // 추가된 업무 확인
      const taskRow = page.locator('tr').filter({ hasText: testTaskTitle });
      const taskExists = await taskRow.count() > 0;
      
      if (taskExists) {
        console.log(`✅ ${task.code} 업무가 목록에 표시됨`);
        
        // 완료 버튼 클릭
        await taskRow.locator('button:has-text("완료")').click();
        await page.waitForLoadState('networkidle');
        
        console.log(`✅ ${task.code} 업무 완료 처리`);
        
        // 페이지 새로고침
        await page.reload();
        await page.waitForLoadState('networkidle');
        
        // 환불 버튼 확인 및 클릭
        const refundButton = taskRow.locator('button:has-text("환불")');
        const refundButtonExists = await refundButton.count() > 0;
        
        if (refundButtonExists) {
          console.log(`✅ ${task.code} 환불 버튼 존재`);
          
          // 환불 버튼 클릭
          await refundButton.click();
          await page.waitForTimeout(2000);
          
          // 환불 모달 확인
          const refundModal = page.locator('div[class*="fixed"]').first();
          const modalExists = await refundModal.count() > 0;
          
          if (modalExists) {
            console.log(`✅ ${task.code} 환불 모달 열림`);
            
            // 환불 정보 입력
            await refundModal.locator('input[name="task_date"]').fill('2025-08-27');
            await refundModal.locator('textarea[name="notes"]').fill(`${task.code} 환불 테스트`);
            await refundModal.locator('select[name="task_priority"]').selectOption('high');
            
            // 환불 처리 버튼 클릭
            await refundModal.locator('button:has-text("환불 처리")').click();
            await page.waitForLoadState('networkidle');
            
            console.log(`✅ ${task.code} 환불 처리 완료`);
            
            // 페이지 새로고침
            await page.reload();
            await page.waitForLoadState('networkidle');
            
            // 환불 상태 확인
            const refundedTask = page.locator('tr').filter({ hasText: testTaskTitle });
            const status = await refundedTask.locator('td:nth-child(8) span').textContent();
            
            if (status?.includes('환불')) {
              console.log(`✅ ${task.code} 환불 상태 확인됨: ${status}`);
            } else {
              console.log(`❌ ${task.code} 환불 상태 확인 실패: ${status}`);
            }
          } else {
            console.log(`❌ ${task.code} 환불 모달이 열리지 않음`);
          }
        } else {
          console.log(`❌ ${task.code} 환불 버튼이 없음`);
        }
      } else {
        console.log(`❌ ${task.code} 업무가 목록에 표시되지 않음`);
      }
    }
    
    // 최종 통계 확인
    const finalTasks = await page.locator('tbody tr').count();
    console.log(`\n📊 최종 업무 개수: ${finalTasks}`);
    
    // 스크린샷 캡처
    await page.screenshot({ 
      path: 'test-results/remote-op-refund-test-result.png',
      fullPage: true 
    });
    
    console.log('🎉 OP1-4 업무 및 환불 테스트 완료!');
  });
});
