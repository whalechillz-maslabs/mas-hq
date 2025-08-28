import { test, expect } from '@playwright/test';

test.describe('환불 업무 수정 테스트', () => {
  test('기존 환불 업무 수정하여 환불 금액 변경', async ({ page }) => {
    console.log('🚀 환불 업무 수정 테스트 시작');

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

    // 4. 모든 업무 정보 확인
    console.log('4️⃣ 모든 업무 정보 확인');
    for (let i = 0; i < existingTasks; i++) {
      const row = page.locator('tbody tr').nth(i);
      const rowText = await row.textContent();
      const salesCell = row.locator('td').nth(4); // 매출 컬럼
      const salesText = await salesCell.textContent();
      const pointsCell = row.locator('td').nth(6); // 포인트 컬럼
      const pointsText = await pointsCell.textContent();
      console.log(`📋 업무 ${i + 1}: ${rowText?.trim().substring(0, 50)}... | 매출: ${salesText} | 포인트: ${pointsText}`);
    }

    // 5. 환불 업무 찾기
    console.log('5️⃣ 환불 업무 찾기');
    let refundTask = null;
    
    for (let i = 0; i < existingTasks; i++) {
      const row = page.locator('tbody tr').nth(i);
      const rowText = await row.textContent();
      
      if (rowText?.includes('[환불]')) {
        refundTask = row;
        console.log(`✅ 환불 업무 발견: ${rowText?.trim().substring(0, 50)}...`);
        break;
      }
    }
    
    if (refundTask) {
      // 6. 환불 업무 수정
      console.log('6️⃣ 환불 업무 수정');
      const editButton = refundTask.locator('button').filter({ hasText: '' }).first(); // 수정 버튼 (아이콘만 있음)
      
      if (await editButton.isVisible()) {
        await editButton.click();
        console.log('✅ 수정 버튼 클릭');
        
        // 수정 모달 대기
        await page.waitForSelector('div[class*="fixed"]', { timeout: 10000 });
        console.log('✅ 수정 모달 열림');
        
        // 7. 매출 금액 수정
        console.log('7️⃣ 매출 금액 수정');
        const salesInput = page.locator('input[name="sales_amount"]');
        
        if (await salesInput.isVisible()) {
          console.log('✅ 매출 금액 입력 필드 발견');
          
          // 현재 값 확인
          const currentValue = await salesInput.inputValue();
          console.log(`📊 현재 매출 금액: ${currentValue}`);
          
          // 새로운 환불 금액 입력 (음수로)
          await salesInput.clear();
          await salesInput.fill('-25000');
          console.log('✅ 새로운 환불 금액 -25,000원 입력');
          
        } else {
          console.log('❌ 매출 금액 입력 필드를 찾을 수 없음');
        }
        
        // 8. 수정 완료
        console.log('8️⃣ 수정 완료');
        const saveButton = page.locator('button:has-text("수정")');
        await saveButton.click();
        
        // 모달이 닫힐 때까지 대기
        await page.waitForTimeout(3000);
        console.log('✅ 수정 완료');

        // 9. 수정 후 업무 목록 확인
        console.log('9️⃣ 수정 후 업무 목록 확인');
        await page.reload();
        await page.waitForTimeout(3000);
        
        const finalTaskCount = await page.locator('tbody tr').count();
        console.log(`📊 수정 후 총 업무 수: ${finalTaskCount}개`);
        
        // 10. 수정된 환불 업무 확인
        console.log('🔟 수정된 환불 업무 확인');
        const updatedRefundTask = page.locator('tbody tr').filter({ hasText: '[환불]' });
        
        if (await updatedRefundTask.count() > 0) {
          console.log('✅ 수정된 환불 업무 발견');
          
          // 수정된 환불 업무의 매출 확인
          const updatedSalesCell = updatedRefundTask.locator('td').nth(4); // 매출 컬럼
          const updatedSalesText = await updatedSalesCell.textContent();
          console.log(`💰 수정된 환불 업무 매출: ${updatedSalesText}`);
          
          // 수정된 환불 업무의 포인트 확인
          const updatedPointsCell = updatedRefundTask.locator('td').nth(6); // 포인트 컬럼
          const updatedPointsText = await updatedPointsCell.textContent();
          console.log(`🎯 수정된 환불 업무 포인트: ${updatedPointsText}`);
          
          // 음수 값 확인
          if (updatedSalesText && updatedSalesText.includes('-')) {
            console.log('✅ 수정된 환불 업무 매출이 음수로 표시됨');
          } else {
            console.log('❌ 수정된 환불 업무 매출이 음수로 표시되지 않음');
          }
          
          if (updatedPointsText && updatedPointsText.includes('-')) {
            console.log('✅ 수정된 환불 업무 포인트가 음수로 표시됨');
          } else {
            console.log('❌ 수정된 환불 업무 포인트가 음수로 표시되지 않음');
          }
          
        } else {
          console.log('❌ 수정된 환불 업무를 찾을 수 없음');
        }
        
        // 11. 총 매출 확인
        console.log('1️⃣1️⃣ 총 매출 확인');
        const totalSalesCard = page.locator('div').filter({ hasText: '개인 매출' });
        if (await totalSalesCard.count() > 0) {
          const totalSalesText = await totalSalesCard.locator('p').first().textContent();
          console.log(`💰 총 매출: ${totalSalesText}`);
        }
        
        // 12. 모든 업무의 매출 확인
        console.log('1️⃣2️⃣ 모든 업무의 매출 확인');
        for (let i = 0; i < finalTaskCount; i++) {
          const row = page.locator('tbody tr').nth(i);
          const rowText = await row.textContent();
          const salesCell = row.locator('td').nth(4); // 매출 컬럼
          const salesText = await salesCell.textContent();
          console.log(`📋 업무 ${i + 1}: ${rowText?.trim().substring(0, 50)}... | 매출: ${salesText}`);
        }
        
      } else {
        console.log('❌ 수정 버튼을 찾을 수 없음');
      }
    } else {
      console.log('❌ 환불 업무를 찾을 수 없음');
    }

    console.log('🎉 환불 업무 수정 테스트 완료!');
  });
});
