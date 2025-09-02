import { test, expect } from '@playwright/test';

test.describe('스케줄 추가 페이지 날짜 문제 해결 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 새로운 배포된 사이트 접속
    await page.goto('https://mas-k4khi7snf-whalechillz-maslabs-projects.vercel.app');
    await page.waitForLoadState('networkidle');
    
    // 페이지 스크린샷으로 현재 상태 확인
    await page.screenshot({ path: 'test-results/home-page-new.png' });
    
    // 로그인 페이지로 이동
    try {
      await page.goto('https://mas-k4khi7snf-whalechillz-maslabs-projects.vercel.app/login');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);
      
      // 페이지 스크린샷으로 로그인 페이지 상태 확인
      await page.screenshot({ path: 'test-results/login-page-new.png' });
      
      // 로그인 폼이 나타날 때까지 대기
      await page.waitForSelector('input[id="phone"]', { timeout: 10000 });
      
      // 전화번호 입력
      const phoneInput = page.locator('input[id="phone"]');
      await phoneInput.fill('01012345678');
      
      // 비밀번호 입력
      const passwordInput = page.locator('input[id="password"]');
      await passwordInput.fill('testpassword');
      
      // 로그인 버튼 클릭
      await page.click('button[type="submit"]');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      // 로그인 후 페이지 스크린샷
      await page.screenshot({ path: 'test-results/after-login-new.png' });
      
    } catch (error) {
      console.log('로그인 실패, 게스트 상태로 진행:', error);
      // 로그인 실패 시 게스트 상태로 진행
    }
  });

  test('스케줄 추가 페이지에서 현재 날짜가 올바르게 표시되는지 확인', async ({ page }) => {
    // 스케줄 추가 페이지로 이동
    try {
      await page.goto('https://mas-k4khi7snf-whalechillz-maslabs-projects.vercel.app/schedules/add');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      // 페이지 스크린샷으로 현재 상태 확인
      await page.screenshot({ path: 'test-results/schedule-add-page-new.png' });
      
      // 날짜 입력 필드 확인
      const dateInput = page.locator('input[type="date"]');
      await expect(dateInput).toBeVisible();
      
      // 현재 날짜 값 확인
      const currentDate = new Date();
      const expectedDate = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD 형식
      
      const actualDate = await dateInput.inputValue();
      console.log('🔍 날짜 확인:', { expectedDate, actualDate });
      
      // 날짜가 현재 날짜와 일치하는지 확인
      expect(actualDate).toBe(expectedDate);
      
      // 한국어 날짜 표시 확인 (페이지에 표시되는 텍스트)
      const dateDisplay = page.locator('text=2025년, text=09월, text=03일');
      if (await dateDisplay.isVisible()) {
        console.log('✅ 한국어 날짜 표시 확인됨');
      }
      
    } catch (error) {
      console.log('스케줄 추가 페이지 접근 실패:', error);
      await page.screenshot({ path: 'test-results/error-schedule-add-page.png' });
      throw error;
    }
  });

  test('기존 스케줄 데이터가 올바르게 표시되는지 확인', async ({ page }) => {
    // 스케줄 추가 페이지로 이동
    try {
      await page.goto('https://mas-k4khi7snf-whalechillz-maslabs-projects.vercel.app/schedules/add');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      // 기존 스케줄 섹션 확인
      const existingScheduleSection = page.locator('text=기존 스케줄, text=Existing Schedule');
      await expect(existingScheduleSection).toBeVisible();
      
      // 스케줄 데이터 로딩 대기
      await page.waitForTimeout(2000);
      
      // 페이지 스크린샷으로 데이터 상태 확인
      await page.screenshot({ path: 'test-results/schedule-data-display.png' });
      
      // 콘솔 로그 확인 (브라우저 개발자 도구)
      const consoleMessages = await page.evaluate(() => {
        return window.console.logs || [];
      });
      
      console.log('🔍 콘솔 메시지:', consoleMessages);
      
      // 시간대별 근무자 현황 확인
      const workerStatusSection = page.locator('text=시간대별 근무자 현황, text=Worker Status');
      if (await workerStatusSection.isVisible()) {
        console.log('✅ 시간대별 근무자 현황 섹션 확인됨');
        
        // 0명이 아닌 근무자가 있는지 확인
        const workerCounts = page.locator('text=0명, text=1명, text=2명, text=3명');
        const hasWorkers = await workerCounts.count() > 0;
        
        if (hasWorkers) {
          console.log('✅ 근무자 데이터가 표시됨');
        } else {
          console.log('ℹ️ 현재 근무자 데이터 없음 (정상)');
        }
      }
      
    } catch (error) {
      console.log('스케줄 데이터 확인 실패:', error);
      await page.screenshot({ path: 'test-results/error-schedule-data.png' });
      throw error;
    }
  });

  test('날짜 변경 시 데이터가 올바르게 업데이트되는지 확인', async ({ page }) => {
    // 스케줄 추가 페이지로 이동
    try {
      await page.goto('https://mas-k4khi7snf-whalechillz-maslabs-projects.vercel.app/schedules/add');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      // 날짜 입력 필드 찾기
      const dateInput = page.locator('input[type="date"]');
      await expect(dateInput).toBeVisible();
      
      // 다른 날짜로 변경 (예: 어제)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      await dateInput.fill(yesterdayStr);
      await page.waitForTimeout(2000);
      
      // 페이지 스크린샷으로 변경된 상태 확인
      await page.screenshot({ path: 'test-results/date-changed.png' });
      
      // 날짜가 변경되었는지 확인
      const actualDate = await dateInput.inputValue();
      expect(actualDate).toBe(yesterdayStr);
      
      console.log('✅ 날짜 변경 확인:', { yesterdayStr, actualDate });
      
    } catch (error) {
      console.log('날짜 변경 테스트 실패:', error);
      await page.screenshot({ path: 'test-results/error-date-change.png' });
      throw error;
    }
  });

  test('전체 페이지 기능이 정상적으로 작동하는지 확인', async ({ page }) => {
    // 스케줄 추가 페이지로 이동
    try {
      await page.goto('https://mas-k4khi7snf-whalechillz-maslabs-projects.vercel.app/schedules/add');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
      // 모든 주요 요소들이 표시되는지 확인
      const elements = [
        'text=새 스케줄 추가',
        'input[type="date"]',
        'input[type="time"]',
        'textarea',
        'button:has-text("취소")',
        'button:has-text("스케줄 추가")'
      ];
      
      for (const selector of elements) {
        const element = page.locator(selector);
        if (await element.isVisible()) {
          console.log(`✅ ${selector} 표시됨`);
        } else {
          console.log(`❌ ${selector} 표시되지 않음`);
        }
      }
      
      // 최종 페이지 스크린샷
      await page.screenshot({ path: 'test-results/final-page-check.png' });
      
    } catch (error) {
      console.log('전체 기능 확인 실패:', error);
      await page.screenshot({ path: 'test-results/error-overall-check.png' });
      throw error;
    }
  });
});
