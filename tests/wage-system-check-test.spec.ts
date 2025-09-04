import { test, expect } from '@playwright/test';

test.describe('급여 체계 확인 테스트', () => {
  test('김탁수 월급제 vs 다른 직원 시급제 확인', async ({ page }) => {
    console.log('=== 급여 체계 확인 테스트 시작 ===');
    
    // 1. 김탁수 (월급제) 로그인
    await page.goto('https://www.maslabs.kr/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="tel"]', '010-6669-9000');
    await page.fill('input[type="password"]', '66699000');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/tasks');
    await page.goto('https://www.maslabs.kr/attendance');
    await page.waitForLoadState('networkidle');
    
    console.log('--- 김탁수 (월급제) 급여 정보 확인 ---');
    
    // 2. 김탁수 급여 정보 확인
    const salarySection = page.locator('text=급여 정보');
    await expect(salarySection).toBeVisible();
    
    // 월급 라벨 확인
    const monthlyLabel = page.locator('text=월급');
    const monthlyCount = await monthlyLabel.count();
    console.log('김탁수 월급 라벨 개수:', monthlyCount);
    
    // 시급 라벨 확인
    const hourlyLabel = page.locator('text=시급');
    const hourlyCount = await hourlyLabel.count();
    console.log('김탁수 시급 라벨 개수:', hourlyCount);
    
    if (monthlyCount > 0) {
      console.log('✅ 김탁수는 월급제로 정상 표시됩니다.');
    } else if (hourlyCount > 0) {
      console.log('⚠️ 김탁수가 시급제로 표시됩니다. 월급제 설정을 확인해주세요.');
    } else {
      console.log('❌ 김탁수의 급여 정보가 표시되지 않습니다.');
    }
    
    // 3. 스크린샷 촬영
    await page.screenshot({ 
      path: 'tests/screenshots/kim-tak-su-monthly-salary.png',
      fullPage: true 
    });
    
    console.log('=== 김탁수 급여 체계 확인 완료 ===');
  });
  
  test('직원 관리 페이지에서 급여 체계 확인', async ({ page }) => {
    console.log('=== 직원 관리 페이지 급여 체계 확인 시작 ===');
    
    // 1. 로그인
    await page.goto('https://www.maslabs.kr/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="tel"]', '010-6669-9000');
    await page.fill('input[type="password"]', '66699000');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/tasks');
    
    // 2. 직원 관리 페이지로 이동
    await page.goto('https://www.maslabs.kr/admin/employee-management');
    await page.waitForLoadState('networkidle');
    
    // 3. 직원 목록 확인
    const employeeList = page.locator('text=직원 목록');
    await expect(employeeList).toBeVisible();
    
    // 4. 김탁수 행 찾기
    const kimTakSuRow = page.locator('text=김탁수').first();
    const kimTakSuCount = await kimTakSuRow.count();
    console.log('김탁수 행 개수:', kimTakSuCount);
    
    if (kimTakSuCount > 0) {
      // 김탁수 행의 급여 정보 확인
      const kimTakSuRowElement = kimTakSuRow.locator('..').first();
      const rowText = await kimTakSuRowElement.textContent();
      console.log('김탁수 행 내용:', rowText);
      
      // 월급 정보 확인
      const monthlySalary = page.locator('text=2,500,000원, text=5,000,000원');
      const monthlySalaryCount = await monthlySalary.count();
      console.log('김탁수 월급 표시 개수:', monthlySalaryCount);
      
      // 시급 정보 확인
      const hourlyWage = page.locator('text=12,000원/시');
      const hourlyWageCount = await hourlyWage.count();
      console.log('김탁수 시급 표시 개수:', hourlyWageCount);
      
      if (monthlySalaryCount > 0) {
        console.log('✅ 직원 관리에서 김탁수가 월급제로 표시됩니다.');
      } else if (hourlyWageCount > 0) {
        console.log('⚠️ 직원 관리에서 김탁수가 시급제로 표시됩니다.');
      } else {
        console.log('❌ 직원 관리에서 김탁수의 급여 정보가 표시되지 않습니다.');
      }
    } else {
      console.log('❌ 김탁수 행을 찾을 수 없습니다.');
    }
    
    // 5. 다른 직원들의 급여 체계 확인
    const allEmployees = page.locator('tbody tr, [role="row"]:not([role="columnheader"])');
    const employeeCount = await allEmployees.count();
    console.log('전체 직원 행 개수:', employeeCount);
    
    if (employeeCount > 0) {
      console.log('--- 전체 직원 급여 체계 ---');
      for (let i = 0; i < Math.min(employeeCount, 5); i++) {
        const employeeRow = allEmployees.nth(i);
        const rowText = await employeeRow.textContent();
        console.log(`직원 ${i + 1}:`, rowText);
      }
    }
    
    // 6. 스크린샷 촬영
    await page.screenshot({ 
      path: 'tests/screenshots/employee-management-wage-system.png',
      fullPage: true 
    });
    
    console.log('=== 직원 관리 페이지 급여 체계 확인 완료 ===');
  });
  
  test('시급 관리 페이지에서 시급제 직원 확인', async ({ page }) => {
    console.log('=== 시급 관리 페이지 시급제 직원 확인 시작 ===');
    
    // 1. 로그인
    await page.goto('https://www.maslabs.kr/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="tel"]', '010-6669-9000');
    await page.fill('input[type="password"]', '66699000');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/tasks');
    
    // 2. 시급 관리 페이지로 이동
    await page.goto('https://www.maslabs.kr/admin/hourly-wages');
    await page.waitForLoadState('networkidle');
    
    // 3. 로딩 완료 대기
    await page.waitForSelector('text=시급 정보를 불러오는 중', { state: 'hidden', timeout: 10000 });
    
    // 4. 직원 선택 드롭다운 확인
    const employeeSelect = page.locator('select, [role="combobox"]').first();
    const employeeSelectCount = await employeeSelect.count();
    console.log('직원 선택 드롭다운 개수:', employeeSelectCount);
    
    if (employeeSelectCount > 0) {
      const options = await employeeSelect.locator('option').count();
      console.log('직원 선택 옵션 개수:', options);
      
      if (options > 1) {
        const optionTexts = await employeeSelect.locator('option').allTextContents();
        console.log('직원 목록:', optionTexts.slice(1)); // 첫 번째 제외
        
        // 김탁수가 목록에 있는지 확인
        const kimTakSuInList = optionTexts.some(text => text.includes('김탁수'));
        if (kimTakSuInList) {
          console.log('⚠️ 김탁수가 시급 관리 목록에 있습니다. 월급제 직원은 제외되어야 합니다.');
        } else {
          console.log('✅ 김탁수가 시급 관리 목록에 없습니다. (월급제이므로 정상)');
        }
      } else {
        console.log('❌ 직원 목록이 로드되지 않았습니다.');
      }
    }
    
    // 5. 등록된 시급 데이터 확인
    const wagesTable = page.locator('table, [role="table"]');
    const wagesTableCount = await wagesTable.count();
    
    if (wagesTableCount > 0) {
      const dataRows = page.locator('tbody tr, [role="row"]:not([role="columnheader"])');
      const dataRowCount = await dataRows.count();
      console.log('등록된 시급 데이터 행 개수:', dataRowCount);
      
      if (dataRowCount > 0) {
        console.log('--- 등록된 시급 데이터 ---');
        for (let i = 0; i < dataRowCount; i++) {
          const row = dataRows.nth(i);
          const rowText = await row.textContent();
          console.log(`시급 데이터 ${i + 1}:`, rowText);
        }
      } else {
        console.log('❌ 등록된 시급 데이터가 없습니다.');
      }
    }
    
    // 6. 스크린샷 촬영
    await page.screenshot({ 
      path: 'tests/screenshots/hourly-wages-employee-list.png',
      fullPage: true 
    });
    
    console.log('=== 시급 관리 페이지 시급제 직원 확인 완료 ===');
  });
});
