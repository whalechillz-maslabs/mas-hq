import { test, expect } from '@playwright/test';

test.describe('시급관리 페이지 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인
    await page.goto('https://www.maslabs.kr/login');
    await page.fill('input[name="phone"]', '010-6669-9000');
    await page.fill('input[name="password"]', '66699000');
    await page.click('button[type="submit"]');
    // 로그인 후 리다이렉트 대기
    await page.waitForURL('**/tasks');
  });

  test('시급관리 페이지 접근 및 기본 기능 확인', async ({ page }) => {
    console.log('🚀 시급관리 페이지 테스트 시작');
    
    // 시급관리 페이지로 이동
    await page.goto('https://www.maslabs.kr/admin/hourly-wages');
    await page.waitForLoadState('networkidle');
    
    // 페이지 제목 확인
    const pageTitle = await page.locator('h1').textContent();
    expect(pageTitle).toContain('시급 관리');
    console.log('✅ 시급관리 페이지 접근 성공');
    
    // 새 시급 등록 섹션 확인
    const newWageSection = page.locator('text=새 시급 등록');
    await expect(newWageSection).toBeVisible();
    console.log('✅ 새 시급 등록 섹션 확인');
    
    // 등록된 시급 목록 섹션 확인
    const wageListSection = page.locator('text=등록된 시급 목록');
    await expect(wageListSection).toBeVisible();
    console.log('✅ 등록된 시급 목록 섹션 확인');
    
    // 직원 선택 드롭다운 확인
    const employeeDropdown = page.locator('select').first();
    await expect(employeeDropdown).toBeVisible();
    console.log('✅ 직원 선택 드롭다운 확인');
    
    // 스크린샷 저장
    await page.screenshot({ path: 'playwright-report/hourly-wages-page.png', fullPage: true });
    console.log('✅ 시급관리 페이지 스크린샷 저장');
  });

  test('허상원 시급 수정 테스트', async ({ page }) => {
    console.log('🔧 허상원 시급 수정 테스트 시작');
    
    await page.goto('https://www.maslabs.kr/admin/hourly-wages');
    await page.waitForLoadState('networkidle');
    
    // 허상원의 시급 수정 버튼 찾기
    const heoSangWonRow = page.locator('tr').filter({ hasText: '허상원' });
    await expect(heoSangWonRow).toBeVisible();
    console.log('✅ 허상원 행 확인');
    
    // 수정 버튼 클릭
    const editButton = heoSangWonRow.locator('button').first();
    await editButton.click();
    await page.waitForTimeout(1000);
    console.log('✅ 수정 버튼 클릭');
    
    // 수정 모달 확인
    const editModal = page.locator('text=시급 수정');
    await expect(editModal).toBeVisible();
    console.log('✅ 수정 모달 열림 확인');
    
    // 현재 값들 확인
    const baseWageInput = page.locator('input[type="number"]').first();
    const currentBaseWage = await baseWageInput.inputValue();
    console.log('현재 기본 시급:', currentBaseWage);
    
    const overtimeInput = page.locator('input[type="number"]').nth(1);
    const currentOvertime = await overtimeInput.inputValue();
    console.log('현재 초과 근무 가중치:', currentOvertime);
    
    const nightInput = page.locator('input[type="number"]').nth(2);
    const currentNight = await nightInput.inputValue();
    console.log('현재 야간 근무 가중치:', currentNight);
    
    const holidayInput = page.locator('input[type="number"]').nth(3);
    const currentHoliday = await holidayInput.inputValue();
    console.log('현재 휴일 근무 가중치:', currentHoliday);
    
    const dateInput = page.locator('input[type="date"]');
    const currentDate = await dateInput.inputValue();
    console.log('현재 적용 시작일:', currentDate);
    
    // 값 수정 시도
    console.log('📝 값 수정 시도');
    
    // 기본 시급을 15000으로 변경
    await baseWageInput.clear();
    await baseWageInput.fill('15000');
    console.log('✅ 기본 시급 15000으로 변경');
    
    // 초과 근무 가중치를 1.5로 변경
    await overtimeInput.clear();
    await overtimeInput.fill('1.5');
    console.log('✅ 초과 근무 가중치 1.5로 변경');
    
    // 야간 근무 가중치를 1.3으로 변경
    await nightInput.clear();
    await nightInput.fill('1.3');
    console.log('✅ 야간 근무 가중치 1.3으로 변경');
    
    // 휴일 근무 가중치를 2.0으로 변경
    await holidayInput.clear();
    await holidayInput.fill('2.0');
    console.log('✅ 휴일 근무 가중치 2.0으로 변경');
    
    // 적용 시작일을 내일로 변경
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    await dateInput.fill(tomorrowStr);
    console.log('✅ 적용 시작일 내일로 변경:', tomorrowStr);
    
    // 수정 전 스크린샷
    await page.screenshot({ path: 'playwright-report/before-wage-update.png', fullPage: true });
    console.log('✅ 수정 전 스크린샷 저장');
    
    // 저장 버튼 클릭
    const saveButton = page.locator('button:has-text("저장")');
    await saveButton.click();
    console.log('✅ 저장 버튼 클릭');
    
    // 결과 확인 (성공 또는 실패)
    await page.waitForTimeout(3000);
    
    // 성공 메시지 확인
    const successMessage = page.locator('text=성공적으로 수정되었습니다');
    const errorMessage = page.locator('text=수정에 실패했습니다');
    
    if (await successMessage.isVisible()) {
      console.log('✅ 시급 수정 성공!');
    } else if (await errorMessage.isVisible()) {
      console.log('❌ 시급 수정 실패!');
      
      // 오류 메시지 상세 확인
      const errorText = await errorMessage.textContent();
      console.log('오류 메시지:', errorText);
    } else {
      console.log('⚠️ 성공/실패 메시지가 표시되지 않음');
    }
    
    // 수정 후 스크린샷
    await page.screenshot({ path: 'playwright-report/after-wage-update.png', fullPage: true });
    console.log('✅ 수정 후 스크린샷 저장');
  });

  test('콘솔 오류 확인', async ({ page }) => {
    console.log('🔍 콘솔 오류 확인 테스트 시작');
    
    // 콘솔 로그 수집
    const consoleLogs: string[] = [];
    const consoleErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      } else {
        consoleLogs.push(msg.text());
      }
    });
    
    await page.goto('https://www.maslabs.kr/admin/hourly-wages');
    await page.waitForLoadState('networkidle');
    
    // 허상원 수정 시도
    const heoSangWonRow = page.locator('tr').filter({ hasText: '허상원' });
    const editButton = heoSangWonRow.locator('button').first();
    await editButton.click();
    await page.waitForTimeout(1000);
    
    // 값 수정
    const baseWageInput = page.locator('input[type="number"]').first();
    await baseWageInput.clear();
    await baseWageInput.fill('16000');
    
    // 저장 시도
    const saveButton = page.locator('button:has-text("저장")');
    await saveButton.click();
    await page.waitForTimeout(3000);
    
    // 콘솔 오류 출력
    if (consoleErrors.length > 0) {
      console.log('❌ 콘솔 오류 발견:');
      consoleErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    } else {
      console.log('✅ 콘솔 오류 없음');
    }
    
    // 콘솔 로그 출력 (관련된 것만)
    const relevantLogs = consoleLogs.filter(log => 
      log.includes('시급') || log.includes('wage') || log.includes('error') || log.includes('Error')
    );
    
    if (relevantLogs.length > 0) {
      console.log('📋 관련 콘솔 로그:');
      relevantLogs.forEach((log, index) => {
        console.log(`${index + 1}. ${log}`);
      });
    }
    
    // 스크린샷 저장
    await page.screenshot({ path: 'playwright-report/console-error-check.png', fullPage: true });
    console.log('✅ 콘솔 오류 확인 스크린샷 저장');
  });

  test('네트워크 요청 확인', async ({ page }) => {
    console.log('🌐 네트워크 요청 확인 테스트 시작');
    
    const networkRequests: any[] = [];
    const networkResponses: any[] = [];
    
    // 네트워크 요청 모니터링
    page.on('request', request => {
      if (request.url().includes('supabase') || request.url().includes('hourly_wages')) {
        networkRequests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
          postData: request.postData()
        });
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('supabase') || response.url().includes('hourly_wages')) {
        networkResponses.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });
    
    await page.goto('https://www.maslabs.kr/admin/hourly-wages');
    await page.waitForLoadState('networkidle');
    
    // 허상원 수정 시도
    const heoSangWonRow = page.locator('tr').filter({ hasText: '허상원' });
    const editButton = heoSangWonRow.locator('button').first();
    await editButton.click();
    await page.waitForTimeout(1000);
    
    // 값 수정
    const baseWageInput = page.locator('input[type="number"]').first();
    await baseWageInput.clear();
    await baseWageInput.fill('17000');
    
    // 저장 시도
    const saveButton = page.locator('button:has-text("저장")');
    await saveButton.click();
    await page.waitForTimeout(3000);
    
    // 네트워크 요청 분석
    console.log('📡 네트워크 요청 분석:');
    networkRequests.forEach((req, index) => {
      console.log(`${index + 1}. ${req.method} ${req.url}`);
      if (req.postData) {
        console.log(`   POST Data: ${req.postData}`);
      }
    });
    
    // 네트워크 응답 분석
    console.log('📡 네트워크 응답 분석:');
    networkResponses.forEach((res, index) => {
      console.log(`${index + 1}. ${res.status} ${res.statusText} - ${res.url}`);
    });
    
    // 스크린샷 저장
    await page.screenshot({ path: 'playwright-report/network-request-check.png', fullPage: true });
    console.log('✅ 네트워크 요청 확인 스크린샷 저장');
  });
});

