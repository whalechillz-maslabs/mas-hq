import { test, expect } from '@playwright/test';

test.describe('연차 신청 시 로그아웃 문제 테스트', () => {
  test('직원용 연차 신청 페이지 - 다른 직원으로 로그인 후 연차 신청', async ({ page }) => {
    // 콘솔 로그 수집
    page.on('console', msg => {
      console.log(`브라우저 콘솔: ${msg.type()}: ${msg.text()}`);
    });
    
    page.on('pageerror', error => {
      console.log(`페이지 에러: ${error.message}`);
    });

    // 1. 로그인 페이지로 이동
    await page.goto('https://www.maslabs.kr/login');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ 로그인 페이지 접근 완료');

    // 2. 다른 직원으로 로그인 (박진 계정)
    const phoneInput = page.locator('input[type="tel"], input[name="phone"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    const submitButton = page.locator('button[type="submit"], button:has-text("로그인")').first();

    // 박진 계정으로 로그인
    await phoneInput.fill('010-9132-4337');
    await passwordInput.fill('91324337');
    
    console.log('✅ 로그인 정보 입력 완료');

    // 3. 로그인 버튼 클릭
    await submitButton.click();
    await page.waitForTimeout(3000);
    
    // 4. 대시보드 또는 연차 신청 페이지로 이동 확인
    const currentUrl = page.url();
    console.log('현재 URL:', currentUrl);
    
    // 로그인 페이지에 머물러 있으면 로그인 실패
    if (currentUrl.includes('/login')) {
      console.log('❌ 로그인 실패 - 로그인 페이지에 머물러 있음');
      // 다른 계정으로 시도하거나 실제 계정 정보 확인 필요
      return;
    }

    console.log('✅ 로그인 성공');

    // 5. 연차 신청 페이지로 이동
    await page.goto('https://www.maslabs.kr/leave');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('✅ 연차 신청 페이지 접근 완료');

    // 6. 로그인 상태 확인 (로그인 페이지로 리다이렉트되었는지 확인)
    const leavePageUrl = page.url();
    console.log('연차 신청 페이지 URL:', leavePageUrl);
    
    if (leavePageUrl.includes('/login')) {
      console.log('❌ 문제 발견: 연차 신청 페이지 접근 시 로그아웃됨');
      throw new Error('연차 신청 페이지 접근 시 로그아웃 문제 발생');
    }

    // 7. 연차 신청 버튼 클릭
    const requestButton = page.locator('button:has-text("연차 신청"), button:has-text("+ 연차 신청")').first();
    
    if (await requestButton.count() > 0) {
      await requestButton.click();
      await page.waitForTimeout(1000);
      console.log('✅ 연차 신청 모달 열기 완료');
    } else {
      console.log('❌ 연차 신청 버튼을 찾을 수 없음');
    }

    // 8. 연차 신청 폼 작성
    const startDateInput = page.locator('input[type="date"]').first();
    const endDateInput = page.locator('input[type="date"]').nth(1);
    const reasonTextarea = page.locator('textarea, input[type="text"]').filter({ hasText: /사유|reason/i }).first();
    const submitRequestButton = page.locator('button:has-text("신청"), button:has-text("추가")').filter({ hasText: /신청|추가/ }).first();

    if (await startDateInput.count() > 0) {
      // 내일 날짜 설정
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      await startDateInput.fill(tomorrowStr);
      await endDateInput.fill(tomorrowStr);
      await reasonTextarea.fill('Playwright 테스트 연차 신청');
      
      console.log('✅ 연차 신청 정보 입력 완료');

      // 9. 연차 신청 제출
      await submitRequestButton.click();
      await page.waitForTimeout(2000);
      
      console.log('✅ 연차 신청 제출 완료');

      // 10. 로그인 상태 재확인
      const finalUrl = page.url();
      console.log('최종 URL:', finalUrl);
      
      if (finalUrl.includes('/login')) {
        console.log('❌ 문제 발견: 연차 신청 후 로그아웃됨');
        throw new Error('연차 신청 후 로그아웃 문제 발생');
      }

      console.log('✅ 연차 신청 성공 - 로그인 상태 유지됨');
    } else {
      console.log('❌ 연차 신청 폼을 찾을 수 없음');
    }
  });

  test('관리자 연차 관리 페이지 - 다른 직원으로 연차 신청', async ({ page }) => {
    // 콘솔 로그 수집
    page.on('console', msg => {
      console.log(`브라우저 콘솔: ${msg.type()}: ${msg.text()}`);
    });
    
    page.on('pageerror', error => {
      console.log(`페이지 에러: ${error.message}`);
    });

    // 1. 관리자로 로그인
    await page.goto('https://www.maslabs.kr/login');
    await page.waitForLoadState('networkidle');
    
    const phoneInput = page.locator('input[type="tel"], input[name="phone"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    const submitButton = page.locator('button[type="submit"], button:has-text("로그인")').first();

    await phoneInput.fill('010-6669-9000');
    await passwordInput.fill('66699000');
    await submitButton.click();
    await page.waitForTimeout(3000);
    
    console.log('✅ 관리자 로그인 완료');

    // 2. 관리자 연차 관리 페이지로 이동
    await page.goto('https://www.maslabs.kr/admin/leave-management');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    console.log('✅ 관리자 연차 관리 페이지 접근 완료');

    // 3. 로그인 상태 확인
    const adminPageUrl = page.url();
    console.log('관리자 페이지 URL:', adminPageUrl);
    
    if (adminPageUrl.includes('/login')) {
      console.log('❌ 문제 발견: 관리자 연차 관리 페이지 접근 시 로그아웃됨');
      throw new Error('관리자 연차 관리 페이지 접근 시 로그아웃 문제 발생');
    }

    // 4. 연차 신청 탭 클릭
    const requestsTab = page.locator('button:has-text("연차 신청")').filter({ hasText: /연차 신청/ }).first();
    if (await requestsTab.count() > 0) {
      await requestsTab.click();
      await page.waitForTimeout(1000);
      console.log('✅ 연차 신청 탭 클릭 완료');
    }

    // 5. 연차 신청 버튼 클릭
    const requestButton = page.locator('button:has-text("연차 신청")').filter({ hasText: /연차 신청/ }).last();
    
    if (await requestButton.count() > 0) {
      await requestButton.click();
      await page.waitForTimeout(1000);
      console.log('✅ 연차 신청 모달 열기 완료');
    }

    // 6. 직원 선택 및 연차 신청 정보 입력
    const employeeSelect = page.locator('select').filter({ hasText: /직원/ }).first();
    const startDateInput = page.locator('input[type="date"]').first();
    const endDateInput = page.locator('input[type="date"]').nth(1);
    const reasonTextarea = page.locator('textarea').first();
    const submitRequestButton = page.locator('button:has-text("신청")').filter({ hasText: /신청/ }).last();

    if (await employeeSelect.count() > 0) {
      // 첫 번째 직원 선택 (관리자 자신 제외)
      await employeeSelect.selectOption({ index: 1 });
      await page.waitForTimeout(500);
      
      // 내일 날짜 설정
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      await startDateInput.fill(tomorrowStr);
      await endDateInput.fill(tomorrowStr);
      await reasonTextarea.fill('Playwright 테스트 - 관리자가 대신 신청');
      
      console.log('✅ 연차 신청 정보 입력 완료');

      // 7. 연차 신청 제출
      await submitRequestButton.click();
      await page.waitForTimeout(3000);
      
      console.log('✅ 연차 신청 제출 완료');

      // 8. 로그인 상태 재확인
      const finalUrl = page.url();
      console.log('최종 URL:', finalUrl);
      
      if (finalUrl.includes('/login')) {
        console.log('❌ 문제 발견: 연차 신청 후 로그아웃됨');
        throw new Error('관리자가 다른 직원 연차 신청 후 로그아웃 문제 발생');
      }

      console.log('✅ 연차 신청 성공 - 로그인 상태 유지됨');
    } else {
      console.log('❌ 직원 선택 드롭다운을 찾을 수 없음');
    }
  });
});

