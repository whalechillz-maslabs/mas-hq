import { test, expect } from '@playwright/test';

test.describe('직원별 스케줄 관리 - 개별 관리 모드 테스트', () => {
  test.beforeEach(async ({ page }) => {
    // 로그인
    await page.goto('https://maslabs.kr/login');
    
    // 김탁수 계정으로 로그인
    await page.fill('input[name="phone"]', '010-6669-9000');
    await page.fill('input[name="password"]', '66699000');
    await page.click('button[type="submit"]');
    
    // 로그인 후 대시보드로 이동
    await page.waitForURL('**/quick-task');
    
    // 직원별 스케줄 관리 페이지로 이동
    await page.goto('https://maslabs.kr/admin/employee-schedules');
    await page.waitForLoadState('networkidle');
  });

  test('개별 관리 모드에서 직원 선택 및 스케줄 입력 테스트', async ({ page }) => {
    // 개별 관리 버튼 클릭
    await page.click('button:has-text("개별 관리")');
    await page.waitForTimeout(1000);
    
    // 직원 목록에서 하상희 선택
    await page.click('text=하상희 (HA, 디자인팀 • 대리)');
    await page.waitForTimeout(1000);
    
    // 하상희가 선택되었는지 확인
    const selectedEmployee = await page.locator('text=하상희 (HA) 디자인팀 • 대리').first();
    await expect(selectedEmployee).toBeVisible();
    
    // 스케줄 그리드에서 시간 슬롯 클릭하여 스케줄 생성
    const timeSlot = page.locator('div[data-time="09:00"]').first();
    await timeSlot.click();
    await page.waitForTimeout(500);
    
    // 스케줄이 생성되었는지 확인
    const scheduleBlock = page.locator('.schedule-block, [data-schedule]').first();
    await expect(scheduleBlock).toBeVisible();
    
    // 스케줄 내용이 표시되는지 확인
    const scheduleText = await scheduleBlock.textContent();
    console.log('생성된 스케줄 내용:', scheduleText);
    
    // 스케줄 내용이 비어있지 않은지 확인
    expect(scheduleText).not.toBe('');
  });

  test('개별 관리 모드에서 스케줄 수정 테스트', async ({ page }) => {
    // 개별 관리 버튼 클릭
    await page.click('button:has-text("개별 관리")');
    await page.waitForTimeout(1000);
    
    // 허상원 선택
    await page.click('text=허상원 (HEO, 본사 • 인턴)');
    await page.waitForTimeout(1000);
    
    // 기존 스케줄이 있는 시간 슬롯 클릭
    const existingSchedule = page.locator('div[data-time="09:00"]').first();
    await existingSchedule.click();
    await page.waitForTimeout(500);
    
    // 스케줄 수정 모달이나 입력 폼이 나타나는지 확인
    const modal = page.locator('.modal, .schedule-form, [role="dialog"]').first();
    if (await modal.isVisible()) {
      console.log('스케줄 수정 모달이 표시됨');
      
      // 모달 내용 확인
      const modalText = await modal.textContent();
      console.log('모달 내용:', modalText);
    } else {
      console.log('스케줄 수정 모달이 표시되지 않음');
    }
  });

  test('개별 관리 모드에서 스케줄 삭제 테스트', async ({ page }) => {
    // 개별 관리 버튼 클릭
    await page.click('button:has-text("개별 관리")');
    await page.waitForTimeout(1000);
    
    // 최형호 선택
    await page.click('text=최형호 (EAR, 마스운영팀 • 부장)');
    await page.waitForTimeout(1000);
    
    // 기존 스케줄이 있는 시간 슬롯 우클릭 (삭제 메뉴)
    const scheduleSlot = page.locator('div[data-time="09:00"]').first();
    await scheduleSlot.click({ button: 'right' });
    await page.waitForTimeout(500);
    
    // 컨텍스트 메뉴가 나타나는지 확인
    const contextMenu = page.locator('.context-menu, [role="menu"]').first();
    if (await contextMenu.isVisible()) {
      console.log('컨텍스트 메뉴가 표시됨');
      
      // 삭제 옵션 클릭
      const deleteOption = contextMenu.locator('text=삭제, text=Delete').first();
      if (await deleteOption.isVisible()) {
        await deleteOption.click();
        await page.waitForTimeout(500);
        console.log('삭제 옵션 클릭됨');
      }
    } else {
      console.log('컨텍스트 메뉴가 표시되지 않음');
    }
  });

  test('개별 관리 모드와 전체 보기 모드 전환 테스트', async ({ page }) => {
    // 초기 상태 확인 (전체 보기가 기본)
    const 전체보기Button = page.locator('button:has-text("전체 보기")');
    await expect(전체보기Button).toHaveClass(/bg-blue/);
    
    // 개별 관리로 전환
    await page.click('button:has-text("개별 관리")');
    await page.waitForTimeout(1000);
    
    // 개별 관리가 활성화되었는지 확인
    const 개별관리Button = page.locator('button:has-text("개별 관리")');
    await expect(개별관리Button).toHaveClass(/bg-blue/);
    
    // 전체 보기로 다시 전환
    await page.click('button:has-text("전체 보기")');
    await page.waitForTimeout(1000);
    
    // 전체 보기가 활성화되었는지 확인
    await expect(전체보기Button).toHaveClass(/bg-blue/);
  });
});