test.describe('시급관리 페이지 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인
    await page.goto('https://www.maslabs.kr/login');
    await page.fill('input[name="phone"]', '010-6669-9000');
    await page.fill('input[name="password"]', '66699000');
    await page.click('button[type="submit"]');
    // 로그인 후 리다이렉트 대기
    await page.waitForURL('**/tasks');
  });

  test('시급관리 페이지 접근 및 기본 기능 확인', async ({ page }) => {
    console.log('🚀 시급관리 페이지 테스트 시작');
    
    // 시급관리 페이지로 이동
    await page.goto('https://www.maslabs.kr/admin/hourly-wages');
    await page.waitForLoadState('networkidle');
    
    // 페이지 제목 확인
    const pageTitle = await page.locator('h1').textContent();
    expect(pageTitle).toContain('시급 관리');
    console.log('✅ 시급관리 페이지 접근 성공');
    
    // 새 시급 등록 섹션 확인
    const newWageSection = page.locator('text=새 시급 등록');
    await expect(newWageSection).toBeVisible();
    console.log('✅ 새 시급 등록 섹션 확인');
    
    // 등록된 시급 목록 섹션 확인
    const wageListSection = page.locator('text=등록된 시급 목록');
    await expect(wageListSection).toBeVisible();
    console.log('✅ 등록된 시급 목록 섹션 확인');
    
    // 직원 선택 드롭다운 확인
    const employeeDropdown = page.locator('select').first();
    await expect(employeeDropdown).toBeVisible();
    console.log('✅ 직원 선택 드롭다운 확인');
    
    // 스크린샷 저장
    await page.screenshot({ path: 'playwright-report/hourly-wages-page.png', fullPage: true });
    console.log('✅ 시급관리 페이지 스크린샷 저장');
  });

  test('허상원 시급 수정 테스트', async ({ page }) => {
    console.log('🔧 허상원 시급 수정 테스트 시작');
    
    await page.goto('https://www.maslabs.kr/admin/hourly-wages');
    await page.waitForLoadState('networkidle');
    
    // 허상원의 시급 수정 버튼 찾기
    const heoSangWonRow = page.locator('tr').filter({ hasText: '허상원' });
    await expect(heoSangWonRow).toBeVisible();
    console.log('✅ 허상원 행 확인');
    
    // 수정 버튼 클릭
    const editButton = heoSangWonRow.locator('button').first();
    await editButton.click();
    await page.waitForTimeout(1000);
    console.log('✅ 수정 버튼 클릭');
    
    // 수정 모달 확인
    const editModal = page.locator('text=시급 수정');
    await expect(editModal).toBeVisible();
    console.log('✅ 수정 모달 열림 확인');
    
    // 현재 값들 확인
    const baseWageInput = page.locator('input[type="number"]').first();
    const currentBaseWage = await baseWageInput.inputValue();
    console.log('현재 기본 시급:', currentBaseWage);
    
    const overtimeInput = page.locator('input[type="number"]').nth(1);
    const currentOvertime = await overtimeInput.inputValue();
    console.log('현재 초과 근무 가중치:', currentOvertime);
    
    const nightInput = page.locator('input[type="number"]').nth(2);
    const currentNight = await nightInput.inputValue();
    console.log('현재 야간 근무 가중치:', currentNight);
    
    const holidayInput = page.locator('input[type="number"]').nth(3);
    const currentHoliday = await holidayInput.inputValue();
    console.log('현재 휴일 근무 가중치:', currentHoliday);
    
    const dateInput = page.locator('input[type="date"]');
    const currentDate = await dateInput.inputValue();
    console.log('현재 적용 시작일:', currentDate);
    
    // 값 수정 시도
    console.log('📝 값 수정 시도');
    
    // 기본 시급을 15000으로 변경
    await baseWageInput.clear();
    await baseWageInput.fill('15000');
    console.log('✅ 기본 시급 15000으로 변경');
    
    // 초과 근무 가중치를 1.5로 변경
    await overtimeInput.clear();
    await overtimeInput.fill('1.5');
    console.log('✅ 초과 근무 가중치 1.5로 변경');
    
    // 야간 근무 가중치를 1.3으로 변경
    await nightInput.clear();
    await nightInput.fill('1.3');
    console.log('✅ 야간 근무 가중치 1.3으로 변경');
    
    // 휴일 근무 가중치를 2.0으로 변경
    await holidayInput.clear();
    await holidayInput.fill('2.0');
    console.log('✅ 휴일 근무 가중치 2.0으로 변경');
    
    // 적용 시작일을 내일로 변경
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    await dateInput.fill(tomorrowStr);
    console.log('✅ 적용 시작일 내일로 변경:', tomorrowStr);
    
    // 수정 전 스크린샷
    await page.screenshot({ path: 'playwright-report/before-wage-update.png', fullPage: true });
    console.log('✅ 수정 전 스크린샷 저장');
    
    // 저장 버튼 클릭
    const saveButton = page.locator('button:has-text("저장")');
    await saveButton.click();
    console.log('✅ 저장 버튼 클릭');
    
    // 결과 확인 (성공 또는 실패)
    await page.waitForTimeout(3000);
    
    // 성공 메시지 확인
    const successMessage = page.locator('text=성공적으로 수정되었습니다');
    const errorMessage = page.locator('text=수정에 실패했습니다');
    
    if (await successMessage.isVisible()) {
      console.log('✅ 시급 수정 성공!');
    } else if (await errorMessage.isVisible()) {
      console.log('❌ 시급 수정 실패!');
      
      // 오류 메시지 상세 확인
      const errorText = await errorMessage.textContent();
      console.log('오류 메시지:', errorText);
    } else {
      console.log('⚠️ 성공/실패 메시지가 표시되지 않음');
    }
    
    // 수정 후 스크린샷
    await page.screenshot({ path: 'playwright-report/after-wage-update.png', fullPage: true });
    console.log('✅ 수정 후 스크린샷 저장');
  });

  test('콘솔 오류 확인', async ({ page }) => {
    console.log('🔍 콘솔 오류 확인 테스트 시작');
    
    // 콘솔 로그 수집
    const consoleLogs: string[] = [];
    const consoleErrors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      } else {
        consoleLogs.push(msg.text());
      }
    });
    
    await page.goto('https://www.maslabs.kr/admin/hourly-wages');
    await page.waitForLoadState('networkidle');
    
    // 허상원 수정 시도
    const heoSangWonRow = page.locator('tr').filter({ hasText: '허상원' });
    const editButton = heoSangWonRow.locator('button').first();
    await editButton.click();
    await page.waitForTimeout(1000);
    
    // 값 수정
    const baseWageInput = page.locator('input[type="number"]').first();
    await baseWageInput.clear();
    await baseWageInput.fill('16000');
    
    // 저장 시도
    const saveButton = page.locator('button:has-text("저장")');
    await saveButton.click();
    await page.waitForTimeout(3000);
    
    // 콘솔 오류 출력
    if (consoleErrors.length > 0) {
      console.log('❌ 콘솔 오류 발견:');
      consoleErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    } else {
      console.log('✅ 콘솔 오류 없음');
    }
    
    // 콘솔 로그 출력 (관련된 것만)
    const relevantLogs = consoleLogs.filter(log => 
      log.includes('시급') || log.includes('wage') || log.includes('error') || log.includes('Error')
    );
    
    if (relevantLogs.length > 0) {
      console.log('📋 관련 콘솔 로그:');
      relevantLogs.forEach((log, index) => {
        console.log(`${index + 1}. ${log}`);
      });
    }
    
    // 스크린샷 저장
    await page.screenshot({ path: 'playwright-report/console-error-check.png', fullPage: true });
    console.log('✅ 콘솔 오류 확인 스크린샷 저장');
  });

  test('네트워크 요청 확인', async ({ page }) => {
    console.log('🌐 네트워크 요청 확인 테스트 시작');
    
    const networkRequests: any[] = [];
    const networkResponses: any[] = [];
    
    // 네트워크 요청 모니터링
    page.on('request', request => {
      if (request.url().includes('supabase') || request.url().includes('hourly_wages')) {
        networkRequests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
          postData: request.postData()
        });
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('supabase') || response.url().includes('hourly_wages')) {
        networkResponses.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });
    
    await page.goto('https://www.maslabs.kr/admin/hourly-wages');
    await page.waitForLoadState('networkidle');
    
    // 허상원 수정 시도
    const heoSangWonRow = page.locator('tr').filter({ hasText: '허상원' });
    const editButton = heoSangWonRow.locator('button').first();
    await editButton.click();
    await page.waitForTimeout(1000);
    
    // 값 수정
    const baseWageInput = page.locator('input[type="number"]').first();
    await baseWageInput.clear();
    await baseWageInput.fill('17000');
    
    // 저장 시도
    const saveButton = page.locator('button:has-text("저장")');
    await saveButton.click();
    await page.waitForTimeout(3000);
    
    // 네트워크 요청 분석
    console.log('📡 네트워크 요청 분석:');
    networkRequests.forEach((req, index) => {
      console.log(`${index + 1}. ${req.method} ${req.url}`);
      if (req.postData) {
        console.log(`   POST Data: ${req.postData}`);
      }
    });
    
    // 네트워크 응답 분석
    console.log('📡 네트워크 응답 분석:');
    networkResponses.forEach((res, index) => {
      console.log(`${index + 1}. ${res.status} ${res.statusText} - ${res.url}`);
    });
    
    // 스크린샷 저장
    await page.screenshot({ path: 'playwright-report/network-request-check.png', fullPage: true });
    console.log('✅ 네트워크 요청 확인 스크린샷 저장');
  });
});
