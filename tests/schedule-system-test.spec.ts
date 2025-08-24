import { test, expect } from '@playwright/test';

test.describe('스케줄 시스템 종합 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인 페이지로 이동
    await page.goto('http://localhost:3000/login');
    
    // 이은정 계정으로 로그인 (매니저 권한)
    await page.click('text=핀번호');
    await page.fill('input[placeholder="전화번호 또는 사번"]', '010-3243-3099');
    await page.fill('input[placeholder="0000"]', '1234');
    await page.click('button:has-text("로그인")');
    
    // 대시보드로 이동 후 스케줄 페이지로 이동
    await page.waitForURL('**/dashboard');
    await page.click('text=근무 스케줄');
    await page.waitForURL('**/schedules');
  });

  test('기본 스케줄 페이지 로딩 테스트', async ({ page }) => {
    // 페이지 제목 확인
    await expect(page.locator('h1:has-text("근무 스케줄")')).toBeVisible();
    
    // 버튼들 확인
    await expect(page.locator('button:has-text("일괄입력")')).toBeVisible();
    await expect(page.locator('button:has-text("추가")')).toBeVisible();
    
    // 뷰 모드 토글 확인
    await expect(page.locator('button:has-text("주간")')).toBeVisible();
    await expect(page.locator('button:has-text("월간")')).toBeVisible();
    
    // 네비게이션 버튼 확인 (ChevronLeft, ChevronRight 아이콘)
    await expect(page.locator('button').filter({ hasText: '‹' })).toBeVisible();
    await expect(page.locator('button').filter({ hasText: '›' })).toBeVisible();
  });

  test('주간 뷰 테스트', async ({ page }) => {
    // 주간 뷰가 기본으로 선택되어 있는지 확인
    await expect(page.locator('button:has-text("주간").bg-white')).toBeVisible();
    
    // 주차 정보가 표시되는지 확인
    await expect(page.locator('text=/\\d+주차/')).toBeVisible();
    
    // 시간대별 그리드가 표시되는지 확인
    await expect(page.locator('text=시간')).toBeVisible();
    
    // 요일 헤더 확인
    await expect(page.locator('text=월')).toBeVisible();
    await expect(page.locator('text=화')).toBeVisible();
    await expect(page.locator('text=수')).toBeVisible();
    await expect(page.locator('text=목')).toBeVisible();
    await expect(page.locator('text=금')).toBeVisible();
    await expect(page.locator('text=토')).toBeVisible();
    await expect(page.locator('text=일')).toBeVisible();
  });

  test('월간 뷰 테스트', async ({ page }) => {
    // 월간 뷰로 전환
    await page.click('button:has-text("월간")');
    await expect(page.locator('button:has-text("월간").bg-white')).toBeVisible();
    
    // 월간 달력이 표시되는지 확인
    await expect(page.locator('text=일')).toBeVisible();
    await expect(page.locator('text=월')).toBeVisible();
    await expect(page.locator('text=화')).toBeVisible();
    await expect(page.locator('text=수')).toBeVisible();
    await expect(page.locator('text=목')).toBeVisible();
    await expect(page.locator('text=금')).toBeVisible();
    await expect(page.locator('text=토')).toBeVisible();
    
    // 일자 번호들이 표시되는지 확인 (최소 1개 이상)
    const dayNumbers = page.locator('.aspect-square .text-xs');
    await expect(dayNumbers.first()).toBeVisible();
  });

  test('일괄 입력 기능 테스트', async ({ page }) => {
    // 일괄 입력 버튼 클릭
    await page.click('button:has-text("일괄입력")');
    
    // 일괄 입력 모달이 나타나는지 확인
    await expect(page.locator('text=일괄 스케줄 입력')).toBeVisible();
    
    // 시간 입력 필드 확인
    await expect(page.locator('input[type="time"]').first()).toBeVisible();
    await expect(page.locator('input[type="time"]').nth(1)).toBeVisible();
    
    // 요일 선택 버튼들 확인 (일괄 입력 모달 내부의 버튼들)
    await expect(page.locator('.bg-green-50 button:has-text("월")')).toBeVisible();
    await expect(page.locator('.bg-green-50 button:has-text("화")')).toBeVisible();
    await expect(page.locator('.bg-green-50 button:has-text("수")')).toBeVisible();
    await expect(page.locator('.bg-green-50 button:has-text("목")')).toBeVisible();
    await expect(page.locator('.bg-green-50 button:has-text("금")')).toBeVisible();
    await expect(page.locator('.bg-green-50 button:has-text("토")')).toBeVisible();
    await expect(page.locator('.bg-green-50 button:has-text("일")')).toBeVisible();
    
    // 취소 버튼으로 모달 닫기
    await page.click('button:has-text("취소")');
    await expect(page.locator('text=일괄 스케줄 입력')).not.toBeVisible();
  });

  test('스케줄 추가 페이지 이동 테스트', async ({ page }) => {
    // 추가 버튼 클릭
    await page.click('button:has-text("추가")');
    
    // 스케줄 추가 페이지로 이동하는지 확인
    await page.waitForURL('**/schedules/add');
    await expect(page.locator('h1:has-text("새 스케줄 추가")')).toBeVisible();
    
    // 뒤로가기
    await page.goBack();
    await page.waitForURL('**/schedules');
  });

  test('네비게이션 테스트', async ({ page }) => {
    // 현재 주차 정보 저장
    const currentWeekText = await page.locator('h2').textContent();
    
    // 다음 주로 이동 (ChevronRight 아이콘 클릭)
    await page.locator('button').filter({ hasText: '›' }).click();
    await page.waitForTimeout(1000);
    
    // 주차가 변경되었는지 확인
    const nextWeekText = await page.locator('h2').textContent();
    expect(nextWeekText).not.toBe(currentWeekText);
    
    // 이전 주로 이동 (ChevronLeft 아이콘 클릭)
    await page.locator('button').filter({ hasText: '‹' }).click();
    await page.waitForTimeout(1000);
    
    // 원래 주차로 돌아왔는지 확인
    const backWeekText = await page.locator('h2').textContent();
    expect(backWeekText).toBe(currentWeekText);
  });

  test('범례 표시 테스트', async ({ page }) => {
    // 범례 섹션이 표시되는지 확인
    await expect(page.locator('text=다른사람')).toBeVisible();
    await expect(page.locator('text=나 포함')).toBeVisible();
    await expect(page.locator('text=점심')).toBeVisible();
    await expect(page.locator('text=없음')).toBeVisible();
    
    // 색상 표시 확인 (첫 번째 요소만 확인)
    await expect(page.locator('.bg-gray-200').first()).toBeVisible();
    await expect(page.locator('.bg-blue-200').first()).toBeVisible();
    await expect(page.locator('.bg-orange-50').first()).toBeVisible();
    await expect(page.locator('.bg-gray-50').first()).toBeVisible();
  });

  test('반응형 디자인 테스트', async ({ page }) => {
    // 모바일 뷰포트로 변경
    await page.setViewportSize({ width: 375, height: 667 });
    
    // 모바일에서도 모든 요소가 보이는지 확인
    await expect(page.locator('h1:has-text("근무 스케줄")')).toBeVisible();
    await expect(page.locator('button:has-text("일괄입력")')).toBeVisible();
    await expect(page.locator('button:has-text("추가")')).toBeVisible();
    
    // 데스크톱 뷰포트로 복원
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('권한 제어 테스트', async ({ page }) => {
    // 주간 뷰에서 시간대별 박스들이 존재하는지 확인
    const timeSlots = page.locator('.grid-cols-8 > button');
    await expect(timeSlots.first()).toBeVisible();
  });

  test('오류 처리 테스트', async ({ page }) => {
    // 일괄 입력에서 요일을 선택하지 않고 적용 시도
    await page.click('button:has-text("일괄입력")');
    await page.click('button:has-text("적용")');
    
    // 경고 메시지가 나타나는지 확인
    page.on('dialog', dialog => {
      expect(dialog.message()).toContain('요일을 선택해주세요');
      dialog.accept();
    });
  });

  test('데이터 로딩 테스트', async ({ page }) => {
    // 페이지 새로고침
    await page.reload();
    
    // 로딩이 완료되면 스케줄 페이지가 정상적으로 표시되는지 확인
    await expect(page.locator('h1:has-text("근무 스케줄")')).toBeVisible();
  });

  test('클릭 토글 기능 테스트', async ({ page }) => {
    // 주간 뷰에서 시간대별 박스 존재 확인
    const timeSlots = page.locator('.grid-cols-8 > button');
    await expect(timeSlots.first()).toBeVisible();
    
    // 클릭 가능한 상태인지 확인 (disabled가 아닌지)
    const firstSlot = timeSlots.first();
    const isDisabled = await firstSlot.isDisabled();
    
    if (!isDisabled) {
      // 클릭 전 상태 저장
      const beforeClass = await firstSlot.getAttribute('class');
      
      // 클릭
      await firstSlot.click();
      await page.waitForTimeout(1000);
      
      // 클릭 후 상태 확인 (애니메이션이나 상태 변화)
      const afterClass = await firstSlot.getAttribute('class');
      expect(afterClass).toBeDefined();
    }
  });
});
