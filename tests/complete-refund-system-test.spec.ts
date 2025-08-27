import { test, expect } from '@playwright/test';

test.describe('완전한 환불 시스템 테스트', () => {
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

  test('완전한 환불 시스템 테스트', async ({ page }) => {
    console.log('🔍 완전한 환불 시스템 테스트 시작');
    
    // 업무 기록 페이지로 이동
    await page.goto('https://www.maslabs.kr/tasks');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ 업무 기록 페이지 접근 완료');
    
    // 페이지 스크린샷 캡처
    await page.screenshot({ 
      path: 'test-results/complete-refund-test-initial.png',
      fullPage: true 
    });
    
    // 1. OP8 카드가 있는지 확인
    const op8Cards = page.locator('div').filter({ hasText: 'OP8' });
    const op8CardCount = await op8Cards.count();
    console.log('📊 OP8 카드 개수:', op8CardCount);
    expect(op8CardCount).toBeGreaterThan(0);
    console.log('✅ OP8 카드가 표시됨을 확인');
    
    // 2. OP8 카드 클릭하여 환불 설명 확인
    await op8Cards.first().click();
    await page.waitForTimeout(1000);
    
    const modal = page.locator('div[class*="fixed"]').first();
    const modalContent = await modal.textContent();
    console.log('📋 OP8 모달 내용:', modalContent?.substring(0, 300));
    
    // 환불 처리 방법이 포함되어 있는지 확인
    expect(modalContent).toContain('환불 처리 방법');
    console.log('✅ OP8 카드에 환불 처리 방법이 표시됨을 확인');
    
    // 모달 닫기
    const closeButton = modal.locator('button').filter({ hasText: '✕' });
    await closeButton.click();
    await page.waitForTimeout(1000);
    
    // 3. OP3 업무 추가
    await page.click('button:has-text("업무 추가")');
    await page.waitForSelector('div[class*="fixed"]', { timeout: 10000 });
    
    console.log('✅ 업무 추가 모달 열림');
    
    const addModal = page.locator('div[class*="fixed"]').first();
    
    // OP3 선택 (환불 테스트용)
    await addModal.locator('select[name="operation_type_id"]').selectOption('13353cf8-5a66-4b53-b954-793e584fefd0'); // OP3
    await addModal.locator('input[name="title"]').fill('완전한 환불 시스템 테스트 업무');
    await addModal.locator('textarea[name="notes"]').fill('환불 테스트를 위한 업무');
    await addModal.locator('input[name="customer_name"]').fill('테스트 고객');
    await addModal.locator('input[name="sales_amount"]').fill('5000000');
    await addModal.locator('select[name="task_priority"]').selectOption('high');
    
    await addModal.locator('button:has-text("추가")').click();
    await page.waitForLoadState('networkidle');
    
    console.log('✅ OP3 업무 추가 완료');
    
    // 페이지 새로고침으로 업무 목록 업데이트
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // 4. 업무 완료 처리
    await page.click('button:has-text("완료")');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ 업무 완료 처리');
    
    // 5. 환불 처리
    await page.click('button:has-text("환불")');
    await page.waitForSelector('div[class*="fixed"]', { timeout: 10000 });
    
    console.log('✅ 환불 모달 열림');
    
    const refundModal = page.locator('div[class*="fixed"]').first();
    await refundModal.locator('textarea[name="notes"]').fill('완전한 환불 시스템 테스트');
    await refundModal.locator('button:has-text("환불 처리")').click();
    await page.waitForLoadState('networkidle');
    
    console.log('✅ 환불 처리 완료');
    
    // 6. 환불된 업무 확인
    const refundedTask = page.locator('tr').filter({ hasText: '완전한 환불 시스템 테스트 업무' });
    const statusText = await refundedTask.locator('td').nth(7).textContent(); // 상태 컬럼
    console.log('📊 환불된 업무 상태:', statusText);
    expect(statusText).toContain('환불');
    console.log('✅ 업무가 환불 상태로 변경됨을 확인');
    
    // 7. 매출이 음수로 표시되는지 확인
    const salesText = await refundedTask.locator('td').nth(4).textContent(); // 매출 컬럼
    console.log('📊 환불된 업무 매출:', salesText);
    expect(salesText).toContain('-');
    console.log('✅ 매출이 음수로 표시됨을 확인');
    
    // 8. 점수가 음수로 계산되는지 확인
    const pointsText = await refundedTask.locator('td').nth(5).textContent(); // 포인트 컬럼
    console.log('📊 환불된 업무 점수:', pointsText);
    expect(pointsText).toContain('-');
    console.log('✅ 점수가 음수로 계산됨을 확인');
    
    // 9. 통계에서 환불이 반영되는지 확인
    const totalPointsElement = page.locator('p').filter({ hasText: '점' }).first();
    const totalPointsText = await totalPointsElement.textContent();
    console.log('📊 총 점수:', totalPointsText);
    expect(totalPointsText).toContain('-');
    console.log('✅ 총 점수에 환불이 반영됨을 확인');
    
    // 10. 상태 변경 버튼이 있는지 확인
    const statusButtons = page.locator('button:has-text("상태")');
    const statusButtonCount = await statusButtons.count();
    console.log('📊 상태 변경 버튼 개수:', statusButtonCount);
    expect(statusButtonCount).toBeGreaterThan(0);
    console.log('✅ 상태 변경 버튼이 표시됨을 확인');
    
    // 11. 수정 버튼이 있는지 확인
    const editButtons = page.locator('button[title="수정"]');
    const editButtonCount = await editButtons.count();
    console.log('📊 수정 버튼 개수:', editButtonCount);
    expect(editButtonCount).toBeGreaterThan(0);
    console.log('✅ 수정 버튼이 표시됨을 확인');
    
    // 최종 스크린샷
    await page.screenshot({ 
      path: 'test-results/complete-refund-test-final.png',
      fullPage: true 
    });
    
    console.log('🎉 완전한 환불 시스템 테스트 완료!');
  });
});
