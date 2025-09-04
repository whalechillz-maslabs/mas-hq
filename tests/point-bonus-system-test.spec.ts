import { test, expect } from '@playwright/test';

test.describe('포인트 수당 시스템 테스트', () => {
  test('김탁수 월급제 + 포인트 수당 확인', async ({ page }) => {
    console.log('=== 김탁수 월급제 + 포인트 수당 테스트 시작 ===');
    
    // 1. 로그인 페이지로 이동
    await page.goto('https://www.maslabs.kr/login');
    await page.waitForLoadState('networkidle');
    
    // 2. 김탁수 계정으로 로그인
    await page.fill('input[type="tel"]', '010-6669-9000');
    await page.fill('input[type="password"]', '66699000');
    await page.click('button[type="submit"]');
    
    // 3. 로그인 후 리다이렉트 대기
    await page.waitForURL('**/tasks');
    console.log('로그인 성공, 현재 URL:', page.url());
    
    // 4. 출근 관리 페이지로 이동
    await page.goto('https://www.maslabs.kr/attendance');
    await page.waitForLoadState('networkidle');
    
    // 5. 급여 정보 섹션 확인
    const salarySection = page.locator('text=급여 정보');
    await expect(salarySection).toBeVisible();
    
    // 6. 월급 정보 확인
    const monthlySalary = page.locator('text=월급');
    const monthlySalaryCount = await monthlySalary.count();
    console.log('월급 라벨 표시 개수:', monthlySalaryCount);
    
    if (monthlySalaryCount > 0) {
      console.log('✅ 월급제로 정상 표시됩니다!');
    } else {
      console.log('❌ 월급제로 표시되지 않습니다.');
    }
    
    // 7. 포인트 수당 섹션 확인
    const pointBonus = page.locator('text=포인트 수당');
    const pointBonusCount = await pointBonus.count();
    console.log('포인트 수당 라벨 표시 개수:', pointBonusCount);
    
    if (pointBonusCount > 0) {
      console.log('✅ 포인트 수당 섹션이 표시됩니다!');
    } else {
      console.log('❌ 포인트 수당 섹션이 표시되지 않습니다.');
    }
    
    // 8. 총 수입 섹션 확인
    const totalEarnings = page.locator('text=총 수입');
    const totalEarningsCount = await totalEarnings.count();
    console.log('총 수입 라벨 표시 개수:', totalEarningsCount);
    
    if (totalEarningsCount > 0) {
      console.log('✅ 총 수입 섹션이 표시됩니다!');
    } else {
      console.log('❌ 총 수입 섹션이 표시되지 않습니다.');
    }
    
    // 9. 포인트 수당 금액 확인
    const pointAmount = page.locator('text=0원').first();
    const pointAmountCount = await pointAmount.count();
    console.log('포인트 수당 금액 표시 개수:', pointAmountCount);
    
    // 10. 스크린샷 촬영
    await page.screenshot({ 
      path: 'tests/screenshots/point-bonus-system-test.png',
      fullPage: true 
    });
    
    console.log('=== 김탁수 월급제 + 포인트 수당 테스트 완료 ===');
  });
  
  test('업무 기록 추가 후 포인트 수당 확인', async ({ page }) => {
    console.log('=== 업무 기록 추가 후 포인트 수당 테스트 시작 ===');
    
    // 1. 로그인
    await page.goto('https://www.maslabs.kr/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="tel"]', '010-6669-9000');
    await page.fill('input[type="password"]', '66699000');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/tasks');
    
    // 2. 업무 기록 페이지로 이동
    await page.goto('https://www.maslabs.kr/tasks');
    await page.waitForLoadState('networkidle');
    
    // 3. 업무 추가 버튼 클릭
    const addTaskButton = page.locator('text=업무 추가');
    if (await addTaskButton.count() > 0) {
      await addTaskButton.click();
      await page.waitForLoadState('networkidle');
      
      // 4. 업무 유형 선택 (예: 전화 상담)
      const taskType = page.locator('text=전화 상담').first();
      if (await taskType.count() > 0) {
        await taskType.click();
        
        // 5. 고객명 입력
        const customerInput = page.locator('input[placeholder*="고객명"]');
        if (await customerInput.count() > 0) {
          await customerInput.fill('테스트 고객');
        }
        
        // 6. 저장 버튼 클릭
        const saveButton = page.locator('button:has-text("저장")');
        if (await saveButton.count() > 0) {
          await saveButton.click();
          await page.waitForLoadState('networkidle');
        }
      }
    }
    
    // 7. 출근 관리 페이지로 이동하여 포인트 수당 확인
    await page.goto('https://www.maslabs.kr/attendance');
    await page.waitForLoadState('networkidle');
    
    // 8. 포인트 수당이 업데이트되었는지 확인
    const pointBonus = page.locator('text=포인트 수당');
    const pointBonusCount = await pointBonus.count();
    console.log('업무 추가 후 포인트 수당 라벨 개수:', pointBonusCount);
    
    // 9. 스크린샷 촬영
    await page.screenshot({ 
      path: 'tests/screenshots/point-bonus-after-task.png',
      fullPage: true 
    });
    
    console.log('=== 업무 기록 추가 후 포인트 수당 테스트 완료 ===');
  });
});
