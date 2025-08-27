import { test, expect } from '@playwright/test';

test.describe('액션 버튼 문제 진단', () => {
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

  test('액션 버튼 문제 진단', async ({ page }) => {
    console.log('🔍 액션 버튼 문제 진단 시작');
    
    // 업무 기록 페이지로 이동
    await page.goto('https://www.maslabs.kr/tasks');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ 업무 기록 페이지 접근 완료');
    
    // 1. 업무 추가
    await page.click('button:has-text("업무 추가")');
    await page.waitForSelector('div[class*="fixed"]', { timeout: 10000 });
    
    const modal = page.locator('div[class*="fixed"]').first();
    
    // 업무 정보 입력
    const testTaskTitle = `액션 버튼 테스트 업무 ${Date.now()}`;
    
    await modal.locator('input[name="task_date"]').fill('2025-08-27');
    await modal.locator('select[name="operation_type_id"]').selectOption('13353cf8-5a66-4b53-b954-793e584fefd0'); // OP3
    await modal.locator('input[name="title"]').fill(testTaskTitle);
    await modal.locator('textarea[name="notes"]').fill('액션 버튼 테스트용 업무');
    await modal.locator('input[name="customer_name"]').fill('테스트 고객');
    await modal.locator('input[name="sales_amount"]').fill('2000000');
    await modal.locator('select[name="task_priority"]').selectOption('high');
    
    await modal.locator('button:has-text("추가")').click();
    await page.waitForLoadState('networkidle');
    
    console.log('✅ 업무 추가 완료');
    
    // 페이지 새로고침
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // 2. 업무 완료 처리
    await page.click('button:has-text("완료")');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ 업무 완료 처리');
    
    // 3. 액션 버튼들 확인
    const taskRow = page.locator('tr').filter({ hasText: testTaskTitle });
    const actionButtons = taskRow.locator('td:last-child button');
    const actionButtonCount = await actionButtons.count();
    
    console.log('📊 액션 버튼 개수:', actionButtonCount);
    
    // 각 액션 버튼 확인
    for (let i = 0; i < actionButtonCount; i++) {
      const button = actionButtons.nth(i);
      const buttonText = await button.textContent();
      const buttonTitle = await button.getAttribute('title');
      console.log(`📋 액션 버튼 ${i+1}: "${buttonText}" (title: "${buttonTitle}")`);
    }
    
    // 4. 수정 버튼 확인
    const editButtons = page.locator('button[title="수정"]');
    const editButtonCount = await editButtons.count();
    console.log('📊 수정 버튼 개수:', editButtonCount);
    
    if (editButtonCount > 0) {
      console.log('✅ 수정 버튼 존재');
    } else {
      console.log('❌ 수정 버튼 없음');
    }
    
    // 5. 환불 버튼 확인 및 클릭
    const refundButtons = page.locator('button:has-text("환불")');
    const refundButtonCount = await refundButtons.count();
    console.log('📊 환불 버튼 개수:', refundButtonCount);
    
    if (refundButtonCount > 0) {
      console.log('✅ 환불 버튼 존재');
      
      // 환불 버튼 클릭
      await refundButtons.first().click();
      await page.waitForTimeout(2000);
      
      // 환불 모달 확인
      const refundModal = page.locator('div[class*="fixed"]').first();
      const modalCount = await refundModal.count();
      console.log('📊 환불 모달 개수:', modalCount);
      
      if (modalCount > 0) {
        console.log('✅ 환불 모달 열림');
        
        // 환불 모달 내용 확인
        const modalContent = await refundModal.textContent();
        console.log('📋 환불 모달 내용:', modalContent?.substring(0, 200));
        
        // 환불 처리 버튼 클릭
        const refundProcessButton = refundModal.locator('button:has-text("환불 처리")');
        if (await refundProcessButton.count() > 0) {
          await refundProcessButton.click();
          await page.waitForLoadState('networkidle');
          console.log('✅ 환불 처리 버튼 클릭 완료');
        } else {
          console.log('❌ 환불 처리 버튼 없음');
        }
      } else {
        console.log('❌ 환불 모달이 열리지 않음');
      }
    } else {
      console.log('❌ 환불 버튼 없음');
    }
    
    // 6. 스크린샷 캡처
    await page.screenshot({ 
      path: 'test-results/debug-action-buttons-result.png',
      fullPage: true 
    });
    
    console.log('🎉 액션 버튼 문제 진단 완료!');
  });
});
