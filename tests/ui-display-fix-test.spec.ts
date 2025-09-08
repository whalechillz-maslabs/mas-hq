import { test, expect } from '@playwright/test';

test.describe('UI 표시 문제 해결 테스트', () => {
  test('김탁수 월급제 UI 표시 확인', async ({ page }) => {
    console.log('=== 김탁수 월급제 UI 표시 확인 테스트 시작 ===');
    
    // 1. 로그인
    await page.goto('https://www.maslabs.kr/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="tel"]', '010-6669-9000');
    await page.fill('input[type="password"]', '66699000');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/tasks');
    
    // 2. 직원 관리 페이지에서 김탁수 급여 확인
    await page.goto('https://www.maslabs.kr/admin/employee-management');
    await page.waitForLoadState('networkidle');
    
    console.log('--- 직원 관리 페이지 김탁수 급여 확인 ---');
    
    // 김탁수 행 찾기
    const kimTakSuRow = page.locator('text=김탁수').first();
    const kimTakSuCount = await kimTakSuRow.count();
    
    if (kimTakSuCount > 0) {
      const kimTakSuRowElement = kimTakSuRow.locator('..').first();
      const rowText = await kimTakSuRowElement.textContent();
      console.log('김탁수 행 내용:', rowText);
      
      // 월급 정보 확인 (5,000,000원)
      const monthlySalary = page.locator('text=5,000,000원');
      const monthlySalaryCount = await monthlySalary.count();
      console.log('김탁수 월급 (5,000,000원) 표시 개수:', monthlySalaryCount);
      
      if (monthlySalaryCount > 0) {
        console.log('✅ 직원 관리에서 김탁수가 월급제로 정상 표시됩니다.');
      } else {
        console.log('❌ 직원 관리에서 김탁수가 월급제로 표시되지 않습니다.');
      }
    }
    
    // 3. 개인 출근 관리 페이지에서 김탁수 급여 확인
    await page.goto('https://www.maslabs.kr/attendance');
    await page.waitForLoadState('networkidle');
    
    console.log('--- 개인 출근 관리 페이지 김탁수 급여 확인 ---');
    
    // 급여 정보 섹션 확인
    const salarySection = page.locator('text=급여 정보');
    await expect(salarySection).toBeVisible();
    
    // 월급 라벨 확인
    const monthlyLabel = page.locator('text=월급');
    const monthlyCount = await monthlyLabel.count();
    console.log('개인 출근 관리 월급 라벨 개수:', monthlyCount);
    
    // 시급 라벨 확인
    const hourlyLabel = page.locator('text=시급');
    const hourlyCount = await hourlyLabel.count();
    console.log('개인 출근 관리 시급 라벨 개수:', hourlyCount);
    
    if (monthlyCount > 0) {
      console.log('✅ 개인 출근 관리에서 김탁수가 월급제로 정상 표시됩니다.');
    } else if (hourlyCount > 0) {
      console.log('❌ 개인 출근 관리에서 김탁수가 시급제로 표시됩니다.');
    } else {
      console.log('❌ 개인 출근 관리에서 김탁수의 급여 정보가 표시되지 않습니다.');
    }
    
    // 4. 시급 관리 페이지에서 김탁수 제외 확인
    await page.goto('https://www.maslabs.kr/admin/hourly-wages');
    await page.waitForLoadState('networkidle');
    
    console.log('--- 시급 관리 페이지 김탁수 제외 확인 ---');
    
    // 로딩 완료 대기
    await page.waitForSelector('text=시급 정보를 불러오는 중', { state: 'hidden', timeout: 10000 });
    
    // 직원 선택 드롭다운 확인
    const employeeSelect = page.locator('select, [role="combobox"]').first();
    const employeeSelectCount = await employeeSelect.count();
    
    if (employeeSelectCount > 0) {
      const options = await employeeSelect.locator('option').count();
      console.log('시급 관리 직원 선택 옵션 개수:', options);
      
      if (options > 1) {
        const optionTexts = await employeeSelect.locator('option').allTextContents();
        const hourlyEmployees = optionTexts.slice(1); // 첫 번째 제외
        console.log('시급 관리 직원 목록:', hourlyEmployees);
        
        // 김탁수가 목록에 있는지 확인
        const kimTakSuInList = hourlyEmployees.some(text => text.includes('김탁수'));
        if (kimTakSuInList) {
          console.log('❌ 김탁수가 시급 관리 목록에 있습니다. (월급제이므로 제외되어야 함)');
        } else {
          console.log('✅ 김탁수가 시급 관리 목록에 없습니다. (월급제이므로 정상)');
        }
      } else {
        console.log('❌ 시급 관리 직원 목록이 로드되지 않았습니다.');
      }
    }
    
    // 5. 스크린샷 촬영
    await page.screenshot({ 
      path: 'tests/screenshots/ui-display-fix-test.png',
      fullPage: true 
    });
    
    console.log('=== 김탁수 월급제 UI 표시 확인 테스트 완료 ===');
  });
  
  test('급여 체계 일관성 최종 확인', async ({ page }) => {
    console.log('=== 급여 체계 일관성 최종 확인 테스트 시작 ===');
    
    // 1. 로그인
    await page.goto('https://www.maslabs.kr/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="tel"]', '010-6669-9000');
    await page.fill('input[type="password"]', '66699000');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/tasks');
    
    // 2. 직원 관리 페이지에서 전체 직원 급여 체계 확인
    await page.goto('https://www.maslabs.kr/admin/employee-management');
    await page.waitForLoadState('networkidle');
    
    console.log('--- 전체 직원 급여 체계 최종 확인 ---');
    
    const allEmployees = page.locator('tbody tr, [role="row"]:not([role="columnheader"])');
    const employeeCount = await allEmployees.count();
    console.log('전체 직원 행 개수:', employeeCount);
    
    if (employeeCount > 0) {
      let monthlyCount = 0;
      let hourlyCount = 0;
      let unspecifiedCount = 0;
      
      for (let i = 0; i < Math.min(employeeCount, 10); i++) {
        const employeeRow = allEmployees.nth(i);
        const rowText = await employeeRow.textContent();
        
        if (rowText?.includes('원/시')) {
          hourlyCount++;
        } else if (rowText?.includes('원') && !rowText.includes('원/시')) {
          monthlyCount++;
        } else {
          unspecifiedCount++;
        }
      }
      
      console.log('급여 체계 분포:');
      console.log('- 월급제:', monthlyCount, '명');
      console.log('- 시급제:', hourlyCount, '명');
      console.log('- 미지정:', unspecifiedCount, '명');
    }
    
    // 3. 시급 관리 페이지에서 시급제 직원만 표시되는지 확인
    await page.goto('https://www.maslabs.kr/admin/hourly-wages');
    await page.waitForLoadState('networkidle');
    
    console.log('--- 시급 관리 페이지 최종 확인 ---');
    
    await page.waitForSelector('text=시급 정보를 불러오는 중', { state: 'hidden', timeout: 10000 });
    
    const employeeSelect = page.locator('select, [role="combobox"]').first();
    const employeeSelectCount = await employeeSelect.count();
    
    if (employeeSelectCount > 0) {
      const options = await employeeSelect.locator('option').count();
      console.log('시급 관리 직원 선택 옵션 개수:', options);
      
      if (options > 1) {
        const optionTexts = await employeeSelect.locator('option').allTextContents();
        const hourlyEmployees = optionTexts.slice(1); // 첫 번째 제외
        console.log('시급 관리 직원 목록:', hourlyEmployees);
        
        // 월급제 직원이 포함되어 있는지 확인
        const hasMonthlyEmployees = hourlyEmployees.some(text => 
          text.includes('김탁수') || text.includes('대표이사')
        );
        
        if (hasMonthlyEmployees) {
          console.log('❌ 시급 관리에 월급제 직원이 포함되어 있습니다.');
        } else {
          console.log('✅ 시급 관리에 시급제 직원만 표시됩니다.');
        }
      }
    }
    
    // 4. 스크린샷 촬영
    await page.screenshot({ 
      path: 'tests/screenshots/wage-system-final-check.png',
      fullPage: true 
    });
    
    console.log('=== 급여 체계 일관성 최종 확인 테스트 완료 ===');
  });
});

