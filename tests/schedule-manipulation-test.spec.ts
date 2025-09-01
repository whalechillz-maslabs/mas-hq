import { test, expect } from '@playwright/test';

test.describe('직원별 스케줄 관리 - 실제 스케줄 조작 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 원격 서버에 접속
    await page.goto('https://maslabs.kr/admin/employee-schedules');
    
    // 로그인 대기
    await page.waitForTimeout(3000);
    
    // 전체 보기 모드로 전환
    await page.getByRole('button', { name: '전체 보기' }).click();
    await page.waitForTimeout(1000);
  });

  test('11:00 시간대 3명 스케줄 삭제 테스트', async ({ page }) => {
    // 페이지가 로드될 때까지 대기
    await page.waitForSelector('text=9월', { timeout: 10000 });
    
    // 11:00 시간대의 3명 스케줄 찾기
    const scheduleCell = page.locator('div').filter({ hasText: '3명하상희허상원+1' }).first();
    await expect(scheduleCell).toBeVisible();
    
    // 삭제 전 스케줄 정보 로그
    const beforeText = await scheduleCell.textContent();
    console.log('삭제 전 11:00 시간대:', beforeText);
    
    // 스케줄 셀에 호버하여 삭제 버튼 표시
    await scheduleCell.hover();
    
    // 삭제 버튼 클릭
    const deleteButton = page.locator('button[title="삭제"]').first();
    await expect(deleteButton).toBeVisible();
    await deleteButton.click();
    
    // 삭제 후 대기
    await page.waitForTimeout(2000);
    
    // 삭제 후 스케줄 정보 확인
    const afterText = await scheduleCell.textContent();
    console.log('삭제 후 11:00 시간대:', afterText);
    
    // 스케줄이 삭제되었는지 확인
    expect(afterText).not.toContain('3명하상희허상원+1');
  });

  test('빈 시간대에 스케줄 추가 테스트', async ({ page }) => {
    // 페이지가 로드될 때까지 대기
    await page.waitForSelector('text=9월', { timeout: 10000 });
    
    // 14:00 시간대 찾기 (비어있는 시간대)
    const emptyTimeSlot = page.locator('div').filter({ hasText: '14:00' }).first();
    await expect(emptyTimeSlot).toBeVisible();
    
    // 추가 전 상태 확인
    const beforeText = await emptyTimeSlot.textContent();
    console.log('추가 전 14:00 시간대:', beforeText);
    
    // 비어있는 시간대에 호버하여 추가 버튼 표시
    await emptyTimeSlot.hover();
    
    // 추가 버튼 클릭
    const addButton = page.locator('button[title="스케줄 추가"]').first();
    await expect(addButton).toBeVisible();
    await addButton.click();
    
    // 추가 후 대기
    await page.waitForTimeout(2000);
    
    // 추가 후 스케줄 정보 확인
    const afterText = await emptyTimeSlot.textContent();
    console.log('추가 후 14:00 시간대:', afterText);
    
    // 스케줄이 추가되었는지 확인
    expect(afterText).not.toBe(beforeText);
  });

  test('개별 관리 모드에서 스케줄 추가 테스트', async ({ page }) => {
    // 개별 관리 모드로 전환
    await page.getByRole('button', { name: '개별 관리' }).click();
    await page.waitForTimeout(1000);
    
    // 직원 선택 (김탁수)
    const employee = page.locator('text=김탁수').first();
    await employee.click();
    await page.waitForTimeout(1000);
    
    // 13:00 시간대 클릭하여 스케줄 추가
    const timeSlot = page.locator('div').filter({ hasText: '13:00' }).first();
    await expect(timeSlot).toBeVisible();
    
    // 추가 전 상태 확인
    const beforeText = await timeSlot.textContent();
    console.log('개별 관리 - 추가 전 13:00:', beforeText);
    
    // 시간대 클릭
    await timeSlot.click();
    await page.waitForTimeout(2000);
    
    // 추가 후 상태 확인
    const afterText = await timeSlot.textContent();
    console.log('개별 관리 - 추가 후 13:00:', afterText);
    
    // 스케줄이 추가되었는지 확인
    expect(afterText).not.toBe(beforeText);
  });

  test('스케줄 정보 상세 분석', async ({ page }) => {
    // 페이지가 로드될 때까지 대기
    await page.waitForSelector('text=9월', { timeout: 10000 });
    
    // 11:00 시간대의 모든 스케줄 정보 수집
    const scheduleInfo = page.locator('div').filter({ hasText: '11:00' });
    const count = await scheduleInfo.count();
    
    console.log(`11:00 시간대에 총 ${count}개의 스케줄 정보가 있음`);
    
    // 각 요일별 스케줄 정보 확인
    for (let i = 0; i < count; i++) {
      const info = await scheduleInfo.nth(i).textContent();
      console.log(`11:00 시간대 ${i+1}:`, info);
    }
    
    // 3명이 포함된 스케줄 찾기
    const threePersonSchedule = page.locator('div').filter({ hasText: '3명' }).first();
    const threePersonText = await threePersonSchedule.textContent();
    console.log('3명이 포함된 스케줄:', threePersonText);
    
    // 3명이 포함된 스케줄이 있는지 확인
    expect(threePersonText).toContain('3명');
  });
});
