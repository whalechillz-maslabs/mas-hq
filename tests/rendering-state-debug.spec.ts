import { test, expect } from '@playwright/test';

test.describe('렌더링 상태 디버그', () => {
  test('로딩 및 렌더링 상태 확인', async ({ page }) => {
    console.log('🎨 렌더링 상태 디버그 시작');
    
    // 모든 콘솔 메시지 캡처
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('렌더링') || text.includes('Loading') || text.includes('loadSchedules')) {
        console.log(`📝 ${text}`);
      }
    });
    
    // 페이지로 이동
    await page.goto('https://maslabs.kr/admin/insert-attendance');
    await page.waitForLoadState('networkidle');
    console.log('✅ 페이지 로딩 완료');
    
    // 초기 상태 확인
    await page.waitForTimeout(2000);
    
    // 날짜를 9월 19일로 변경
    const dateInput = page.locator('input[type="date"]');
    await dateInput.fill('2025-09-19');
    console.log('📅 날짜 변경 완료');
    
    // 조회 버튼 클릭
    const searchButton = page.locator('button:has-text("조회")');
    await searchButton.click();
    console.log('🔍 조회 버튼 클릭 완료');
    
    // 충분한 시간 대기
    await page.waitForTimeout(5000);
    
    // DOM 상태 확인
    const finalState = await page.evaluate(() => {
      const loadingDiv = document.querySelector('[class*="animate-spin"]');
      const noDataDiv = document.querySelector(':has-text("해당 조건에 맞는 스케줄이 없습니다")');
      const table = document.querySelector('table');
      
      return {
        hasLoadingSpinner: !!loadingDiv,
        hasNoDataMessage: !!noDataDiv,
        hasTable: !!table,
        bodyInnerText: document.body.innerText.includes('해당 조건에 맞는 스케줄이 없습니다'),
        totalElements: document.querySelectorAll('*').length
      };
    });
    
    console.log('🏗️ 최종 DOM 상태:', JSON.stringify(finalState, null, 2));
    
    // React 상태 확인 (가능하다면)
    const reactState = await page.evaluate(() => {
      // React DevTools가 있다면 상태 확인
      if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
        return { hasReactDevTools: true };
      }
      return { hasReactDevTools: false };
    });
    
    console.log('⚛️ React 상태:', JSON.stringify(reactState, null, 2));
    
    console.log('🏁 렌더링 상태 디버그 완료');
  });
});
