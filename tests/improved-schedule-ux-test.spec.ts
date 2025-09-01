import { test, expect } from '@playwright/test';

test.describe('직원별 스케줄 관리 - 개선된 전체보기 UX 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 원격 서버에 접속
    await page.goto('https://maslabs.kr/admin/employee-schedules');
    
    // 로그인 대기
    await page.waitForTimeout(3000);
    
    // 전체 보기 모드로 전환
    await page.getByRole('button', { name: '전체 보기' }).click();
    await page.waitForTimeout(1000);
  });

  test('2명 이상 스케줄에서 개별 직원 이름 표시 확인', async ({ page }) => {
    // 페이지가 로드될 때까지 대기
    await page.waitForTimeout(5000);
    
    // 2명 이상이 근무하는 시간대 찾기 (예: 9:00)
    const scheduleCell = page.locator('div').filter({ hasText: '2명' }).first();
    await expect(scheduleCell).toBeVisible();
    
    // 직원 이름이 개별적으로 표시되는지 확인
    const employeeNames = scheduleCell.locator('div').filter({ hasText: /[가-힣]+/ });
    const count = await employeeNames.count();
    
    console.log(`2명 이상 근무하는 시간대에서 ${count}개의 직원 이름이 표시됨`);
    
    // 최소 2명의 이름이 표시되어야 함
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('3명 이상 스케줄에서 개별 직원 삭제 버튼 확인', async ({ page }) => {
    // 페이지가 로드될 때까지 대기
    await page.waitForTimeout(5000);
    
    // 3명 이상이 근무하는 시간대 찾기 (예: 11:00)
    const scheduleCell = page.locator('div').filter({ hasText: '3명' }).first();
    await expect(scheduleCell).toBeVisible();
    
    // 스케줄 셀에 호버
    await scheduleCell.hover();
    
    // 개별 직원 삭제 버튼들이 표시되는지 확인
    const deleteButtons = page.locator('button[title*="삭제"]');
    const buttonCount = await deleteButtons.count();
    
    console.log(`3명 이상 근무하는 시간대에서 ${buttonCount}개의 삭제 버튼이 표시됨`);
    
    // 최소 3개의 삭제 버튼이 표시되어야 함
    expect(buttonCount).toBeGreaterThanOrEqual(3);
  });

  test('개별 직원 삭제 기능 테스트', async ({ page }) => {
    // 페이지가 로드될 때까지 대기
    await page.waitForTimeout(5000);
    
    // 3명 이상이 근무하는 시간대 찾기
    const scheduleCell = page.locator('div').filter({ hasText: '3명' }).first();
    await expect(scheduleCell).toBeVisible();
    
    // 삭제 전 직원 수 확인
    const beforeText = await scheduleCell.textContent();
    console.log('삭제 전:', beforeText);
    
    // 스케줄 셀에 호버하여 삭제 버튼 표시
    await scheduleCell.hover();
    
    // 첫 번째 직원의 삭제 버튼 클릭
    const firstDeleteButton = page.locator('button[title*="삭제"]').first();
    await expect(firstDeleteButton).toBeVisible();
    await firstDeleteButton.click();
    
    // 삭제 후 대기
    await page.waitForTimeout(2000);
    
    // 삭제 후 상태 확인
    const afterText = await scheduleCell.textContent();
    console.log('삭제 후:', afterText);
    
    // 직원 수가 줄어들었는지 확인
    expect(afterText).not.toBe(beforeText);
  });

  test('스케줄 정보 상세 표시 확인', async ({ page }) => {
    // 페이지가 로드될 때까지 대기
    await page.waitForTimeout(5000);
    
    // 11:00 시간대의 3명 스케줄 찾기
    const scheduleCell = page.locator('div').filter({ hasText: '3명하상희허상원' }).first();
    await expect(scheduleCell).toBeVisible();
    
    // 스케줄 정보 상세 분석
    const scheduleText = await scheduleCell.textContent();
    console.log('11:00 시간대 상세 정보:', scheduleText);
    
    // 하상희, 허상원이 포함되어 있는지 확인
    expect(scheduleText).toContain('하상희');
    expect(scheduleText).toContain('허상원');
    
    // 3명이 표시되어 있는지 확인
    expect(scheduleText).toContain('3명');
  });

  test('빈 시간대에 스케줄 추가 후 개별 삭제 테스트', async ({ page }) => {
    // 페이지가 로드될 때까지 대기
    await page.waitForTimeout(5000);
    
    // 18:00 시간대 찾기 (비어있는 시간대)
    const emptyTimeSlot = page.locator('div').filter({ hasText: '18:00' }).first();
    await expect(emptyTimeSlot).toBeVisible();
    
    // 추가 전 상태 확인
    const beforeText = await emptyTimeSlot.textContent();
    console.log('추가 전 18:00:', beforeText);
    
    // 비어있는 시간대에 호버하여 추가 버튼 표시
    await emptyTimeSlot.hover();
    
    // 추가 버튼 클릭
    const addButton = page.locator('button[title="스케줄 추가"]').first();
    await expect(addButton).toBeVisible();
    await addButton.click();
    
    // 추가 후 대기
    await page.waitForTimeout(2000);
    
    // 추가 후 상태 확인
    const afterText = await emptyTimeSlot.textContent();
    console.log('추가 후 18:00:', afterText);
    
    // 스케줄이 추가되었는지 확인
    expect(afterText).not.toBe(beforeText);
    
    // 추가된 스케줄에 호버하여 삭제 버튼 표시
    await emptyTimeSlot.hover();
    
    // 삭제 버튼이 표시되는지 확인
    const deleteButton = page.locator('button[title*="삭제"]').first();
    await expect(deleteButton).toBeVisible();
    
    // 삭제 버튼 클릭
    await deleteButton.click();
    await page.waitForTimeout(2000);
    
    // 삭제 후 상태 확인
    const finalText = await emptyTimeSlot.textContent();
    console.log('삭제 후 18:00:', finalText);
    
    // 스케줄이 삭제되었는지 확인
    expect(finalText).not.toContain('1명');
  });

  test('개선된 직원 선택 기능 테스트', async ({ page }) => {
    // 페이지가 로드될 때까지 대기
    await page.waitForTimeout(5000);
    
    // 빈 시간대 찾기 (예: 19:00)
    const emptyTimeSlot = page.locator('div').filter({ hasText: '19:00' }).first();
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
    console.log('개선된 직원 선택으로 추가 후:', scheduleText);
    
    // "Unknown"이 아닌 실제 직원 이름이 표시되어야 함
    expect(scheduleText).not.toContain('Unknown');
  });

  test('기존 스케줄 셀에 직원 추가 기능 테스트', async ({ page }) => {
    // 페이지가 로드될 때까지 대기
    await page.waitForTimeout(5000);
    
    // 이미 사람이 들어있는 셀 찾기 (예: 2명이 근무하는 시간대)
    const occupiedCell = page.locator('div').filter({ hasText: '2명' }).first();
    await expect(occupiedCell).toBeVisible();
    
    // 기존 스케줄 셀에 호버
    await occupiedCell.hover();
    
    // 직원 추가 버튼이 표시되는지 확인
    const addEmployeeButton = page.locator('button[title="직원 추가"]').first();
    await expect(addEmployeeButton).toBeVisible();
    
    console.log('기존 스케줄 셀에 직원 추가 버튼이 표시됨');
    
    // 직원 추가 버튼 클릭
    await addEmployeeButton.click();
    await page.waitForTimeout(2000);
    
    // 추가 후 스케줄 정보 확인
    const afterText = await occupiedCell.textContent();
    console.log('기존 셀에 직원 추가 후:', afterText);
    
    // 직원 수가 증가했는지 확인
    expect(afterText).toContain('3명');
  });
});
