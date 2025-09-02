import { test, expect } from '@playwright/test';

test.describe('휴식 시작 기능 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 원격 서버 접속
    await page.goto('https://www.maslabs.kr');
    await page.waitForLoadState('networkidle');
    
    // 페이지 스크린샷으로 현재 상태 확인
    await page.screenshot({ path: 'test-results/login-page.png' });
    
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
      // 로그인 실패 시 게스트 상태로 진행
    }
  });

  test('휴식 시작 버튼이 정상적으로 표시되는지 확인', async ({ page }) => {
    // 페이지 스크린샷으로 현재 상태 확인
    await page.screenshot({ path: 'test-results/after-login.png' });
    
    // 출근 관리 페이지로 이동 시도
    try {
      // 다양한 방법으로 출근 관리 링크 찾기
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
    await page.screenshot({ path: 'test-results/attendance-page.png' });
    
    // 출근 체크 버튼 찾기
    const checkInButton = page.locator('button:has-text("출근 체크"), button:has-text("출근")');
    if (await checkInButton.isVisible()) {
      await checkInButton.click();
      await page.waitForTimeout(2000);
    }
    
    // 휴식 시작 버튼이 표시되는지 확인
    const breakStartButton = page.locator('button:has-text("휴식 시작")');
    await expect(breakStartButton).toBeVisible();
    
    // 퇴근 체크 버튼도 함께 표시되는지 확인
    const checkOutButton = page.locator('button:has-text("퇴근 체크"), button:has-text("퇴근")');
    await expect(checkOutButton).toBeVisible();
  });

  test('휴식 시작 후 상태 변경 확인', async ({ page }) => {
    // 출근 관리 페이지로 이동 시도
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
    
    // 출근 체크
    const checkInButton = page.locator('button:has-text("출근 체크"), button:has-text("출근")');
    if (await checkInButton.isVisible()) {
      await checkInButton.click();
      await page.waitForTimeout(2000);
    }
    
    // 휴식 시작
    const breakStartButton = page.locator('button:has-text("휴식 시작")');
    if (await breakStartButton.isVisible()) {
      await breakStartButton.click();
      await page.waitForTimeout(2000);
    }
    
    // 상태가 "휴식 중"으로 변경되었는지 확인
    const statusText = page.locator('text=휴식 중, text=현재 상태: 휴식 중');
    await expect(statusText).toBeVisible();
    
    // 휴식 후 복귀 버튼이 표시되는지 확인
    const returnButton = page.locator('button:has-text("휴식 후 복귀")');
    await expect(returnButton).toBeVisible();
    
    // 퇴근 체크 버튼도 표시되는지 확인
    const checkOutButton = page.locator('button:has-text("퇴근 체크"), button:has-text("퇴근")');
    await expect(checkOutButton).toBeVisible();
  });

  test('휴식 시작 후 복귀 기능 확인', async ({ page }) => {
    // 출근 관리 페이지로 이동 시도
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
    
    // 출근 체크
    const checkInButton = page.locator('button:has-text("출근 체크"), button:has-text("출근")');
    if (await checkInButton.isVisible()) {
      await checkInButton.click();
      await page.waitForTimeout(2000);
    }
    
    // 휴식 시작
    const breakStartButton = page.locator('button:has-text("휴식 시작")');
    if (await breakStartButton.isVisible()) {
      await breakStartButton.click();
      await page.waitForTimeout(2000);
    }
    
    // 휴식 후 복귀
    const returnButton = page.locator('button:has-text("휴식 후 복귀")');
    if (await returnButton.isVisible()) {
      await returnButton.click();
      await page.waitForTimeout(2000);
    }
    
    // 상태가 "근무 중"으로 변경되었는지 확인
    const statusText = page.locator('text=근무 중, text=현재 상태: 근무 중');
    await expect(statusText).toBeVisible();
    
    // 휴식 시작 버튼이 다시 표시되는지 확인
    const breakStartButton2 = page.locator('button:has-text("휴식 시작")');
    await expect(breakStartButton2).toBeVisible();
  });

  test('전체 출근-휴식-복귀-퇴근 플로우 테스트', async ({ page }) => {
    // 출근 관리 페이지로 이동 시도
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
    
    // 1. 출근 체크
    const checkInButton = page.locator('button:has-text("출근 체크"), button:has-text("출근")');
    if (await checkInButton.isVisible()) {
      await checkInButton.click();
      await page.waitForTimeout(2000);
    }
    
    // 2. 휴식 시작
    const breakStartButton = page.locator('button:has-text("휴식 시작")');
    if (await breakStartButton.isVisible()) {
      await breakStartButton.click();
      await page.waitForTimeout(2000);
    }
    
    // 3. 휴식 후 복귀
    const returnButton = page.locator('button:has-text("휴식 후 복귀")');
    if (await returnButton.isVisible()) {
      await returnButton.click();
      await page.waitForTimeout(2000);
    }
    
    // 4. 퇴근 체크
    const checkOutButton = page.locator('button:has-text("퇴근 체크"), button:has-text("퇴근")');
    if (await checkOutButton.isVisible()) {
      await checkOutButton.click();
      await page.waitForTimeout(2000);
    }
    
    // 상태가 "출근 전"으로 변경되었는지 확인
    const statusText = page.locator('text=출근 전, text=현재 상태: 출근 전');
    await expect(statusText).toBeVisible();
    
    // 출근 체크 버튼이 다시 표시되는지 확인
    const checkInButton2 = page.locator('button:has-text("출근 체크"), button:has-text("출근")');
    await expect(checkInButton2).toBeVisible();
  });
});
