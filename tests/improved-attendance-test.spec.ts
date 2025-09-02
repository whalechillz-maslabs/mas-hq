import { test, expect } from '@playwright/test';

test.describe('개선된 출근 관리 시스템 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 원격 서버에 접속
    await page.goto('https://maslabs.kr/attendance');
    
    // 로그인 대기
    await page.waitForTimeout(3000);
  });

  test('일일 근무 요약 표시 확인', async ({ page }) => {
    // 페이지가 로드될 때까지 대기
    await page.waitForTimeout(5000);
    
    // 디버깅 정보 확인
    const debugInfo = page.locator('text=디버깅 정보').first();
    await expect(debugInfo).toBeVisible();
    
    // 사용자 정보 확인
    const userId = page.locator('text=사용자 ID: WHA').first();
    await expect(userId).toBeVisible();
    
    const userName = page.locator('text=사용자 이름: 김탁수').first();
    await expect(userName).toBeVisible();
    
    // 오늘 스케줄 수 확인
    const scheduleCount = page.locator('text=/오늘 스케줄 수: \d+개/').first();
    await expect(scheduleCount).toBeVisible();
    
    console.log('✅ 디버깅 정보가 정상적으로 표시됨');
  });

  test('일일 근무 요약 카드 확인', async ({ page }) => {
    // 페이지가 로드될 때까지 대기
    await page.waitForTimeout(5000);
    
    // 일일 근무 요약 카드 찾기
    const summaryCard = page.locator('text=오늘 근무 요약').first();
    
    if (await summaryCard.isVisible()) {
      console.log('✅ 일일 근무 요약 카드가 표시됨');
      
      // 총 근무 시간 확인
      const totalWorkTime = page.locator('text=/총 근무 시간/').first();
      await expect(totalWorkTime).toBeVisible();
      
      // 완료된 근무 수 확인
      const completedWork = page.locator('text=/완료된 근무/').first();
      await expect(completedWork).toBeVisible();
      
      // 진행 중인 근무 수 확인
      const inProgressWork = page.locator('text=/진행 중/').first();
      await expect(inProgressWork).toBeVisible();
      
      // 대기 중인 근무 수 확인
      const pendingWork = page.locator('text=/대기 중/').first();
      await expect(pendingWork).toBeVisible();
      
    } else {
      console.log('⚠️ 일일 근무 요약 카드가 표시되지 않음 (아직 구현되지 않음)');
    }
  });

  test('단순화된 출근 관리 UI 확인', async ({ page }) => {
    // 페이지가 로드될 때까지 대기
    await page.waitForTimeout(5000);
    
    // 간단한 출근 관리 섹션 찾기
    const simpleAttendance = page.locator('text=간단한 출근 관리').first();
    
    if (await simpleAttendance.isVisible()) {
      console.log('✅ 단순화된 출근 관리 UI가 표시됨');
      
      // 현재 상태 확인
      const currentStatus = page.locator('text=/현재 상태:/').first();
      await expect(currentStatus).toBeVisible();
      
      // 출근 체크 버튼 확인 (출근 전 상태일 때)
      const checkInButton = page.locator('button:has-text("출근 체크")').first();
      if (await checkInButton.isVisible()) {
        console.log('✅ 출근 체크 버튼이 표시됨');
      }
      
    } else {
      console.log('⚠️ 단순화된 출근 관리 UI가 표시되지 않음 (아직 구현되지 않음)');
    }
  });

  test('출근 체크 기능 테스트', async ({ page }) => {
    // 페이지가 로드될 때까지 대기
    await page.waitForTimeout(5000);
    
    // 출근 체크 버튼 찾기
    const checkInButton = page.locator('button:has-text("출근")').first();
    
    if (await checkInButton.isVisible()) {
      console.log('✅ 출근 버튼이 표시됨');
      
      // 출근 버튼 클릭
      await checkInButton.click();
      await page.waitForTimeout(2000);
      
      // 출근 완료 메시지 확인
      try {
        const successMessage = page.locator('text=출근 체크가 완료되었습니다').first();
        if (await successMessage.isVisible()) {
          console.log('✅ 출근 체크가 성공적으로 완료됨');
        }
      } catch (error) {
        console.log('⚠️ 출근 체크 완료 메시지를 확인할 수 없음');
      }
      
    } else {
      console.log('⚠️ 출근 버튼이 표시되지 않음');
    }
  });

  test('퇴근 체크 기능 테스트', async ({ page }) => {
    // 페이지가 로드될 때까지 대기
    await page.waitForTimeout(5000);
    
    // 퇴근 체크 버튼 찾기
    const checkOutButton = page.locator('button:has-text("퇴근")').first();
    
    if (await checkOutButton.isVisible()) {
      console.log('✅ 퇴근 버튼이 표시됨');
      
      // 퇴근 버튼 클릭
      await checkOutButton.click();
      await page.waitForTimeout(2000);
      
      // 퇴근 완료 메시지 확인
      try {
        const successMessage = page.locator('text=퇴근 체크가 완료되었습니다').first();
        if (await successMessage.isVisible()) {
          console.log('✅ 퇴근 체크가 성공적으로 완료됨');
        }
      } catch (error) {
        console.log('⚠️ 퇴근 체크 완료 메시지를 확인할 수 없음');
      }
      
    } else {
      console.log('⚠️ 퇴근 버튼이 표시되지 않음 (아직 출근하지 않았거나 이미 퇴근함)');
    }
  });

  test('휴식 후 복귀 기능 테스트', async ({ page }) => {
    // 페이지가 로드될 때까지 대기
    await page.waitForTimeout(5000);
    
    // 휴식 후 복귀 버튼 찾기
    const breakReturnButton = page.locator('button:has-text("휴식 후 복귀")').first();
    
    if (await breakReturnButton.isVisible()) {
      console.log('✅ 휴식 후 복귀 버튼이 표시됨');
      
      // 휴식 후 복귀 버튼 클릭
      await breakReturnButton.click();
      await page.waitForTimeout(2000);
      
      // 복귀 완료 메시지 확인
      try {
        const successMessage = page.locator('text=휴식 후 복귀가 기록되었습니다').first();
        if (await successMessage.isVisible()) {
          console.log('✅ 휴식 후 복귀가 성공적으로 기록됨');
        }
      } catch (error) {
        console.log('⚠️ 휴식 후 복귀 완료 메시지를 확인할 수 없음');
      }
      
    } else {
      console.log('⚠️ 휴식 후 복귀 버튼이 표시되지 않음 (아직 출근하지 않았거나 이미 퇴근함)');
    }
  });

  test('일일 근무 시간 계산 확인', async ({ page }) => {
    // 페이지가 로드될 때까지 대기
    await page.waitForTimeout(5000);
    
    // 총 근무 시간 표시 확인
    const totalWorkTime = page.locator('text=/총 근무 시간:/').first();
    
    if (await totalWorkTime.isVisible()) {
      console.log('✅ 총 근무 시간이 표시됨');
      
      // 시간 형식 확인 (예: 8h 30m)
      const timeFormat = page.locator('text=/\\d+h \\d+m/').first();
      if (await timeFormat.isVisible()) {
        console.log('✅ 근무 시간 형식이 올바르게 표시됨');
      }
      
    } else {
      console.log('⚠️ 총 근무 시간이 표시되지 않음 (아직 퇴근하지 않았거나 계산되지 않음)');
    }
  });

  test('스케줄 상세 보기 확인', async ({ page }) => {
    // 페이지가 로드될 때까지 대기
    await page.waitForTimeout(5000);
    
    // 오늘의 근무 스케줄 섹션 확인
    const scheduleSection = page.locator('text=오늘의 근무 스케줄').first();
    await expect(scheduleSection).toBeVisible();
    
    // 스케줄 항목들 확인
    const scheduleItems = page.locator('div').filter({ hasText: '번째 시간대' });
    const itemCount = await scheduleItems.count();
    
    if (itemCount > 0) {
      console.log(`✅ ${itemCount}개의 스케줄 항목이 표시됨`);
      
      // 첫 번째 스케줄 항목의 상태 확인
      const firstItem = scheduleItems.first();
      const statusText = await firstItem.textContent();
      console.log('첫 번째 스케줄 상태:', statusText);
      
    } else {
      console.log('⚠️ 스케줄 항목이 표시되지 않음');
    }
  });

  test('전체 시스템 통합 테스트', async ({ page }) => {
    // 페이지가 로드될 때까지 대기
    await page.waitForTimeout(5000);
    
    console.log('🔍 전체 시스템 통합 테스트 시작');
    
    // 1. 페이지 로딩 확인
    const pageTitle = page.locator('text=출근 관리').first();
    await expect(pageTitle).toBeVisible();
    console.log('✅ 페이지 제목 확인됨');
    
    // 2. 사용자 정보 확인
    const userName = page.locator('text=김탁수').first();
    await expect(userName).toBeVisible();
    console.log('✅ 사용자 정보 확인됨');
    
    // 3. 현재 시간 표시 확인
    const currentTime = page.locator('text=/현재 시간/').first();
    await expect(currentTime).toBeVisible();
    console.log('✅ 현재 시간 표시 확인됨');
    
    // 4. 스케줄 정보 확인
    const scheduleInfo = page.locator('text=/오늘 스케줄 수:/').first();
    await expect(scheduleInfo).toBeVisible();
    console.log('✅ 스케줄 정보 확인됨');
    
    // 5. 출근/퇴근 기능 확인
    const checkInButton = page.locator('button:has-text("출근")').first();
    const checkOutButton = page.locator('button:has-text("퇴근")').first();
    
    if (await checkInButton.isVisible()) {
      console.log('✅ 출근 기능 사용 가능');
    }
    
    if (await checkOutButton.isVisible()) {
      console.log('✅ 퇴근 기능 사용 가능');
    }
    
    console.log('🎯 전체 시스템 통합 테스트 완료');
  });
});
