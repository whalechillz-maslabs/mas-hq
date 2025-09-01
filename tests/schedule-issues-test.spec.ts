import { test, expect } from '@playwright/test';

test.describe('직원별 스케줄 관리 - 전체보기 문제점 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 원격 서버에 접속
    await page.goto('https://maslabs.kr/admin/employee-schedules');
    
    // 로그인 대기
    await page.waitForTimeout(3000);
    
    // 전체 보기 모드로 전환
    await page.getByRole('button', { name: '전체 보기' }).click();
    await page.waitForTimeout(1000);
  });

  test('빈공간 클릭 시 초록색+ 버튼 2개 문제 확인', async ({ page }) => {
    // 페이지가 로드될 때까지 대기
    await page.waitForTimeout(5000);
    
    // 빈 시간대 찾기 (예: 목요일 9:00)
    const emptyTimeSlot = page.locator('div').filter({ hasText: '목 4' }).first().locator('..').locator('div').filter({ hasText: '9:00' }).first().locator('..');
    await expect(emptyTimeSlot).toBeVisible();
    
    // 빈 시간대 클릭
    await emptyTimeSlot.click();
    await page.waitForTimeout(1000);
    
    // 초록색+ 버튼이 몇 개 나타나는지 확인
    const addButtons = page.locator('button[title="스케줄 추가"]');
    const buttonCount = await addButtons.count();
    
    console.log(`빈공간 클릭 후 초록색+ 버튼 개수: ${buttonCount}개`);
    
    // 2개가 아닌 1개만 나타나야 함
    expect(buttonCount).toBe(1);
  });

  test('빈공간에 스케줄 추가 시 Unknown 문제 확인', async ({ page }) => {
    // 페이지가 로드될 때까지 대기
    await page.waitForTimeout(5000);
    
    // 빈 시간대 찾기 (예: 토요일 10:00)
    const emptyTimeSlot = page.locator('div').filter({ hasText: '토 6' }).first().locator('..').locator('div').filter({ hasText: '10:00' }).first().locator('..');
    await expect(emptyTimeSlot).toBeVisible();
    
    // 빈 시간대에 호버하여 추가 버튼 표시
    await emptyTimeSlot.hover();
    
    // 추가 버튼 클릭
    const addButton = page.locator('button[title="스케줄 추가"]').first();
    await expect(addButton).toBeVisible();
    await addButton.click();
    
    // 추가 후 대기
    await page.waitForTimeout(2000);
    
    // 추가된 스케줄 정보 확인
    const scheduleText = await emptyTimeSlot.textContent();
    console.log('빈공간에 스케줄 추가 후:', scheduleText);
    
    // "Unknown"이 아닌 실제 직원 이름이 표시되어야 함
    expect(scheduleText).not.toContain('Unknown');
  });

  test('기존 스케줄 셀에 다른 직원 추가 불가 문제 확인', async ({ page }) => {
    // 페이지가 로드될 때까지 대기
    await page.waitForTimeout(5000);
    
    // 이미 사람이 들어있는 셀 찾기 (예: 월요일 11:00 - 3명)
    const occupiedCell = page.locator('div').filter({ hasText: '3명하상희허상원+1' }).first();
    await expect(occupiedCell).toBeVisible();
    
    // 기존 스케줄 셀에 호버
    await occupiedCell.hover();
    
    // 추가 버튼이 표시되는지 확인 (기존 직원 추가 가능해야 함)
    const addButtons = page.locator('button[title="스케줄 추가"]');
    const buttonCount = await addButtons.count();
    
    console.log(`기존 스케줄 셀에서 추가 버튼 개수: ${buttonCount}개`);
    
    // 기존 스케줄 셀에도 추가 버튼이 표시되어야 함
    expect(buttonCount).toBeGreaterThan(0);
  });

  test('기존 스케줄 셀에 하상희 추가 테스트', async ({ page }) => {
    // 페이지가 로드될 때까지 대기
    await page.waitForTimeout(5000);
    
    // 이미 사람이 들어있는 셀 찾기 (예: 화요일 9:00 - 2명)
    const occupiedCell = page.locator('div').filter({ hasText: '2명허상원최형호' }).first();
    await expect(occupiedCell).toBeVisible();
    
    // 기존 스케줄 셀에 호버하여 추가 버튼 표시
    await occupiedCell.hover();
    
    // 추가 버튼이 표시되는지 확인
    const addButton = page.locator('button[title="스케줄 추가"]').first();
    await expect(addButton).toBeVisible();
    
    // 추가 버튼 클릭
    await addButton.click();
    await page.waitForTimeout(2000);
    
    // 추가 후 스케줄 정보 확인
    const afterText = await occupiedCell.textContent();
    console.log('기존 셀에 하상희 추가 후:', afterText);
    
    // 직원 수가 증가했는지 확인
    expect(afterText).toContain('3명');
  });

  test('전체보기에서 스케줄 추가 시 직원 선택 문제 확인', async ({ page }) => {
    // 페이지가 로드될 때까지 대기
    await page.waitForTimeout(5000);
    
    // 빈 시간대 찾기 (예: 일요일 14:00)
    const emptyTimeSlot = page.locator('div').filter({ hasText: '일 7' }).first().locator('..').locator('div').filter({ hasText: '14:00' }).first().locator('..');
    await expect(emptyTimeSlot).toBeVisible();
    
    // 빈 시간대에 호버하여 추가 버튼 표시
    await emptyTimeSlot.hover();
    
    // 추가 버튼 클릭
    const addButton = page.locator('button[title="스케줄 추가"]').first();
    await expect(addButton).toBeVisible();
    await addButton.click();
    
    // 추가 후 대기
    await page.waitForTimeout(2000);
    
    // 추가된 스케줄 정보 확인
    const scheduleText = await emptyTimeSlot.textContent();
    console.log('일요일 14:00에 스케줄 추가 후:', scheduleText);
    
    // "Unknown"이 아닌 실제 직원 이름이 표시되어야 함
    expect(scheduleText).not.toContain('Unknown');
    
    // 직원 이름이 포함되어 있는지 확인
    const hasEmployeeName = /[가-힣]+/.test(scheduleText || '');
    expect(hasEmployeeName).toBe(true);
  });
});
