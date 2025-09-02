import { test, expect } from '@playwright/test';

test.describe('김탁수님 스케줄 조회 문제 진단', () => {
  test.beforeEach(async ({ page }) => {
    // 원격 서버 접속
    await page.goto('https://www.maslabs.kr');
    await page.waitForLoadState('networkidle');
    
    // 로그인 폼 찾기 (전화번호 + 비밀번호)
    try {
      // 전화번호 입력
      const phoneInput = page.locator('input[placeholder="전화번호"], input[name="phone"]');
      await phoneInput.fill('01012345678');
      
      // 비밀번호 입력
      const passwordInput = page.locator('input[type="password"], input[placeholder="비밀번호"], input[name="password"]');
      await passwordInput.fill('testpassword');
      
      // 로그인 버튼 클릭
      await page.click('button:has-text("로그인")');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);
      
    } catch (error) {
      console.log('로그인 실패, 게스트 상태로 진행:', error);
    }
  });

  test('출근 관리 페이지 디버깅 정보 확인', async ({ page }) => {
    // 출근 관리 페이지로 이동
    try {
      const attendanceLink = page.locator('text=출근 관리, text=출근, a[href*="attendance"], a[href*="출근"]');
      if (await attendanceLink.isVisible()) {
        await attendanceLink.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
      } else {
        console.log('출근 관리 링크를 찾을 수 없습니다');
        return;
      }
    } catch (error) {
      console.log('출근 관리 페이지 접근 실패:', error);
      return;
    }
    
    // 페이지 스크린샷으로 현재 상태 확인
    await page.screenshot({ path: 'test-results/attendance-debug.png' });
    
    // 디버깅 정보 확인
    const debugInfo = page.locator('text=디버깅 정보:');
    await expect(debugInfo).toBeVisible();
    
    // 사용자 정보 확인
    const userId = page.locator('text=사용자 ID: WHA');
    await expect(userId).toBeVisible();
    
    const userName = page.locator('text=사용자 이름: 김탁수');
    await expect(userName).toBeVisible();
    
    // 스케줄 정보 확인
    const scheduleCount = page.locator('text=오늘 스케줄 수: 0개');
    await expect(scheduleCount).toBeVisible();
    
    // 오늘 날짜 확인
    const todayDate = page.locator('text=오늘 날짜: 2025-09-02');
    await expect(todayDate).toBeVisible();
    
    console.log('✅ 디버깅 정보 확인 완료');
  });

  test('관리자 페이지에서 김탁수님 스케줄 확인', async ({ page }) => {
    // 관리자 페이지로 이동 시도
    try {
      // 다양한 방법으로 관리자 링크 찾기
      const adminLinks = page.locator('text=관리자, text=Admin, text=직원 관리, text=스케줄 관리');
      if (await adminLinks.isVisible()) {
        await adminLinks.first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
      } else {
        console.log('관리자 링크를 찾을 수 없습니다');
        return;
      }
    } catch (error) {
      console.log('관리자 페이지 접근 실패:', error);
      return;
    }
    
    // 페이지 스크린샷
    await page.screenshot({ path: 'test-results/admin-page.png' });
    
    // 김탁수님 정보 찾기
    const kimTakSu = page.locator('text=김탁수, text=WHA');
    if (await kimTakSu.isVisible()) {
      console.log('✅ 김탁수님 정보 발견');
      
      // 김탁수님 클릭하여 상세 정보 확인
      await kimTakSu.click();
      await page.waitForTimeout(2000);
      
      // 스케줄 정보 확인
      const schedules = page.locator('text=스케줄, text=근무, text=일정');
      if (await schedules.isVisible()) {
        console.log('✅ 스케줄 정보 발견');
      } else {
        console.log('❌ 스케줄 정보 없음');
      }
    } else {
      console.log('❌ 김탁수님 정보를 찾을 수 없음');
    }
  });

  test('네트워크 요청 분석', async ({ page }) => {
    // 출근 관리 페이지로 이동
    try {
      const attendanceLink = page.locator('text=출근 관리, text=출근, a[href*="attendance"], a[href*="출근"]');
      if (await attendanceLink.isVisible()) {
        await attendanceLink.click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
      }
    } catch (error) {
      console.log('출근 관리 페이지 접근 실패:', error);
      return;
    }
    
    // 네트워크 요청 확인
    const networkRequests = await page.evaluate(() => {
      return performance.getEntriesByType('resource')
        .filter(entry => entry.name.includes('supabase') || entry.name.includes('api'))
        .map(entry => ({
          name: entry.name,
          duration: entry.duration,
          transferSize: entry.transferSize
        }));
    });
    
    console.log('🌐 네트워크 요청:', networkRequests);
    
    // 브라우저 콘솔 로그 확인
    const consoleMessages = await page.evaluate(() => {
      return window.consoleMessages || [];
    });
    
    console.log('📝 콘솔 메시지:', consoleMessages);
  });

  test('스케줄 등록 테스트', async ({ page }) => {
    // 관리자 페이지로 이동
    try {
      const adminLinks = page.locator('text=관리자, text=Admin, text=직원 관리, text=스케줄 관리');
      if (await adminLinks.isVisible()) {
        await adminLinks.first().click();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(2000);
      }
    } catch (error) {
      console.log('관리자 페이지 접근 실패:', error);
      return;
    }
    
    // 스케줄 등록 버튼 찾기
    const addScheduleButton = page.locator('text=스케줄 등록, text=추가, text=등록, button:has-text("+")');
    if (await addScheduleButton.isVisible()) {
      console.log('✅ 스케줄 등록 버튼 발견');
      
      // 스케줄 등록 시도
      await addScheduleButton.click();
      await page.waitForTimeout(2000);
      
      // 등록 폼 확인
      const form = page.locator('form, input[type="date"], input[type="time"]');
      if (await form.isVisible()) {
        console.log('✅ 스케줄 등록 폼 발견');
      } else {
        console.log('❌ 스케줄 등록 폼 없음');
      }
    } else {
      console.log('❌ 스케줄 등록 버튼을 찾을 수 없음');
    }
  });
});
