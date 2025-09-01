import { test, expect } from '@playwright/test';

test.describe('관리자 직원별 스케줄 관리 기본 구조 테스트', () => {
  test('페이지 로딩 및 기본 구조 확인', async ({ page }) => {
    console.log('🚀 관리자 직원별 스케줄 관리 기본 구조 테스트 시작');
    
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
    
    // 2. 직원별 스케줄 관리 페이지로 이동
    await page.goto('https://www.maslabs.kr/admin/employee-schedules');
    await page.waitForLoadState('networkidle');
    console.log('✅ 직원별 스케줄 관리 페이지 접근');
    
    // 3. 30분 단위 시간대 확인
    console.log('📊 30분 단위 시간대 확인');
    
    // 시간대 라벨들이 30분 단위로 표시되는지 확인
    const timeLabels = page.locator('.grid.grid-cols-8 > div:first-child');
    const timeTexts = await timeLabels.allTextContents();
    console.log('시간대 라벨들:', timeTexts);
    
    // 30분 단위 시간대가 있는지 확인
    expect(timeTexts).toContain('9:00');
    expect(timeTexts).toContain('9:30');
    expect(timeTexts).toContain('10:00');
    expect(timeTexts).toContain('10:30');
    
    // 18-19시 시간대가 있는지 확인
    expect(timeTexts).toContain('18:00');
    expect(timeTexts).toContain('18:30');
    expect(timeTexts).toContain('19:00');
    
    console.log('✅ 30분 단위 및 18-19시 시간대 확인됨');
    
    // 4. 직원 목록 구조 확인
    console.log('👥 직원 목록 구조 확인');
    
    // 직원 검색창 확인
    const searchInput = page.locator('input[placeholder="직원 검색..."]');
    await expect(searchInput).toBeVisible();
    console.log('✅ 직원 검색창 확인됨');
    
    // 직원 목록 확인
    const employeeList = page.locator('div').filter({ hasText: /마스운영팀|STE 경영지원팀|JH 마스운영팀/ });
    const employeeCount = await employeeList.count();
    console.log(`📊 직원 목록 개수: ${employeeCount}`);
    
    // 5. 스크린샷 저장
    await page.screenshot({ path: 'test-results/admin-schedule-simple-test.png' });
    console.log('📸 스크린샷 저장됨');
    
    console.log('🎉 기본 구조 테스트 완료!');
  });
});
