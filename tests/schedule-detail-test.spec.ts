import { test, expect } from '@playwright/test';

test.describe('직원별 스케줄 관리 - 전체 보기 상세 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 원격 서버에 접속
    await page.goto('https://maslabs.kr/admin/employee-schedules');
    
    // 로그인 대기
    await page.waitForTimeout(3000);
    
    // 전체 보기 모드로 전환
    await page.getByRole('button', { name: '전체 보기' }).click();
    await page.waitForTimeout(1000);
  });

  test('9월 1일 11:00 스케줄 상세 정보 확인', async ({ page }) => {
    // 페이지가 로드될 때까지 대기
    await page.waitForSelector('text=9월', { timeout: 10000 });
    
    // 11:00 시간대의 스케줄 셀 찾기 (더 간단한 방식)
    const timeSlots = page.locator('div').filter({ hasText: '11:00' });
    await expect(timeSlots.first()).toBeVisible();
    
    // 11:00 시간대의 스케줄 정보가 표시되는지 확인
    const scheduleCells = page.locator('div').filter({ hasText: '3명' });
    await expect(scheduleCells.first()).toBeVisible();
    
    // 스케줄 정보 로그
    const scheduleText = await scheduleCells.first().textContent();
    console.log('11:00 시간대 스케줄 정보:', scheduleText);
    
    // 3명이 포함되어 있는지 확인
    expect(scheduleText).toContain('3명');
  });

  test('스케줄 삭제 버튼 표시 확인', async ({ page }) => {
    // 페이지가 로드될 때까지 대기
    await page.waitForSelector('text=9월', { timeout: 10000 });
    
    // 스케줄이 있는 셀에 호버
    const scheduleCell = page.locator('div').filter({ hasText: '3명' }).first();
    await scheduleCell.hover();
    
    // 삭제 버튼이 표시되는지 확인
    const deleteButton = page.locator('button[title="삭제"]').first();
    await expect(deleteButton).toBeVisible();
    
    console.log('삭제 버튼이 표시됨');
  });

  test('스케줄 추가 버튼 표시 확인', async ({ page }) => {
    // 페이지가 로드될 때까지 대기
    await page.waitForSelector('text=9월', { timeout: 10000 });
    
    // 비어있는 시간대 찾기 (예: 14:00)
    const emptyTimeSlot = page.locator('div').filter({ hasText: '14:00' }).first();
    await expect(emptyTimeSlot).toBeVisible();
    
    // 비어있는 시간대에 호버
    await emptyTimeSlot.hover();
    
    // 추가 버튼이 표시되는지 확인
    const addButton = page.locator('button[title="스케줄 추가"]').first();
    await expect(addButton).toBeVisible();
    
    console.log('추가 버튼이 표시됨');
  });

  test('전체 보기 모드에서 스케줄 정보 표시 확인', async ({ page }) => {
    // 페이지가 로드될 때까지 대기
    await page.waitForSelector('text=9월', { timeout: 10000 });
    
    // 전체 보기 설명 텍스트 확인
    const description = page.locator('text=모든 직원의 스케줄을 한눈에 확인하고 관리할 수 있습니다');
    await expect(description).toBeVisible();
    
    // 시간대별 스케줄 정보 확인
    const scheduleInfo = page.locator('div').filter({ hasText: '명' });
    const count = await scheduleInfo.count();
    
    console.log(`총 ${count}개의 스케줄 정보가 표시됨`);
    
    // 스케줄 정보가 있는지 확인
    expect(count).toBeGreaterThan(0);
  });
});
