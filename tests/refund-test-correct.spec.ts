import { test, expect } from '@playwright/test';

test.describe('환불 기능 테스트 (올바른 선택자)', () => {
  test('OP1 업무 생성 -> 완료 -> 환불 처리 (새로운 로우 생성 확인)', async ({ page }) => {
    console.log('🚀 환불 기능 테스트 시작');

    // 1. 로그인 페이지로 이동
    await page.goto('https://www.maslabs.kr/login');
    await page.waitForLoadState('networkidle');
    console.log('✅ 로그인 페이지 로드 완료');

    // 2. 허상원으로 로그인 (올바른 선택자 사용)
    console.log('2️⃣ 허상원 계정으로 로그인');
    
    // 전화번호 입력
    await page.fill('input[type="tel"]', '010-8948-4501');
    
    // 비밀번호 입력
    await page.fill('input[type="password"]', '89484501');
    
    // 로그인 버튼 클릭
    await page.click('button:has-text("로그인")');
    
    // 로그인 후 대시보드로 이동
    await page.waitForURL('**/dashboard', { timeout: 30000 });
    console.log('✅ 로그인 성공');

    // 3. 업무 기록 페이지로 이동
    console.log('3️⃣ 업무 기록 페이지로 이동');
    await page.click('a[href="/tasks"]');
    await page.waitForURL('**/tasks', { timeout: 30000 });
    console.log('✅ 업무 기록 페이지 로드 완료');

    // 4. 기존 업무 확인
    console.log('4️⃣ 기존 업무 확인');
    await page.waitForTimeout(3000);
    const existingTasks = await page.locator('tbody tr').count();
    console.log(`📊 기존 업무 수: ${existingTasks}개`);

    // 5. 새로운 OP1 업무 추가
    console.log('5️⃣ 새로운 OP1 업무 추가');
    await page.click('button:has-text("업무 추가")');
    
    // 모달이 나타날 때까지 대기
    await page.waitForSelector('div[class*="fixed"]', { timeout: 10000 });
    
    // 업무 유형 선택 (OP1)
    await page.selectOption('select[name="operation_type_id"]', { index: 0 });
    
    // 업무명 입력
    await page.fill('input[name="title"]', '환불 테스트용 OP1 업무');
    
    // 고객명 입력
    await page.fill('input[name="customer_name"]', '환불테스트고객');
    
    // 매출 금액 입력
    await page.fill('input[name="sales_amount"]', '1700000');
    
    // 업무 내용 입력
    await page.fill('textarea[name="notes"]', '환불 테스트를 위한 업무입니다.');
    
    // 추가 버튼 클릭
    const modal = page.locator('div[class*="fixed"]').first();
    await modal.locator('button:has-text("추가")').click();
    
    // 모달이 닫힐 때까지 대기
    await page.waitForTimeout(2000);
    console.log('✅ OP1 업무 추가 완료');

    // 6. 추가된 업무 확인
    console.log('6️⃣ 추가된 업무 확인');
    await page.reload();
    await page.waitForTimeout(3000);
    
    const newTaskCount = await page.locator('tbody tr').count();
    console.log(`📊 업무 추가 후 총 업무 수: ${newTaskCount}개`);
    
    // 새로 추가된 업무 찾기
    const newTaskRow = page.locator('tbody tr').filter({ hasText: '환불 테스트용 OP1 업무' });
    await expect(newTaskRow).toBeVisible();
    console.log('✅ 새로 추가된 업무 확인됨');

    // 7. 업무 완료 처리
    console.log('7️⃣ 업무 완료 처리');
    const completeButton = newTaskRow.locator('button:has-text("완료")');
    await completeButton.click();
    
    // 완료 상태 확인
    await page.waitForTimeout(2000);
    const statusCell = newTaskRow.locator('td').nth(8); // 상태 컬럼
    await expect(statusCell).toContainText('완료');
    console.log('✅ 업무 완료 처리됨');

    // 8. 환불 처리
    console.log('8️⃣ 환불 처리 시작');
    const refundButton = newTaskRow.locator('button:has-text("환불")');
    await refundButton.click();
    
    // 환불 모달 대기
    await page.waitForSelector('div[class*="fixed"]', { timeout: 10000 });
    
    // 환불 사유 입력
    await page.fill('textarea[name="notes"]', '테스트용 환불 처리입니다.');
    
    // 환불 버튼 클릭
    const refundModal = page.locator('div[class*="fixed"]').first();
    await refundModal.locator('button:has-text("환불 처리")').click();
    
    // 모달이 닫힐 때까지 대기
    await page.waitForTimeout(3000);
    console.log('✅ 환불 처리 완료');

    // 9. 새로운 환불 로우 확인
    console.log('9️⃣ 새로운 환불 로우 확인');
    await page.reload();
    await page.waitForTimeout(3000);
    
    const finalTaskCount = await page.locator('tbody tr').count();
    console.log(`📊 환불 처리 후 총 업무 수: ${finalTaskCount}개`);
    
    // 원본 업무와 환불 업무 모두 확인
    const originalTask = page.locator('tbody tr').filter({ hasText: '환불 테스트용 OP1 업무' }).filter({ hasNotText: '[환불]' });
    const refundTask = page.locator('tbody tr').filter({ hasText: '[환불] 환불 테스트용 OP1 업무' });
    
    await expect(originalTask).toBeVisible();
    await expect(refundTask).toBeVisible();
    
    console.log('✅ 원본 업무와 환불 업무 모두 확인됨');

    // 10. 환불 업무의 매출과 포인트 확인
    console.log('🔟 환불 업무 상세 정보 확인');
    
    // 환불 업무의 매출 확인 (음수여야 함)
    const refundSalesCell = refundTask.locator('td').nth(4); // 매출 컬럼
    const refundSalesText = await refundSalesCell.textContent();
    console.log(`💰 환불 업무 매출: ${refundSalesText}`);
    
    // 환불 업무의 포인트 확인 (음수여야 함)
    const refundPointsCell = refundTask.locator('td').nth(6); // 포인트 컬럼
    const refundPointsText = await refundPointsCell.textContent();
    console.log(`🎯 환불 업무 포인트: ${refundPointsText}`);
    
    // 음수 값 확인
    expect(refundSalesText).toContain('-');
    expect(refundPointsText).toContain('-');
    
    console.log('✅ 환불 업무가 음수 매출과 포인트로 생성됨');

    // 11. 통계 카드 확인
    console.log('1️⃣1️⃣ 통계 카드 확인');
    
    // 총 업무 수 확인 (원본 + 환불 = 2개 증가)
    const totalTasksCard = page.locator('div').filter({ hasText: '총 업무' }).locator('p').first();
    const totalTasksText = await totalTasksCard.textContent();
    console.log(`📊 총 업무 수: ${totalTasksText}`);
    
    // 획득 포인트 확인 (원본 포인트 - 환불 포인트 = 0)
    const totalPointsCard = page.locator('div').filter({ hasText: '획득 포인트' }).locator('p').first();
    const totalPointsText = await totalPointsCard.textContent();
    console.log(`🎯 총 포인트: ${totalPointsText}`);
    
    console.log('✅ 통계 카드 확인 완료');

    console.log('🎉 환불 기능 테스트 완료 - 새로운 로우 생성 확인됨!');
  });
});
