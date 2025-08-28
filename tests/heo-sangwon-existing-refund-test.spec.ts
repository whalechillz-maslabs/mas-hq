import { test, expect } from '@playwright/test';

test.describe('허상원 계정 기존 업무 환불 테스트', () => {
  test('기존 완료된 업무를 환불 처리', async ({ page }) => {
    console.log('🚀 허상원 계정 기존 업무 환불 테스트 시작');

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

    // 4. 기존 업무 정보 확인
    console.log('4️⃣ 기존 업무 정보 확인');
    const existingTaskRow = page.locator('tbody tr').first();
    const taskText = await existingTaskRow.textContent();
    console.log(`📋 기존 업무: ${taskText?.trim()}`);

    // 5. 기존 업무의 상태 확인
    console.log('5️⃣ 기존 업무 상태 확인');
    const statusCell = existingTaskRow.locator('td').nth(8); // 상태 컬럼
    const statusText = await statusCell.textContent();
    console.log(`📊 업무 상태: ${statusText?.trim()}`);

    // 6. 환불 버튼 확인
    console.log('6️⃣ 환불 버튼 확인');
    const refundButton = existingTaskRow.locator('button:has-text("환불")');
    
    if (await refundButton.isVisible()) {
      console.log('✅ 환불 버튼 발견');
      
      // 7. 환불 처리
      console.log('7️⃣ 환불 처리 시작');
      await refundButton.click();
      
      // 환불 모달 대기
      await page.waitForSelector('div[class*="fixed"]', { timeout: 10000 });
      console.log('✅ 환불 모달 열림');
      
      // 환불 사유 입력
      await page.fill('textarea[name="notes"]', '허상원 테스트용 기존 업무 환불 처리입니다.');
      
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
      
      // 9. 모든 업무 행 확인
      console.log('9️⃣ 모든 업무 행 확인');
      for (let i = 0; i < finalTaskCount; i++) {
        const row = page.locator('tbody tr').nth(i);
        const rowText = await row.textContent();
        console.log(`📋 업무 ${i + 1}: ${rowText?.trim()}`);
      }
      
      // 10. 환불 업무 찾기
      console.log('🔟 환불 업무 찾기');
      const refundTask = page.locator('tbody tr').filter({ hasText: '[환불]' });
      
      if (await refundTask.count() > 0) {
        console.log('✅ 환불 업무 발견');
        
        // 환불 업무의 매출과 포인트 확인
        const refundSalesCell = refundTask.locator('td').nth(4); // 매출 컬럼
        const refundSalesText = await refundSalesCell.textContent();
        console.log(`💰 환불 업무 매출: ${refundSalesText}`);
        
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
        console.log('❌ 환불 업무를 찾을 수 없음');
      }
      
    } else {
      console.log('❌ 환불 버튼을 찾을 수 없음');
      
      // 완료 버튼 확인
      const completeButton = existingTaskRow.locator('button:has-text("완료")');
      if (await completeButton.isVisible()) {
        console.log('✅ 완료 버튼 발견 - 업무를 완료 처리해야 합니다');
      } else {
        console.log('❌ 완료 버튼도 없음');
      }
    }

    // 11. 통계 카드 확인
    console.log('1️⃣1️⃣ 통계 카드 확인');
    
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

    console.log('🎉 허상원 계정 기존 업무 환불 테스트 완료!');
  });
});
