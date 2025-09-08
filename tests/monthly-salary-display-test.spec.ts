import { test, expect } from '@playwright/test';

test.describe('월급여 대상자 급여정보 표시 테스트', () => {
  test('김탁수 월급 표시 확인', async ({ page }) => {
    console.log('=== 김탁수 월급 표시 확인 테스트 시작 ===');
    
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
      const monthlySalary = page.locator('text=3,000,000원/월');
      const monthlySalaryCount = await monthlySalary.count();
      console.log('월급 3,000,000원 표시 개수:', monthlySalaryCount);
      
      if (monthlySalaryCount > 0) {
        console.log('✅ 월급 3,000,000원이 정상 표시됩니다.');
      } else {
        console.log('❌ 월급 3,000,000원이 표시되지 않습니다.');
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
      if (msg.type() === 'log' && (msg.text().includes('직원 정보 조회 결과') || msg.text().includes('급여 계산 함수'))) {
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
      path: 'tests/screenshots/monthly-salary-display-test.png',
      fullPage: true 
    });
    
    console.log('=== 김탁수 월급 표시 확인 테스트 완료 ===');
  });
  
  test('다른 월급여 대상자들 확인', async ({ page }) => {
    console.log('=== 다른 월급여 대상자들 확인 테스트 시작 ===');
    
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
    
    console.log('--- 직원 관리 페이지 로딩 완료 ---');
    
    // 3. 월급여 대상자들 확인
    const monthlySalaryEmployees = [
      { name: '김탁수', expectedSalary: '3,000,000원' },
      { name: '나수진', expectedSalary: '1,000,000원' },
      { name: '이은정', expectedSalary: '2,000,000원' }
    ];
    
    for (const employee of monthlySalaryEmployees) {
      console.log(`\\n--- ${employee.name} 급여 확인 ---`);
      
      const employeeRow = page.locator(`text=${employee.name}`).first();
      const employeeRowCount = await employeeRow.count();
      
      if (employeeRowCount > 0) {
        const employeeRowElement = employeeRow.locator('..').first();
        const rowText = await employeeRowElement.textContent();
        console.log(`${employee.name} 행 내용:`, rowText);
        
        // 급여 정보 확인
        const salaryText = await employeeRowElement.locator('text=원').first().textContent();
        console.log(`${employee.name} 급여 표시:`, salaryText);
        
        if (salaryText?.includes(employee.expectedSalary)) {
          console.log(`✅ ${employee.name}의 월급이 정상 표시됩니다.`);
        } else {
          console.log(`❌ ${employee.name}의 월급이 예상과 다릅니다.`);
        }
      } else {
        console.log(`❌ ${employee.name} 행을 찾을 수 없습니다.`);
      }
    }
    
    // 4. 스크린샷 촬영
    await page.screenshot({ 
      path: 'tests/screenshots/monthly-salary-employees-test.png',
      fullPage: true 
    });
    
    console.log('=== 다른 월급여 대상자들 확인 테스트 완료 ===');
  });
});

