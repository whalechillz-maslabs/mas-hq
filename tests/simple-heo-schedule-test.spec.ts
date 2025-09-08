import { test, expect } from '@playwright/test';

test.describe('허상원 스케줄 간단 테스트', () => {
  test('허상원 스케줄 표시 확인', async ({ page }) => {
    console.log('=== 허상원 스케줄 간단 테스트 시작 ===');
    
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
    
    // 3. 날짜를 2025-09-04로 설정
    const dateInput = page.locator('input[type="date"]');
    await dateInput.fill('2025-09-04');
    
    // 4. 필터 적용
    const applyFilterButton = page.locator('button:has-text("필터 적용")');
    await applyFilterButton.click();
    
    // 5. 로딩 완료 대기
    await page.waitForTimeout(5000);
    
    // 6. 페이지 전체 텍스트 확인
    const pageText = await page.textContent('body');
    console.log('페이지 전체 텍스트:', pageText);
    
    // 7. 허상원 관련 텍스트 찾기
    if (pageText?.includes('허상원')) {
      console.log('✅ 허상원이 페이지에 있습니다.');
      
      // 스케줄 관련 텍스트 찾기
      if (pageText.includes('09:00')) {
        console.log('✅ 09:00 스케줄이 표시됩니다.');
      } else {
        console.log('❌ 09:00 스케줄이 표시되지 않습니다.');
      }
      
      if (pageText.includes('13:00')) {
        console.log('✅ 13:00 스케줄이 표시됩니다.');
      } else {
        console.log('❌ 13:00 스케줄이 표시되지 않습니다.');
      }
      
      if (pageText.includes('10:00')) {
        console.log('⚠️ 10:00 스케줄도 표시됩니다.');
      }
      
    } else {
      console.log('❌ 허상원이 페이지에 없습니다.');
    }
    
    // 8. 스크린샷 촬영
    await page.screenshot({ 
      path: 'tests/screenshots/simple-heo-schedule-test.png',
      fullPage: true 
    });
    
    console.log('=== 허상원 스케줄 간단 테스트 완료 ===');
  });
});

