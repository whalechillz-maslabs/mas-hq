import { test, expect } from '@playwright/test';

test.describe('팀 관리 기능 직원 출근 관리 테스트', () => {
  test('김탁수 계정으로 직원 출근 관리 테스트', async ({ page }) => {
    console.log('🚀 김탁수 계정 직원 출근 관리 테스트 시작');
    
    // 1. 로그인
    await page.goto('https://www.maslabs.kr/login');
    console.log('✅ 로그인 페이지 접근');
    
    // 전화번호 입력 (실제 김탁수 계정)
    await page.fill('input[name="phone"]', '010-6669-9000');
    await page.fill('input[name="password"]', '66699000');
    await page.click('button:has-text("로그인")');
    
    // 로그인 완료 대기
    await page.waitForURL('**/quick-task');
    console.log('✅ 김탁수 계정 로그인 완료');
    
    // 2. 직원 출근 관리 페이지로 이동
    await page.goto('https://www.maslabs.kr/admin/attendance-management');
    console.log('🔍 직원 출근 관리 페이지로 이동 중...');
    
    // 페이지 로딩 대기
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // 3. 페이지 제목 확인
    const pageTitle = await page.locator('h1, [class*="title"]').first().textContent();
    console.log('📌 페이지 제목:', pageTitle);
    expect(pageTitle).toContain('출근 관리');
    
    // 4. 로딩 상태 확인
    const loadingElement = page.locator('text=로딩 중...');
    const hasLoading = await loadingElement.count() > 0;
    console.log('🔄 로딩 상태:', hasLoading ? '로딩 중' : '로딩 완료');
    
    if (hasLoading) {
      console.log('⚠️ 페이지가 로딩 중입니다. 잠시 대기...');
      await page.waitForTimeout(5000);
    }
    
    // 5. 통계 카드 확인
    const statsCards = page.locator('[class*="grid"] > div, [class*="card"]').filter({ hasText: /출근 완료|근무 중|미출근|평균 근무시간/ });
    const statsCount = await statsCards.count();
    console.log('📊 통계 카드 수:', statsCount);
    
    if (statsCount > 0) {
      for (let i = 0; i < statsCount; i++) {
        const cardText = await statsCards.nth(i).textContent();
        console.log(`📊 통계 카드 ${i + 1}:`, cardText?.trim());
      }
    }
    
    // 6. 출근 기록 테이블 확인
    const table = page.locator('table, [class*="table"]');
    const hasTable = await table.count() > 0;
    console.log('📋 출근 기록 테이블 존재:', hasTable);
    
    if (hasTable) {
      const rows = table.locator('tr, [class*="row"]');
      const rowCount = await rows.count();
      console.log('📋 테이블 행 수:', rowCount);
      
      if (rowCount > 1) { // 헤더 제외
        for (let i = 1; i < Math.min(rowCount, 4); i++) { // 처음 3개 행만 확인
          const rowText = await rows.nth(i).textContent();
          console.log(`📋 행 ${i}:`, rowText?.trim());
        }
      }
    }
    
    // 7. 액션 버튼 확인
    const actionButtons = page.locator('button, [class*="action"], [class*="icon"]');
    const actionCount = await actionButtons.count();
    console.log('🔘 액션 버튼 수:', actionCount);
    
    if (actionCount > 0) {
      for (let i = 0; i < Math.min(actionCount, 5); i++) {
        const buttonText = await actionButtons.nth(i).textContent();
        const buttonClass = await actionButtons.nth(i).getAttribute('class');
        console.log(`🔘 액션 버튼 ${i + 1}:`, buttonText?.trim(), '클래스:', buttonClass);
      }
    }
    
    // 8. 필터 및 검색 기능 확인
    const dateFilter = page.locator('input[type="date"], input[placeholder*="날짜"], input[placeholder*="Date"]');
    const departmentFilter = page.locator('select, [class*="select"], [class*="dropdown"]');
    const searchInput = page.locator('input[placeholder*="검색"], input[placeholder*="Search"], input[placeholder*="이름"]');
    
    console.log('🔍 날짜 필터 존재:', await dateFilter.count() > 0);
    console.log('🔍 부서 필터 존재:', await departmentFilter.count() > 0);
    console.log('🔍 검색 입력창 존재:', await searchInput.count() > 0);
    
    // 9. 엑셀 다운로드 버튼 확인
    const excelButton = page.locator('button:has-text("엑셀"), button:has-text("Excel"), button:has-text("다운로드")');
    console.log('📥 엑셀 다운로드 버튼 존재:', await excelButton.count() > 0);
    
    // 10. 스크린샷 저장
    await page.screenshot({ path: 'tests/screenshots/attendance-admin-kimtaksu.png' });
    console.log('📸 스크린샷 저장됨');
    
    console.log('🎉 김탁수 계정 직원 출근 관리 테스트 완료!');
  });

  test('허상원 계정으로 직원 출근 관리 테스트', async ({ page }) => {
    console.log('🚀 허상원 계정 직원 출근 관리 테스트 시작');
    
    // 1. 로그인
    await page.goto('https://www.maslabs.kr/login');
    console.log('✅ 로그인 페이지 접근');
    
    // 전화번호 입력 (실제 허상원 계정)
    await page.fill('input[name="phone"]', '010-8948-4501');
    await page.fill('input[name="password"]', '89484501');
    await page.click('button:has-text("로그인")');
    
    // 로그인 완료 대기
    await page.waitForURL('**/quick-task');
    console.log('✅ 허상원 계정 로그인 완료');
    
    // 2. 직원 출근 관리 페이지로 이동
    await page.goto('https://www.maslabs.kr/admin/attendance-management');
    console.log('🔍 직원 출근 관리 페이지로 이동 중...');
    
    // 페이지 로딩 대기
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);
    
    // 3. 페이지 제목 확인
    const pageTitle = await page.locator('h1, [class*="title"]').first().textContent();
    console.log('📌 페이지 제목:', pageTitle);
    
    // 4. 권한 확인 (허상원은 관리자가 아닐 수 있음)
    const accessDenied = page.locator('text=권한이 필요합니다, text=Access Denied, text=권한');
    const hasAccess = await accessDenied.count() === 0;
    console.log('🔐 페이지 접근 권한:', hasAccess ? '접근 가능' : '접근 거부됨');
    
    if (hasAccess) {
      // 5. 로딩 상태 확인
      const loadingElement = page.locator('text=로딩 중...');
      const hasLoading = await loadingElement.count() > 0;
      console.log('🔄 로딩 상태:', hasLoading ? '로딩 중' : '로딩 완료');
      
      if (hasLoading) {
        console.log('⚠️ 페이지가 로딩 중입니다. 잠시 대기...');
        await page.waitForTimeout(5000);
      }
      
      // 6. 통계 카드 확인
      const statsCards = page.locator('[class*="grid"] > div, [class*="card"]').filter({ hasText: /출근 완료|근무 중|미출근|평균 근무시간/ });
      const statsCount = await statsCards.count();
      console.log('📊 통계 카드 수:', statsCount);
      
      // 7. 출근 기록 테이블 확인
      const table = page.locator('table, [class*="table"]');
      const hasTable = await table.count() > 0;
      console.log('📋 출근 기록 테이블 존재:', hasTable);
    }
    
    // 8. 스크린샷 저장
    await page.screenshot({ path: 'tests/screenshots/attendance-admin-heosangwon.png' });
    console.log('📸 스크린샷 저장됨');
    
    console.log('🎉 허상원 계정 직원 출근 관리 테스트 완료!');
  });
});
