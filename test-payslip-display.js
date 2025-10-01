const { chromium } = require('playwright');

async function testPayslipDisplay() {
  console.log('=== 급여명세서 표시 테스트 시작 ===');
  
  const browser = await chromium.launch({
    headless: false,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();
  
  try {
    // 로그인 페이지로 이동
    console.log('1. 로그인 페이지로 이동...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');
    
    // 로그인
    console.log('2. 로그인 시도...');
    await page.fill('input[name="phone"]', '010-6669-9000');
    await page.fill('input[name="password"]', '66699000');
    await page.click('button[type="submit"]');
    
    // 로그인 완료 대기 (tasks 페이지로 리다이렉트됨)
    await page.waitForURL('**/tasks');
    console.log('3. 로그인 완료');
    
    // 급여명세서 생성기로 이동
    console.log('4. 급여명세서 생성기로 이동...');
    await page.goto('http://localhost:3000/admin/payslip-generator');
    await page.waitForLoadState('networkidle');
    
    // 페이지 로딩 대기
    await page.waitForTimeout(2000);
    
    // select 요소들 확인
    const selects = await page.locator('select').count();
    console.log('5. Select 요소 개수:', selects);
    
    // JavaScript로 직접 설정
    console.log('6. JavaScript로 년월 설정...');
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
    
    await page.waitForTimeout(1000);
    
    // 급여명세서 생성 버튼 클릭
    console.log('8. 급여명세서 생성 버튼 클릭...');
    await page.click('button:has-text("2025년 8월 급여 명세서 생성")');
    
    // 생성 완료 대기
    await page.waitForTimeout(3000);
    
    // 급여명세서 상세 정보 확인
    console.log('9. 급여명세서 상세 정보 확인...');
    
    // 직원명 확인
    const employeeName = await page.textContent('text=직원명').then(() => {
      return page.textContent('text=직원명').then(text => {
        const nextElement = page.locator('text=직원명').locator('..').locator('p');
        return nextElement.textContent();
      });
    }).catch(() => '정보 없음');
    
    console.log('직원명:', employeeName);
    
    // 주휴수당 확인
    const weeklyHolidayPay = await page.textContent('text=주휴수당').catch(() => null);
    console.log('주휴수당 표시 여부:', weeklyHolidayPay ? '표시됨' : '표시 안됨');
    
    if (weeklyHolidayPay) {
      const weeklyHolidayAmount = await page.textContent('text=주휴수당').then(() => {
        return page.locator('text=주휴수당').locator('..').locator('span').textContent();
      });
      console.log('주휴수당 금액:', weeklyHolidayAmount);
    }
    
    // 식대 확인
    const mealAllowance = await page.textContent('text=식대').catch(() => null);
    console.log('식대 표시 여부:', mealAllowance ? '표시됨' : '표시 안됨');
    
    if (mealAllowance) {
      const mealAllowanceAmount = await page.textContent('text=식대').then(() => {
        return page.locator('text=식대').locator('..').locator('span').textContent();
      });
      console.log('식대 금액:', mealAllowanceAmount);
    }
    
    // 총 지급액 확인
    const totalEarnings = await page.textContent('text=총 지급액').then(() => {
      return page.locator('text=총 지급액').locator('..').locator('span').textContent();
    }).catch(() => '정보 없음');
    
    console.log('총 지급액:', totalEarnings);
    
    // 스크린샷 촬영
    console.log('10. 스크린샷 촬영...');
    await page.screenshot({ path: 'payslip-display-test.png', fullPage: true });
    
    // 발행된 급여명세서 목록에서 상세 보기 클릭
    console.log('11. 발행된 급여명세서 목록 확인...');
    
    // "보기" 버튼 클릭 (첫 번째 급여명세서)
    const viewButton = page.locator('button:has-text("보기")').first();
    if (await viewButton.isVisible()) {
      await viewButton.click();
      await page.waitForTimeout(2000);
      
      // 발행된 급여명세서에서 주휴수당 확인
      const issuedWeeklyHolidayPay = await page.textContent('text=주휴수당').catch(() => null);
      console.log('발행된 급여명세서 - 주휴수당 표시 여부:', issuedWeeklyHolidayPay ? '표시됨' : '표시 안됨');
      
      if (issuedWeeklyHolidayPay) {
        const issuedWeeklyHolidayAmount = await page.textContent('text=주휴수당').then(() => {
          return page.locator('text=주휴수당').locator('..').locator('span').textContent();
        });
        console.log('발행된 급여명세서 - 주휴수당 금액:', issuedWeeklyHolidayAmount);
      }
      
      // 발행된 급여명세서 스크린샷
      await page.screenshot({ path: 'issued-payslip-test.png', fullPage: true });
    }
    
    console.log('=== 테스트 완료 ===');
    
  } catch (error) {
    console.error('테스트 중 오류 발생:', error);
    await page.screenshot({ path: 'error-screenshot.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testPayslipDisplay().catch(console.error);
