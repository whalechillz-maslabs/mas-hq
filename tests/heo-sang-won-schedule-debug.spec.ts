import { test, expect } from '@playwright/test';

test.describe('허상원 스케줄 표시 문제 디버깅', () => {
  test('허상원 스케줄 표시 확인', async ({ page }) => {
    console.log('=== 허상원 스케줄 표시 문제 디버깅 시작 ===');
    
    // 1. 로그인
    await page.goto('https://www.maslabs.kr/login');
    await page.waitForLoadState('networkidle');
    
    await page.fill('input[type="tel"]', '010-6669-9000');
    await page.fill('input[type="password"]', '66699000');
    await page.click('button[type="submit"]');
    
    await page.waitForURL('**/tasks');
    
    // 2. 관리자 출근 관리 페이지로 이동
    await page.goto('https://www.maslabs.kr/admin/attendance-management');
    await page.waitForLoadState('networkidle');
    
    console.log('--- 관리자 출근 관리 페이지 로딩 완료 ---');
    
    // 3. 날짜를 2025-09-04로 설정
    const dateInput = page.locator('input[type="date"]');
    await dateInput.fill('2025-09-04');
    
    // 4. 필터 적용
    const applyFilterButton = page.locator('button:has-text("필터 적용")');
    await applyFilterButton.click();
    
    // 5. 로딩 완료 대기
    await page.waitForTimeout(3000);
    
    console.log('--- 2025-09-04 데이터 로딩 완료 ---');
    
    // 6. 허상원 행 찾기
    const heoSangWonRow = page.locator('text=허상원').first();
    const heoRowCount = await heoSangWonRow.count();
    
    if (heoRowCount > 0) {
      console.log('✅ 허상원 행을 찾았습니다.');
      
      // 허상원 행의 부모 요소 찾기
      const heoRowElement = heoSangWonRow.locator('..').first();
      const rowText = await heoRowElement.textContent();
      console.log('허상원 행 내용:', rowText);
      
      // 스케줄 정보 확인 (더 안전한 방법)
      const scheduleText = await heoRowElement.locator('text=스케줄').locator('..').textContent();
      console.log('스케줄 표시:', scheduleText);
      
      // 실제 출근 정보 확인
      const actualClockInText = await heoRowElement.locator('text=실제 출근').locator('..').textContent();
      console.log('실제 출근 표시:', actualClockInText);
      
      // 근무 시간 확인
      const workHoursText = await heoRowElement.locator('text=시간').locator('..').textContent();
      console.log('근무 시간 표시:', workHoursText);
      
      // 예상값과 비교
      console.log('\\n=== 예상값 vs 실제값 비교 ===');
      console.log('예상 스케줄: 09:00 - 13:00 (4h)');
      console.log('실제 스케줄:', scheduleText);
      console.log('예상 실제 출근: 오전 09:00');
      console.log('실제 출근:', actualClockInText);
      console.log('예상 근무시간: 4.00시간');
      console.log('실제 근무시간:', workHoursText);
      
      // 스케줄 표시 문제 확인
      if (scheduleText?.includes('09:00') && scheduleText?.includes('13:00')) {
        console.log('✅ 스케줄 표시가 정상입니다.');
      } else if (scheduleText?.includes('10:00')) {
        console.log('❌ 스케줄이 여전히 10:00부터 표시됩니다.');
      } else {
        console.log('❓ 스케줄 표시가 예상과 다릅니다.');
      }
      
    } else {
      console.log('❌ 허상원 행을 찾을 수 없습니다.');
    }
    
    // 7. 디버그 정보 확인
    const debugButton = page.locator('button:has-text("디버그 보기")');
    const debugButtonCount = await debugButton.count();
    
    if (debugButtonCount > 0) {
      console.log('\\n--- 디버그 정보 확인 ---');
      await debugButton.click();
      
      // 디버그 패널 내용 확인
      const debugPanel = page.locator('[class*="debug"], [class*="Debug"]');
      const debugPanelCount = await debugPanel.count();
      
      if (debugPanelCount > 0) {
        const debugText = await debugPanel.textContent();
        console.log('디버그 정보:', debugText);
      }
    }
    
    // 8. 스크린샷 촬영
    await page.screenshot({ 
      path: 'tests/screenshots/heo-sang-won-schedule-debug.png',
      fullPage: true 
    });
    
    console.log('=== 허상원 스케줄 표시 문제 디버깅 완료 ===');
  });
});
