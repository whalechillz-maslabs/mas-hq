import { test, expect } from '@playwright/test';

test.describe('수량 필드 제거 후 업무 추가 및 환불 처리 테스트', () => {
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

  test('수량 필드 제거 확인 및 환불 처리 테스트', async ({ page }) => {
    console.log('🔍 수량 필드 제거 후 업무 추가 및 환불 처리 테스트 시작');
    
    // 업무 기록 페이지로 이동
    await page.goto('https://www.maslabs.kr/tasks');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ 업무 기록 페이지 접근 완료');
    
    // 페이지 스크린샷 캡처
    await page.screenshot({ 
      path: 'test-results/quantity-removed-test-initial.png',
      fullPage: true 
    });
    
    // 1. 업무 추가 모달 열기
    await page.click('button:has-text("업무 추가")');
    await page.waitForSelector('div[class*="fixed"]', { timeout: 10000 });
    
    console.log('✅ 업무 추가 모달 열림');
    
    const modal = page.locator('div[class*="fixed"]').first();
    
    // 2. 수량 필드가 없는지 확인
    const quantityField = modal.locator('input[name="quantity"]');
    const quantityFieldCount = await quantityField.count();
    console.log('📊 수량 필드 개수:', quantityFieldCount);
    expect(quantityFieldCount).toBe(0);
    console.log('✅ 수량 필드가 제거됨을 확인');
    
    // 3. OP3 업무 추가
    await modal.locator('select[name="operation_type_id"]').selectOption('13353cf8-5a66-4b53-b954-793e584fefd0'); // OP3
    await modal.locator('input[name="title"]').fill('수량 필드 제거 테스트 업무');
    await modal.locator('textarea[name="notes"]').fill('수량 필드가 제거된 상태에서 추가된 업무');
    await modal.locator('input[name="customer_name"]').fill('테스트 고객');
    await modal.locator('input[name="sales_amount"]').fill('2000000');
    await modal.locator('select[name="task_priority"]').selectOption('high');
    
    await modal.locator('button:has-text("추가")').click();
    await page.waitForLoadState('networkidle');
    
    console.log('✅ OP3 업무 추가 완료');
    
    // 4. 업무 완료 처리
    await page.click('button:has-text("완료")');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ 업무 완료 처리');
    
    // 5. 환불 처리
    await page.click('button:has-text("환불")');
    await page.waitForSelector('div[class*="fixed"]', { timeout: 10000 });
    
    console.log('✅ 환불 모달 열림');
    
    const refundModal = page.locator('div[class*="fixed"]').first();
    await refundModal.locator('textarea[name="notes"]').fill('수량 필드 제거 후 환불 테스트');
    await refundModal.locator('button:has-text("환불 처리")').click();
    await page.waitForLoadState('networkidle');
    
    console.log('✅ 환불 처리 완료');
    
    // 6. 환불된 업무의 점수 확인
    const refundTask = page.locator('tr').filter({ hasText: '환불 처리' });
    const pointsText = await refundTask.locator('td').nth(6).textContent();
    console.log('📊 환불된 업무 점수:', pointsText);
    
    // 점수가 음수인지 확인
    expect(pointsText).toContain('-');
    console.log('✅ 환불된 업무 점수가 음수임을 확인');
    
    // 7. 상태 변경 버튼 확인
    const completeButtons = page.locator('button:has-text("완료")');
    const completeButtonCount = await completeButtons.count();
    console.log('✅ 완료 버튼 개수:', completeButtonCount);
    
    // 8. 삭제 버튼 확인
    const deleteButtons = page.locator('button[title="삭제"]');
    const deleteButtonCount = await deleteButtons.count();
    console.log('🗑️ 삭제 버튼 개수:', deleteButtonCount);
    
    // 최종 스크린샷
    await page.screenshot({ 
      path: 'test-results/quantity-removed-test-final.png',
      fullPage: true 
    });
    
    console.log('🎉 수량 필드 제거 후 업무 추가 및 환불 처리 테스트 완료!');
  });
});
