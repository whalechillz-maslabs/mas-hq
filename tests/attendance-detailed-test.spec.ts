import { test, expect } from '@playwright/test';

test.describe('출근 관리 페이지 상세 테스트', () => {
  test('출근 관리 페이지 데이터 로딩 및 기능 확인', async ({ page }) => {
    console.log('🚀 출근 관리 페이지 상세 테스트 시작');
    
    // 1. 로그인
    await page.goto('https://www.maslabs.kr/login');
    console.log('✅ 로그인 페이지 접근');
    
    // 전화번호 입력
    await page.fill('input[placeholder="전화번호"]', '01012345678');
    await page.fill('input[placeholder="비밀번호"]', 'password123');
    await page.click('button:has-text("로그인")');
    
    // 로그인 완료 대기
    await page.waitForURL('**/quick-task');
    console.log('✅ 김탁수 계정 로그인 완료');
    
    // 2. 출근 관리 페이지로 이동
    await page.goto('https://www.maslabs.kr/admin/attendance-management');
    console.log('🔍 출근 관리 페이지로 이동 중...');
    
    // 페이지 로딩 대기
    await page.waitForLoadState('networkidle');
    
    // 3. 페이지 제목 확인
    const pageTitle = await page.locator('h1').first().textContent();
    console.log('📌 페이지 제목:', pageTitle);
    expect(pageTitle).toContain('출근 관리');
    
    // 4. 데이터 로딩 상태 확인
    const loadingElement = page.locator('text=로딩 중...');
    const hasLoading = await loadingElement.count() > 0;
    console.log('🔄 로딩 상태:', hasLoading ? '로딩 중' : '로딩 완료');
    
    if (hasLoading) {
      console.log('⚠️ 페이지가 로딩 중입니다. 잠시 대기...');
      await page.waitForTimeout(5000);
    }
    
    // 5. 통계 카드 확인
    const statsCards = page.locator('[class*="grid"] > div').filter({ hasText: /출근 완료|근무 중|미출근|평균 근무시간/ });
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
    
    // 9. 콘솔 오류 확인
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // 10. 네트워크 요청 확인
    const networkErrors: string[] = [];
    page.on('response', response => {
      if (response.status() >= 400) {
        networkErrors.push(`${response.url()} - ${response.status()}`);
      }
    });
    
    // 페이지 새로고침하여 오류 확인
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    console.log('📊 총 콘솔 오류 수:', consoleErrors.length);
    if (consoleErrors.length > 0) {
      console.log('콘솔 오류 목록:');
      consoleErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    console.log('📊 총 네트워크 오류 수:', networkErrors.length);
    if (networkErrors.length > 0) {
      console.log('네트워크 오류 목록:');
      networkErrors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
    }
    
    // 11. 스크린샷 저장
    await page.screenshot({ path: 'tests/screenshots/attendance-detailed-test.png' });
    console.log('📸 스크린샷 저장됨');
    
    console.log('🎉 출근 관리 페이지 상세 테스트 완료!');
  });
});
