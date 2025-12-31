import { test, expect } from '@playwright/test';

test.describe('연차 관리 시스템 - 대시보드 및 관리자 기능 테스트', () => {
  
  // 테스트 1: 대시보드 특별연차/특별근무 표시 확인
  test('대시보드 특별연차 및 특별근무 표시 테스트', async ({ page }) => {
    // 콘솔 로그 수집
    page.on('console', msg => {
      console.log(`브라우저 콘솔: ${msg.type()}: ${msg.text()}`);
    });
    
    page.on('pageerror', error => {
      console.log(`페이지 에러: ${error.message}`);
    });

    // 1. 최형호로 로그인
    await page.goto('https://www.maslabs.kr/login');
    await page.waitForLoadState('networkidle');
    
    const phoneInput = page.locator('input[type="tel"], input[name="phone"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    const submitButton = page.locator('button[type="submit"], button:has-text("로그인")').first();

    // 최형호 계정으로 로그인 (실제 계정 정보 확인 필요)
    await phoneInput.fill('010-9132-4337');
    await passwordInput.fill('91324337');
    await submitButton.click();
    await page.waitForTimeout(3000);
    
    console.log('✅ 최형호 로그인 완료');

    // 2. 대시보드로 이동
    await page.goto('https://www.maslabs.kr/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    console.log('✅ 대시보드 접근 완료');

    // 3. "특별연차 및 특별 근무" 섹션 확인
    const specialSection = page.locator('text=특별연차 및 특별 근무').first();
    await expect(specialSection).toBeVisible({ timeout: 10000 });
    
    console.log('✅ 특별연차 및 특별 근무 섹션 확인');

    // 4. 특별연차 데이터 확인
    const welfareLeaveText = page.locator('text=최근 특별연차');
    const noDataText = page.locator('text=특별연차 및 특별 근무 내역이 없습니다');
    
    if (await welfareLeaveText.count() > 0) {
      console.log('✅ 특별연차 데이터 있음');
      
      // 날짜 형식 확인 (2026년 1월 1일(목))
      const datePattern = /\d{4}년 \d{1,2}월 \d{1,2}일\([월화수목금토일]\)/;
      const dateText = await page.locator('text=/\\d{4}년 \\d{1,2}월 \\d{1,2}일\\([월화수목금토일]\\)/').first().textContent();
      console.log('특별연차 날짜:', dateText);
      
      // 일수 확인
      const daysText = page.locator('text=일수: 1일');
      if (await daysText.count() > 0) {
        console.log('✅ 일수 표시 확인');
      }
      
      // 사유 확인
      const reasonText = page.locator('text=/사유: .+/');
      if (await reasonText.count() > 0) {
        const reason = await reasonText.first().textContent();
        console.log('특별연차 사유:', reason);
      }
    } else if (await noDataText.count() > 0) {
      console.log('⚠️ 특별연차 데이터 없음 - "내역이 없습니다" 메시지 표시');
    }

    // 5. 특별근무 데이터 확인
    const specialWorkText = page.locator('text=최근 특별 근무');
    
    if (await specialWorkText.count() > 0) {
      console.log('✅ 특별근무 데이터 있음');
      
      // 날짜 형식 확인 (2025년 11월 22일(토))
      const workDatePattern = /\d{4}년 \d{1,2}월 \d{1,2}일\([월화수목금토일]\)/;
      const workDateText = await page.locator('text=/\\d{4}년 \\d{1,2}월 \\d{1,2}일\\([월화수목금토일]\\)/').first().textContent();
      console.log('특별근무 날짜:', workDateText);
      
      // 시간 범위 확인 (9-10시)
      const timeText = page.locator('text=/\\d+-\\d+시/');
      if (await timeText.count() > 0) {
        const time = await timeText.first().textContent();
        console.log('특별근무 시간:', time);
      }
      
      // 사유 확인
      const workReasonText = page.locator('text=/사유: .+/');
      if (await workReasonText.count() > 0) {
        const workReason = await workReasonText.first().textContent();
        console.log('특별근무 사유:', workReason);
      }
    } else if (await noDataText.count() > 0) {
      console.log('⚠️ 특별근무 데이터 없음 - "내역이 없습니다" 메시지 표시');
    }

    // 6. 스크린샷 저장
    await page.screenshot({ path: 'tests/screenshots/dashboard-special-leave-work.png', fullPage: true });
    console.log('✅ 스크린샷 저장 완료');
  });
  
  // 테스트 2: 관리자 연차 신청 현황 CRUD 기능 테스트
  test('관리자 연차 신청 현황 수정/삭제 기능 테스트', async ({ page }) => {
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

    // 3. "연차 신청" 탭 클릭
    const requestsTab = page.locator('button:has-text("연차 신청")').first();
    if (await requestsTab.count() > 0) {
      await requestsTab.click();
      await page.waitForTimeout(1000);
      console.log('✅ 연차 신청 탭 클릭 완료');
    }

    // 4. 연차 신청 목록 테이블 확인
    const requestsTable = page.locator('table').filter({ hasText: /연차 신청 현황/ });
    await expect(requestsTable).toBeVisible({ timeout: 10000 });
    
    console.log('✅ 연차 신청 목록 테이블 확인');

    // 5. "액션" 컬럼 확인
    const actionColumn = page.locator('th:has-text("액션"), th:has-text("action")').first();
    const actionColumnVisible = await actionColumn.count() > 0;
    console.log('액션 컬럼 존재:', actionColumnVisible);
    
    // 6. pending 상태 신청 확인
    const pendingRows = page.locator('tr').filter({ hasText: /대기|pending/i });
    const pendingCount = await pendingRows.count();
    console.log('대기 중인 신청 수:', pendingCount);
    
    if (pendingCount > 0) {
      // 7. pending 신청에 수정/삭제 버튼 확인
      const editButton = pendingRows.first().locator('button:has-text("수정"), button:has-text("edit")');
      const deleteButton = pendingRows.first().locator('button:has-text("삭제"), button:has-text("delete")');
      
      const hasEditButton = await editButton.count() > 0;
      const hasDeleteButton = await deleteButton.count() > 0;
      
      console.log('수정 버튼 존재:', hasEditButton);
      console.log('삭제 버튼 존재:', hasDeleteButton);
      
      if (!hasEditButton || !hasDeleteButton) {
        console.log('⚠️ pending 신청에 수정/삭제 버튼이 없습니다');
      }
    } else {
      console.log('⚠️ 대기 중인 신청이 없습니다');
    }
    
    // 8. approved/rejected 상태 신청 확인
    const approvedRows = page.locator('tr').filter({ hasText: /승인|approved/i });
    const approvedCount = await approvedRows.count();
    console.log('승인된 신청 수:', approvedCount);
    
    if (approvedCount > 0) {
      const approvedEditButton = approvedRows.first().locator('button:has-text("수정")');
      const hasApprovedEditButton = await approvedEditButton.count() > 0;
      console.log('승인된 신청에 수정 버튼 존재:', hasApprovedEditButton);
      
      if (hasApprovedEditButton) {
        console.log('⚠️ 승인된 신청에 수정 버튼이 있습니다 (제거 필요)');
      }
    }

    // 9. 스크린샷 저장
    await page.screenshot({ path: 'tests/screenshots/admin-leave-requests-crud.png', fullPage: true });
    console.log('✅ 스크린샷 저장 완료');
  });
  
  // 테스트 3: welfare_leave_policy 데이터 조회 테스트
  test('welfare_leave_policy 데이터 조회 및 표시 테스트', async ({ page }) => {
    // 콘솔 로그 수집
    const consoleMessages: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(text);
      if (text.includes('welfare') || text.includes('복지') || text.includes('welfare_leave_policy')) {
        console.log(`브라우저 콘솔: ${msg.type()}: ${text}`);
      }
    });
    
    page.on('pageerror', error => {
      console.log(`페이지 에러: ${error.message}`);
    });

    // 1. 최형호로 로그인
    await page.goto('https://www.maslabs.kr/login');
    await page.waitForLoadState('networkidle');
    
    const phoneInput = page.locator('input[type="tel"], input[name="phone"]').first();
    const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
    const submitButton = page.locator('button[type="submit"], button:has-text("로그인")').first();

    await phoneInput.fill('010-9132-4337');
    await passwordInput.fill('91324337');
    await submitButton.click();
    await page.waitForTimeout(3000);
    
    console.log('✅ 최형호 로그인 완료');

    // 2. 대시보드로 이동
    await page.goto('https://www.maslabs.kr/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000); // 데이터 로드 대기
    
    console.log('✅ 대시보드 접근 완료');

    // 3. 콘솔에서 welfare_leave_policy 조회 로그 확인
    const welfareLogs = consoleMessages.filter(msg => 
      msg.includes('welfare') || 
      msg.includes('복지') || 
      msg.includes('welfare_leave_policy') ||
      msg.includes('error') ||
      msg.includes('Error')
    );
    
    console.log('복지 연차 관련 로그:', welfareLogs);
    
    // 4. 특별연차 섹션 확인
    const specialLeaveSection = page.locator('text=특별연차 및 특별 근무').first();
    await expect(specialLeaveSection).toBeVisible({ timeout: 10000 });
    
    // 5. 데이터 표시 확인
    const hasWelfareData = await page.locator('text=최근 특별연차').count() > 0;
    const hasNoDataMessage = await page.locator('text=특별연차 및 특별 근무 내역이 없습니다').count() > 0;
    
    console.log('특별연차 데이터 있음:', hasWelfareData);
    console.log('데이터 없음 메시지:', hasNoDataMessage);
    
    // 6. 스크린샷 저장
    await page.screenshot({ path: 'tests/screenshots/welfare-leave-policy-test.png', fullPage: true });
    console.log('✅ 스크린샷 저장 완료');
  });
});

