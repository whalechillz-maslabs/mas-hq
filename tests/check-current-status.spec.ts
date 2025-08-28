import { test, expect } from '@playwright/test';

test.describe('현재 업무 상태 확인', () => {
  test('현재 모든 업무의 상태 확인', async ({ page }) => {
    console.log('🚀 현재 업무 상태 확인 시작');

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

    // 4. 모든 업무 정보 상세 확인
    console.log('4️⃣ 모든 업무 정보 상세 확인');
    for (let i = 0; i < existingTasks; i++) {
      const row = page.locator('tbody tr').nth(i);
      const rowText = await row.textContent();
      const salesCell = row.locator('td').nth(4); // 매출 컬럼
      const salesText = await salesCell.textContent();
      const pointsCell = row.locator('td').nth(6); // 포인트 컬럼
      const pointsText = await pointsCell.textContent();
      const statusCell = row.locator('td').nth(8); // 상태 컬럼
      const statusText = await statusCell.textContent();
      
      console.log(`📋 업무 ${i + 1}:`);
      console.log(`   전체 텍스트: ${rowText?.trim()}`);
      console.log(`   매출: ${salesText}`);
      console.log(`   포인트: ${pointsText}`);
      console.log(`   상태: ${statusText?.trim()}`);
      
      // 환불 버튼 확인
      const refundButton = row.locator('button:has-text("환불")');
      if (await refundButton.isVisible()) {
        console.log(`   ✅ 환불 버튼 있음`);
      } else {
        console.log(`   ❌ 환불 버튼 없음`);
      }
      
      // 완료 버튼 확인
      const completeButton = row.locator('button:has-text("완료")');
      if (await completeButton.isVisible()) {
        console.log(`   ✅ 완료 버튼 있음`);
      } else {
        console.log(`   ❌ 완료 버튼 없음`);
      }
      
      console.log('   ---');
    }

    // 5. 통계 카드 확인
    console.log('5️⃣ 통계 카드 확인');
    const totalTasksCard = page.locator('div').filter({ hasText: '총 업무' });
    if (await totalTasksCard.count() > 0) {
      const totalTasksText = await totalTasksCard.locator('p').first().textContent();
      console.log(`📊 총 업무: ${totalTasksText}`);
    }
    
    const totalPointsCard = page.locator('div').filter({ hasText: '획득 포인트' });
    if (await totalPointsCard.count() > 0) {
      const totalPointsText = await totalPointsCard.locator('p').first().textContent();
      console.log(`🎯 총 포인트: ${totalPointsText}`);
    }
    
    const totalSalesCard = page.locator('div').filter({ hasText: '개인 매출' });
    if (await totalSalesCard.count() > 0) {
      const totalSalesText = await totalSalesCard.locator('p').first().textContent();
      console.log(`💰 총 매출: ${totalSalesText}`);
    }
    
    const refundCard = page.locator('div').filter({ hasText: '환불' });
    if (await refundCard.count() > 0) {
      const refundCount = await refundCard.locator('p').first().textContent();
      console.log(`🔄 환불: ${refundCount}`);
    }

    console.log('🎉 현재 업무 상태 확인 완료!');
  });
});
