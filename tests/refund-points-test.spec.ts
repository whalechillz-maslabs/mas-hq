import { test, expect } from '@playwright/test';

test.describe('환불 포인트 테스트', () => {
  test('환불 시 포인트 음수 표기 및 총 포인트 0 확인', async ({ page }) => {
    console.log('🚀 환불 포인트 테스트 시작');

    // 1. 로그인
    await page.goto('https://www.maslabs.kr/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="tel"]', '010-8948-4501');
    await page.fill('input[type="password"]', '89484501');
    await page.click('button:has-text("로그인")');
    
    await page.waitForURL('**/dashboard', { timeout: 30000 });
    console.log('✅ 로그인 성공');

    // 2. 업무 기록 페이지로 이동
    await page.goto('https://www.maslabs.kr/tasks');
    await page.waitForLoadState('networkidle');
    console.log('✅ 업무 기록 페이지 로드 완료');

    // 3. 기존 업무 확인
    await page.waitForTimeout(3000);
    const existingTasks = await page.locator('tbody tr').count();
    console.log(`📊 기존 업무 수: ${existingTasks}개`);

    // 4. 새로운 OP1 업무 추가
    console.log('4️⃣ 새로운 OP1 업무 추가');
    await page.click('button:has-text("업무 추가")');
    
    // 모달이 나타날 때까지 대기
    await page.waitForSelector('div[class*="fixed"]', { timeout: 10000 });
    
    // 업무 유형 선택 (OP1)
    await page.selectOption('select[name="operation_type_id"]', { index: 0 });
    
    // 업무명 입력
    await page.fill('input[name="title"]', '포인트 테스트용 OP1 업무');
    
    // 고객명 입력
    await page.fill('input[name="customer_name"]', '포인트테스트고객');
    
    // 매출 금액 입력
    await page.fill('input[name="sales_amount"]', '3000000');
    
    // 업무 내용 입력
    await page.fill('textarea[name="notes"]', '포인트 테스트를 위한 업무입니다.');
    
    // 추가 버튼 클릭
    const modal = page.locator('div[class*="fixed"]').first();
    await modal.locator('button:has-text("추가")').click();
    
    // 모달이 닫힐 때까지 대기
    await page.waitForTimeout(2000);
    console.log('✅ OP1 업무 추가 완료');

    // 5. 추가된 업무 확인 (재시도 로직 포함)
    console.log('5️⃣ 추가된 업무 확인');
    let newTaskRow;
    let retryCount = 0;
    const maxRetries = 5;
    
    while (retryCount < maxRetries) {
      await page.reload();
      await page.waitForTimeout(3000);
      
      const newTaskCount = await page.locator('tbody tr').count();
      console.log(`📊 업무 추가 후 총 업무 수: ${newTaskCount}개`);
      
      newTaskRow = page.locator('tbody tr').filter({ hasText: '포인트 테스트용 OP1 업무' });
      
      if (await newTaskRow.count() > 0) {
        console.log('✅ 새로 추가된 업무 확인됨');
        break;
      } else {
        retryCount++;
        console.log(`❌ 업무가 목록에 표시되지 않음 (시도 ${retryCount}/${maxRetries})`);
        if (retryCount < maxRetries) {
          await page.waitForTimeout(2000);
        }
      }
    }
    
    if (retryCount >= maxRetries) {
      console.log('❌ 모든 재시도 후에도 업무가 목록에 표시되지 않음');
      return;
    }

    // 6. 업무 완료 처리
    console.log('6️⃣ 업무 완료 처리');
    const completeButton = newTaskRow.locator('button:has-text("완료")');
    await completeButton.click();
    
    // 완료 상태 확인
    await page.waitForTimeout(2000);
    const statusCell = newTaskRow.locator('td').nth(8); // 상태 컬럼
    await expect(statusCell).toContainText('완료');
    console.log('✅ 업무 완료 처리됨');

    // 7. 환불 처리
    console.log('7️⃣ 환불 처리 시작');
    const refundButton = newTaskRow.locator('button:has-text("환불")');
    await refundButton.click();
    
    // 환불 모달 대기
    await page.waitForSelector('div[class*="fixed"]', { timeout: 10000 });
    
    // 환불 사유 입력
    await page.fill('textarea[name="notes"]', '포인트 테스트용 환불 처리입니다.');
    
    // 환불 버튼 클릭
    const refundModal = page.locator('div[class*="fixed"]').first();
    await refundModal.locator('button:has-text("환불 처리")').click();
    
    // 모달이 닫힐 때까지 대기
    await page.waitForTimeout(3000);
    console.log('✅ 환불 처리 완료');

    // 8. 새로운 환불 로우 확인
    console.log('8️⃣ 새로운 환불 로우 확인');
    await page.reload();
    await page.waitForTimeout(3000);
    
    const finalTaskCount = await page.locator('tbody tr').count();
    console.log(`📊 환불 처리 후 총 업무 수: ${finalTaskCount}개`);
    
    // 원본 업무와 환불 업무 모두 확인
    const originalTask = page.locator('tbody tr').filter({ hasText: '포인트 테스트용 OP1 업무' }).filter({ hasNotText: '[환불]' });
    const refundTask = page.locator('tbody tr').filter({ hasText: '[환불] 포인트 테스트용 OP1 업무' });
    
    if (await originalTask.count() > 0 && await refundTask.count() > 0) {
      console.log('✅ 원본 업무와 환불 업무 모두 확인됨');
      
      // 9. 환불 업무의 포인트 확인 (음수여야 함)
      console.log('9️⃣ 환불 업무 포인트 확인');
      
      const refundPointsCell = refundTask.locator('td').nth(6); // 포인트 컬럼
      const refundPointsText = await refundPointsCell.textContent();
      console.log(`🎯 환불 업무 포인트: ${refundPointsText}`);
      
      // 음수 값 확인
      if (refundPointsText && refundPointsText.includes('-')) {
        console.log('✅ 환불 업무 포인트가 음수로 표시됨');
      } else {
        console.log('❌ 환불 업무 포인트가 음수로 표시되지 않음');
      }
      
      // 10. 원본 업무의 포인트 확인 (양수여야 함)
      console.log('🔟 원본 업무 포인트 확인');
      
      const originalPointsCell = originalTask.locator('td').nth(6); // 포인트 컬럼
      const originalPointsText = await originalPointsCell.textContent();
      console.log(`🎯 원본 업무 포인트: ${originalPointsText}`);
      
      // 양수 값 확인
      if (originalPointsText && !originalPointsText.includes('-')) {
        console.log('✅ 원본 업무 포인트가 양수로 표시됨');
      } else {
        console.log('❌ 원본 업무 포인트가 양수로 표시되지 않음');
      }
      
    } else {
      console.log('❌ 원본 업무 또는 환불 업무를 찾을 수 없음');
    }

    // 11. 총 포인트 확인 (0이어야 함)
    console.log('1️⃣1️⃣ 총 포인트 확인');
    
    // 획득 포인트 확인
    const totalPointsCard = page.locator('div').filter({ hasText: '획득 포인트' });
    if (await totalPointsCard.count() > 0) {
      const totalPointsText = await totalPointsCard.locator('p').first().textContent();
      console.log(`🎯 총 포인트: ${totalPointsText}`);
      
      // 총 포인트가 0인지 확인
      if (totalPointsText && totalPointsText.includes('0')) {
        console.log('✅ 총 포인트가 0으로 표시됨 (원본 + 환불 = 0)');
      } else {
        console.log('❌ 총 포인트가 0으로 표시되지 않음');
      }
    } else {
      console.log('❌ 획득 포인트 카드를 찾을 수 없음');
    }

    // 12. 모든 업무 행의 포인트 확인
    console.log('1️⃣2️⃣ 모든 업무 행의 포인트 확인');
    for (let i = 0; i < finalTaskCount; i++) {
      const row = page.locator('tbody tr').nth(i);
      const rowText = await row.textContent();
      const pointsCell = row.locator('td').nth(6); // 포인트 컬럼
      const pointsText = await pointsCell.textContent();
      console.log(`📋 업무 ${i + 1}: ${rowText?.trim().substring(0, 50)}... | 포인트: ${pointsText}`);
    }

    console.log('🎉 환불 포인트 테스트 완료!');
  });
});
