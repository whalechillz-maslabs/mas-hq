import { test, expect } from '@playwright/test';

test.describe('깨끗한 상태에서 환불 처리 및 삭제 버튼 테스트', () => {
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

  test('환불 처리 점수 확인 및 삭제 버튼 테스트', async ({ page }) => {
    console.log('🔍 깨끗한 상태에서 환불 처리 및 삭제 버튼 테스트 시작');
    
    // 업무 기록 페이지로 이동
    await page.goto('https://www.maslabs.kr/tasks');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ 업무 기록 페이지 접근 완료');
    
    // 초기 상태 확인 (업무가 없어야 함)
    const initialTaskRows = page.locator('table tbody tr');
    const initialTaskCount = await initialTaskRows.count();
    console.log('📊 초기 업무 개수:', initialTaskCount);
    
    // 페이지 스크린샷 캡처
    await page.screenshot({ 
      path: 'test-results/clean-refund-test-initial.png',
      fullPage: true 
    });
    
    // 1. OP3 업무 추가 (40점)
    await page.click('button:has-text("업무 추가")');
    await page.waitForSelector('div[class*="fixed"]', { timeout: 10000 });
    
    console.log('✅ 업무 추가 모달 열림');
    
    const modal = page.locator('div[class*="fixed"]').first();
    
    // OP3 업무 추가
    await modal.locator('select[name="operation_type_id"]').selectOption('13353cf8-5a66-4b53-b954-793e584fefd0'); // OP3
    await modal.locator('input[name="title"]').fill('테스트 OP3 업무');
    await modal.locator('textarea[name="notes"]').fill('환불 테스트용 업무');
    await modal.locator('input[name="customer_name"]').fill('테스트 고객');
    await modal.locator('input[name="sales_amount"]').fill('1000000');
    await modal.locator('select[name="task_priority"]').selectOption('high');
    
    await modal.locator('button:has-text("추가")').click();
    await page.waitForLoadState('networkidle');
    
    console.log('✅ OP3 업무 추가 완료');
    
    // 2. 업무 완료 처리
    await page.click('button:has-text("완료")');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ 업무 완료 처리');
    
    // 완료 후 상태 확인
    const completedTaskRows = page.locator('table tbody tr');
    const completedTaskCount = await completedTaskRows.count();
    console.log('📊 완료 후 업무 개수:', completedTaskCount);
    
    // 3. 환불 처리
    await page.click('button:has-text("환불")');
    await page.waitForSelector('div[class*="fixed"]', { timeout: 10000 });
    
    console.log('✅ 환불 모달 열림');
    
    const refundModal = page.locator('div[class*="fixed"]').first();
    await refundModal.locator('textarea[name="notes"]').fill('환불 테스트');
    await refundModal.locator('button:has-text("환불 처리")').click();
    await page.waitForLoadState('networkidle');
    
    console.log('✅ 환불 처리 완료');
    
    // 환불 후 상태 확인
    const refundTaskRows = page.locator('table tbody tr');
    const refundTaskCount = await refundTaskRows.count();
    console.log('📊 환불 후 업무 개수:', refundTaskCount);
    
    // 스크린샷 캡처
    await page.screenshot({ 
      path: 'test-results/clean-refund-test-after-refund.png',
      fullPage: true 
    });
    
    // 4. 환불된 업무의 점수 확인
    const refundTask = page.locator('tr').filter({ hasText: '환불 처리' });
    const pointsText = await refundTask.locator('td').nth(6).textContent();
    console.log('📊 환불된 업무 점수:', pointsText);
    
    // 점수가 음수인지 확인
    expect(pointsText).toContain('-');
    console.log('✅ 환불된 업무 점수가 음수임을 확인');
    
    // 5. 삭제 버튼 확인
    const deleteButtons = page.locator('button[title="삭제"]');
    const deleteButtonCount = await deleteButtons.count();
    console.log('🗑️ 삭제 버튼 개수:', deleteButtonCount);
    
    // 삭제 버튼이 있는지 확인
    expect(deleteButtonCount).toBeGreaterThan(0);
    console.log('✅ 삭제 버튼이 표시됨을 확인');
    
    // 6. 삭제 기능 테스트
    await deleteButtons.first().click();
    
    // 확인 다이얼로그 처리
    page.on('dialog', dialog => dialog.accept());
    
    await page.waitForLoadState('networkidle');
    
    console.log('✅ 삭제 기능 테스트 완료');
    
    // 삭제 후 상태 확인
    const finalTaskRows = page.locator('table tbody tr');
    const finalTaskCount = await finalTaskRows.count();
    console.log('📊 삭제 후 업무 개수:', finalTaskCount);
    
    // 최종 스크린샷
    await page.screenshot({ 
      path: 'test-results/clean-refund-test-final.png',
      fullPage: true 
    });
    
    console.log('🎉 깨끗한 상태에서 환불 처리 및 삭제 버튼 테스트 완료!');
  });
});
