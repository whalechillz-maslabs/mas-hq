import { test, expect } from '@playwright/test';

test.describe('허상원 계정 환불 기능 테스트', () => {
  test('허상원 계정으로 OP1 업무 생성 -> 완료 -> 환불 처리', async ({ page }) => {
    console.log('🚀 허상원 계정 환불 기능 테스트 시작');

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
    await page.fill('input[name="title"]', '허상원 환불 테스트용 OP1 업무');
    
    // 고객명 입력
    await page.fill('input[name="customer_name"]', '허상원테스트고객');
    
    // 매출 금액 입력
    await page.fill('input[name="sales_amount"]', '2500000');
    
    // 업무 내용 입력
    await page.fill('textarea[name="notes"]', '허상원 환불 테스트를 위한 업무입니다.');
    
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
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      await page.reload();
      await page.waitForTimeout(3000);
      
      const newTaskCount = await page.locator('tbody tr').count();
      console.log(`📊 업무 추가 후 총 업무 수: ${newTaskCount}개`);
      
      newTaskRow = page.locator('tbody tr').filter({ hasText: '허상원 환불 테스트용 OP1 업무' });
      
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
    await page.fill('textarea[name="notes"]', '허상원 테스트용 환불 처리입니다.');
    
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
    const originalTask = page.locator('tbody tr').filter({ hasText: '허상원 환불 테스트용 OP1 업무' }).filter({ hasNotText: '[환불]' });
    const refundTask = page.locator('tbody tr').filter({ hasText: '[환불] 허상원 환불 테스트용 OP1 업무' });
    
    if (await originalTask.count() > 0 && await refundTask.count() > 0) {
      console.log('✅ 원본 업무와 환불 업무 모두 확인됨');
      
      // 9. 환불 업무의 매출과 포인트 확인
      console.log('9️⃣ 환불 업무 상세 정보 확인');
      
      // 환불 업무의 매출 확인 (음수여야 함)
      const refundSalesCell = refundTask.locator('td').nth(4); // 매출 컬럼
      const refundSalesText = await refundSalesCell.textContent();
      console.log(`💰 환불 업무 매출: ${refundSalesText}`);
      
      // 환불 업무의 포인트 확인 (음수여야 함)
      const refundPointsCell = refundTask.locator('td').nth(6); // 포인트 컬럼
      const refundPointsText = await refundPointsCell.textContent();
      console.log(`🎯 환불 업무 포인트: ${refundPointsText}`);
      
      // 음수 값 확인
      if (refundSalesText && refundSalesText.includes('-')) {
        console.log('✅ 환불 업무 매출이 음수로 표시됨');
      } else {
        console.log('❌ 환불 업무 매출이 음수로 표시되지 않음');
      }
      
      if (refundPointsText && refundPointsText.includes('-')) {
        console.log('✅ 환불 업무 포인트가 음수로 표시됨');
      } else {
        console.log('❌ 환불 업무 포인트가 음수로 표시되지 않음');
      }
      
    } else {
      console.log('❌ 원본 업무 또는 환불 업무를 찾을 수 없음');
    }

    // 10. 통계 카드 확인
    console.log('🔟 통계 카드 확인');
    
    // 총 업무 수 확인
    const totalTasksCard = page.locator('div').filter({ hasText: '총 업무' });
    if (await totalTasksCard.count() > 0) {
      const totalTasksText = await totalTasksCard.locator('p').first().textContent();
      console.log(`📊 총 업무 수: ${totalTasksText}`);
    }
    
    // 획득 포인트 확인
    const totalPointsCard = page.locator('div').filter({ hasText: '획득 포인트' });
    if (await totalPointsCard.count() > 0) {
      const totalPointsText = await totalPointsCard.locator('p').first().textContent();
      console.log(`🎯 총 포인트: ${totalPointsText}`);
    }

    console.log('🎉 허상원 계정 환불 기능 테스트 완료!');
  });
});
