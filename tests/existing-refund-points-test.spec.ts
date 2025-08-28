import { test, expect } from '@playwright/test';

test.describe('기존 업무 환불 포인트 테스트', () => {
  test('기존 업무를 사용한 환불 포인트 테스트', async ({ page }) => {
    console.log('🚀 기존 업무 환불 포인트 테스트 시작');

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

    // 4. 모든 기존 업무 정보 확인
    console.log('4️⃣ 모든 기존 업무 정보 확인');
    for (let i = 0; i < existingTasks; i++) {
      const row = page.locator('tbody tr').nth(i);
      const rowText = await row.textContent();
      const pointsCell = row.locator('td').nth(6); // 포인트 컬럼
      const pointsText = await pointsCell.textContent();
      const statusCell = row.locator('td').nth(8); // 상태 컬럼
      const statusText = await statusCell.textContent();
      console.log(`📋 업무 ${i + 1}: ${rowText?.trim().substring(0, 50)}... | 포인트: ${pointsText} | 상태: ${statusText?.trim()}`);
    }

    // 5. 환불 가능한 업무 찾기 (완료 상태이고 OP1-4인 업무)
    console.log('5️⃣ 환불 가능한 업무 찾기');
    let refundableTask = null;
    
    for (let i = 0; i < existingTasks; i++) {
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
      
      // 6. 완료되지 않은 업무를 완료 처리
      console.log('6️⃣ 완료되지 않은 업무를 완료 처리');
      for (let i = 0; i < existingTasks; i++) {
        const row = page.locator('tbody tr').nth(i);
        const completeButton = row.locator('button:has-text("완료")');
        
        if (await completeButton.isVisible()) {
          console.log(`✅ 완료 버튼 발견 (업무 ${i + 1})`);
          await completeButton.click();
          await page.waitForTimeout(2000);
          
          // 다시 환불 가능한 업무 찾기
          for (let j = 0; j < existingTasks; j++) {
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
      // 7. 환불 처리
      console.log('7️⃣ 환불 처리 시작');
      const refundButton = refundableTask.locator('button:has-text("환불")');
      
      if (await refundButton.isVisible()) {
        await refundButton.click();
        
        // 환불 모달 대기
        await page.waitForSelector('div[class*="fixed"]', { timeout: 10000 });
        console.log('✅ 환불 모달 열림');
        
        // 환불 사유 입력
        await page.fill('textarea[name="notes"]', '기존 업무 포인트 테스트용 환불 처리입니다.');
        
        // 환불 버튼 클릭
        const refundModal = page.locator('div[class*="fixed"]').first();
        await refundModal.locator('button:has-text("환불 처리")').click();
        
        // 모달이 닫힐 때까지 대기
        await page.waitForTimeout(3000);
        console.log('✅ 환불 처리 완료');

        // 8. 환불 후 업무 목록 확인
        console.log('8️⃣ 환불 후 업무 목록 확인');
        await page.reload();
        await page.waitForTimeout(3000);
        
        const finalTaskCount = await page.locator('tbody tr').count();
        console.log(`📊 환불 처리 후 총 업무 수: ${finalTaskCount}개`);
        
        // 9. 모든 업무의 포인트 확인
        console.log('9️⃣ 모든 업무의 포인트 확인');
        for (let i = 0; i < finalTaskCount; i++) {
          const row = page.locator('tbody tr').nth(i);
          const rowText = await row.textContent();
          const pointsCell = row.locator('td').nth(6); // 포인트 컬럼
          const pointsText = await pointsCell.textContent();
          console.log(`📋 업무 ${i + 1}: ${rowText?.trim().substring(0, 50)}... | 포인트: ${pointsText}`);
          
          // 환불 업무인지 확인
          if (rowText?.includes('[환불]')) {
            console.log(`🎯 환불 업무 발견: ${pointsText}`);
            if (pointsText && pointsText.includes('-')) {
              console.log('✅ 환불 업무 포인트가 음수로 표시됨');
            } else {
              console.log('❌ 환불 업무 포인트가 음수로 표시되지 않음');
            }
          }
        }
        
        // 10. 총 포인트 확인
        console.log('🔟 총 포인트 확인');
        const totalPointsCard = page.locator('div').filter({ hasText: '획득 포인트' });
        if (await totalPointsCard.count() > 0) {
          const totalPointsText = await totalPointsCard.locator('p').first().textContent();
          console.log(`🎯 총 포인트: ${totalPointsText}`);
        }
        
      } else {
        console.log('❌ 환불 버튼을 찾을 수 없음');
      }
    } else {
      console.log('❌ 환불 가능한 업무를 찾을 수 없음');
    }

    console.log('🎉 기존 업무 환불 포인트 테스트 완료!');
  });
});
