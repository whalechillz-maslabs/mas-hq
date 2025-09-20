import { test, expect } from '@playwright/test';

test.describe('9월 19일 최종 테스트', () => {
  test('9월 19일 모든 필터 정상 작동 확인', async ({ page }) => {
    console.log('🎯 9월 19일 최종 테스트 시작');
    
    // 콘솔 에러 모니터링
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log(`❌ 콘솔 에러: ${msg.text()}`);
      }
    });
    
    // 페이지 에러 모니터링
    page.on('pageerror', error => {
      console.log(`💥 페이지 에러: ${error.message}`);
    });
    
    // 페이지로 이동
    await page.goto('https://maslabs.kr/admin/insert-attendance');
    await page.waitForLoadState('networkidle');
    
    // 날짜를 9월 19일로 설정
    const dateInput = page.locator('input[type="date"]');
    await dateInput.fill('2025-09-19');
    console.log('📅 9월 19일로 날짜 설정');
    
    // 전체 조회 테스트
    const employeeSelect = page.locator('select').first();
    const statusSelect = page.locator('select').nth(1);
    const searchButton = page.locator('button:has-text("조회")');
    
    await employeeSelect.selectOption('all');
    await statusSelect.selectOption('all');
    await searchButton.click();
    await page.waitForTimeout(3000);
    
    // 테이블 확인
    const table = page.locator('table');
    const hasTable = await table.isVisible();
    console.log(`📊 전체 조회 - 테이블 존재: ${hasTable}`);
    
    if (hasTable) {
      const rowCount = await page.locator('tbody tr').count();
      console.log(`📋 전체 조회 - 행 개수: ${rowCount}`);
    }
    
    // 완료 상태 필터 테스트
    console.log('🔄 완료 상태 필터 테스트');
    await statusSelect.selectOption('completed');
    await searchButton.click();
    await page.waitForTimeout(3000);
    
    const completedTable = page.locator('table');
    const hasCompletedTable = await completedTable.isVisible();
    console.log(`📊 완료 조회 - 테이블 존재: ${hasCompletedTable}`);
    
    if (hasCompletedTable) {
      const completedRowCount = await page.locator('tbody tr').count();
      console.log(`📋 완료 조회 - 행 개수: ${completedRowCount}`);
    }
    
    // 미출근 상태 필터 테스트
    console.log('🔄 미출근 상태 필터 테스트');
    await statusSelect.selectOption('no-attendance');
    await searchButton.click();
    await page.waitForTimeout(3000);
    
    const noAttendanceTable = page.locator('table');
    const hasNoAttendanceTable = await noAttendanceTable.isVisible();
    console.log(`📊 미출근 조회 - 테이블 존재: ${hasNoAttendanceTable}`);
    
    if (hasNoAttendanceTable) {
      const noAttendanceRowCount = await page.locator('tbody tr').count();
      console.log(`📋 미출근 조회 - 행 개수: ${noAttendanceRowCount}`);
    }
    
    // 부분 출근 상태 필터 테스트
    console.log('🔄 부분 출근 상태 필터 테스트');
    await statusSelect.selectOption('partial-attendance');
    await searchButton.click();
    await page.waitForTimeout(3000);
    
    const partialTable = page.locator('table');
    const hasPartialTable = await partialTable.isVisible();
    console.log(`📊 부분 출근 조회 - 테이블 존재: ${hasPartialTable}`);
    
    if (hasPartialTable) {
      const partialRowCount = await page.locator('tbody tr').count();
      console.log(`📋 부분 출근 조회 - 행 개수: ${partialRowCount}`);
    }
    
    // 에러 확인
    if (consoleErrors.length > 0) {
      console.log('❌ 발견된 콘솔 에러들:');
      consoleErrors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    } else {
      console.log('✅ 콘솔 에러 없음');
    }
    
    // Application error 확인
    const hasApplicationError = await page.locator(':has-text("Application error")').isVisible();
    console.log(`🚨 Application error 발생: ${hasApplicationError}`);
    
    console.log('🏁 9월 19일 최종 테스트 완료');
  });
});
