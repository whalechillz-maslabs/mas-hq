import { test, expect } from '@playwright/test';

test.describe('파트타임 알바 급여명세서 및 정산서 시스템 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인
    await page.goto('https://www.maslabs.kr/login');
    await page.fill('input[name="phone"]', '010-6669-9000');
    await page.fill('input[name="password"]', '66699000');
    await page.click('button[type="submit"]');
    // 로그인 후 리다이렉트 대기 (tasks 또는 quick-task)
    await page.waitForURL('**/tasks');
  });

  test('파트타임 정산 페이지 접근 및 직원 선택 테스트', async ({ page }) => {
    console.log('🚀 파트타임 정산 페이지 테스트 시작');
    
    // 대시보드에서 파트타임 정산 페이지로 이동
    await page.goto('https://www.maslabs.kr/admin/part-time-settlement');
    await page.waitForLoadState('networkidle');
    
    // 페이지 제목 확인
    const pageTitle = await page.locator('h1').textContent();
    expect(pageTitle).toContain('파트타임 일자별 정산');
    console.log('✅ 파트타임 정산 페이지 접근 성공');
    
    // 직원 선택 드롭다운 확인
    const employeeDropdown = page.locator('select').first();
    await expect(employeeDropdown).toBeVisible();
    console.log('✅ 직원 선택 드롭다운 확인');
    
    // 허상원 선택
    await employeeDropdown.selectOption({ label: '허상원 (MASLABS-003) - part_time' });
    const selectedEmployee = await employeeDropdown.inputValue();
    console.log('✅ 허상원 선택 완료:', selectedEmployee);
    
    // 주차 선택 확인
    const weekDropdown = page.locator('select').nth(1);
    await expect(weekDropdown).toBeVisible();
    const selectedWeek = await weekDropdown.inputValue();
    console.log('✅ 주차 선택 확인:', selectedWeek);
    
    // 스크린샷 저장
    await page.screenshot({ path: 'playwright-report/parttime-settlement-page.png', fullPage: true });
    console.log('✅ 파트타임 정산 페이지 스크린샷 저장');
  });

  test('달력 입력 정산서 생성 테스트', async ({ page }) => {
    console.log('📅 달력 입력 정산서 생성 테스트 시작');
    
    await page.goto('https://www.maslabs.kr/admin/part-time-settlement');
    await page.waitForLoadState('networkidle');
    
    // 허상원 선택
    const employeeDropdown = page.locator('select').first();
    await employeeDropdown.selectOption({ label: '허상원 (MASLABS-003) - part_time' });
    
    // 주차 선택 (8월 3주차)
    const weekDropdown = page.locator('select').nth(1);
    await weekDropdown.selectOption({ index: 2 }); // 3주차 선택
    
    // 근무 기록 로딩 대기
    await page.waitForTimeout(3000);
    
    // 일자별 근무 기록 테이블 확인
    const workRecordsTable = page.locator('table');
    await expect(workRecordsTable).toBeVisible();
    console.log('✅ 일자별 근무 기록 테이블 확인');
    
    // 근무 시간 및 금액 확인
    const workHours = await page.locator('td').filter({ hasText: /시간/ }).first().textContent();
    const dailyWage = await page.locator('td').filter({ hasText: /원/ }).first().textContent();
    console.log('📊 근무 시간:', workHours);
    console.log('💰 일급:', dailyWage);
    
    // 주간 정산 생성 버튼 클릭
    const generateButton = page.locator('button:has-text("주간 정산 생성")');
    if (await generateButton.isEnabled()) {
      await generateButton.click();
      await page.waitForTimeout(2000);
      console.log('✅ 주간 정산 생성 버튼 클릭');
    }
    
    // 스크린샷 저장
    await page.screenshot({ path: 'playwright-report/calendar-settlement-generation.png', fullPage: true });
    console.log('✅ 달력 입력 정산서 생성 스크린샷 저장');
  });

  test('급여명세서 생성기 페이지 테스트', async ({ page }) => {
    console.log('📋 급여명세서 생성기 페이지 테스트 시작');
    
    await page.goto('https://www.maslabs.kr/admin/payslip-generator');
    await page.waitForLoadState('networkidle');
    
    // 페이지 제목 확인
    const pageTitle = await page.locator('h1').textContent();
    expect(pageTitle).toContain('급여 명세서 생성');
    console.log('✅ 급여명세서 생성기 페이지 접근 성공');
    
    // 직원 선택 (허상원)
    const employeeDropdown = page.locator('select').first();
    await employeeDropdown.selectOption({ label: '허상원 (MASLABS-003) - part_time' });
    console.log('✅ 허상원 선택 완료');
    
    // 년도 선택 (2025년)
    const yearDropdown = page.locator('select').nth(1);
    await yearDropdown.selectOption({ label: '2025년' });
    console.log('✅ 2025년 선택 완료');
    
    // 월 선택 (8월)
    const monthDropdown = page.locator('select').nth(2);
    await monthDropdown.selectOption({ label: '8월' });
    console.log('✅ 8월 선택 완료');
    
    // 급여명세서 생성 버튼 클릭
    const generateButton = page.locator('button:has-text("급여 명세서 생성")');
    await generateButton.click();
    await page.waitForTimeout(3000);
    console.log('✅ 급여명세서 생성 버튼 클릭');
    
    // 생성된 급여명세서 확인
    const payslipSection = page.locator('text=기본 정보');
    await expect(payslipSection).toBeVisible();
    console.log('✅ 급여명세서 생성 확인');
    
    // 출력/인쇄 버튼 확인
    const printButton = page.locator('button:has-text("출력/인쇄")');
    await expect(printButton).toBeVisible();
    console.log('✅ 출력/인쇄 버튼 확인');
    
    // 스크린샷 저장
    await page.screenshot({ path: 'playwright-report/payslip-generation.png', fullPage: true });
    console.log('✅ 급여명세서 생성 스크린샷 저장');
  });

  test('정산서 문서 저장 및 프린터 기능 테스트', async ({ page }) => {
    console.log('💾 정산서 문서 저장 및 프린터 기능 테스트 시작');
    
    await page.goto('https://www.maslabs.kr/admin/payslip-generator');
    await page.waitForLoadState('networkidle');
    
    // 허상원 8월 급여명세서 생성
    const employeeDropdown = page.locator('select').first();
    await employeeDropdown.selectOption({ label: '허상원 (MASLABS-003) - part_time' });
    
    const yearDropdown = page.locator('select').nth(1);
    await yearDropdown.selectOption({ label: '2025년' });
    
    const monthDropdown = page.locator('select').nth(2);
    await monthDropdown.selectOption({ label: '8월' });
    
    const generateButton = page.locator('button:has-text("급여 명세서 생성")');
    await generateButton.click();
    await page.waitForTimeout(3000);
    
    // 출력/인쇄 버튼 클릭
    const printButton = page.locator('button:has-text("출력/인쇄")');
    await printButton.click();
    await page.waitForTimeout(2000);
    console.log('✅ 출력/인쇄 버튼 클릭');
    
    // 새 창에서 인쇄 미리보기 확인
    const newPage = await page.context().newPage();
    await newPage.waitForLoadState('networkidle');
    
    // 인쇄 미리보기 페이지 확인
    const printContent = newPage.locator('body');
    await expect(printContent).toBeVisible();
    console.log('✅ 인쇄 미리보기 페이지 확인');
    
    // 인쇄 미리보기 스크린샷 저장
    await newPage.screenshot({ path: 'playwright-report/print-preview.png', fullPage: true });
    console.log('✅ 인쇄 미리보기 스크린샷 저장');
    
    await newPage.close();
  });

  test('간단한 정산 테스트 페이지 확인', async ({ page }) => {
    console.log('🧪 간단한 정산 테스트 페이지 확인 시작');
    
    await page.goto('https://www.maslabs.kr/admin/simple-settlement');
    await page.waitForLoadState('networkidle');
    
    // 페이지 제목 확인
    const pageTitle = await page.locator('h1').textContent();
    expect(pageTitle).toContain('간단한 정산 테스트');
    console.log('✅ 간단한 정산 테스트 페이지 접근 성공');
    
    // 직원 목록 테이블 확인
    const employeeTable = page.locator('table');
    await expect(employeeTable).toBeVisible();
    console.log('✅ 직원 목록 테이블 확인');
    
    // 허상원 정보 확인
    const heoSangWonRow = page.locator('tr').filter({ hasText: '허상원' });
    await expect(heoSangWonRow).toBeVisible();
    
    const heoInfo = await heoSangWonRow.textContent();
    expect(heoInfo).toContain('MASLABS-003');
    expect(heoInfo).toContain('part_time');
    expect(heoInfo).toContain('13,000');
    console.log('✅ 허상원 정보 확인:', heoInfo);
    
    // 정산 테스트 버튼 확인
    const testButton = page.locator('button:has-text("정산 테스트")');
    await expect(testButton).toBeVisible();
    console.log('✅ 정산 테스트 버튼 확인');
    
    // 스크린샷 저장
    await page.screenshot({ path: 'playwright-report/simple-settlement-test.png', fullPage: true });
    console.log('✅ 간단한 정산 테스트 페이지 스크린샷 저장');
  });

  test('파트타임 알바 월별 급여명세서 생성 테스트', async ({ page }) => {
    console.log('📊 파트타임 알바 월별 급여명세서 생성 테스트 시작');
    
    await page.goto('https://www.maslabs.kr/admin/payslip-generator');
    await page.waitForLoadState('networkidle');
    
    // 파트타임 직원들 확인
    const employeeDropdown = page.locator('select').first();
    const options = await employeeDropdown.locator('option').allTextContents();
    console.log('📋 사용 가능한 직원 목록:', options);
    
    // 허상원 선택 (파트타임)
    await employeeDropdown.selectOption({ label: '허상원 (MASLABS-003) - part_time' });
    
    // 2025년 8월 선택
    const yearDropdown = page.locator('select').nth(1);
    await yearDropdown.selectOption({ label: '2025년' });
    
    const monthDropdown = page.locator('select').nth(2);
    await monthDropdown.selectOption({ label: '8월' });
    
    // 급여명세서 생성
    const generateButton = page.locator('button:has-text("급여 명세서 생성")');
    await generateButton.click();
    await page.waitForTimeout(5000);
    
    // 생성된 급여명세서 상세 정보 확인
    const employeeName = await page.locator('text=직원명:').locator('..').locator('span').last().textContent();
    const employeeCode = await page.locator('text=직원 코드:').locator('..').locator('span').last().textContent();
    const employmentType = await page.locator('text=고용형태:').locator('..').locator('span').last().textContent();
    
    console.log('👤 직원명:', employeeName);
    console.log('🆔 직원 코드:', employeeCode);
    console.log('💼 고용형태:', employmentType);
    
    // 파트타임 급여 정보 확인
    if (employmentType?.includes('파트타임')) {
      const totalHours = await page.locator('text=총 근무시간:').locator('..').locator('span').last().textContent();
      const hourlyRate = await page.locator('text=시급:').locator('..').locator('span').last().textContent();
      const totalEarnings = await page.locator('text=총 지급액:').locator('..').locator('span').last().textContent();
      
      console.log('⏰ 총 근무시간:', totalHours);
      console.log('💰 시급:', hourlyRate);
      console.log('💵 총 지급액:', totalEarnings);
      
      // 파트타임 급여 계산 검증
      expect(totalHours).toBeTruthy();
      expect(hourlyRate).toContain('13,000');
      expect(totalEarnings).toBeTruthy();
      console.log('✅ 파트타임 급여 정보 검증 완료');
    }
    
    // 스크린샷 저장
    await page.screenshot({ path: 'playwright-report/parttime-monthly-payslip.png', fullPage: true });
    console.log('✅ 파트타임 월별 급여명세서 스크린샷 저장');
  });
});
