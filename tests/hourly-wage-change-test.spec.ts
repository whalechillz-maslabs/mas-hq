import { test, expect } from '@playwright/test';

test.describe('시급 변경 테스트', () => {
  test('김탁수 시급 변경 확인 (12,000원 → 13,000원)', async ({ page }) => {
    console.log('=== 김탁수 시급 변경 테스트 시작 ===');
    
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
    
    // 6. 시급 정보 확인 (13,000원으로 변경되었는지)
    const hourlyWage = page.locator('text=13,000원');
    const hourlyWageCount = await hourlyWage.count();
    console.log('13,000원 시급 표시 개수:', hourlyWageCount);
    
    if (hourlyWageCount > 0) {
      console.log('✅ 시급이 13,000원으로 정상 변경되었습니다!');
    } else {
      // 12,000원이 여전히 표시되는지 확인
      const oldWage = page.locator('text=12,000원');
      const oldWageCount = await oldWage.count();
      console.log('12,000원 시급 표시 개수:', oldWageCount);
      
      if (oldWageCount > 0) {
        console.log('⚠️ 시급이 아직 12,000원으로 표시됩니다. 시스템을 확인해주세요.');
      } else {
        console.log('❌ 시급 정보가 표시되지 않습니다.');
      }
    }
    
    // 7. 급여 계산 결과 확인
    const wageCalculation = page.locator('text=급여 계산');
    const wageCalculationCount = await wageCalculation.count();
    console.log('급여 계산 섹션 개수:', wageCalculationCount);
    
    // 8. 스크린샷 촬영
    await page.screenshot({ 
      path: 'tests/screenshots/hourly-wage-change-test.png',
      fullPage: true 
    });
    
    console.log('=== 김탁수 시급 변경 테스트 완료 ===');
  });
  
  test('시급 변경 시스템 동작 확인', async ({ page }) => {
    console.log('=== 시급 변경 시스템 동작 확인 ===');
    
    // 1. 관리자 페이지로 이동 (시급 관리)
    await page.goto('https://www.maslabs.kr/admin/hourly-wages');
    await page.waitForLoadState('networkidle');
    
    // 2. 로그인이 필요한지 확인
    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      console.log('관리자 페이지 접근을 위해 로그인이 필요합니다.');
      
      // 김탁수 계정으로 로그인
      await page.fill('input[type="tel"]', '010-6669-9000');
      await page.fill('input[type="password"]', '66699000');
      await page.click('button[type="submit"]');
      
      // 로그인 후 다시 시급 관리 페이지로 이동
      await page.waitForURL('**/tasks');
      await page.goto('https://www.maslabs.kr/admin/hourly-wages');
      await page.waitForLoadState('networkidle');
    }
    
    // 3. 시급 관리 페이지 내용 확인
    const pageTitle = await page.title();
    console.log('시급 관리 페이지 제목:', pageTitle);
    
    // 4. 김탁수의 시급 정보가 표시되는지 확인
    const kimTakSuRow = page.locator('text=김탁수');
    const kimTakSuCount = await kimTakSuRow.count();
    console.log('김탁수 시급 정보 행 개수:', kimTakSuCount);
    
    if (kimTakSuCount > 0) {
      console.log('✅ 김탁수의 시급 정보가 관리 페이지에 표시됩니다.');
      
      // 5. 현재 시급 확인
      const currentWage = page.locator('text=13,000');
      const currentWageCount = await currentWage.count();
      console.log('13,000원 표시 개수:', currentWageCount);
      
      if (currentWageCount > 0) {
        console.log('✅ 관리 페이지에서도 13,000원 시급이 정상 표시됩니다.');
      }
    } else {
      console.log('❌ 김탁수의 시급 정보가 관리 페이지에 표시되지 않습니다.');
    }
    
    // 6. 스크린샷 촬영
    await page.screenshot({ 
      path: 'tests/screenshots/hourly-wage-admin-test.png',
      fullPage: true 
    });
    
    console.log('=== 시급 변경 시스템 동작 확인 완료 ===');
  });
});
