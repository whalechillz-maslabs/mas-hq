import { test, expect } from '@playwright/test';

test.describe('출근 관리 페이지 테스트', () => {
  test('김탁수 계정으로 출근 관리 페이지 확인', async ({ page }) => {
    console.log('🚀 출근 관리 페이지 테스트 시작');
    
    // 1. 로그인
    await page.goto('https://www.maslabs.kr/login');
    await page.waitForLoadState('networkidle');
    
    // 김탁수 계정으로 로그인 (관리자)
    await page.fill('input[type="tel"]', '010-6669-9000');
    await page.fill('input[type="password"]', '66699000');
    await page.click('button[type="submit"]');
    
    // 로그인 후 빠른 업무 입력 페이지로 이동
    await page.waitForURL('**/quick-task');
    console.log('✅ 김탁수 계정 로그인 완료');
    
    // 2. 출근 관리 페이지로 이동
    await page.goto('https://www.maslabs.kr/admin/attendance-management');
    await page.waitForLoadState('networkidle');
    console.log('✅ 출근 관리 페이지 접근');
    
    // 3. 페이지 제목 확인
    const pageTitle = page.locator('h1');
    await expect(pageTitle).toContainText('MASLABS');
    console.log('✅ 페이지 제목 확인됨');
    
    // 4. 필터 요소들 확인
    const dateInput = page.locator('input[type="date"]');
    const departmentSelect = page.locator('select');
    const searchInput = page.locator('input[placeholder*="이름"]');
    
    await expect(dateInput).toBeVisible();
    await expect(departmentSelect).toBeVisible();
    await expect(searchInput).toBeVisible();
    console.log('✅ 필터 요소들 확인됨');
    
    // 5. 통계 카드 확인
    const statsCards = page.locator('div.bg-white.rounded-lg.shadow').filter({ hasText: /출근 완료|근무 중|미출근|평균 근무시간/ });
    await expect(statsCards).toHaveCount(4);
    console.log('✅ 통계 카드 4개 확인됨');
    
    // 6. 출근 기록 테이블 확인
    const attendanceTable = page.locator('table');
    await expect(attendanceTable).toBeVisible();
    console.log('✅ 출근 기록 테이블 확인됨');
    
    // 7. 실제 데이터 확인 (수정 후)
    const employeeRows = page.locator('tbody tr');
    const rowCount = await employeeRows.count();
    console.log(`📊 현재 출근 기록 수: ${rowCount}개`);
    
    if (rowCount > 0) {
      const firstRowData = await employeeRows.first().textContent();
      console.log('첫 번째 기록:', firstRowData);
    }
    
    // 8. 스크린샷 저장
    await page.screenshot({ path: 'test-results/attendance-management-test.png' });
    console.log('📸 스크린샷 저장됨');
    
    console.log('🎉 출근 관리 페이지 테스트 완료!');
  });
});
