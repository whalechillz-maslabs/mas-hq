import { test, expect } from '@playwright/test';

test.describe('업무 추가 모달 디버깅', () => {
  test.beforeEach(async ({ page }) => {
    // 배포 서버로 접속
    await page.goto('https://www.maslabs.kr/login');
    
    // 관리자 로그인
    await page.fill('input[type="tel"]', '010-6669-9000');
    await page.fill('input[type="password"]', '66699000');
    await page.click('button[type="submit"]');
    
    // 대시보드 로딩 대기
    await page.waitForURL('**/dashboard', { timeout: 15000 });
  });

  test('업무 추가 모달 디버깅', async ({ page }) => {
    console.log('🔍 업무 추가 모달 디버깅 시작');
    
    // 업무 기록 페이지로 이동
    await page.goto('https://www.maslabs.kr/tasks');
    await page.waitForLoadState('networkidle');
    
    console.log('✅ 업무 기록 페이지 접근 완료');
    
    // 페이지 콘솔 로그 확인
    page.on('console', msg => {
      console.log('🔧 브라우저 콘솔:', msg.text());
    });
    
    // 페이지 에러 확인
    page.on('pageerror', error => {
      console.log('❌ 페이지 에러:', error.message);
    });
    
    // 업무 추가 버튼 찾기
    const addButton = page.locator('button:has-text("업무 추가")');
    console.log('🔘 업무 추가 버튼 존재:', await addButton.count() > 0);
    
    // 버튼 속성 확인
    const buttonElement = addButton.first();
    const isVisible = await buttonElement.isVisible();
    const isEnabled = await buttonElement.isEnabled();
    console.log('🔘 버튼 가시성:', isVisible);
    console.log('🔘 버튼 활성화:', isEnabled);
    
    // 버튼 클릭 이벤트 확인
    await buttonElement.click();
    console.log('🔘 버튼 클릭 완료');
    
    // 잠시 대기
    await page.waitForTimeout(3000);
    
    // 모달 관련 요소들 확인
    const modalSelectors = [
      'div[role="dialog"]',
      '.modal',
      '[class*="modal"]',
      '[class*="Modal"]',
      'div[class*="fixed"]',
      'div[class*="absolute"]'
    ];
    
    for (const selector of modalSelectors) {
      const elements = page.locator(selector);
      const count = await elements.count();
      if (count > 0) {
        console.log(`📋 모달 발견 (${selector}):`, count);
        const text = await elements.first().textContent();
        console.log('📋 모달 내용:', text?.substring(0, 100));
      }
    }
    
    // 페이지 스크린샷
    await page.screenshot({ 
      path: 'test-results/debug-modal-after-click.png',
      fullPage: true 
    });
    
    // JavaScript 실행으로 모달 상태 확인
    const modalState = await page.evaluate(() => {
      // 모달 관련 상태 확인
      const modals = document.querySelectorAll('div[role="dialog"], .modal, [class*="modal"]');
      const showAddModal = (window as any).showAddModal;
      const setShowAddModal = (window as any).setShowAddModal;
      
      return {
        modalCount: modals.length,
        showAddModal: showAddModal,
        hasSetShowAddModal: typeof setShowAddModal === 'function'
      };
    });
    
    console.log('🔧 모달 상태:', modalState);
    
    console.log('🎉 모달 디버깅 완료!');
  });
});
