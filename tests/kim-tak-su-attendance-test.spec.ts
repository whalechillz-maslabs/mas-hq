import { test, expect } from '@playwright/test';

test.describe('김탁수 개인 출근 관리 페이지 테스트', () => {
  test('김탁수 월급제 표시 확인', async ({ page }) => {
    console.log('=== 김탁수 개인 출근 관리 페이지 테스트 시작 ===');
    
    // 1. 로그인
    await page.goto('https://www.maslabs.kr/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="tel"]', '010-6669-9000');
    await page.fill('input[type="password"]', '66699000');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/tasks');
    
    // 2. 개인 출근 관리 페이지로 이동
    await page.goto('https://www.maslabs.kr/attendance');
    await page.waitForLoadState('networkidle');
    
    console.log('--- 개인 출근 관리 페이지 로딩 완료 ---');
    
    // 3. 급여 정보 섹션 확인
    const salarySection = page.locator('text=급여 정보');
    await expect(salarySection).toBeVisible();
    
    // 4. 월급 vs 시급 라벨 확인
    const monthlyLabel = page.locator('text=월급');
    const hourlyLabel = page.locator('text=시급');
    
    const monthlyCount = await monthlyLabel.count();
    const hourlyCount = await hourlyLabel.count();
    
    console.log('월급 라벨 개수:', monthlyCount);
    console.log('시급 라벨 개수:', hourlyCount);
    
    // 5. 급여 정보 상세 확인
    if (monthlyCount > 0) {
      console.log('✅ 김탁수가 월급제로 표시됩니다.');
      
      // 월급 정보 확인
      const monthlySalary = page.locator('text=5,000,000원/월');
      const monthlySalaryCount = await monthlySalary.count();
      console.log('월급 5,000,000원 표시 개수:', monthlySalaryCount);
      
      if (monthlySalaryCount > 0) {
        console.log('✅ 월급 5,000,000원이 정상 표시됩니다.');
      } else {
        console.log('❌ 월급 5,000,000원이 표시되지 않습니다.');
      }
      
      // 일급 환산 정보 확인
      const dailyWage = page.locator('text=일급:');
      const dailyWageCount = await dailyWage.count();
      console.log('일급 환산 정보 표시 개수:', dailyWageCount);
      
    } else if (hourlyCount > 0) {
      console.log('❌ 김탁수가 시급제로 표시됩니다.');
      
      // 시급 정보 확인
      const hourlyWage = page.locator('text=12,000원/시간');
      const hourlyWageCount = await hourlyWage.count();
      console.log('시급 12,000원 표시 개수:', hourlyWageCount);
      
    } else {
      console.log('❌ 급여 정보가 표시되지 않습니다.');
    }
    
    // 6. 브라우저 콘솔 로그 확인
    const consoleLogs = [];
    page.on('console', msg => {
      if (msg.type() === 'log' && msg.text().includes('직원 정보 조회 결과')) {
        consoleLogs.push(msg.text());
      }
    });
    
    // 페이지 새로고침하여 급여 계산 함수 실행
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // 7. 콘솔 로그 출력
    console.log('브라우저 콘솔 로그:');
    consoleLogs.forEach(log => console.log(log));
    
    // 8. 스크린샷 촬영
    await page.screenshot({ 
      path: 'tests/screenshots/kim-tak-su-attendance-test.png',
      fullPage: true 
    });
    
    console.log('=== 김탁수 개인 출근 관리 페이지 테스트 완료 ===');
  });
});
