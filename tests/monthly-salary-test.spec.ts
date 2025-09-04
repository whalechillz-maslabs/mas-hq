import { test, expect } from '@playwright/test';

test.describe('월급제 시스템 테스트', () => {
  test('김탁수 월급제 확인 (500만원/월)', async ({ page }) => {
    console.log('=== 김탁수 월급제 테스트 시작 ===');
    
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
    
    // 7. 500만원 월급 확인
    const fiveMillionWon = page.locator('text=5,000,000원/월');
    const fiveMillionCount = await fiveMillionWon.count();
    console.log('5,000,000원/월 표시 개수:', fiveMillionCount);
    
    if (fiveMillionCount > 0) {
      console.log('✅ 500만원 월급이 정상 표시됩니다!');
    } else {
      // 다른 형태로 표시되는지 확인
      const alternativeDisplay = page.locator('text=500만원');
      const alternativeCount = await alternativeDisplay.count();
      console.log('500만원 표시 개수:', alternativeCount);
      
      if (alternativeCount > 0) {
        console.log('✅ 500만원이 다른 형태로 표시됩니다.');
      } else {
        console.log('❌ 500만원 월급이 표시되지 않습니다.');
      }
    }
    
    // 8. 일급 환산 정보 확인
    const dailyWage = page.locator('text=일급:');
    const dailyWageCount = await dailyWage.count();
    console.log('일급 환산 정보 표시 개수:', dailyWageCount);
    
    if (dailyWageCount > 0) {
      console.log('✅ 일급 환산 정보가 표시됩니다!');
    } else {
      console.log('❌ 일급 환산 정보가 표시되지 않습니다.');
    }
    
    // 9. 시급 정보가 표시되지 않는지 확인
    const hourlyWage = page.locator('text=시급');
    const hourlyWageCount = await hourlyWage.count();
    console.log('시급 라벨 표시 개수:', hourlyWageCount);
    
    if (hourlyWageCount === 0) {
      console.log('✅ 시급 정보가 표시되지 않습니다 (월급제이므로 정상)!');
    } else {
      console.log('⚠️ 시급 정보가 여전히 표시됩니다.');
    }
    
    // 10. 스크린샷 촬영
    await page.screenshot({ 
      path: 'tests/screenshots/monthly-salary-test.png',
      fullPage: true 
    });
    
    console.log('=== 김탁수 월급제 테스트 완료 ===');
  });
  
  test('월급제 vs 시급제 시스템 비교', async ({ page }) => {
    console.log('=== 월급제 vs 시급제 시스템 비교 테스트 ===');
    
    // 1. 김탁수 (월급제) 로그인
    await page.goto('https://www.maslabs.kr/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="tel"]', '010-6669-9000');
    await page.fill('input[type="password"]', '66699000');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/tasks');
    await page.goto('https://www.maslabs.kr/attendance');
    await page.waitForLoadState('networkidle');
    
    // 2. 김탁수 급여 정보 확인
    console.log('--- 김탁수 (월급제) 급여 정보 ---');
    const kimSalaryInfo = page.locator('text=급여 정보');
    await expect(kimSalaryInfo).toBeVisible();
    
    const kimMonthlyLabel = page.locator('text=월급');
    const kimMonthlyCount = await kimMonthlyLabel.count();
    console.log('김탁수 월급 라벨 개수:', kimMonthlyCount);
    
    // 3. 로그아웃 후 다른 계정으로 테스트 (시급제)
    await page.goto('https://www.maslabs.kr/login');
    await page.waitForLoadState('networkidle');
    
    // 허상원 계정으로 로그인 (시급제 가정)
    await page.fill('input[type="tel"]', '010-1234-5678');
    await page.fill('input[type="password"]', '12345678');
    await page.click('button[type="submit"]');
    
    // 로그인 실패 시 다른 계정 시도
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log('허상원 계정 로그인 실패, 다른 계정으로 시도');
      // 다른 계정으로 시도하거나 테스트 종료
    } else {
      await page.waitForURL('**/tasks');
      await page.goto('https://www.maslabs.kr/attendance');
      await page.waitForLoadState('networkidle');
      
      console.log('--- 다른 직원 (시급제) 급여 정보 ---');
      const otherSalaryInfo = page.locator('text=급여 정보');
      await expect(otherSalaryInfo).toBeVisible();
      
      const otherHourlyLabel = page.locator('text=시급');
      const otherHourlyCount = await otherHourlyLabel.count();
      console.log('다른 직원 시급 라벨 개수:', otherHourlyCount);
    }
    
    // 4. 스크린샷 촬영
    await page.screenshot({ 
      path: 'tests/screenshots/wage-system-comparison.png',
      fullPage: true 
    });
    
    console.log('=== 월급제 vs 시급제 시스템 비교 테스트 완료 ===');
  });
});
