import { test, expect } from '@playwright/test';

test.describe('Admin Page Time Display Fix Test', () => {
  test('관리자 페이지에서 김탁수 출근 시간 확인', async ({ page }) => {
    // 로그인 페이지로 이동
    await page.goto('https://maslabs.kr/login');
    
    // 로그인 폼 작성
    await page.fill('input[name="phone"]', '010-6669-9000');
    await page.fill('input[name="password"]', '66699000');
    
    // 로그인 버튼 클릭
    await page.click('button[type="submit"]');
    
    // 로그인 후 리다이렉트 확인
    await page.waitForURL('**/dashboard', { timeout: 10000 }).catch(async () => {
      await page.waitForURL('**/tasks', { timeout: 10000 });
    });
    
    console.log('✅ 로그인 성공');
    
    // 관리자 출근 관리 페이지로 이동
    await page.goto('https://maslabs.kr/admin/attendance-management');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ 관리자 페이지 로딩 완료');
    
    // 김탁수 행 찾기
    const kimTaksuRow = page.locator('tr:has-text("김탁수")');
    await expect(kimTaksuRow).toBeVisible();
    
    // 김탁수의 실제 출근 시간 확인
    const checkInTimeCell = kimTaksuRow.locator('td').nth(2); // 실제 출근 컬럼
    await expect(checkInTimeCell).toBeVisible();
    
    const checkInTimeText = await checkInTimeCell.textContent();
    console.log('김탁수 실제 출근 시간:', checkInTimeText);
    
    // 시간이 올바른 형식인지 확인 (08:17 형태)
    expect(checkInTimeText).toMatch(/\d{2}:\d{2}/);
    
    // 17:17이 아닌 08:17 형태인지 확인
    expect(checkInTimeText).not.toContain('17:17');
    expect(checkInTimeText).toContain('08:17');
    
    console.log('✅ 김탁수 출근 시간 형식 확인');
    
    // 위치 정보 확인 (위치 없음으로 표시되어야 함)
    const locationCell = kimTaksuRow.locator('td').nth(6); // 위치 컬럼
    await expect(locationCell).toBeVisible();
    
    const locationText = await locationCell.textContent();
    console.log('김탁수 위치 정보:', locationText);
    
    expect(locationText).toBe('위치 없음');
    console.log('✅ 위치 정보 확인');
    
    // 상태 확인 (근무중으로 표시되어야 함)
    const statusCell = kimTaksuRow.locator('td').nth(7); // 상태 컬럼
    await expect(statusCell).toBeVisible();
    
    const statusText = await statusCell.textContent();
    console.log('김탁수 상태:', statusText);
    
    expect(statusText).toContain('근무중');
    console.log('✅ 상태 확인');
    
    // 스크린샷 저장
    await page.screenshot({ path: 'admin-time-fix-test.png', fullPage: true });
    
    console.log('🎉 관리자 페이지 시간 표시 수정 확인 완료!');
  });
});
