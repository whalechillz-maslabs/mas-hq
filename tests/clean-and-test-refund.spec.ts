import { test, expect } from '@playwright/test';

test.describe('환불 업무 정리 및 재테스트', () => {
  test('기존 환불 업무 삭제 후 새로운 환불 업무 생성', async ({ page }) => {
    console.log('🚀 환불 업무 정리 및 재테스트 시작');

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

    // 4. 기존 환불 업무 삭제
    console.log('4️⃣ 기존 환불 업무 삭제');
    for (let i = 0; i < existingTasks; i++) {
      const row = page.locator('tbody tr').nth(i);
      const rowText = await row.textContent();
      
      if (rowText?.includes('[환불]')) {
        console.log(`🗑️ 환불 업무 삭제: ${rowText?.trim().substring(0, 50)}...`);
        
        // 삭제 버튼 클릭
        const deleteButton = row.locator('button').last(); // 마지막 버튼이 삭제 버튼
        await deleteButton.click();
        
        // 확인 다이얼로그 처리
        page.on('dialog', dialog => dialog.accept());
        
        await page.waitForTimeout(2000);
        console.log('✅ 환불 업무 삭제 완료');
        break;
      }
    }

    // 5. 삭제 후 업무 목록 확인
    console.log('5️⃣ 삭제 후 업무 목록 확인');
    await page.reload();
    await page.waitForTimeout(3000);
    
    const afterDeleteTasks = await page.locator('tbody tr').count();
    console.log(`📊 삭제 후 업무 수: ${afterDeleteTasks}개`);

    // 6. 환불 가능한 업무 찾기
    console.log('6️⃣ 환불 가능한 업무 찾기');
    let refundableTask = null;
    
    for (let i = 0; i < afterDeleteTasks; i++) {
      const row = page.locator('tbody tr').nth(i);
      const rowText = await row.textContent();
      const statusCell = row.locator('td').nth(8); // 상태 컬럼
      const statusText = await statusCell.textContent();
      
      // 완료 상태이고 OP1-4인 업무 찾기
      if (statusText?.trim() === '완료' && 
          (rowText?.includes('OP1') || rowText?.includes('OP2') || rowText?.includes('OP3') || rowText?.includes('OP4'))) {
        refundableTask = row;
        console.log(`✅ 환불 가능한 업무 발견: ${rowText?.trim().substring(0, 50)}...`);
        break;
      }
    }
    
    if (!refundableTask) {
      console.log('❌ 환불 가능한 업무를 찾을 수 없음');
      
      // 7. 완료되지 않은 업무를 완료 처리
      console.log('7️⃣ 완료되지 않은 업무를 완료 처리');
      for (let i = 0; i < afterDeleteTasks; i++) {
        const row = page.locator('tbody tr').nth(i);
        const completeButton = row.locator('button:has-text("완료")');
        
        if (await completeButton.isVisible()) {
          console.log(`✅ 완료 버튼 발견 (업무 ${i + 1})`);
          await completeButton.click();
          await page.waitForTimeout(2000);
          
          // 다시 환불 가능한 업무 찾기
          for (let j = 0; j < afterDeleteTasks; j++) {
            const newRow = page.locator('tbody tr').nth(j);
            const newRowText = await newRow.textContent();
            const newStatusCell = newRow.locator('td').nth(8);
            const newStatusText = await newStatusCell.textContent();
            
            if (newStatusText?.trim() === '완료' && 
                (newRowText?.includes('OP1') || newRowText?.includes('OP2') || newRowText?.includes('OP3') || newRowText?.includes('OP4'))) {
              refundableTask = newRow;
              console.log(`✅ 환불 가능한 업무 발견: ${newRowText?.trim().substring(0, 50)}...`);
              break;
            }
          }
          break;
        }
      }
    }

    if (refundableTask) {
      // 8. 새로운 환불 처리
      console.log('8️⃣ 새로운 환불 처리 시작');
      const refundButton = refundableTask.locator('button:has-text("환불")');
      
      if (await refundButton.isVisible()) {
        await refundButton.click();
        
        // 환불 모달 대기
        await page.waitForSelector('div[class*="fixed"]', { timeout: 10000 });
        console.log('✅ 환불 모달 열림');
        
        // 9. 환불 금액 입력
        console.log('9️⃣ 환불 금액 입력');
        const refundAmountInput = page.locator('input[name="refund_amount"]');
        
        if (await refundAmountInput.isVisible()) {
          console.log('✅ 환불 금액 입력 필드 발견');
          
          // 환불 금액 입력 (원본 매출의 일부만 환불)
          await refundAmountInput.clear();
          await refundAmountInput.fill('40000');
          console.log('✅ 환불 금액 40,000원 입력');
          
        } else {
          console.log('❌ 환불 금액 입력 필드를 찾을 수 없음');
        }
        
        // 환불 사유 입력
        await page.fill('textarea[name="notes"]', '새로운 환불 테스트입니다.');
        
        // 환불 버튼 클릭
        const refundModal = page.locator('div[class*="fixed"]').first();
        await refundModal.locator('button:has-text("환불 처리")').click();
        
        // 모달이 닫힐 때까지 대기
        await page.waitForTimeout(3000);
        console.log('✅ 새로운 환불 처리 완료');

        // 10. 새로운 환불 업무 확인
        console.log('🔟 새로운 환불 업무 확인');
        await page.reload();
        await page.waitForTimeout(3000);
        
        const finalTaskCount = await page.locator('tbody tr').count();
        console.log(`📊 최종 업무 수: ${finalTaskCount}개`);
        
        // 11. 새로운 환불 업무 찾기 및 확인
        console.log('1️⃣1️⃣ 새로운 환불 업무 확인');
        const newRefundTask = page.locator('tbody tr').filter({ hasText: '[환불]' });
        
        if (await newRefundTask.count() > 0) {
          console.log('✅ 새로운 환불 업무 발견');
          
          // 새로운 환불 업무의 매출 확인 (음수여야 함)
          const newRefundSalesCell = newRefundTask.locator('td').nth(4); // 매출 컬럼
          const newRefundSalesText = await newRefundSalesCell.textContent();
          console.log(`💰 새로운 환불 업무 매출: ${newRefundSalesText}`);
          
          // 새로운 환불 업무의 포인트 확인 (음수여야 함)
          const newRefundPointsCell = newRefundTask.locator('td').nth(6); // 포인트 컬럼
          const newRefundPointsText = await newRefundPointsCell.textContent();
          console.log(`🎯 새로운 환불 업무 포인트: ${newRefundPointsText}`);
          
          // 음수 값 확인
          if (newRefundSalesText && newRefundSalesText.includes('-')) {
            console.log('✅ 새로운 환불 업무 매출이 음수로 표시됨');
          } else {
            console.log('❌ 새로운 환불 업무 매출이 음수로 표시되지 않음');
          }
          
          if (newRefundPointsText && newRefundPointsText.includes('-')) {
            console.log('✅ 새로운 환불 업무 포인트가 음수로 표시됨');
          } else {
            console.log('❌ 새로운 환불 업무 포인트가 음수로 표시되지 않음');
          }
          
        } else {
          console.log('❌ 새로운 환불 업무를 찾을 수 없음');
        }
        
        // 12. 환불 카운트 확인
        console.log('1️⃣2️⃣ 환불 카운트 확인');
        const refundCard = page.locator('div').filter({ hasText: '환불' });
        if (await refundCard.count() > 0) {
          const refundCount = await refundCard.locator('p').first().textContent();
          console.log(`📊 환불 카운트: ${refundCount}`);
          
          // 환불 카운트가 1인지 확인
          if (refundCount && refundCount.includes('1')) {
            console.log('✅ 환불 카운트가 올바르게 표시됨');
          } else {
            console.log('❌ 환불 카운트가 올바르게 표시되지 않음');
          }
        }
        
        // 13. 총 매출 확인
        console.log('1️⃣3️⃣ 총 매출 확인');
        const totalSalesCard = page.locator('div').filter({ hasText: '개인 매출' });
        if (await totalSalesCard.count() > 0) {
          const totalSalesText = await totalSalesCard.locator('p').first().textContent();
          console.log(`💰 총 매출: ${totalSalesText}`);
        }
        
        // 14. 모든 업무의 매출 확인
        console.log('1️⃣4️⃣ 모든 업무의 매출 확인');
        for (let i = 0; i < finalTaskCount; i++) {
          const row = page.locator('tbody tr').nth(i);
          const rowText = await row.textContent();
          const salesCell = row.locator('td').nth(4); // 매출 컬럼
          const salesText = await salesCell.textContent();
          const pointsCell = row.locator('td').nth(6); // 포인트 컬럼
          const pointsText = await pointsCell.textContent();
          console.log(`📋 업무 ${i + 1}: ${rowText?.trim().substring(0, 50)}... | 매출: ${salesText} | 포인트: ${pointsText}`);
        }
        
      } else {
        console.log('❌ 환불 버튼을 찾을 수 없음');
      }
    } else {
      console.log('❌ 환불 가능한 업무를 찾을 수 없음');
    }

    console.log('🎉 환불 업무 정리 및 재테스트 완료!');
  });
});
