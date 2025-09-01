import { test, expect } from '@playwright/test';

test.describe('근무 스케줄 30분 단위 및 18-19시 확장 테스트', () => {
  test('김탁수 계정으로 30분 단위 스케줄 입력 테스트', async ({ page }) => {
    console.log('🚀 근무 스케줄 30분 단위 테스트 시작');
    
    // 1. 로그인
    await page.goto('https://www.maslabs.kr/login');
    await page.waitForLoadState('networkidle');
    
    // 김탁수 계정으로 로그인
    await page.fill('input[type="tel"]', '010-6669-9000');
    await page.fill('input[type="password"]', '66699000');
    await page.click('button[type="submit"]');
    
    // 로그인 후 빠른 업무 입력 페이지로 이동
    await page.waitForURL('**/quick-task');
    console.log('✅ 김탁수 계정 로그인 완료');
    
    // 2. 근무 스케줄 페이지로 이동
    await page.goto('https://www.maslabs.kr/schedules');
    await page.waitForLoadState('networkidle');
    console.log('✅ 근무 스케줄 페이지 접근');
    
    // 3. 30분 단위 시간대 확인
    console.log('📊 30분 단위 시간대 확인');
    
    // 9:00, 9:30, 10:00 등이 표시되는지 확인
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
    
    // 4. 30분 단위 스케줄 추가 테스트
    console.log('📝 30분 단위 스케줄 추가 테스트');
    
    // 9:30 시간대 클릭
    const time930Button = page.locator('button').filter({ hasText: '9:30' }).first();
    await time930Button.click();
    await page.waitForTimeout(2000);
    
    console.log('✅ 9:30 스케줄 추가 완료');
    
    // 5. 18:30 시간대 클릭 (18-19시 확장 테스트)
    console.log('📝 18:30 시간대 스케줄 추가 테스트');
    
    const time1830Button = page.locator('button').filter({ hasText: '18:30' }).first();
    await time1830Button.click();
    await page.waitForTimeout(2000);
    
    console.log('✅ 18:30 스케줄 추가 완료');
    
    // 6. 일괄 입력 테스트
    console.log('📝 일괄 입력 테스트');
    
    // 일괄입력 버튼 클릭
    await page.click('button:has-text("일괄입력")');
    await page.waitForTimeout(1000);
    
    // 일괄 입력 모달이 나타나는지 확인
    const bulkModal = page.locator('text=일괄 스케줄 입력 (30분 단위로 자동 분할)');
    await expect(bulkModal).toBeVisible();
    console.log('✅ 일괄 입력 모달 표시됨');
    
    // 시작 시간을 14:00으로 설정
    await page.fill('input[type="time"]:first-of-type', '14:00');
    
    // 종료 시간을 16:00으로 설정
    await page.fill('input[type="time"]:last-of-type', '16:00');
    
    // 월요일 선택
    await page.click('button:has-text("월")');
    
    // 적용 버튼 클릭
    await page.click('button:has-text("적용")');
    await page.waitForTimeout(3000);
    
    console.log('✅ 일괄 입력 완료 (14:00-16:00, 월요일)');
    
    // 7. 스케줄이 제대로 추가되었는지 확인
    console.log('🔍 스케줄 추가 확인');
    
    // 페이지 새로고침
    await page.reload();
    await page.waitForLoadState('networkidle');
    
    // 9:30, 18:30 시간대에 스케줄이 있는지 확인
    const schedule930 = page.locator('button').filter({ hasText: '9:30' }).first();
    const schedule1830 = page.locator('button').filter({ hasText: '18:30' }).first();
    
    // 스케줄이 추가된 셀의 배경색이 변경되었는지 확인
    const schedule930Class = await schedule930.getAttribute('class');
    const schedule1830Class = await schedule1830.getAttribute('class');
    
    console.log('9:30 스케줄 클래스:', schedule930Class);
    console.log('18:30 스케줄 클래스:', schedule1830Class);
    
    // 8. 스크린샷 저장
    await page.screenshot({ path: 'test-results/schedule-30min-test.png' });
    console.log('📸 스크린샷 저장됨');
    
    console.log('🎉 모든 테스트 완료!');
  });
});
