const { chromium } = require('playwright');

async function debugPayslipGeneration() {
  console.log('=== 급여명세서 생성 디버깅 시작 ===');
  
  const browser = await chromium.launch({
    headless: false,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // 콘솔 로그 캡처
  page.on('console', msg => {
    console.log('브라우저 콘솔:', msg.text());
  });
  
  // 네트워크 요청 캡처
  page.on('response', response => {
    if (response.url().includes('payslips') || response.url().includes('generate')) {
      console.log('네트워크 응답:', response.url(), response.status());
    }
  });
  
  try {
    // 로그인
    console.log('1. 로그인...');
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="phone"]', '010-6669-9000');
    await page.fill('input[name="password"]', '66699000');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/tasks');
    
    // 급여명세서 생성기로 이동
    console.log('2. 급여명세서 생성기로 이동...');
    await page.goto('http://localhost:3000/admin/payslip-generator');
    await page.waitForLoadState('networkidle');
    
    // 페이지 로딩 대기
    await page.waitForTimeout(3000);
    
    // 현재 상태 확인
    console.log('3. 현재 상태 확인...');
    
    // 직원 선택 상태 확인
    const employeeSelect = await page.locator('select').first();
    const selectedEmployee = await employeeSelect.inputValue();
    console.log('선택된 직원 ID:', selectedEmployee);
    
    // 년도 선택 상태 확인
    const yearSelect = await page.locator('select').nth(1);
    const selectedYear = await yearSelect.inputValue();
    console.log('선택된 년도:', selectedYear);
    
    // 월 선택 상태 확인
    const monthSelect = await page.locator('select').nth(2);
    const selectedMonth = await monthSelect.inputValue();
    console.log('선택된 월:', selectedMonth);
    
    // JavaScript로 설정
    console.log('4. JavaScript로 설정...');
    await page.evaluate(() => {
      // 직원 선택
      const employeeSelect = document.querySelector('select');
      if (employeeSelect) {
        employeeSelect.value = 'e998a540-51bf-4380-bcb1-86fb36ec7eb8';
        employeeSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
      
      // 년도 선택
      const yearSelect = document.querySelectorAll('select')[1];
      if (yearSelect) {
        yearSelect.value = '2025';
        yearSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
      
      // 월 선택
      const monthSelect = document.querySelectorAll('select')[2];
      if (monthSelect) {
        monthSelect.value = '8';
        monthSelect.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    
    await page.waitForTimeout(2000);
    
    // 설정 후 상태 확인
    console.log('5. 설정 후 상태 확인...');
    const newSelectedEmployee = await employeeSelect.inputValue();
    const newSelectedYear = await yearSelect.inputValue();
    const newSelectedMonth = await monthSelect.inputValue();
    console.log('설정 후 - 직원:', newSelectedEmployee, '년도:', newSelectedYear, '월:', newSelectedMonth);
    
    // 급여명세서 생성 버튼 클릭
    console.log('6. 급여명세서 생성 버튼 클릭...');
    const generateButton = page.locator('button:has-text("2025년 8월 급여 명세서 생성")');
    await generateButton.click();
    
    // 생성 완료 대기
    await page.waitForTimeout(5000);
    
    // 생성 결과 확인
    console.log('7. 생성 결과 확인...');
    
    // 급여명세서 상세 영역 확인
    const payslipSection = page.locator('text=급여 명세서').first();
    const isPayslipVisible = await payslipSection.isVisible();
    console.log('급여명세서 섹션 표시 여부:', isPayslipVisible);
    
    if (isPayslipVisible) {
      // 직원명 확인
      const employeeNameElement = page.locator('text=직원명').first();
      const employeeName = await employeeNameElement.locator('..').locator('p').textContent().catch(() => '정보 없음');
      console.log('직원명:', employeeName);
      
      // 주휴수당 확인
      const weeklyHolidayElement = page.locator('text=주휴수당').first();
      const isWeeklyHolidayVisible = await weeklyHolidayElement.isVisible();
      console.log('주휴수당 표시 여부:', isWeeklyHolidayVisible);
      
      if (isWeeklyHolidayVisible) {
        const weeklyHolidayAmount = await weeklyHolidayElement.locator('..').locator('span').textContent();
        console.log('주휴수당 금액:', weeklyHolidayAmount);
      }
      
      // 식대 확인
      const mealAllowanceElement = page.locator('text=식대').first();
      const isMealAllowanceVisible = await mealAllowanceElement.isVisible();
      console.log('식대 표시 여부:', isMealAllowanceVisible);
      
      if (isMealAllowanceVisible) {
        const mealAllowanceAmount = await mealAllowanceElement.locator('..').locator('span').textContent();
        console.log('식대 금액:', mealAllowanceAmount);
      }
      
      // 총 지급액 확인
      const totalEarningsElement = page.locator('text=총 지급액').first();
      const totalEarnings = await totalEarningsElement.locator('..').locator('span').textContent().catch(() => '정보 없음');
      console.log('총 지급액:', totalEarnings);
    }
    
    // 발행된 급여명세서 목록 확인
    console.log('8. 발행된 급여명세서 목록 확인...');
    const payslipList = page.locator('text=발행된 급여명세서 목록');
    const isListVisible = await payslipList.isVisible();
    console.log('급여명세서 목록 표시 여부:', isListVisible);
    
    if (isListVisible) {
      const payslipRows = page.locator('tbody tr');
      const rowCount = await payslipRows.count();
      console.log('급여명세서 목록 행 수:', rowCount);
      
      if (rowCount > 0) {
        // 첫 번째 행의 "보기" 버튼 클릭
        const viewButton = payslipRows.first().locator('button:has-text("보기")');
        await viewButton.click();
        await page.waitForTimeout(2000);
        
        // 발행된 급여명세서에서 주휴수당 확인
        const issuedWeeklyHolidayElement = page.locator('text=주휴수당').first();
        const isIssuedWeeklyHolidayVisible = await issuedWeeklyHolidayElement.isVisible();
        console.log('발행된 급여명세서 - 주휴수당 표시 여부:', isIssuedWeeklyHolidayVisible);
        
        if (isIssuedWeeklyHolidayVisible) {
          const issuedWeeklyHolidayAmount = await issuedWeeklyHolidayElement.locator('..').locator('span').textContent();
          console.log('발행된 급여명세서 - 주휴수당 금액:', issuedWeeklyHolidayAmount);
        }
      }
    }
    
    // 스크린샷 촬영
    await page.screenshot({ path: 'debug-payslip-generation.png', fullPage: true });
    
    console.log('=== 디버깅 완료 ===');
    
  } catch (error) {
    console.error('디버깅 중 오류 발생:', error);
    await page.screenshot({ path: 'debug-error.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

debugPayslipGeneration().catch(console.error);