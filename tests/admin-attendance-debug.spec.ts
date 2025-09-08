import { test, expect } from '@playwright/test';

test.describe('관리자 출근 관리 페이지 디버그 테스트', () => {
  test('로그인 후 관리자 출근 관리 페이지 접근 및 디버그 정보 확인', async ({ page }) => {
    // 1. 로그인 페이지로 이동
    await page.goto('https://www.maslabs.kr/login');
    
    // 2. 로그인 폼 확인
    await expect(page.locator('input[type="tel"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // 3. 로그인 정보 입력
    await page.fill('input[type="tel"]', '010-6669-9000');
    await page.fill('input[type="password"]', '66699000');
    
    // 4. 로그인 버튼 클릭
    await page.click('button[type="submit"]');
    
    // 5. 로그인 성공 후 tasks 페이지로 이동 확인 (실제 리다이렉트 경로)
    await page.waitForURL('**/tasks', { timeout: 10000 });
    
    // 6. 관리자 출근 관리 페이지로 이동
    await page.goto('https://www.maslabs.kr/admin/attendance-management');
    
    // 7. 페이지 로딩 대기
    await page.waitForLoadState('networkidle');
    
    // 8. 디버그 정보 패널 확인
    const debugPanel = page.locator('.bg-yellow-50.border.border-yellow-200');
    await expect(debugPanel).toBeVisible();
    
    // 9. 디버그 정보 내용 확인
    const debugTitle = debugPanel.locator('h3');
    await expect(debugTitle).toContainText('🔍 디버그 정보');
    
    // 10. 기본 정보 확인
    const basicInfo = debugPanel.locator('h4').filter({ hasText: '기본 정보' });
    await expect(basicInfo).toBeVisible();
    
    // 11. 처리 단계 확인
    const processSteps = debugPanel.locator('h4').filter({ hasText: '처리 단계' });
    await expect(processSteps).toBeVisible();
    
    // 12. 디버그 정보 스크린샷
    await page.screenshot({ 
      path: 'tests/screenshots/admin-attendance-debug.png',
      fullPage: true 
    });
    
    // 13. 디버그 정보 텍스트 추출
    const debugText = await debugPanel.textContent();
    console.log('디버그 정보:', debugText);
    
    // 14. 오류 정보가 있는지 확인
    const errorSection = debugPanel.locator('h4').filter({ hasText: '오류 정보' });
    const hasErrors = await errorSection.isVisible();
    
    if (hasErrors) {
      console.log('❌ 오류가 발견되었습니다!');
      const errorText = await errorSection.textContent();
      console.log('오류 내용:', errorText);
    } else {
      console.log('✅ 오류가 없습니다!');
    }
    
    // 15. 통계 카드 확인
    const statsCards = page.locator('.grid.grid-cols-1.md\\:grid-cols-4 .bg-white.rounded-lg.shadow');
    await expect(statsCards).toHaveCount(4);
    
    // 16. 출근 기록 테이블 확인
    const attendanceTable = page.locator('table');
    await expect(attendanceTable).toBeVisible();
    
    // 17. 테이블 헤더 확인
    const tableHeaders = attendanceTable.locator('th');
    await expect(tableHeaders).toHaveCount(9); // 9개 컬럼
    
    // 18. 부서 필터 확인
    const departmentFilter = page.locator('select');
    await expect(departmentFilter).toBeVisible();
    
    // 19. 부서 옵션 확인
    const departmentOptions = departmentFilter.locator('option');
    const optionTexts = await departmentOptions.allTextContents();
    console.log('부서 옵션:', optionTexts);
    
    // 20. 실제 부서명이 포함되어 있는지 확인
    expect(optionTexts).toContain('개발팀');
    expect(optionTexts).toContain('디자인팀');
    expect(optionTexts).toContain('마케팅팀');
    expect(optionTexts).toContain('본사');
    expect(optionTexts).toContain('경영지원팀');
    expect(optionTexts).toContain('마스운영팀');
    expect(optionTexts).toContain('싱싱운영팀');
  });
  
  test('날짜 변경 시 디버그 정보 업데이트 확인', async ({ page }) => {
    // 1. 로그인
    await page.goto('https://www.maslabs.kr/login');
    await page.fill('input[type="tel"]', '010-6669-9000');
    await page.fill('input[type="password"]', '66699000');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/tasks');
    
    // 2. 관리자 출근 관리 페이지로 이동
    await page.goto('https://www.maslabs.kr/admin/attendance-management');
    await page.waitForLoadState('networkidle');
    
    // 3. 날짜 입력 필드 찾기
    const dateInput = page.locator('input[type="date"]');
    await expect(dateInput).toBeVisible();
    
    // 4. 다른 날짜로 변경
    await dateInput.fill('2025-09-03');
    
    // 5. 필터 적용 버튼 클릭
    const filterButton = page.locator('button').filter({ hasText: '필터 적용' });
    await filterButton.click();
    
    // 6. 디버그 정보 업데이트 대기
    await page.waitForTimeout(2000);
    
    // 7. 디버그 정보 확인
    const debugPanel = page.locator('.bg-yellow-50.border.border-yellow-200');
    await expect(debugPanel).toBeVisible();
    
    // 8. 변경된 날짜가 반영되었는지 확인
    const debugText = await debugPanel.textContent();
    expect(debugText).toContain('2025-09-03');
    
    console.log('날짜 변경 후 디버그 정보:', debugText);
  });
});
